import { Play, RotateCcw } from 'lucide-react';
import type { DisruptionType, SupplyNetworkData } from '../types/supplyChain';
import { DURATION_OPTIONS } from '../logic/simulation';

interface SimulationPanelProps {
  data: SupplyNetworkData;
  disruptionType: DisruptionType;
  targetId: string;
  durationDays: number;
  hasResult: boolean;
  onChangeDisruptionType: (t: DisruptionType) => void;
  onChangeTargetId: (id: string) => void;
  onChangeDuration: (days: number) => void;
  onSimulate: () => void;
  onReset: () => void;
}

const disruptionOptions: { value: DisruptionType; label: string; hint: string }[] = [
  { value: 'supplier_shutdown', label: 'Supplier Shutdown',  hint: 'Supplier halts operations entirely' },
  { value: 'flooding',          label: 'Flooding',           hint: "Supplier's facility is flooded and offline" },
  { value: 'route_closure',     label: 'Route Closure',      hint: 'A shipping corridor is closed' },
];

export default function SimulationPanel({
  data,
  disruptionType,
  targetId,
  durationDays,
  hasResult,
  onChangeDisruptionType,
  onChangeTargetId,
  onChangeDuration,
  onSimulate,
  onReset,
}: SimulationPanelProps) {
  const isRouteTarget = disruptionType === 'route_closure';
  const canSimulate   = targetId.trim().length > 0;

  return (
    <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-[12px] text-slate-500">
        Configure a synthetic disruption and run it against the current supply network.
      </p>

      {/* Disruption type */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Disruption type
        </p>
        <div className="space-y-1.5">
          {disruptionOptions.map((opt) => {
            const isSelected = disruptionType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeDisruptionType(opt.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`text-[12.5px] font-semibold ${isSelected ? 'text-blue-700' : 'text-navy-900'}`}
                >
                  {opt.label}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">{opt.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target */}
      <div>
        <label
          htmlFor="target-select"
          className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400"
        >
          {isRouteTarget ? 'Transport route' : 'Supplier'}
        </label>
        <select
          id="target-select"
          value={targetId}
          onChange={(e) => onChangeTargetId(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-navy-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select {isRouteTarget ? 'a route' : 'a supplier'}…</option>
          {isRouteTarget
            ? data.routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)
            : data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
          }
        </select>
      </div>

      {/* Duration */}
      <div>
        <label
          htmlFor="duration-select"
          className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400"
        >
          Duration
        </label>
        <select
          id="duration-select"
          value={durationDays}
          onChange={(e) => onChangeDuration(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-navy-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {DURATION_OPTIONS.map((d) => (
            <option key={d.days} value={d.days}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={!canSimulate}
          onClick={onSimulate}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-blue-200/60 transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          <Play size={14} strokeWidth={2.5} />
          Simulate Disruption
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={!hasResult}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <RotateCcw size={14} strokeWidth={2.4} />
          Reset
        </button>
      </div>

      {!canSimulate && (
        <p className="text-center text-[11px] text-slate-400">
          Select a {isRouteTarget ? 'route' : 'supplier'} above to run a simulation.
        </p>
      )}
    </div>
  );
}
