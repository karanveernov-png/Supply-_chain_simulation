import { useCallback, useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import type { Core, ElementDefinition, NodeSingular } from 'cytoscape';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import dagre from 'cytoscape-dagre';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { SimulationResult, SupplyNetworkData } from '../types/supplyChain';
import {
  getComponentProductEdgeStatus,
  getComponentStatus,
  getCustomerStatus,
  getProductCustomerEdgeStatus,
  getProductStatus,
  getRouteStatus,
  getRouteSupplierEdgeStatus,
  getSupplierComponentEdgeStatus,
  getSupplierStatus,
} from '../logic/graphStatus';
import Legend from './graph/Legend';
import NodeDetailPanel from './graph/NodeDetailPanel';
import type { SelectedNode } from './graph/NodeDetailPanel';

let dagreRegistered = false;
function ensureDagreRegistered() {
  if (!dagreRegistered) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cytoscape.use(dagre as any);
    dagreRegistered = true;
  }
}

const styleSheet: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'font-size': 9,
      'font-family': 'Inter, ui-sans-serif, system-ui, sans-serif',
      color: '#0f1b2e',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '84px',
      'border-width': 1.4,
      width: 'label',
      height: 'label',
      padding: '7px',
      shape: 'round-rectangle',
      'background-color': '#ffffff',
      'border-color': '#cbd5e1',
      'transition-property': 'background-color, border-color, border-width',
      'transition-duration': 150,
    },
  },
  {
    selector: 'node[nodeType = "route"]',
    style: {
      shape: 'diamond',
      'background-color': '#f8fafc',
      'border-color': '#94a3b8',
      'border-style': 'dashed',
      'font-size': 8,
      color: '#64748b',
      padding: '14px',
    },
  },
  {
    selector: 'node[nodeType = "supplier"]',
    style: {
      shape: 'round-rectangle',
      'background-color': '#eff6ff',
      'border-color': '#2563eb',
      'font-weight': 500,
    },
  },
  {
    selector: 'node[nodeType = "component"]',
    style: {
      shape: 'hexagon',
      'background-color': '#f1f5f9',
      'border-color': '#64748b',
      padding: '12px',
    },
  },
  {
    selector: 'node[nodeType = "product"]',
    style: {
      shape: 'ellipse',
      'background-color': '#ffffff',
      'border-color': '#0f1b2e',
      'border-width': 2,
      'font-weight': 600,
      padding: '10px',
    },
  },
  {
    selector: 'node[nodeType = "customer"]',
    style: {
      shape: 'star',
      'background-color': '#f8fafc',
      'border-color': '#475569',
      padding: '14px',
    },
  },
  // status overrides (applied after base/type rules)
  {
    selector: 'node[status = "disrupted"], node[status = "blocked"], node[status = "high"]',
    style: { 'background-color': '#fee2e2', 'border-color': '#dc2626', 'border-width': 2.5 },
  },
  {
    selector: 'node[status = "degraded"], node[status = "partial"], node[status = "medium"]',
    style: { 'background-color': '#fef3c7', 'border-color': '#d97706', 'border-width': 2.5 },
  },
  {
    selector: 'node[status = "recommended"]',
    style: { 'background-color': '#dcfce7', 'border-color': '#16a34a', 'border-width': 2.5 },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 3,
      'border-color': '#1d4ed8',
      'overlay-color': '#1d4ed8',
      'overlay-opacity': 0.12,
      'overlay-padding': 5,
    },
  },
  {
    selector: 'edge',
    style: {
      width: 1.2,
      'line-color': '#cbd5e1',
      'target-arrow-color': '#cbd5e1',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.7,
      'curve-style': 'bezier',
      opacity: 0.85,
      'transition-property': 'line-color, target-arrow-color, width',
      'transition-duration': 150,
    },
  },
  {
    selector: 'edge[status = "cut"]',
    style: { 'line-color': '#dc2626', 'target-arrow-color': '#dc2626', width: 2, 'line-style': 'dashed' },
  },
  {
    selector: 'edge[status = "reduced"]',
    style: { 'line-color': '#d97706', 'target-arrow-color': '#d97706', width: 1.8, 'line-style': 'dashed' },
  },
  {
    selector: 'edge[status = "blocked"]',
    style: { 'line-color': '#dc2626', 'target-arrow-color': '#dc2626', width: 2 },
  },
  {
    selector: 'edge[status = "partial"]',
    style: { 'line-color': '#d97706', 'target-arrow-color': '#d97706', width: 1.8 },
  },
  {
    selector: 'edge[status = "recommended"]',
    style: { 'line-color': '#16a34a', 'target-arrow-color': '#16a34a', width: 1.8 },
  },
];

interface DependencyGraphProps {
  data: SupplyNetworkData;
  result: SimulationResult | null;
  height?: string;
  onResetSimulation?: () => void;
}

export default function DependencyGraph({ data, result, height = '560px', onResetSimulation }: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [isReady, setIsReady] = useState(false);

  const buildElements = useCallback((): ElementDefinition[] => {
    const elements: ElementDefinition[] = [];

    for (const route of data.routes) {
      elements.push({ data: { id: route.id, label: route.name, nodeType: 'route', status: 'normal' } });
    }
    for (const supplier of data.suppliers) {
      elements.push({ data: { id: supplier.id, label: supplier.name, nodeType: 'supplier', status: 'normal' } });
      elements.push({
        data: {
          id: `e-${supplier.routeId}-${supplier.id}`,
          source: supplier.routeId,
          target: supplier.id,
          status: 'normal',
        },
      });
      for (const link of supplier.supplies) {
        elements.push({
          data: {
            id: `e-${supplier.id}-${link.componentId}`,
            source: supplier.id,
            target: link.componentId,
            status: 'normal',
          },
        });
      }
    }
    for (const component of data.components) {
      elements.push({ data: { id: component.id, label: component.name, nodeType: 'component', status: 'normal' } });
    }
    for (const product of data.products) {
      elements.push({ data: { id: product.id, label: product.name, nodeType: 'product', status: 'normal' } });
      for (const req of product.requiredComponents) {
        elements.push({
          data: {
            id: `e-${req.componentId}-${product.id}`,
            source: req.componentId,
            target: product.id,
            status: 'normal',
          },
        });
      }
    }
    for (const customer of data.customers) {
      elements.push({ data: { id: customer.id, label: customer.name, nodeType: 'customer', status: 'normal' } });
      for (const order of customer.orders) {
        elements.push({
          data: {
            id: `e-${order.productId}-${customer.id}`,
            source: order.productId,
            target: customer.id,
            status: 'normal',
          },
        });
      }
    }
    return elements;
  }, [data]);

  // Mount cytoscape once per data set.
  useEffect(() => {
    ensureDagreRegistered();
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(),
      style: styleSheet,
      wheelSensitivity: 0.25,
      minZoom: 0.25,
      maxZoom: 2.5,
      boxSelectionEnabled: false,
      touchTapThreshold: 8,
    });

    cy.layout({
      name: 'dagre',
      // @ts-expect-error cytoscape-dagre layout options are not in @types/cytoscape
      rankDir: 'LR',
      nodeSep: 16,
      rankSep: 95,
      edgeSep: 6,
      padding: 20,
      fit: true,
    }).run();

    cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      const nodeType = node.data('nodeType');
      setSelected({ type: nodeType, id: node.id() });
    });
    cy.on('tap', (evt) => {
      if (evt.target === cy) setSelected(null);
    });

    cyRef.current = cy;
    setIsReady(true);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildElements]);

  // Push status updates whenever the simulation result changes, without rebuilding the graph.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !isReady) return;

    cy.batch(() => {
      for (const route of data.routes) {
        cy.getElementById(route.id).data('status', getRouteStatus(result, route.id));
      }
      for (const supplier of data.suppliers) {
        cy.getElementById(supplier.id).data('status', getSupplierStatus(result, supplier.id));
        cy.getElementById(`e-${supplier.routeId}-${supplier.id}`).data(
          'status',
          getRouteSupplierEdgeStatus(result, supplier.routeId, supplier.id),
        );
        for (const link of supplier.supplies) {
          cy.getElementById(`e-${supplier.id}-${link.componentId}`).data(
            'status',
            getSupplierComponentEdgeStatus(result, supplier.id, link.componentId),
          );
        }
      }
      for (const component of data.components) {
        cy.getElementById(component.id).data('status', getComponentStatus(result, component.id));
      }
      for (const product of data.products) {
        cy.getElementById(product.id).data('status', getProductStatus(result, product.id));
        for (const req of product.requiredComponents) {
          cy.getElementById(`e-${req.componentId}-${product.id}`).data(
            'status',
            getComponentProductEdgeStatus(result, req.componentId, product.id),
          );
        }
      }
      for (const customer of data.customers) {
        cy.getElementById(customer.id).data('status', getCustomerStatus(result, customer.id));
        for (const order of customer.orders) {
          cy.getElementById(`e-${order.productId}-${customer.id}`).data(
            'status',
            getProductCustomerEdgeStatus(result, order.productId, customer.id),
          );
        }
      }
    });
  }, [result, data, isReady]);

  const handleFit = () => cyRef.current?.fit(undefined, 28);
  const handleZoomIn = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * 1.25, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };
  const handleZoomOut = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() / 1.25, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };
  const handleReset = () => {
    setSelected(null);
    onResetSimulation?.();
    requestAnimationFrame(() => cyRef.current?.fit(undefined, 28));
  };

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white">
      <div ref={containerRef} style={{ height }} className="w-full bg-slate-50/60" />

      <div className="absolute right-3 top-3 flex items-center gap-0.5 rounded-md border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom in"
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
        >
          <ZoomIn size={15} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom out"
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
        >
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          onClick={handleFit}
          title="Fit to screen"
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
        >
          <Maximize2 size={15} />
        </button>
        {onResetSimulation && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset simulation"
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      <Legend />

      {selected && <NodeDetailPanel data={data} result={result} selected={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
