import type { LucideIcon } from 'lucide-react';

export type MetricTone = 'neutral' | 'blue' | 'red' | 'amber' | 'green';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  tone?: MetricTone;
}

const toneStyles: Record<
  MetricTone,
  { bg: string; border: string; iconBg: string; icon: string; value: string }
> = {
  neutral: {
    bg: 'bg-white',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    icon: 'text-slate-500',
    value: 'text-navy-900',
  },
  blue: {
    bg: 'bg-white',
    border: 'border-blue-100',
    iconBg: 'bg-blue-50',
    icon: 'text-blue-600',
    value: 'text-navy-900',
  },
  red: {
    bg: 'bg-white',
    border: 'border-red-100',
    iconBg: 'bg-red-50',
    icon: 'text-red-600',
    value: 'text-red-700',
  },
  amber: {
    bg: 'bg-white',
    border: 'border-amber-100',
    iconBg: 'bg-amber-50',
    icon: 'text-amber-600',
    value: 'text-amber-800',
  },
  green: {
    bg: 'bg-white',
    border: 'border-green-100',
    iconBg: 'bg-green-50',
    icon: 'text-green-600',
    value: 'text-green-800',
  },
};

export default function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone = 'neutral',
}: MetricCardProps) {
  const s = toneStyles[tone];
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-3 shadow-sm sm:p-4`}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:text-[10.5px]">
          {label}
        </p>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${s.iconBg} ${s.icon} sm:h-8 sm:w-8`}
        >
          <Icon size={13} strokeWidth={2.2} className="sm:hidden" />
          <Icon size={15} strokeWidth={2.2} className="hidden sm:block" />
        </div>
      </div>

      {/* Value */}
      <div className="mt-2.5">
        <p
          className={`text-2xl font-bold leading-none mono-tabular sm:text-[28px] ${s.value}`}
        >
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-[10px] leading-tight text-slate-400 sm:text-[11px]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
