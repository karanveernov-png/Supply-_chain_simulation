const nodeShapes: { label: string; shapeClass: string; color: string }[] = [
  { label: 'Transport route', shapeClass: 'legend-diamond', color: '#94a3b8' },
  { label: 'Supplier', shapeClass: 'legend-roundrect', color: '#2563eb' },
  { label: 'Component', shapeClass: 'legend-hexagon', color: '#64748b' },
  { label: 'Product', shapeClass: 'legend-ellipse', color: '#0f1b2e' },
  { label: 'Customer', shapeClass: 'legend-star', color: '#475569' },
];

const statusSwatches: { label: string; color: string; border: string }[] = [
  { label: 'Disrupted / blocked', color: '#fee2e2', border: '#dc2626' },
  { label: 'Partial / degraded', color: '#fef3c7', border: '#d97706' },
  { label: 'Recommended alternative', color: '#dcfce7', border: '#16a34a' },
];

export default function Legend() {
  return (
    <div className="absolute bottom-3 left-3 w-[220px] rounded-md border border-slate-200 bg-white/95 p-3 text-[11px] shadow-sm backdrop-blur">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Legend</p>
      <div className="mb-2.5 space-y-1.5">
        {nodeShapes.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-slate-600">
            <ShapeIcon kind={s.shapeClass} color={s.color} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 border-t border-slate-100 pt-2">
        {statusSwatches.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-slate-600">
            <span
              className="h-3 w-3 shrink-0 rounded-sm border-2"
              style={{ backgroundColor: s.color, borderColor: s.border }}
            />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShapeIcon({ kind, color }: { kind: string; color: string }) {
  const common = { width: 12, height: 12, fill: 'none', stroke: color, strokeWidth: 1.6 } as const;
  switch (kind) {
    case 'legend-diamond':
      return (
        <svg viewBox="0 0 14 14" {...common} className="shrink-0">
          <polygon points="7,1 13,7 7,13 1,7" strokeDasharray="2,1.3" />
        </svg>
      );
    case 'legend-roundrect':
      return (
        <svg viewBox="0 0 14 14" {...common} className="shrink-0">
          <rect x="1" y="2.5" width="12" height="9" rx="2.5" />
        </svg>
      );
    case 'legend-hexagon':
      return (
        <svg viewBox="0 0 14 14" {...common} className="shrink-0">
          <polygon points="4,1.5 10,1.5 13,7 10,12.5 4,12.5 1,7" />
        </svg>
      );
    case 'legend-ellipse':
      return (
        <svg viewBox="0 0 14 14" {...common} className="shrink-0">
          <ellipse cx="7" cy="7" rx="6" ry="5" strokeWidth={2} />
        </svg>
      );
    case 'legend-star':
      return (
        <svg viewBox="0 0 14 14" {...common} className="shrink-0">
          <polygon points="7,1 8.7,5.2 13,5.4 9.6,8.1 10.8,12.3 7,9.9 3.2,12.3 4.4,8.1 1,5.4 5.3,5.2" />
        </svg>
      );
    default:
      return null;
  }
}
