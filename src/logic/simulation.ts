import type {
  Component,
  ComponentImpact,
  CustomerImpact,
  ID,
  ImpactStatus,
  ProductImpact,
  SimulationInput,
  SimulationResult,
  Supplier,
  SupplyNetworkData,
} from '../types/supplyChain';
import { generateRecommendations } from './recommendations';

/**
 * Deterministic supply-allocation model
 * ======================================
 * This prototype uses a simple, explainable capacity-vs-demand model instead
 * of a full time-phased simulation:
 *
 * 1. Every supplier-component link has a fixed monthly capacity.
 * 2. A disruption removes (shutdown/flooding) or reduces (route closure,
 *    for suppliers with an alternate route) the capacity of the affected
 *    supplier(s) for every component they supply.
 * 3. For each component, remaining network-wide capacity is compared
 *    against total monthly demand (derived from customer orders via each
 *    product's bill of materials).
 *      - remaining >= demand  -> component status "ok" (redundancy absorbed it)
 *      - 0 < remaining < demand -> component status "partial" (shortage)
 *      - remaining <= 0 (and demand > 0) -> component status "blocked"
 * 4. A product inherits the worst status of any component it requires.
 * 5. A customer is "at risk" if any product they ordered is partial/blocked.
 *
 * Assumptions & limitations (documented deliberately, not hidden):
 * - Demand figures are treated as a flat monthly volume; the model does not
 *   simulate multiple time periods, existing inventory, or safety stock.
 * - Duration of the disruption does not change the capacity math; it is used
 *   only to compare against alternate-supplier lead times in the generated
 *   recovery note, since the dataset has no time-phased inventory to draw down.
 * - A route closure assumes suppliers without a documented alternate route
 *   lose 100% of capacity for the closure's duration, and suppliers with one
 *   retain 40% of capacity via the secondary corridor.
 * - Financial exposure is an estimate: blocked demand is valued at 100% of
 *   list price x at-risk quantity; partial shortages are valued at the
 *   shortfall ratio of the limiting component x quantity x price.
 */

const ROUTE_CLOSURE_ALT_ROUTE_RETENTION = 0.4;

export const DURATION_OPTIONS: { label: string; days: number }[] = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '2 months', days: 60 },
];

export function formatDuration(days: number): string {
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months}-month`;
  }
  if (days % 7 === 0) {
    const weeks = days / 7;
    return `${weeks}-week`;
  }
  return `${days}-day`;
}

export function computeComponentDemand(data: SupplyNetworkData, componentId: ID): number {
  let total = 0;
  for (const product of data.products) {
    const req = product.requiredComponents.find((r) => r.componentId === componentId);
    if (!req) continue;
    const productDemand = data.customers.reduce(
      (sum, c) =>
        sum + c.orders.filter((o) => o.productId === product.id).reduce((s, o) => s + o.quantity, 0),
      0,
    );
    total += req.qtyPerUnit * productDemand;
  }
  return total;
}

export function computeProductDemand(data: SupplyNetworkData, productId: ID): number {
  return data.customers.reduce(
    (sum, c) => sum + c.orders.filter((o) => o.productId === productId).reduce((s, o) => s + o.quantity, 0),
    0,
  );
}

export function getSingleSourceComponents(data: SupplyNetworkData): Component[] {
  return data.components.filter(
    (c) => data.suppliers.filter((s) => s.supplies.some((l) => l.componentId === c.id)).length === 1,
  );
}

export function getCriticalSuppliers(data: SupplyNetworkData): Supplier[] {
  const singleSourceIds = new Set(getSingleSourceComponents(data).map((c) => c.id));
  return data.suppliers.filter((s) => s.supplies.some((l) => singleSourceIds.has(l.componentId)));
}

export interface CorrelatedRouteRisk {
  componentId: ID;
  routeId: ID;
  supplierIds: ID[];
}

/**
 * Finds multi-sourced components whose suppliers all share the same
 * transport route. A multi-sourced component is usually treated as
 * low-risk, but if every supplier ships through the same corridor, a single
 * route closure can still take it out entirely — a correlated risk that a
 * supplier-only view would miss.
 */
export function getCorrelatedRouteRisks(data: SupplyNetworkData): CorrelatedRouteRisk[] {
  const risks: CorrelatedRouteRisk[] = [];
  for (const component of data.components) {
    const suppliers = data.suppliers.filter((s) => s.supplies.some((l) => l.componentId === component.id));
    if (suppliers.length < 2) continue;
    const routeIds = new Set(suppliers.map((s) => s.routeId));
    if (routeIds.size === 1) {
      risks.push({ componentId: component.id, routeId: suppliers[0].routeId, supplierIds: suppliers.map((s) => s.id) });
    }
  }
  return risks;
}

function statusRank(status: ImpactStatus): number {
  if (status === 'blocked') return 2;
  if (status === 'partial') return 1;
  return 0;
}

export function runSimulation(data: SupplyNetworkData, input: SimulationInput): SimulationResult {
  const disruptedSupplierIds: ID[] = [];
  const degradedSupplierIds: ID[] = [];
  let disruptedRouteId: ID | undefined;
  const degradedFactor = new Map<ID, number>();

  if (input.disruptionType === 'route_closure') {
    disruptedRouteId = input.targetId;
    const routeSuppliers = data.suppliers.filter((s) => s.routeId === input.targetId);
    for (const s of routeSuppliers) {
      if (s.hasAlternateRoute) {
        degradedSupplierIds.push(s.id);
        degradedFactor.set(s.id, ROUTE_CLOSURE_ALT_ROUTE_RETENTION);
      } else {
        disruptedSupplierIds.push(s.id);
      }
    }
  } else {
    // 'supplier_shutdown' and 'flooding' both model a full loss of capacity
    // at the named supplier. Flooding is treated as halting the facility
    // entirely, the same as a shutdown, for the duration of the event.
    disruptedSupplierIds.push(input.targetId);
  }

  const componentImpacts: ComponentImpact[] = data.components.map((component) => {
    const links = data.suppliers.flatMap((s) =>
      s.supplies.filter((l) => l.componentId === component.id).map((l) => ({ supplier: s, link: l })),
    );

    let totalBefore = 0;
    let totalAfter = 0;
    const affectedSupplierIds: ID[] = [];
    const remainingSupplierIds: ID[] = [];

    for (const { supplier, link } of links) {
      totalBefore += link.capacityPerMonth;
      if (disruptedSupplierIds.includes(supplier.id)) {
        affectedSupplierIds.push(supplier.id);
      } else if (degradedFactor.has(supplier.id)) {
        const factor = degradedFactor.get(supplier.id)!;
        totalAfter += link.capacityPerMonth * factor;
        affectedSupplierIds.push(supplier.id);
        remainingSupplierIds.push(supplier.id);
      } else {
        totalAfter += link.capacityPerMonth;
        remainingSupplierIds.push(supplier.id);
      }
    }

    const totalDemand = computeComponentDemand(data, component.id);
    const shortfallUnits = Math.max(0, totalDemand - totalAfter);
    let status: ImpactStatus = 'ok';
    if (totalDemand > 0 && totalAfter <= 0) status = 'blocked';
    else if (shortfallUnits > 0) status = 'partial';

    return {
      componentId: component.id,
      status,
      totalCapacityBefore: totalBefore,
      totalCapacityAfter: Math.round(totalAfter),
      totalDemand,
      shortfallUnits: Math.round(shortfallUnits),
      affectedSupplierIds,
      remainingSupplierIds,
    };
  });

  const componentImpactMap = new Map(componentImpacts.map((c) => [c.componentId, c]));

  const productImpacts: ProductImpact[] = data.products.map((product) => {
    let worstStatus: ImpactStatus = 'ok';
    let worstShortfallRatio = 0;
    const limitingComponentIds: ID[] = [];

    for (const req of product.requiredComponents) {
      const impact = componentImpactMap.get(req.componentId);
      if (!impact) continue;
      const ratio = impact.totalDemand > 0 ? impact.shortfallUnits / impact.totalDemand : 0;
      if (statusRank(impact.status) > statusRank(worstStatus)) {
        worstStatus = impact.status;
      }
      if (ratio > worstShortfallRatio) worstShortfallRatio = ratio;
    }

    for (const req of product.requiredComponents) {
      const impact = componentImpactMap.get(req.componentId);
      if (impact && impact.status === worstStatus && worstStatus !== 'ok') {
        limitingComponentIds.push(req.componentId);
      }
    }

    return {
      productId: product.id,
      status: worstStatus,
      limitingComponentIds,
      worstShortfallRatio: Math.min(1, worstShortfallRatio),
    };
  });

  const productImpactMap = new Map(productImpacts.map((p) => [p.productId, p]));

  const customerImpacts: CustomerImpact[] = data.customers.map((customer) => {
    let riskLevel: CustomerImpact['riskLevel'] = 'none';
    const affectedProductIds: ID[] = [];
    let atRiskOrderValue = 0;

    for (const order of customer.orders) {
      const impact = productImpactMap.get(order.productId);
      const product = data.products.find((p) => p.id === order.productId);
      if (!impact || !product || impact.status === 'ok') continue;

      affectedProductIds.push(order.productId);
      const ratio = impact.status === 'blocked' ? 1 : impact.worstShortfallRatio;
      atRiskOrderValue += order.quantity * product.price * ratio;

      if (impact.status === 'blocked') riskLevel = 'high';
      else if (impact.status === 'partial' && riskLevel !== 'high') riskLevel = 'medium';
    }

    return {
      customerId: customer.id,
      riskLevel,
      affectedProductIds,
      atRiskOrderValue: Math.round(atRiskOrderValue),
    };
  });

  const recommendations = generateRecommendations(data, componentImpacts, disruptedSupplierIds);

  const totalShortfallUnits = componentImpacts.reduce((sum, c) => sum + c.shortfallUnits, 0);
  const estimatedFinancialExposure = customerImpacts.reduce((sum, c) => sum + c.atRiskOrderValue, 0);

  const summaryText = buildSummaryText(data, input, {
    disruptedSupplierIds,
    degradedSupplierIds,
    disruptedRouteId,
    componentImpacts,
    productImpacts,
    customerImpacts,
    recommendations,
  });

  const recoveryNote = buildRecoveryNote(data, input, componentImpacts, recommendations, estimatedFinancialExposure);

  return {
    input,
    disruptedSupplierIds,
    degradedSupplierIds,
    disruptedRouteId,
    componentImpacts,
    productImpacts,
    customerImpacts,
    recommendations,
    totalShortfallUnits: Math.round(totalShortfallUnits),
    estimatedFinancialExposure,
    summaryText,
    recoveryNote,
  };
}

function disruptionLabel(type: SimulationInput['disruptionType']): string {
  if (type === 'supplier_shutdown') return 'Supplier shutdown';
  if (type === 'flooding') return 'Flooding';
  return 'Transport route closure';
}

function buildSummaryText(
  data: SupplyNetworkData,
  input: SimulationInput,
  parts: Pick<
    SimulationResult,
    | 'disruptedSupplierIds'
    | 'degradedSupplierIds'
    | 'disruptedRouteId'
    | 'componentImpacts'
    | 'productImpacts'
    | 'customerImpacts'
    | 'recommendations'
  >,
): string {
  const targetName =
    input.disruptionType === 'route_closure'
      ? data.routes.find((r) => r.id === input.targetId)?.name ?? 'the selected route'
      : data.suppliers.find((s) => s.id === input.targetId)?.name ?? 'the selected supplier';

  const blockedComponents = parts.componentImpacts.filter((c) => c.status === 'blocked');
  const partialComponents = parts.componentImpacts.filter((c) => c.status === 'partial');
  const blockedProducts = parts.productImpacts.filter((p) => p.status === 'blocked');
  const partialProducts = parts.productImpacts.filter((p) => p.status === 'partial');
  const atRiskCustomers = parts.customerImpacts.filter((c) => c.riskLevel !== 'none');

  if (blockedComponents.length === 0 && partialComponents.length === 0) {
    return `${disruptionLabel(input.disruptionType)} affecting ${targetName} does not create a measurable shortage. Remaining suppliers in the network have sufficient combined capacity to cover current customer demand, so all products stay available${
      parts.degradedSupplierIds.length > 0
        ? ', though some shipments now route through a secondary corridor with added lead time.'
        : '.'
    }`;
  }

  const componentNames = (impacts: ComponentImpact[]) =>
    impacts
      .map((c) => data.components.find((comp) => comp.id === c.componentId)?.name)
      .filter(Boolean)
      .join(', ');

  const sentences: string[] = [];

  if (blockedComponents.length > 0 && partialComponents.length > 0) {
    sentences.push(
      `${disruptionLabel(input.disruptionType)} affecting ${targetName} creates a full shortage of ${componentNames(
        blockedComponents,
      )}, and a partial shortage of ${componentNames(partialComponents)}.`,
    );
  } else if (blockedComponents.length > 0) {
    sentences.push(
      `${disruptionLabel(input.disruptionType)} affecting ${targetName} creates a full shortage of ${componentNames(
        blockedComponents,
      )}.`,
    );
  } else {
    sentences.push(
      `${disruptionLabel(input.disruptionType)} affecting ${targetName} creates a partial shortage of ${componentNames(
        partialComponents,
      )}.`,
    );
  }

  const productCount = blockedProducts.length + partialProducts.length;
  if (productCount > 0) {
    sentences.push(
      `${productCount} product${productCount === 1 ? '' : 's'} require${
        productCount === 1 ? 's' : ''
      } the affected component${blockedComponents.length + partialComponents.length === 1 ? '' : 's'}, putting ${
        atRiskCustomers.length
      } customer order${atRiskCustomers.length === 1 ? '' : 's'} at risk.`,
    );
  }

  const componentsNeedingAlternatives = [...blockedComponents, ...partialComponents];
  const componentsWithoutAlternatives = componentsNeedingAlternatives.filter(
    (c) => !parts.recommendations.some((r) => r.componentId === c.componentId),
  );

  if (parts.recommendations.length > 0) {
    const topComponent = componentsNeedingAlternatives.find((c) =>
      parts.recommendations.some((r) => r.componentId === c.componentId),
    );
    const topRec = parts.recommendations.find((r) => r.componentId === topComponent?.componentId);
    if (topComponent && topRec) {
      const altSupplier = data.suppliers.find((s) => s.id === topRec.supplierId);
      const componentName = data.components.find((c) => c.id === topComponent.componentId)?.name ?? 'this component';
      sentences.push(
        `For ${componentName}, ${altSupplier?.name ?? 'an alternative supplier'} has ${
          topComponent.status === 'partial' ? 'limited' : 'available'
        } spare capacity and is the top-ranked alternative.`,
      );
    }
  }

  if (componentsWithoutAlternatives.length > 0) {
    sentences.push(
      `No viable alternative supplier currently exists in the network for ${componentNames(
        componentsWithoutAlternatives,
      )}.`,
    );
  }

  return sentences.join(' ');
}

function buildRecoveryNote(
  data: SupplyNetworkData,
  input: SimulationInput,
  componentImpacts: ComponentImpact[],
  recommendations: SimulationResult['recommendations'],
  estimatedFinancialExposure: number,
): string {
  const shortageImpacts = componentImpacts.filter((c) => c.status === 'blocked' || c.status === 'partial');
  const durationLabel = formatDuration(input.durationDays);

  if (shortageImpacts.length === 0) {
    return `No measurable supply gap in this scenario — the network absorbs the disruption using existing supplier redundancy, regardless of the selected ${durationLabel} window.`;
  }

  // Focus on the component contributing the most financial exposure.
  const worstImpact = [...shortageImpacts].sort((a, b) => b.shortfallUnits - a.shortfallUnits)[0];
  const component = data.components.find((c) => c.id === worstImpact.componentId);
  const bestRecForComponent = recommendations
    .filter((r) => r.componentId === worstImpact.componentId)
    .sort((a, b) => a.leadTimeDays - b.leadTimeDays)[0];

  if (!bestRecForComponent) {
    return `No alternate supplier exists for ${component?.name ?? 'this component'} in the current network, so the selected ${durationLabel} disruption window directly limits output until the original supplier recovers. Estimated exposure: ~₹${estimatedFinancialExposure.toLocaleString(
      'en-IN',
    )}.`;
  }

  const altSupplier = data.suppliers.find((s) => s.id === bestRecForComponent.supplierId);

  if (bestRecForComponent.leadTimeDays <= input.durationDays) {
    return `Given the selected ${durationLabel} disruption window, ${altSupplier?.name ?? 'the alternate supplier'} can likely ramp up within its ${bestRecForComponent.leadTimeDays}-day lead time, helping close the gap before the disruption ends.`;
  }

  return `The fastest alternative for ${component?.name ?? 'this component'} — ${
    altSupplier?.name ?? 'an alternate supplier'
  } at a ${bestRecForComponent.leadTimeDays}-day lead time — cannot fully ramp up within the selected ${durationLabel} window, so some shortage is likely to persist until the disruption clears.`;
}

export interface BaselineRisk {
  totalSuppliers: number;
  totalComponents: number;
  totalProducts: number;
  totalCustomers: number;
  criticalSupplierCount: number;
  singleSourceComponentCount: number;
  customersAtRiskCount: number;
}

/**
 * Baseline structural risk: for every single-source-dependent (critical)
 * supplier, simulate a full shutdown and union the customers who would be
 * put at risk. This is a standing, dataset-level readiness metric — it does
 * not depend on whether a simulation is currently active.
 */
export function computeBaselineRisk(data: SupplyNetworkData): BaselineRisk {
  const criticalSuppliers = getCriticalSuppliers(data);
  const singleSourceComponents = getSingleSourceComponents(data);

  const atRiskCustomerIds = new Set<ID>();
  for (const supplier of criticalSuppliers) {
    const result = runSimulation(data, {
      disruptionType: 'supplier_shutdown',
      targetId: supplier.id,
      durationDays: 30,
    });
    for (const ci of result.customerImpacts) {
      if (ci.riskLevel !== 'none') atRiskCustomerIds.add(ci.customerId);
    }
  }

  return {
    totalSuppliers: data.suppliers.length,
    totalComponents: data.components.length,
    totalProducts: data.products.length,
    totalCustomers: data.customers.length,
    criticalSupplierCount: criticalSuppliers.length,
    singleSourceComponentCount: singleSourceComponents.length,
    customersAtRiskCount: atRiskCustomerIds.size,
  };
}

// ---------- Disruption chain (PPT-style explanation) ----------

export interface DisruptionChainStep {
  label: string;
  tone: 'source' | 'blocked' | 'partial' | 'ok' | 'impact';
}

/**
 * Builds a single, concise cause-and-effect chain for the headline
 * explanation (e.g. "Supplier unavailable -> Motor shortage -> Pump
 * production blocked -> 3 customer orders affected"). It walks the single
 * most consequential path through the already-computed result rather than
 * enumerating every affected item — the detailed breakdown tables cover the
 * full picture. Entirely derived from `result`; no new calculation happens
 * here.
 */
export function buildPrimaryDisruptionChain(data: SupplyNetworkData, result: SimulationResult): DisruptionChainStep[] {
  const targetName =
    result.input.disruptionType === 'route_closure'
      ? data.routes.find((r) => r.id === result.input.targetId)?.name
      : data.suppliers.find((s) => s.id === result.input.targetId)?.name;

  const sourceLabel =
    result.input.disruptionType === 'route_closure'
      ? `${targetName ?? 'Route'} closed`
      : `${targetName ?? 'Supplier'} unavailable`;

  const shortages = result.componentImpacts
    .filter((c) => c.status !== 'ok')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'blocked' ? -1 : 1;
      return b.shortfallUnits - a.shortfallUnits;
    });

  if (shortages.length === 0) {
    return [
      { label: sourceLabel, tone: 'source' },
      { label: 'Remaining suppliers cover demand', tone: 'ok' },
      { label: 'No production impact', tone: 'ok' },
      { label: 'No customer orders affected', tone: 'ok' },
    ];
  }

  const worstComponent = shortages[0];
  const componentName = data.components.find((c) => c.id === worstComponent.componentId)?.name ?? 'Component';

  const candidateProducts = result.productImpacts
    .filter((p) => p.limitingComponentIds.includes(worstComponent.componentId))
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'blocked' ? -1 : 1));
  const worstProduct = candidateProducts[0];
  const productName = worstProduct ? data.products.find((p) => p.id === worstProduct.productId)?.name : undefined;

  const steps: DisruptionChainStep[] = [
    { label: sourceLabel, tone: 'source' },
    {
      label: `${componentName} ${worstComponent.status === 'blocked' ? 'shortage' : 'partial shortage'}`,
      tone: worstComponent.status === 'blocked' ? 'blocked' : 'partial',
    },
  ];

  if (worstProduct && productName) {
    steps.push({
      label: `${productName} production ${worstProduct.status === 'blocked' ? 'blocked' : 'constrained'}`,
      tone: worstProduct.status === 'blocked' ? 'blocked' : 'partial',
    });

    const affectedCount = result.customerImpacts.filter((c) => c.affectedProductIds.includes(worstProduct.productId)).length;
    steps.push({
      label: affectedCount > 0 ? `${affectedCount} customer order${affectedCount === 1 ? '' : 's'} potentially affected` : 'No customer orders affected',
      tone: affectedCount > 0 ? 'impact' : 'ok',
    });
  } else {
    const totalAtRisk = result.customerImpacts.filter((c) => c.riskLevel !== 'none').length;
    steps.push({
      label: totalAtRisk > 0 ? `${totalAtRisk} customer order${totalAtRisk === 1 ? '' : 's'} potentially affected` : 'No customer orders affected',
      tone: totalAtRisk > 0 ? 'impact' : 'ok',
    });
  }

  return steps;
}
