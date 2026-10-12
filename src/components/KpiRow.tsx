import { Boxes, Factory, ShieldAlert, Truck, Users } from 'lucide-react';
import type { BaselineRisk } from '../logic/simulation';
import MetricCard from './MetricCard';

interface KpiRowProps {
  baseline: BaselineRisk;
}

export default function KpiRow({ baseline }: KpiRowProps) {
  return (
    <div className="border-b border-slate-200/80 bg-[#eef2f7] px-3 py-3 sm:px-6 sm:py-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        <MetricCard label="Suppliers"   value={baseline.totalSuppliers}   icon={Factory}     tone="blue" />
        <MetricCard label="Components"  value={baseline.totalComponents}  icon={Boxes}       tone="blue" />
        <MetricCard label="Products"    value={baseline.totalProducts}    icon={Truck}       tone="blue" />
        <MetricCard
          label="Critical"
          value={baseline.criticalSupplierCount}
          subtitle={`of ${baseline.totalSuppliers} single-source`}
          icon={ShieldAlert}
          tone="amber"
        />
        <MetricCard
          label="At Risk"
          value={baseline.customersAtRiskCount}
          subtitle="customers exposed"
          icon={Users}
          tone="red"
        />
      </div>
    </div>
  );
}
