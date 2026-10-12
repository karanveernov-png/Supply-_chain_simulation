import { useState } from 'react';
import type { DisruptionType, SimulationResult, SupplyNetworkData } from '../../types/supplyChain';
import DependencyGraph from '../DependencyGraph';
import ImpactSummary from '../ImpactSummary';
import RecommendationsPanel from '../RecommendationsPanel';
import SimulationPanel from '../SimulationPanel';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';

interface SimulatorViewProps {
  data: SupplyNetworkData;
  disruptionType: DisruptionType;
  targetId: string;
  durationDays: number;
  result: SimulationResult | null;
  onChangeDisruptionType: (t: DisruptionType) => void;
  onChangeTargetId: (id: string) => void;
  onChangeDuration: (days: number) => void;
  onSimulate: () => void;
  onReset: () => void;
}

export default function SimulatorView({
  data,
  disruptionType,
  targetId,
  durationDays,
  result,
  onChangeDisruptionType,
  onChangeTargetId,
  onChangeDuration,
  onSimulate,
  onReset,
}: SimulatorViewProps) {
  const [panelOpen, setPanelOpen] = useState(!result);

  return (
    <div className="space-y-4">
      {/* Collapsible config panel */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Collapse toggle (mobile) */}
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left sm:hidden"
        >
          <div className="flex items-center gap-2">
            <Settings2 size={15} className="text-slate-400" />
            <span className="text-[13px] font-bold text-navy-900">Configure Disruption</span>
          </div>
          {panelOpen
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />
          }
        </button>

        {/* Desktop heading */}
        <div className="hidden items-center gap-2 border-b border-slate-100 px-5 py-3.5 sm:flex">
          <Settings2 size={15} className="text-slate-400" />
          <span className="text-[13px] font-bold text-navy-900">Configure Disruption</span>
        </div>

        <div className={`${panelOpen ? 'block' : 'hidden'} sm:block`}>
          <SimulationPanel
            data={data}
            disruptionType={disruptionType}
            targetId={targetId}
            durationDays={durationDays}
            hasResult={!!result}
            onChangeDisruptionType={onChangeDisruptionType}
            onChangeTargetId={onChangeTargetId}
            onChangeDuration={onChangeDuration}
            onSimulate={() => { onSimulate(); setPanelOpen(false); }}
            onReset={() => { onReset(); setPanelOpen(true); }}
          />
        </div>
      </div>

      <DependencyGraph
        data={data}
        result={result}
        height="320px"
        onResetSimulation={result ? onReset : undefined}
      />

      {result ? (
        <>
          <ImpactSummary data={data} result={result} />
          <RecommendationsPanel data={data} result={result} />
        </>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="text-[13.5px] font-bold text-navy-900">No simulation running</p>
          <p className="mx-auto mt-1.5 max-w-[260px] text-[12px] leading-relaxed text-slate-500">
            Configure a disruption above, then tap{' '}
            <span className="font-semibold text-navy-700">Simulate Disruption</span> to see the impact.
          </p>
        </div>
      )}
    </div>
  );
}
