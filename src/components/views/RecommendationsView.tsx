import { Zap } from 'lucide-react';
import type { SectionId } from '../BottomNav';
import type { SimulationResult, SupplyNetworkData } from '../../types/supplyChain';
import RecommendationsPanel from '../RecommendationsPanel';

interface RecommendationsViewProps {
  data: SupplyNetworkData;
  result: SimulationResult | null;
  onNavigate: (section: SectionId) => void;
}

export default function RecommendationsView({ data, result, onNavigate }: RecommendationsViewProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[14px] font-bold text-navy-900 sm:text-[15px]">Recommendations</h1>
        <p className="mt-0.5 text-[12px] text-slate-500">
          Alternative sourcing options generated from the most recently run disruption scenario.
        </p>
      </div>

      {result ? (
        <RecommendationsPanel data={data} result={result} />
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          {/* Icon ring */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 mb-4">
            <Zap size={22} className="text-blue-500" />
          </div>
          <p className="text-[13.5px] font-bold text-navy-900">No simulation has been run yet</p>
          <p className="mx-auto mt-1.5 max-w-[260px] text-[12px] leading-relaxed text-slate-500">
            Run a disruption scenario in the simulator to generate ranked alternative-supplier recommendations.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('simulator')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            <Zap size={14} />
            Go to Disruption Simulator
          </button>
        </div>
      )}
    </div>
  );
}
