export type BadgeTone = 'red' | 'amber' | 'green' | 'blue' | 'slate';

const toneClasses: Record<BadgeTone, string> = {
  red:   'bg-red-50   text-red-700   border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  blue:  'bg-blue-50  text-blue-700  border-blue-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

const dotColorMap: Record<BadgeTone, string> = {
  red:   'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  blue:  'bg-blue-500',
  slate: 'bg-slate-400',
};

interface StatusBadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
}

export default function StatusBadge({ tone, children, dot = true }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${toneClasses[tone]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColorMap[tone]}`} />}
      {children}
    </span>
  );
}
