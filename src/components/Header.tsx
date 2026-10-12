import { Activity, Network } from 'lucide-react';
import { DEMO_COMPANY_NAME } from '../data/syntheticNetwork';

interface HeaderProps {
  hasActiveSimulation: boolean;
}

export default function Header({ hasActiveSimulation }: HeaderProps) {
  return (
    <header
      className="relative shrink-0 overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800" />
      {/* Subtle dot-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* Accent glow */}
      <div className="absolute -right-16 top-0 h-24 w-48 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg sm:h-9 sm:w-9">
            <Network size={15} strokeWidth={2.4} className="text-white" />
            <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-sm" />
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-bold tracking-tight text-white sm:text-[16px]">
                SupplyWeb
              </span>
              {hasActiveSimulation && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  SIM ACTIVE
                </span>
              )}
            </div>
            <div className="mt-0.5 max-w-[160px] truncate text-[11px] text-navy-400 sm:max-w-none">
              {DEMO_COMPANY_NAME}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveSimulation && (
            <div className="hidden items-center gap-1.5 text-[11px] font-semibold text-green-400 sm:flex">
              <Activity size={11} className="animate-pulse" />
              Live
            </div>
          )}
          <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/40 backdrop-blur-sm">
            DEMO
          </span>
        </div>
      </div>
    </header>
  );
}
