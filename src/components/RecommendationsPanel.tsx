import { Lightbulb, ShieldOff } from 'lucide-react';
import type { SimulationResult, SupplyNetworkData } from '../types/supplyChain';

interface RecommendationsPanelProps {
  data: SupplyNetworkData;
  result: SimulationResult;
}

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function RecommendationsPanel({ data, result }: RecommendationsPanelProps) {
  const shortageComponentIds = Array.from(
    new Set(result.componentImpacts.filter((c) => c.status !== 'ok').map((c) => c.componentId)),
  );

  if (shortageComponentIds.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-navy-900">Alternative Supplier Recommendations</h2>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-[13px] text-green-700">
          No sourcing action needed — the network already covers demand in this scenario.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-navy-900">Alternative Supplier Recommendations</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Ranked by a weighted score of available capacity (45%), lead time (30%), and cost (25%), relative to other
        candidates for the same component.
      </p>

      <div className="mt-4 space-y-4">
        {shortageComponentIds.map((componentId) => {
          const component = data.components.find((c) => c.id === componentId);
          const impact = result.componentImpacts.find((c) => c.componentId === componentId)!;
          const recs = result.recommendations
            .filter((r) => r.componentId === componentId)
            .sort((a, b) => b.score - a.score);

          return (
            <div key={componentId}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[13px] font-medium text-navy-900">{component?.name}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10.5px] font-medium ${
                    impact.status === 'blocked' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {impact.status === 'blocked' ? 'Fully blocked' : `Short by ${impact.shortfallUnits.toLocaleString('en-IN')}/mo`}
                </span>
              </div>

              {recs.length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] text-slate-600">
                  <ShieldOff size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  No viable alternative supplier currently exists in the network for this component. This is a
                  single-source dependency.
                </div>
              ) : (
                <div className="space-y-2">
                  {recs.map((rec, idx) => {
                    const supplier = data.suppliers.find((s) => s.id === rec.supplierId);
                    return (
                      <div key={rec.supplierId} className="rounded-md border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
                                <Lightbulb size={12} />
                              </span>
                            )}
                            <span className="text-[13px] font-medium text-navy-900">{supplier?.name}</span>
                          </div>
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 mono-tabular">
                            Score {rec.score}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11.5px]">
                          <Stat label="Capacity" value={`${rec.availableCapacity.toLocaleString('en-IN')}/mo`} />
                          <Stat label="Lead time" value={`${rec.leadTimeDays} days`} />
                          <Stat label="Unit cost" value={inr(rec.unitCost)} />
                        </div>
                        <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{rec.reason}</p>
                        {rec.limitation && (
                          <p className="mt-1 text-[11.5px] leading-relaxed text-amber-700">⚠ {rec.limitation}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-medium text-navy-900 mono-tabular">{value}</div>
    </div>
  );
}
