import { useMemo, useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import type { SectionId } from './components/BottomNav';
import KpiRow from './components/KpiRow';
import OverviewView from './components/views/OverviewView';
import NetworkView from './components/views/NetworkView';
import SimulatorView from './components/views/SimulatorView';
import RiskAnalysisView from './components/views/RiskAnalysisView';
import RecommendationsView from './components/views/RecommendationsView';
import { supplyNetworkData } from './data/syntheticNetwork';
import { computeBaselineRisk, runSimulation } from './logic/simulation';
import type { DisruptionType, SimulationResult } from './types/supplyChain';

export default function App() {
  const [section, setSection] = useState<SectionId>('overview');

  const [disruptionType, setDisruptionType] = useState<DisruptionType>('supplier_shutdown');
  const [targetId, setTargetId] = useState('');
  const [durationDays, setDurationDays] = useState(14);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const baseline = useMemo(() => computeBaselineRisk(supplyNetworkData), []);

  const handleChangeDisruptionType = (t: DisruptionType) => {
    setDisruptionType(t);
    setTargetId('');
  };

  const handleSimulate = () => {
    if (!targetId) return;
    const res = runSimulation(supplyNetworkData, { disruptionType, targetId, durationDays });
    setResult(res);
  };

  const handleReset = () => {
    setResult(null);
    setTargetId('');
  };

  const handleQuickLaunch = (input: { disruptionType: DisruptionType; targetId: string; durationDays: number }) => {
    setDisruptionType(input.disruptionType);
    setTargetId(input.targetId);
    setDurationDays(input.durationDays);
    const res = runSimulation(supplyNetworkData, input);
    setResult(res);
    setSection('simulator');
  };

  const affectedComponentCount = result ? result.componentImpacts.filter((c) => c.status !== 'ok').length : 0;

  return (
    <div className="flex flex-col bg-slate-50" style={{ minHeight: '100dvh' }}>
      <Header hasActiveSimulation={!!result} />
      <KpiRow baseline={baseline} />
      <main className="min-w-0 flex-1 overflow-y-auto px-3 py-4 pb-24 sm:px-6 sm:py-5">
        {section === 'overview' && (
          <OverviewView
            data={supplyNetworkData}
            baseline={baseline}
            result={result}
            onNavigate={setSection}
            onQuickLaunch={handleQuickLaunch}
          />
        )}
        {section === 'network' && (
          <NetworkView data={supplyNetworkData} result={result} onResetSimulation={handleReset} />
        )}
        {section === 'simulator' && (
          <SimulatorView
            data={supplyNetworkData}
            disruptionType={disruptionType}
            targetId={targetId}
            durationDays={durationDays}
            result={result}
            onChangeDisruptionType={handleChangeDisruptionType}
            onChangeTargetId={setTargetId}
            onChangeDuration={setDurationDays}
            onSimulate={handleSimulate}
            onReset={handleReset}
          />
        )}
        {section === 'risk' && <RiskAnalysisView data={supplyNetworkData} />}
        {section === 'recommendations' && (
          <RecommendationsView data={supplyNetworkData} result={result} onNavigate={setSection} />
        )}
      </main>
      <BottomNav active={section} onSelect={setSection} activeSimBadgeCount={affectedComponentCount} />
    </div>
  );
}
