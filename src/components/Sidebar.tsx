import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Share2, Zap, ShieldAlert, Lightbulb } from 'lucide-react';

export type SectionId = 'overview' | 'network' | 'simulator' | 'risk' | 'recommendations';

interface NavItem {
  id: SectionId;
  label: string;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'network', label: 'Dependency Network', icon: Share2 },
  { id: 'simulator', label: 'Disruption Simulator', icon: Zap },
  { id: 'risk', label: 'Risk Analysis', icon: ShieldAlert },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
];

interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  activeSimBadgeCount?: number;
}

export default function Sidebar({ active, onSelect, activeSimBadgeCount }: SidebarProps) {
  return (
    <nav className="flex w-56 shrink-0 flex-col gap-0.5 border-r border-slate-200 bg-white px-3 py-4">
      {items.map((item) => {
        const isActive = item.id === active;
        const Icon = item.icon;
        const showBadge = item.id === 'recommendations' && !!activeSimBadgeCount;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`group flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Icon size={16} strokeWidth={2} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'} />
              {item.label}
            </span>
            {showBadge && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                {activeSimBadgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
