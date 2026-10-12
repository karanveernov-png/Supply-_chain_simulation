import type { SupplyNetworkData } from '../types/supplyChain';

/**
 * SYNTHETIC DEMO DATA
 * ===================
 * Entirely fictional manufacturing network built for the SupplyWeb prototype.
 * Company and supplier names, locations, quantities, lead times, and costs are
 * invented for demonstration purposes only and do not represent real
 * businesses, prices, or relationships.
 *
 * Demo company: Northstar Manufacturing — a fictional small manufacturer of
 * industrial pumps, hydraulic systems, and motor-driven equipment.
 */

export const supplyNetworkData: SupplyNetworkData = {
  routes: [
    {
      id: 'route-northern',
      name: 'Northern Corridor',
      operator: 'Metro Logistics',
      description: 'Road corridor linking Punjab-region suppliers to the Northstar Manufacturing plant.',
    },
    {
      id: 'route-western',
      name: 'Western Corridor',
      operator: 'Metro Logistics',
      description: 'Primary industrial corridor used by electrical and electronics suppliers.',
    },
    {
      id: 'route-southern',
      name: 'Southern Corridor',
      operator: 'Metro Logistics',
      description: 'Road and rail corridor for hydraulics and polymer suppliers.',
    },
  ],

  suppliers: [
    {
      id: 'sup-ppp',
      name: 'Punjab Precision Parts',
      location: 'Ludhiana, Punjab',
      routeId: 'route-northern',
      hasAlternateRoute: false,
      supplies: [
        { componentId: 'comp-steel-housing', capacityPerMonth: 1200, leadTimeDays: 10, unitCost: 450, isPrimary: true },
        { componentId: 'comp-precision-bearings', capacityPerMonth: 3000, leadTimeDays: 8, unitCost: 60, isPrimary: true },
      ],
    },
    {
      id: 'sup-northstar-components',
      name: 'Northstar Components',
      location: 'Pune, Maharashtra',
      routeId: 'route-western',
      hasAlternateRoute: false,
      supplies: [
        { componentId: 'comp-electric-motor', capacityPerMonth: 400, leadTimeDays: 21, unitCost: 1200, isPrimary: true },
        { componentId: 'comp-power-control-board', capacityPerMonth: 600, leadTimeDays: 14, unitCost: 340, isPrimary: true },
      ],
    },
    {
      id: 'sup-apex-electrical',
      name: 'Apex Electrical Supply',
      location: 'Pune, Maharashtra',
      routeId: 'route-western',
      hasAlternateRoute: false,
      supplies: [
        { componentId: 'comp-power-control-board', capacityPerMonth: 180, leadTimeDays: 20, unitCost: 365, isPrimary: false },
        { componentId: 'comp-power-transformer', capacityPerMonth: 500, leadTimeDays: 16, unitCost: 210, isPrimary: true },
      ],
    },
    {
      id: 'sup-vikram-castings',
      name: 'Vikram Castings & Forge',
      location: 'Jalandhar, Punjab',
      routeId: 'route-northern',
      hasAlternateRoute: false,
      supplies: [
        { componentId: 'comp-steel-housing', capacityPerMonth: 500, leadTimeDays: 18, unitCost: 480, isPrimary: false },
        { componentId: 'comp-mounting-bracket', capacityPerMonth: 2000, leadTimeDays: 7, unitCost: 35, isPrimary: true },
        { componentId: 'comp-valve-assembly', capacityPerMonth: 150, leadTimeDays: 20, unitCost: 175, isPrimary: false },
      ],
    },
    {
      id: 'sup-everest-hydraulics',
      name: 'Everest Hydraulics',
      location: 'Coimbatore, Tamil Nadu',
      routeId: 'route-southern',
      hasAlternateRoute: false,
      supplies: [
        { componentId: 'comp-hydraulic-cylinder', capacityPerMonth: 300, leadTimeDays: 25, unitCost: 980, isPrimary: true },
        { componentId: 'comp-valve-assembly', capacityPerMonth: 450, leadTimeDays: 12, unitCost: 150, isPrimary: true },
      ],
    },
    {
      id: 'sup-sundar-plastics',
      name: 'Sundar Plastics Ltd',
      location: 'Coimbatore, Tamil Nadu',
      routeId: 'route-southern',
      hasAlternateRoute: false,
      supplies: [
        { componentId: 'comp-polymer-casing', capacityPerMonth: 2500, leadTimeDays: 9, unitCost: 28, isPrimary: true },
        { componentId: 'comp-gasket-set', capacityPerMonth: 4000, leadTimeDays: 6, unitCost: 6, isPrimary: true },
      ],
    },
    {
      id: 'sup-coastal-wire',
      name: 'Coastal Wire & Cable',
      location: 'Pune, Maharashtra',
      routeId: 'route-western',
      hasAlternateRoute: true,
      supplies: [
        { componentId: 'comp-copper-wiring', capacityPerMonth: 1800, leadTimeDays: 11, unitCost: 95, isPrimary: true },
      ],
    },
    {
      id: 'sup-himalaya-fasteners',
      name: 'Himalaya Fasteners Co',
      location: 'Ludhiana, Punjab',
      routeId: 'route-northern',
      hasAlternateRoute: false,
      supplies: [
        { componentId: 'comp-fastener-kit', capacityPerMonth: 5000, leadTimeDays: 5, unitCost: 4, isPrimary: true },
        { componentId: 'comp-mounting-bracket', capacityPerMonth: 800, leadTimeDays: 12, unitCost: 40, isPrimary: false },
        { componentId: 'comp-gasket-set', capacityPerMonth: 1500, leadTimeDays: 10, unitCost: 7, isPrimary: false },
      ],
    },
  ],

  components: [
    { id: 'comp-steel-housing', name: 'Steel Housing', category: 'Structural', unit: 'units' },
    { id: 'comp-precision-bearings', name: 'Precision Bearings', category: 'Mechanical', unit: 'units' },
    { id: 'comp-electric-motor', name: 'Electric Motor', category: 'Electromechanical', unit: 'units' },
    { id: 'comp-power-control-board', name: 'Power Control Board', category: 'Electronics', unit: 'units' },
    { id: 'comp-power-transformer', name: 'Power Transformer', category: 'Electronics', unit: 'units' },
    { id: 'comp-mounting-bracket', name: 'Mounting Bracket', category: 'Structural', unit: 'units' },
    { id: 'comp-hydraulic-cylinder', name: 'Hydraulic Cylinder', category: 'Hydraulics', unit: 'units' },
    { id: 'comp-valve-assembly', name: 'Valve Assembly', category: 'Hydraulics', unit: 'units' },
    { id: 'comp-polymer-casing', name: 'Polymer Casing', category: 'Structural', unit: 'units' },
    { id: 'comp-gasket-set', name: 'Gasket Set', category: 'Sealing', unit: 'sets' },
    { id: 'comp-copper-wiring', name: 'Copper Wiring Harness', category: 'Electrical', unit: 'units' },
    { id: 'comp-fastener-kit', name: 'Fastener Kit', category: 'Hardware', unit: 'sets' },
  ],

  products: [
    {
      id: 'prod-industrial-pump',
      name: 'Industrial Pump Unit',
      price: 18500,
      requiredComponents: [
        { componentId: 'comp-steel-housing', qtyPerUnit: 1 },
        { componentId: 'comp-precision-bearings', qtyPerUnit: 2 },
        { componentId: 'comp-electric-motor', qtyPerUnit: 1 },
        { componentId: 'comp-mounting-bracket', qtyPerUnit: 2 },
        { componentId: 'comp-gasket-set', qtyPerUnit: 1 },
      ],
    },
    {
      id: 'prod-hydraulic-lift',
      name: 'Hydraulic Lift System',
      price: 42000,
      requiredComponents: [
        { componentId: 'comp-hydraulic-cylinder', qtyPerUnit: 1 },
        { componentId: 'comp-valve-assembly', qtyPerUnit: 2 },
        { componentId: 'comp-steel-housing', qtyPerUnit: 1 },
        { componentId: 'comp-power-control-board', qtyPerUnit: 1 },
        { componentId: 'comp-fastener-kit', qtyPerUnit: 1 },
      ],
    },
    {
      id: 'prod-control-panel',
      name: 'Control Panel Assembly',
      price: 9800,
      requiredComponents: [
        { componentId: 'comp-power-control-board', qtyPerUnit: 1 },
        { componentId: 'comp-power-transformer', qtyPerUnit: 1 },
        { componentId: 'comp-copper-wiring', qtyPerUnit: 1 },
        { componentId: 'comp-fastener-kit', qtyPerUnit: 1 },
      ],
    },
    {
      id: 'prod-motor-drive',
      name: 'Compact Motor Drive',
      price: 15200,
      requiredComponents: [
        { componentId: 'comp-electric-motor', qtyPerUnit: 1 },
        { componentId: 'comp-power-control-board', qtyPerUnit: 1 },
        { componentId: 'comp-copper-wiring', qtyPerUnit: 1 },
        { componentId: 'comp-gasket-set', qtyPerUnit: 1 },
      ],
    },
    {
      id: 'prod-valve-module',
      name: 'Precision Valve Module',
      price: 6200,
      requiredComponents: [
        { componentId: 'comp-valve-assembly', qtyPerUnit: 1 },
        { componentId: 'comp-mounting-bracket', qtyPerUnit: 1 },
        { componentId: 'comp-fastener-kit', qtyPerUnit: 1 },
        { componentId: 'comp-gasket-set', qtyPerUnit: 1 },
      ],
    },
    {
      id: 'prod-sensor-housing',
      name: 'Sensor-Integrated Housing Kit',
      price: 3400,
      requiredComponents: [
        { componentId: 'comp-polymer-casing', qtyPerUnit: 1 },
        { componentId: 'comp-steel-housing', qtyPerUnit: 1 },
        { componentId: 'comp-mounting-bracket', qtyPerUnit: 1 },
        { componentId: 'comp-fastener-kit', qtyPerUnit: 2 },
      ],
    },
  ],

  customers: [
    {
      id: 'cust-retailer-one',
      name: 'Retailer One',
      region: 'North Zone',
      orders: [
        { productId: 'prod-industrial-pump', quantity: 40 },
        { productId: 'prod-motor-drive', quantity: 25 },
      ],
    },
    {
      id: 'cust-regional-distributor',
      name: 'Regional Distributor',
      region: 'West Zone',
      orders: [
        { productId: 'prod-industrial-pump', quantity: 60 },
        { productId: 'prod-control-panel', quantity: 100 },
        { productId: 'prod-sensor-housing', quantity: 80 },
      ],
    },
    {
      id: 'cust-coastal-infra',
      name: 'Coastal Infrastructure Corp',
      region: 'South Zone',
      orders: [
        { productId: 'prod-hydraulic-lift', quantity: 15 },
        { productId: 'prod-valve-module', quantity: 30 },
      ],
    },
    {
      id: 'cust-western-plains',
      name: 'Western Plains Equipment',
      region: 'West Zone',
      orders: [
        { productId: 'prod-motor-drive', quantity: 35 },
        { productId: 'prod-valve-module', quantity: 20 },
        { productId: 'prod-control-panel', quantity: 50 },
      ],
    },
    {
      id: 'cust-summit-industrial',
      name: 'Summit Industrial Traders',
      region: 'South Zone',
      orders: [
        { productId: 'prod-hydraulic-lift', quantity: 8 },
        { productId: 'prod-sensor-housing', quantity: 40 },
        { productId: 'prod-industrial-pump', quantity: 20 },
      ],
    },
  ],
};

export const DEMO_COMPANY_NAME = 'Northstar Manufacturing';
