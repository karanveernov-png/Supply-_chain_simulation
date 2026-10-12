import { AlertTriangle, ArrowRight, Banknote, PackageX, TrendingDown, Users } from 'lucide-react';
import type { SimulationResult, SupplyNetworkData } from '../types/supplyChain';
import { buildPrimaryDisruptionChain } from '../logic/simulation';
import type { DisruptionChainStep } from '../logic/simulation';
import StatusBadge from './StatusBadge';
import type { BadgeTone } from './StatusBadge';

const chainToneClasses: Record<DisruptionChainStep['tone'], string> = {
  source: 'border-navy-700 bg-navy-900 text-white',
  blocked: 'border-red-200 bg-red-50 text-red-700',
  partial: 'border-amber-200 bg-amber-50 text-amber-700',
  ok: 'border-green-200 bg-green-50 text-green-700',
  impact: 'border-blue-200 bg-blue-50 text-blue-700',
};

function ChainStep({ step, isLast }: { step: DisruptionChainStep; isLast: boolean }) {
  return (
    <>
      <span
        className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium leading-tight ${chainToneClasses[step.tone]}`}
      >
        {step.label}
      </span>
      {!isLast && <ArrowRight size={12} className="shrink-0 text-slate-300" strokeWidth={2.5} />}
    </>
  );
}

interface ImpactSummaryProps {
  data: SupplyNetworkData;
  result: SimulationResult;
}

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function statusTone(status: 'blocked' | 'partial' | 'ok'): BadgeTone {
  if (status === 'blocked') return 'red';
  if (status === 'partial') return 'amber';
  return 'green';
}

function riskTone(risk: 'high' | 'medium' | 'none'): BadgeTone {
  if (risk === 'high') return 'red';
  if (risk === 'medium') return 'amber';
  return 'slate';
}

export default function ImpactSummary({ data, result }: ImpactSummaryProps) {
  const blockedComponents = result.componentImpacts.filter((c) => c.status !== 'ok');
  const affectedProducts = result.productImpacts.filter((p) => p.status !== 'ok');
  const atRiskCustomers = result.customerImpacts.filter((c) => c.riskLevel !== 'none');

  const blockedProductCount = result.productImpacts.filter((p) => p.status === 'blocked').length;
  const partialProductCount = result.productImpacts.filter((p) => p.status === 'partial').length;
  const chain = buildPrimaryDisruptionChain(data, result);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-navy-900">Impact Analysis</h2>
        <span className="text-[11px] text-slate-400">— from this scenario</span>
      </div>

      {/* disruption chain */}
      <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Disruption chain</p>
      <div className="flex flex-wrap items-center gap-1">
        {chain.map((step, idx) => (
          <ChainStep key={idx} step={step} isLast={idx === chain.length - 1} />
        ))}
      </div>

      {/* narrative */}
      <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-[12.5px] leading-relaxed text-navy-900">{result.summaryText}</p>
        <p className="text-[12px] leading-relaxed text-slate-600">{result.recoveryNote}</p>
      </div>

      {/* headline metrics — 2-col on mobile, 4-col on sm+ */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <HeadlineStat icon={PackageX} label="Blocked" value={blockedProductCount} tone={blockedProductCount > 0 ? 'red' : 'green'} />
        <HeadlineStat icon={TrendingDown} label="Partial" value={partialProductCount} tone={partialProductCount > 0 ? 'amber' : 'green'} />
        <HeadlineStat icon={Users} label="At risk" value={atRiskCustomers.length} tone={atRiskCustomers.length > 0 ? 'red' : 'green'} />
        <HeadlineStat icon={Banknote} label="Exposure" value={inr(result.estimatedFinancialExposure)} tone={result.estimatedFinancialExposure > 0 ? 'amber' : 'green'} />
      </div>

      {blockedComponents.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-[13px] text-green-700">
          <AlertTriangle size={15} />
          No components fall short of demand in this scenario.
        </div>
      ) : (
        <>
          {/* Affected components — cards on mobile, table on sm+ */}
          <SectionHeading>Affected components</SectionHeading>

          <div className="space-y-2 sm:hidden">
            {blockedComponents.map((c) => {
              const component = data.components.find((comp) => comp.id === c.componentId);
              const pctShort = c.totalDemand > 0 ? Math.round((c.shortfallUnits / c.totalDemand) * 100) : 0;
              return (
                <div key={c.componentId} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-navy-900">{component?.name}</span>
                    <StatusBadge tone={statusTone(c.status)}>{c.status === 'blocked' ? 'Blocked' : 'Partial'}</StatusBadge>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1 text-[11.5px]">
                    <div>
                      <div className="text-slate-400">Required</div>
                      <div className="mono-tabular text-slate-700">{c.totalDemand.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Available</div>
                      <div className="mono-tabular text-slate-700">{c.totalCapacityAfter.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Short</div>
                      <div className="mono-tabular font-medium text-red-600">
                        {c.shortfallUnits > 0 ? `${pctShort}%` : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10.5px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Component</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Required</th>
                  <th className="px-3 py-2 font-medium text-right">Available</th>
                  <th className="px-3 py-2 font-medium text-right">Unmet</th>
                  <th className="px-3 py-2 font-medium text-right">% short</th>
                </tr>
              </thead>
              <tbody>
                {blockedComponents.map((c) => {
                  const component = data.components.find((comp) => comp.id === c.componentId);
                  const pctShort = c.totalDemand > 0 ? Math.round((c.shortfallUnits / c.totalDemand) * 100) : 0;
                  return (
                    <tr key={c.componentId} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-navy-900">{component?.name}</td>
                      <td className="px-3 py-2">
                        <StatusBadge tone={statusTone(c.status)}>{c.status === 'blocked' ? 'Blocked' : 'Partial'}</StatusBadge>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600 mono-tabular">{c.totalDemand.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right text-slate-600 mono-tabular">{c.totalCapacityAfter.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-medium text-red-600 mono-tabular">
                        {c.shortfallUnits > 0 ? c.shortfallUnits.toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-red-600 mono-tabular">
                        {c.shortfallUnits > 0 ? `${pctShort}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Affected products */}
          <SectionHeading>Affected products</SectionHeading>
          <div className="space-y-2 sm:hidden">
            {affectedProducts.map((p) => {
              const product = data.products.find((prod) => prod.id === p.productId);
              const limitingNames = p.limitingComponentIds
                .map((id) => data.components.find((c) => c.id === id)?.name)
                .join(', ');
              return (
                <div key={p.productId} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-navy-900">{product?.name}</span>
                    <StatusBadge tone={statusTone(p.status)}>{p.status === 'blocked' ? 'Blocked' : 'Partial'}</StatusBadge>
                  </div>
                  {limitingNames && (
                    <div className="mt-1 text-[11.5px] text-slate-500">Limiting: {limitingNames}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10.5px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Limiting component(s)</th>
                </tr>
              </thead>
              <tbody>
                {affectedProducts.map((p) => {
                  const product = data.products.find((prod) => prod.id === p.productId);
                  const limitingNames = p.limitingComponentIds
                    .map((id) => data.components.find((c) => c.id === id)?.name)
                    .join(', ');
                  return (
                    <tr key={p.productId} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-navy-900">{product?.name}</td>
                      <td className="px-3 py-2">
                        <StatusBadge tone={statusTone(p.status)}>{p.status === 'blocked' ? 'Fully blocked' : 'Partially affected'}</StatusBadge>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{limitingNames}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Customers at risk */}
          <SectionHeading>Customers at risk</SectionHeading>
          <div className="space-y-2 sm:hidden">
            {atRiskCustomers.map((c) => {
              const customer = data.customers.find((cust) => cust.id === c.customerId);
              const productNames = c.affectedProductIds
                .map((id) => data.products.find((p) => p.id === id)?.name)
                .join(', ');
              return (
                <div key={c.customerId} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-navy-900">{customer?.name}</span>
                    <StatusBadge tone={riskTone(c.riskLevel)}>{c.riskLevel === 'high' ? 'High' : 'Medium'}</StatusBadge>
                  </div>
                  <div className="mt-1 text-[11.5px] text-slate-500">{productNames}</div>
                  <div className="mt-1 text-[11.5px] font-medium text-navy-900 mono-tabular">
                    {inr(c.atRiskOrderValue)} at risk
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10.5px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Risk</th>
                  <th className="px-3 py-2 font-medium">Affected products</th>
                  <th className="px-3 py-2 font-medium text-right">Est. value at risk</th>
                </tr>
              </thead>
              <tbody>
                {atRiskCustomers.map((c) => {
                  const customer = data.customers.find((cust) => cust.id === c.customerId);
                  const productNames = c.affectedProductIds
                    .map((id) => data.products.find((p) => p.id === id)?.name)
                    .join(', ');
                  return (
                    <tr key={c.customerId} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-navy-900">{customer?.name}</td>
                      <td className="px-3 py-2">
                        <StatusBadge tone={riskTone(c.riskLevel)}>{c.riskLevel === 'high' ? 'High' : 'Medium'}</StatusBadge>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{productNames}</td>
                      <td className="px-3 py-2 text-right font-medium text-navy-900 mono-tabular">{inr(c.atRiskOrderValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            Financial exposure is estimated from synthetic order quantities. This prototype does not model existing inventory or safety stock.
          </p>
        </>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{children}</p>;
}

function HeadlineStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof PackageX;
  label: string;
  value: string | number;
  tone: 'red' | 'amber' | 'green';
}) {
  const toneColor = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : 'text-green-600';
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2.5 sm:px-3">
      <div className="flex items-center gap-1 text-slate-400">
        <Icon size={12} className={toneColor} />
        <span className="text-[10px] uppercase tracking-wide leading-tight">{label}</span>
      </div>
      <p className="mt-1 text-base font-semibold text-navy-900 mono-tabular sm:text-lg">{value}</p>
    </div>
  );
}
