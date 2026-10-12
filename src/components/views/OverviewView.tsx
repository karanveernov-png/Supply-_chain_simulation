import { ArrowRight, Share2, Zap, AlertTriangle } from 'lucide-react';
import type { BaselineRisk } from '../../logic/simulation';
import { getCriticalSuppliers, getSingleSourceComponents } from '../../logic/simulation';
import type { DisruptionType, SimulationResult, SupplyNetworkData } from '../../types/supplyChain';
import { DEMO_COMPANY_NAME } from '../../data/syntheticNetwork';
import type { SectionId } from '../BottomNav';

interface OverviewViewProps {
  data: SupplyNetworkData;
  baseline: BaselineRisk;
  result: SimulationResult | null;
  onNavigate: (section: SectionId) => void;
  onQuickLaunch: (input: { disruptionType: DisruptionType; targetId: string; durationDays: number }) => void;
}

export default function OverviewView({ data, baseline, result, onNavigate, onQuickLaunch }: OverviewViewProps) {
  const criticalSuppliers   = getCriticalSuppliers(data);
  const singleSourceComponents = getSingleSourceComponents(data);

  return (
    <div className="space-y-4">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-5 text-white shadow-lg sm:p-6">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-0 h-28 w-32 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative">
          <span className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-bold tracking-widest text-blue-300">
            SUPPLY CHAIN INTELLIGENCE
          </span>
          <h1 className="mt-1 text-[17px] font-bold leading-snug tracking-tight text-white sm:text-[19px]">
            End-to-end visibility<br className="hidden sm:block" /> for small manufacturers
          </h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">
            {DEMO_COMPANY_NAME} · {baseline.totalSuppliers} suppliers ·{' '}
            {baseline.totalComponents} components · {baseline.totalProducts} products
          </p>
          <p className="mt-1 text-[11px] text-white/30">
            All data is synthetic and for demonstration purposes only.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => onNavigate('network')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-blue-900/30 transition-colors hover:bg-blue-400 active:bg-blue-600"
            >
              <Share2 size={14} />
              Dependency Network
            </button>
            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/12 active:bg-white/18"
            >
              <Zap size={14} />
              Disruption Simulator
            </button>
          </div>
        </div>
      </section>

      {/* ── Structural risk ── */}
      <section className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
            <AlertTriangle size={15} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-navy-900">Structural vulnerabilities</h2>
            <p className="text-[11px] text-slate-500">
              {baseline.criticalSupplierCount} of {baseline.totalSuppliers} suppliers are sole-source
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {criticalSuppliers.slice(0, 5).map((s) => {
            const soleComponents = s.supplies.filter((link) =>
              singleSourceComponents.some((c) => c.id === link.componentId),
            );
            return (
              <li
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-amber-100 bg-white/80 px-3 py-2.5 backdrop-blur-sm"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-700">
                  !
                </span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-navy-900">{s.name}</div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-500">
                    Sole source:{' '}
                    {soleComponents
                      .map((l) => data.components.find((c) => c.id === l.componentId)?.name)
                      .join(', ')}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => onNavigate('risk')}
          className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-amber-700 hover:text-amber-800"
        >
          Full risk analysis <ArrowRight size={12} />
        </button>
      </section>

      {/* ── Scenarios / active sim ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
            <Zap size={15} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-navy-900">
              {result ? 'Active simulation' : 'Demonstration scenarios'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {result
                ? 'Disruption is propagating through the network'
                : 'Tap a scenario to run it instantly'}
            </p>
          </div>
        </div>

        {result ? (
          <>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
              <p className="text-[12.5px] leading-relaxed text-navy-900">{result.summaryText}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
            >
              Full impact analysis <ArrowRight size={12} />
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <ScenarioCard
              badge="A"
              badgeColor="red"
              title="Critical supplier shutdown"
              description="Northstar Components (sole source of Electric Motors) goes offline for 14 days."
              onClick={() =>
                onQuickLaunch({ disruptionType: 'supplier_shutdown', targetId: 'sup-northstar-components', durationDays: 14 })
              }
            />
            <ScenarioCard
              badge="B"
              badgeColor="amber"
              title="Redundant supplier failure"
              description="Vikram Castings & Forge goes offline; other suppliers absorb demand."
              onClick={() =>
                onQuickLaunch({ disruptionType: 'supplier_shutdown', targetId: 'sup-vikram-castings', durationDays: 14 })
              }
            />
            <ScenarioCard
              badge="C"
              badgeColor="blue"
              title="Transport corridor closure"
              description="The Western Corridor closes, affecting three electrical suppliers for 30 days."
              onClick={() =>
                onQuickLaunch({ disruptionType: 'route_closure', targetId: 'route-western', durationDays: 30 })
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Scenario card ── */
type Color = 'red' | 'amber' | 'blue';
const colorMap: Record<Color, { badge: string; hover: string }> = {
  red:   { badge: 'bg-red-100 text-red-700',   hover: 'hover:border-red-200   hover:bg-red-50/40' },
  amber: { badge: 'bg-amber-100 text-amber-700', hover: 'hover:border-amber-200 hover:bg-amber-50/40' },
  blue:  { badge: 'bg-blue-100 text-blue-700',  hover: 'hover:border-blue-200  hover:bg-blue-50/40' },
};

function ScenarioCard({
  badge,
  badgeColor,
  title,
  description,
  onClick,
}: {
  badge: string;
  badgeColor: Color;
  title: string;
  description: string;
  onClick: () => void;
}) {
  const c = colorMap[badgeColor];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition-all active:scale-[0.98] ${c.hover}`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${c.badge}`}
      >
        {badge}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold text-navy-900">{title}</div>
        <div className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{description}</div>
      </div>
      <ArrowRight size={14} className="mt-1 shrink-0 text-slate-300" />
    </button>
  );
}
