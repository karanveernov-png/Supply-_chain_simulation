import { X } from 'lucide-react';
import type { ID, SimulationResult, SupplyNetworkData } from '../../types/supplyChain';
import { computeComponentDemand, computeProductDemand, getSingleSourceComponents } from '../../logic/simulation';
import StatusBadge from '../StatusBadge';
import type { BadgeTone } from '../StatusBadge';

export type SelectedNode = { type: 'supplier' | 'component' | 'product' | 'customer' | 'route'; id: ID };

interface NodeDetailPanelProps {
  data: SupplyNetworkData;
  result: SimulationResult | null;
  selected: SelectedNode;
  onClose: () => void;
}

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function NodeDetailPanel({ data, result, selected, onClose }: NodeDetailPanelProps) {
  return (
    <div className="absolute right-3 top-14 max-h-[calc(100%-4.5rem)] w-[300px] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-3.5 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {typeLabel(selected.type)}
        </span>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-900">
          <X size={14} />
        </button>
      </div>
      <div className="px-3.5 py-3">
        {selected.type === 'supplier' && <SupplierDetail data={data} result={result} id={selected.id} />}
        {selected.type === 'component' && <ComponentDetail data={data} result={result} id={selected.id} />}
        {selected.type === 'product' && <ProductDetail data={data} result={result} id={selected.id} />}
        {selected.type === 'customer' && <CustomerDetail data={data} result={result} id={selected.id} />}
        {selected.type === 'route' && <RouteDetail data={data} result={result} id={selected.id} />}
      </div>
    </div>
  );
}

function typeLabel(t: SelectedNode['type']) {
  return { supplier: 'Supplier', component: 'Component', product: 'Product', customer: 'Customer', route: 'Transport route' }[t];
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-[12.5px]">
      <span className="text-slate-500">{k}</span>
      <span className="text-right font-medium text-navy-900">{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 first:mt-0">{children}</p>;
}

function statusTone(status: string): BadgeTone {
  if (status === 'blocked' || status === 'disrupted' || status === 'high' || status === 'cut') return 'red';
  if (status === 'partial' || status === 'degraded' || status === 'medium' || status === 'reduced') return 'amber';
  if (status === 'recommended') return 'green';
  return 'slate';
}

function SupplierDetail({ data, result, id }: { data: SupplyNetworkData; result: SimulationResult | null; id: ID }) {
  const supplier = data.suppliers.find((s) => s.id === id);
  if (!supplier) return null;
  const route = data.routes.find((r) => r.id === supplier.routeId);
  const singleSourceIds = new Set(getSingleSourceComponents(data).map((c) => c.id));
  const isCritical = supplier.supplies.some((l) => singleSourceIds.has(l.componentId));

  let status: string = 'normal';
  if (result) {
    if (result.disruptedSupplierIds.includes(id)) status = 'disrupted';
    else if (result.degradedSupplierIds.includes(id)) status = 'degraded';
    else if (result.recommendations.some((r) => r.supplierId === id)) status = 'recommended';
  }

  return (
    <>
      <h3 className="text-sm font-semibold text-navy-900">{supplier.name}</h3>
      <p className="text-xs text-slate-500">{supplier.location}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {isCritical && <StatusBadge tone="amber">Single-source for &ge;1 part</StatusBadge>}
        {status !== 'normal' && (
          <StatusBadge tone={statusTone(status)}>
            {status === 'disrupted' && 'Disrupted this scenario'}
            {status === 'degraded' && 'Reduced capacity this scenario'}
            {status === 'recommended' && 'Recommended alternative'}
          </StatusBadge>
        )}
      </div>

      <SectionTitle>Logistics</SectionTitle>
      <Row k="Transport route" v={route?.name ?? '—'} />
      <Row k="Alternate route" v={supplier.hasAlternateRoute ? 'Yes' : 'No'} />

      <SectionTitle>Components supplied</SectionTitle>
      <div className="space-y-2">
        {supplier.supplies.map((link) => {
          const component = data.components.find((c) => c.id === link.componentId);
          return (
            <div key={link.componentId} className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-navy-900">{component?.name}</span>
                <span className="text-[10px] text-slate-500">{link.isPrimary ? 'Primary' : 'Alternate'}</span>
              </div>
              <Row k="Capacity" v={`${link.capacityPerMonth.toLocaleString('en-IN')}/mo`} />
              <Row k="Lead time" v={`${link.leadTimeDays} days`} />
              <Row k="Unit cost" v={inr(link.unitCost)} />
            </div>
          );
        })}
      </div>
    </>
  );
}

function ComponentDetail({ data, result, id }: { data: SupplyNetworkData; result: SimulationResult | null; id: ID }) {
  const component = data.components.find((c) => c.id === id);
  if (!component) return null;
  const suppliers = data.suppliers.filter((s) => s.supplies.some((l) => l.componentId === id));
  const demand = computeComponentDemand(data, id);
  const impact = result?.componentImpacts.find((c) => c.componentId === id);
  const usedByProducts = data.products.filter((p) => p.requiredComponents.some((r) => r.componentId === id));

  return (
    <>
      <h3 className="text-sm font-semibold text-navy-900">{component.name}</h3>
      <p className="text-xs text-slate-500">{component.category}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suppliers.length === 1 && <StatusBadge tone="amber">Single-source</StatusBadge>}
        {suppliers.length > 1 && <StatusBadge tone="blue">{suppliers.length} eligible suppliers</StatusBadge>}
        {impact && impact.status !== 'ok' && (
          <StatusBadge tone={statusTone(impact.status)}>{impact.status === 'blocked' ? 'Fully blocked' : 'Partial shortage'}</StatusBadge>
        )}
      </div>

      <SectionTitle>Supply vs demand</SectionTitle>
      <Row k="Monthly demand" v={`${demand.toLocaleString('en-IN')} ${component.unit}`} />
      <Row k="Capacity (baseline)" v={`${(impact?.totalCapacityBefore ?? suppliers.reduce((s, sup) => s + (sup.supplies.find((l) => l.componentId === id)?.capacityPerMonth ?? 0), 0)).toLocaleString('en-IN')}/mo`} />
      {impact && (
        <>
          <Row k="Capacity (this scenario)" v={`${impact.totalCapacityAfter.toLocaleString('en-IN')}/mo`} />
          {impact.shortfallUnits > 0 && <Row k="Shortfall" v={`${impact.shortfallUnits.toLocaleString('en-IN')} ${component.unit}`} />}
        </>
      )}

      <SectionTitle>Suppliers</SectionTitle>
      <div className="space-y-1">
        {suppliers.map((s) => {
          const link = s.supplies.find((l) => l.componentId === id)!;
          return (
            <div key={s.id} className="flex items-center justify-between text-[12.5px]">
              <span className="text-navy-900">{s.name}</span>
              <span className="text-slate-500">{link.capacityPerMonth.toLocaleString('en-IN')}/mo · {link.leadTimeDays}d</span>
            </div>
          );
        })}
      </div>

      <SectionTitle>Used in products</SectionTitle>
      <ul className="space-y-0.5 text-[12.5px] text-navy-900">
        {usedByProducts.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </>
  );
}

function ProductDetail({ data, result, id }: { data: SupplyNetworkData; result: SimulationResult | null; id: ID }) {
  const product = data.products.find((p) => p.id === id);
  if (!product) return null;
  const demand = computeProductDemand(data, id);
  const impact = result?.productImpacts.find((p) => p.productId === id);
  const customers = data.customers.filter((c) => c.orders.some((o) => o.productId === id));

  return (
    <>
      <h3 className="text-sm font-semibold text-navy-900">{product.name}</h3>
      <p className="text-xs text-slate-500">{inr(product.price)} / unit</p>
      {impact && impact.status !== 'ok' && (
        <div className="mt-2">
          <StatusBadge tone={statusTone(impact.status)}>{impact.status === 'blocked' ? 'Fully blocked' : 'Partially affected'}</StatusBadge>
        </div>
      )}

      <SectionTitle>Demand</SectionTitle>
      <Row k="Monthly orders" v={`${demand.toLocaleString('en-IN')} units`} />

      <SectionTitle>Required components</SectionTitle>
      <div className="space-y-1">
        {product.requiredComponents.map((r) => {
          const component = data.components.find((c) => c.id === r.componentId);
          const isLimiting = impact?.limitingComponentIds.includes(r.componentId);
          return (
            <div key={r.componentId} className="flex items-center justify-between text-[12.5px]">
              <span className={isLimiting ? 'font-medium text-red-700' : 'text-navy-900'}>{component?.name}</span>
              <span className="text-slate-500">x{r.qtyPerUnit}</span>
            </div>
          );
        })}
      </div>

      <SectionTitle>Ordered by</SectionTitle>
      <ul className="space-y-0.5 text-[12.5px] text-navy-900">
        {customers.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </>
  );
}

function CustomerDetail({ data, result, id }: { data: SupplyNetworkData; result: SimulationResult | null; id: ID }) {
  const customer = data.customers.find((c) => c.id === id);
  if (!customer) return null;
  const impact = result?.customerImpacts.find((c) => c.customerId === id);

  return (
    <>
      <h3 className="text-sm font-semibold text-navy-900">{customer.name}</h3>
      <p className="text-xs text-slate-500">{customer.region}</p>
      {impact && impact.riskLevel !== 'none' && (
        <div className="mt-2">
          <StatusBadge tone={statusTone(impact.riskLevel)}>{impact.riskLevel === 'high' ? 'High risk' : 'Medium risk'}</StatusBadge>
        </div>
      )}
      {impact && impact.atRiskOrderValue > 0 && (
        <div className="mt-1.5">
          <Row k="Est. order value at risk" v={inr(impact.atRiskOrderValue)} />
        </div>
      )}

      <SectionTitle>Orders</SectionTitle>
      <div className="space-y-1">
        {customer.orders.map((o) => {
          const product = data.products.find((p) => p.id === o.productId);
          const affected = impact?.affectedProductIds.includes(o.productId);
          return (
            <div key={o.productId} className="flex items-center justify-between text-[12.5px]">
              <span className={affected ? 'font-medium text-red-700' : 'text-navy-900'}>{product?.name}</span>
              <span className="text-slate-500">{o.quantity} units</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RouteDetail({ data, result, id }: { data: SupplyNetworkData; result: SimulationResult | null; id: ID }) {
  const route = data.routes.find((r) => r.id === id);
  if (!route) return null;
  const suppliers = data.suppliers.filter((s) => s.routeId === id);
  const isDisrupted = result?.disruptedRouteId === id;

  return (
    <>
      <h3 className="text-sm font-semibold text-navy-900">{route.name}</h3>
      <p className="text-xs text-slate-500">Operated by {route.operator}</p>
      {isDisrupted && (
        <div className="mt-2">
          <StatusBadge tone="red">Closed this scenario</StatusBadge>
        </div>
      )}
      <SectionTitle>Description</SectionTitle>
      <p className="text-[12.5px] leading-relaxed text-navy-900">{route.description}</p>

      <SectionTitle>Suppliers on this route</SectionTitle>
      <div className="space-y-1">
        {suppliers.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-[12.5px]">
            <span className="text-navy-900">{s.name}</span>
            <span className="text-slate-500">{s.hasAlternateRoute ? 'Has backup route' : 'No backup route'}</span>
          </div>
        ))}
      </div>
    </>
  );
}
