import type { ID, ImpactStatus, SimulationResult } from '../types/supplyChain';

// Pure helpers that translate a SimulationResult (or its absence) into the
// visual status of each node and edge in the dependency graph. Kept separate
// from simulation.ts so the graph component's styling logic has one place to
// read from, independent of how the numbers were computed.

export type SupplierNodeStatus = 'disrupted' | 'degraded' | 'recommended' | 'normal';
export type RouteNodeStatus = 'disrupted' | 'normal';
export type CustomerNodeStatus = 'high' | 'medium' | 'none' | 'normal';
export type EdgeStatus = 'cut' | 'reduced' | 'blocked' | 'partial' | 'recommended' | 'normal';

export function getSupplierStatus(result: SimulationResult | null, supplierId: ID): SupplierNodeStatus {
  if (!result) return 'normal';
  if (result.disruptedSupplierIds.includes(supplierId)) return 'disrupted';
  if (result.degradedSupplierIds.includes(supplierId)) return 'degraded';
  if (result.recommendations.some((r) => r.supplierId === supplierId)) return 'recommended';
  return 'normal';
}

export function getComponentStatus(result: SimulationResult | null, componentId: ID): ImpactStatus | 'normal' {
  if (!result) return 'normal';
  return result.componentImpacts.find((c) => c.componentId === componentId)?.status ?? 'normal';
}

export function getProductStatus(result: SimulationResult | null, productId: ID): ImpactStatus | 'normal' {
  if (!result) return 'normal';
  return result.productImpacts.find((p) => p.productId === productId)?.status ?? 'normal';
}

export function getCustomerStatus(result: SimulationResult | null, customerId: ID): CustomerNodeStatus {
  if (!result) return 'normal';
  return result.customerImpacts.find((c) => c.customerId === customerId)?.riskLevel ?? 'none';
}

export function getRouteStatus(result: SimulationResult | null, routeId: ID): RouteNodeStatus {
  if (result?.disruptedRouteId === routeId) return 'disrupted';
  return 'normal';
}

export function getRouteSupplierEdgeStatus(result: SimulationResult | null, routeId: ID, supplierId: ID): EdgeStatus {
  if (!result || result.disruptedRouteId !== routeId) return 'normal';
  if (result.disruptedSupplierIds.includes(supplierId)) return 'cut';
  if (result.degradedSupplierIds.includes(supplierId)) return 'reduced';
  return 'normal';
}

export function getSupplierComponentEdgeStatus(
  result: SimulationResult | null,
  supplierId: ID,
  componentId: ID,
): EdgeStatus {
  if (!result) return 'normal';
  const impact = result.componentImpacts.find((c) => c.componentId === componentId);
  if (!impact) return 'normal';
  if (impact.affectedSupplierIds.includes(supplierId)) {
    return result.disruptedSupplierIds.includes(supplierId) ? 'cut' : 'reduced';
  }
  if (result.recommendations.some((r) => r.supplierId === supplierId && r.componentId === componentId)) {
    return 'recommended';
  }
  return 'normal';
}

export function getComponentProductEdgeStatus(
  result: SimulationResult | null,
  componentId: ID,
  productId: ID,
): EdgeStatus {
  if (!result) return 'normal';
  const impact = result.productImpacts.find((p) => p.productId === productId);
  if (!impact || !impact.limitingComponentIds.includes(componentId)) return 'normal';
  return impact.status === 'blocked' ? 'blocked' : impact.status === 'partial' ? 'partial' : 'normal';
}

export function getProductCustomerEdgeStatus(
  result: SimulationResult | null,
  productId: ID,
  customerId: ID,
): EdgeStatus {
  if (!result) return 'normal';
  const productImpact = result.productImpacts.find((p) => p.productId === productId);
  if (!productImpact || productImpact.status === 'ok') return 'normal';
  const customerImpact = result.customerImpacts.find((c) => c.customerId === customerId);
  if (!customerImpact || !customerImpact.affectedProductIds.includes(productId)) return 'normal';
  return productImpact.status === 'blocked' ? 'blocked' : 'partial';
}
