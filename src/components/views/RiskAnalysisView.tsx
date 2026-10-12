import { AlertOctagon, Route as RouteIcon, ShieldAlert } from 'lucide-react';
import {
  computeComponentDemand,
  getCorrelatedRouteRisks,
  getCriticalSuppliers,
  getSingleSourceComponents,
} from '../../logic/simulation';
import type { SupplyNetworkData } from '../../types/supplyChain';
import StatusBadge from '../StatusBadge';

interface RiskAnalysisViewProps {
  data: SupplyNetworkData;
}

/* Shared section wrapper */
function RiskSection({
  icon,
  iconClass,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2.5 mb-1">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>
        <h2 className="text-[13px] font-bold text-navy-900">{title}</h2>
      </div>
      <p className="mb-3 text-[12px] text-slate-500 pl-10">{description}</p>
      {children}
    </section>
  );
}

export default function RiskAnalysisView({ data }: RiskAnalysisViewProps) {
  const singleSourceComponents = getSingleSourceComponents(data);
  const criticalSuppliers      = getCriticalSuppliers(data);
  const correlatedRisks        = getCorrelatedRouteRisks(data);

  return (
    <div className="space-y-4">

      {/* ── Single-source components ── */}
      <RiskSection
        icon={<ShieldAlert size={15} className="text-amber-600" />}
        iconClass="bg-amber-50"
        title="Single-source components"
        description="Components available from exactly one supplier — losing that supplier blocks the component entirely."
      >
        {/* Mobile cards */}
        <div className="space-y-2 sm:hidden">
          {singleSourceComponents.map((c) => {
            const supplier = data.suppliers.find((s) => s.supplies.some((l) => l.componentId === c.id));
            const demand   = computeComponentDemand(data, c.id);
            const products = data.products.filter((p) => p.requiredComponents.some((r) => r.componentId === c.id));
            return (
              <div key={c.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                <div className="text-[12.5px] font-semibold text-navy-900">{c.name}</div>
                <div className="mt-1 text-[11.5px] text-slate-600">Sole supplier: {supplier?.name}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Demand: <span className="mono-tabular">{demand.toLocaleString('en-IN')} {c.unit}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Affects: {products.map((p) => p.name).join(', ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 sm:block">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-semibold">Component</th>
                <th className="px-4 py-2.5 font-semibold">Sole supplier</th>
                <th className="px-4 py-2.5 text-right font-semibold">Monthly demand</th>
                <th className="px-4 py-2.5 font-semibold">Products affected</th>
              </tr>
            </thead>
            <tbody>
              {singleSourceComponents.map((c) => {
                const supplier = data.suppliers.find((s) => s.supplies.some((l) => l.componentId === c.id));
                const demand   = computeComponentDemand(data, c.id);
                const products = data.products.filter((p) => p.requiredComponents.some((r) => r.componentId === c.id));
                return (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-semibold text-navy-900">{c.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{supplier?.name}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600 mono-tabular">
                      {demand.toLocaleString('en-IN')} {c.unit}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{products.map((p) => p.name).join(', ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </RiskSection>

      {/* ── Critical suppliers ── */}
      <RiskSection
        icon={<AlertOctagon size={15} className="text-red-600" />}
        iconClass="bg-red-50"
        title="Critical suppliers"
        description="Suppliers who are the sole source of at least one component — losing any creates an immediate shortage."
      >
        {/* Mobile cards */}
        <div className="space-y-2 sm:hidden">
          {criticalSuppliers.map((s) => {
            const singleSourceIds   = new Set(singleSourceComponents.map((c) => c.id));
            const soleComponents    = s.supplies.filter((l) => singleSourceIds.has(l.componentId));
            const downstreamCount   = new Set(
              data.products
                .filter((p) => p.requiredComponents.some((r) => soleComponents.some((sc) => sc.componentId === r.componentId)))
                .map((p) => p.id),
            ).size;
            return (
              <div key={s.id} className="rounded-xl border border-red-100 bg-red-50/30 p-3">
                <div className="text-[12.5px] font-semibold text-navy-900">{s.name}</div>
                <div className="mt-0.5 text-[11.5px] text-slate-500">{s.location}</div>
                <div className="mt-1 text-[11.5px] text-slate-600">
                  Sole-sourced:{' '}
                  {soleComponents.map((l) => data.components.find((c) => c.id === l.componentId)?.name).join(', ')}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">{downstreamCount} downstream products</div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 sm:block">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-semibold">Supplier</th>
                <th className="px-4 py-2.5 font-semibold">Location</th>
                <th className="px-4 py-2.5 font-semibold">Sole-sourced components</th>
                <th className="px-4 py-2.5 text-right font-semibold">Downstream products</th>
              </tr>
            </thead>
            <tbody>
              {criticalSuppliers.map((s) => {
                const singleSourceIds  = new Set(singleSourceComponents.map((c) => c.id));
                const soleComponents   = s.supplies.filter((l) => singleSourceIds.has(l.componentId));
                const downstreamCount  = new Set(
                  data.products
                    .filter((p) => p.requiredComponents.some((r) => soleComponents.some((sc) => sc.componentId === r.componentId)))
                    .map((p) => p.id),
                ).size;
                return (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-semibold text-navy-900">{s.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{s.location}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {soleComponents.map((l) => data.components.find((c) => c.id === l.componentId)?.name).join(', ')}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600 mono-tabular">{downstreamCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </RiskSection>

      {/* ── Correlated transport risk ── */}
      <RiskSection
        icon={<RouteIcon size={15} className="text-amber-600" />}
        iconClass="bg-amber-50"
        title="Correlated transport risk"
        description="Multi-sourced components whose every supplier ships through the same corridor — one closure removes all sources."
      >
        {correlatedRisks.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[12.5px] text-green-700">
            ✓ No multi-sourced components share a single corridor across all suppliers.
          </div>
        ) : (
          <div className="space-y-2">
            {correlatedRisks.map((risk) => {
              const component = data.components.find((c) => c.id === risk.componentId);
              const route     = data.routes.find((r) => r.id === risk.routeId);
              const suppliers = data.suppliers.filter((s) => risk.supplierIds.includes(s.id));
              return (
                <div key={risk.componentId} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-navy-900">{component?.name}</span>
                    <StatusBadge tone="amber">{route?.name}</StatusBadge>
                  </div>
                  <p className="mt-1.5 text-[12px] text-amber-800">
                    Both {suppliers.map((s) => s.name).join(' and ')} ship through this corridor — closing it removes
                    every available source simultaneously.
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </RiskSection>
    </div>
  );
}
