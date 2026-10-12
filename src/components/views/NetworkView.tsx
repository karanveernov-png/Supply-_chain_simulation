import { Info } from 'lucide-react';
import DependencyGraph from '../DependencyGraph';
import type { SimulationResult, SupplyNetworkData } from '../../types/supplyChain';

interface NetworkViewProps {
  data: SupplyNetworkData;
  result: SimulationResult | null;
  onResetSimulation: () => void;
}

export default function NetworkView({ data, result, onResetSimulation }: NetworkViewProps) {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-[14px] font-bold text-navy-900 sm:text-[15px]">Dependency Network</h1>
        <p className="mt-0.5 text-[12px] text-slate-500">
          Routes → Suppliers → Components → Products → Customers. Tap any node · pinch to zoom · drag to pan.
        </p>
      </div>

      {result && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] font-medium text-amber-700">
          <Info size={13} className="shrink-0" />
          Showing results of the active simulation
        </div>
      )}

      <DependencyGraph
        data={data}
        result={result}
        height="calc(100dvh - 280px)"
        onResetSimulation={result ? onResetSimulation : undefined}
      />
    </div>
  );
}
