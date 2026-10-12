// Core domain types for the SupplyWeb prototype.
// All data is synthetic and used only to demonstrate dependency modeling.

export type ID = string;

/** A capability link: one supplier's ability to provide one component. */
export interface SupplierComponentLink {
  componentId: ID;
  /** Units this supplier can produce/ship per month for this component. */
  capacityPerMonth: number;
  leadTimeDays: number;
  /** Indicative unit cost in INR. */
  unitCost: number;
  /** Whether this supplier is the primary (preferred) source for this component. */
  isPrimary: boolean;
}

export interface Supplier {
  id: ID;
  name: string;
  location: string;
  /** Transport route this supplier normally ships through. */
  routeId: ID;
  /**
   * If true, this supplier can reroute shipments through a secondary corridor
   * when its primary route is closed, at reduced capacity instead of zero.
   */
  hasAlternateRoute: boolean;
  supplies: SupplierComponentLink[];
}

export interface Component {
  id: ID;
  name: string;
  category: string;
  unit: string;
}

export interface ProductRequirement {
  componentId: ID;
  qtyPerUnit: number;
}

export interface Product {
  id: ID;
  name: string;
  /** Indicative unit price in INR, used only to estimate financial exposure. */
  price: number;
  requiredComponents: ProductRequirement[];
}

export interface CustomerOrder {
  productId: ID;
  /** Synthetic monthly order volume in units. */
  quantity: number;
}

export interface Customer {
  id: ID;
  name: string;
  region: string;
  orders: CustomerOrder[];
}

export interface TransportRoute {
  id: ID;
  name: string;
  operator: string;
  description: string;
}

export interface SupplyNetworkData {
  suppliers: Supplier[];
  components: Component[];
  products: Product[];
  customers: Customer[];
  routes: TransportRoute[];
}

// ---------- Simulation ----------

export type DisruptionType = 'supplier_shutdown' | 'flooding' | 'route_closure';

export interface SimulationInput {
  disruptionType: DisruptionType;
  /** Supplier id for shutdown/flooding, route id for route_closure. */
  targetId: ID;
  durationDays: number;
}

export type ImpactStatus = 'blocked' | 'partial' | 'ok';

export interface ComponentImpact {
  componentId: ID;
  status: ImpactStatus;
  totalCapacityBefore: number;
  totalCapacityAfter: number;
  totalDemand: number;
  shortfallUnits: number;
  /** Suppliers that lost some or all capacity in this scenario. */
  affectedSupplierIds: ID[];
  /** Suppliers still contributing capacity after the disruption. */
  remainingSupplierIds: ID[];
}

export interface ProductImpact {
  productId: ID;
  status: ImpactStatus;
  limitingComponentIds: ID[];
  /** 0..1 — the worst shortfall ratio among this product's required components. */
  worstShortfallRatio: number;
}

export interface CustomerImpact {
  customerId: ID;
  riskLevel: 'high' | 'medium' | 'none';
  affectedProductIds: ID[];
  atRiskOrderValue: number;
}

export interface SupplierRecommendation {
  supplierId: ID;
  componentId: ID;
  availableCapacity: number;
  leadTimeDays: number;
  unitCost: number;
  /** 0..100 explainable composite score. */
  score: number;
  reason: string;
  limitation?: string;
}

export interface SimulationResult {
  input: SimulationInput;
  disruptedSupplierIds: ID[];
  degradedSupplierIds: ID[];
  disruptedRouteId?: ID;
  componentImpacts: ComponentImpact[];
  productImpacts: ProductImpact[];
  customerImpacts: CustomerImpact[];
  recommendations: SupplierRecommendation[];
  totalShortfallUnits: number;
  estimatedFinancialExposure: number;
  summaryText: string;
  recoveryNote: string;
}
