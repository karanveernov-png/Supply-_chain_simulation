import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Share2, Zap, ShieldAlert, Lightbulb } from 'lucide-react';

export type SectionId = 'overview' | 'network' | 'simulator' | 'risk' | 'recommendations';

interface NavItem {
  id: SectionId;
  label: string;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { id: 'overview',         label: 'Overview',  icon: LayoutDashboard },
  { id: 'network',          label: 'Network',   icon: Share2 },
  { id: 'simulator',        label: 'Simulate',  icon: Zap },
  { id: 'risk',             label: 'Risk',      icon: ShieldAlert },
  { id: 'recommendations',  label: 'Recs',      icon: Lightbulb },
];

interface BottomNavProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  activeSimBadgeCount?: number;
}

export default function BottomNav({ active, onSelect, activeSimBadgeCount }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end border-t border-slate-200/70 bg-white/90 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        const Icon = item.icon;
        const showBadge = item.id === 'recommendations' && !!activeSimBadgeCount;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition-all duration-150 ${
              isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {/* Active pill indicator at top */}
            {isActive && (
              <span className="absolute left-1/2 top-0 h-[2px] w-8 -translate-x-1/2 rounded-full bg-blue-600" />
            )}
            {/* Icon container with active bg */}
            <div
              className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150 ${
                isActive ? 'bg-blue-50' : ''
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
              {showBadge && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                  {activeSimBadgeCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
