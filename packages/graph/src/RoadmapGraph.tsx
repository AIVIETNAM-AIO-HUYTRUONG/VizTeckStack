'use client';
import '@xyflow/react/dist/style.css';
import React, { useCallback, useRef, type MouseEvent } from 'react';
import {
  ReactFlow, Controls, ReactFlowProvider, useReactFlow,
  type Node,
  type OnNodesChange, type OnEdgesChange, type OnConnect, type OnNodesDelete,
} from '@xyflow/react';
import { RoadmapNode } from './RoadmapNode';
import type { NodeItem, EdgeItem } from './types';

// nodeTypes must be defined at module scope (stable reference — prevents remount on render)
const nodeTypes = { roadmapNode: RoadmapNode };

export interface RoadmapGraphProps {
  nodes: NodeItem[];
  edges: EdgeItem[];
  mode: 'view' | 'edit';
  onNodeClick?: (node: NodeItem) => void;
  /** Called when React Flow node state changes (drag, select, etc.) — edit mode only */
  onNodesChange?: OnNodesChange;
  /** Called when React Flow edge state changes (connect, delete, etc.) — edit mode only */
  onEdgesChange?: OnEdgesChange;
  /** Called when edges are connected — edit mode only */
  onConnect?: OnConnect;
  /** Called when canvas nodes are deleted (unplace) — edit mode only */
  onNodesDelete?: OnNodesDelete;
  /** Called on right-click on empty canvas area — receives the flow-space position */
  onPaneContextMenu?: (event: MouseEvent, position: { x: number; y: number }) => void;
  /** Called when a node is dropped from inventory onto the canvas — receives flow-space position */
  onDropNode?: (nodeId: string, flowPosition: { x: number; y: number }) => void;
  /** Called when an edge is clicked — edit mode only; use to delete the edge */
  onEdgeClick?: (edgeId: string) => void;
}

interface GraphCanvasProps extends RoadmapGraphProps {
  rfNodes: Node[];
  rfEdges: ReturnType<typeof mapEdges>;
  isView: boolean;
}

function mapEdges(edges: EdgeItem[]) {
  return edges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    label: e.label,
  }));
}

/** Inner component — must live inside ReactFlowProvider to use useReactFlow() */
function GraphCanvas({
  nodes, rfNodes, rfEdges, isView, onNodeClick,
  onNodesChange, onEdgesChange, onConnect, onNodesDelete,
  onPaneContextMenu, onDropNode, onEdgeClick,
}: GraphCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  function handleNodeClick(_event: MouseEvent, rfNode: Node) {
    if (onNodeClick) {
      const original = nodes.find((n) => n.id === rfNode.id);
      if (original) {
        onNodeClick(original);
      }
    }
  }

  function handleEdgeClick(_event: MouseEvent, edge: { id: string }) {
    if (onEdgeClick) onEdgeClick(edge.id);
  }

  function handlePaneContextMenu(event: React.MouseEvent | globalThis.MouseEvent) {
    if (onPaneContextMenu) {
      event.preventDefault();
      const { clientX, clientY } = event as React.MouseEvent;
      const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
      onPaneContextMenu(event as MouseEvent, flowPosition);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!onDropNode) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dt = event.dataTransfer as any;
    const nodeId: string = dt.getData('nodeId') || dt.getData('text/plain') || '';
    if (!nodeId) return;
    const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    onDropNode(nodeId, flowPosition);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event.dataTransfer as any).dropEffect = 'move';
  }

  return (
    <div
      className="w-full h-full bg-bg-1"
      onDrop={!isView ? handleDrop : undefined}
      onDragOver={!isView ? handleDragOver : undefined}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={!isView}
        nodesConnectable={!isView}
        elementsSelectable={!isView}
        edgesReconnectable={!isView}
        fitView
        onNodeClick={onNodeClick ? handleNodeClick : undefined}
        onNodesChange={!isView ? onNodesChange : undefined}
        onEdgesChange={!isView ? onEdgesChange : undefined}
        onConnect={!isView ? onConnect : undefined}
        onNodesDelete={!isView ? onNodesDelete : undefined}
        onEdgeClick={!isView && onEdgeClick ? handleEdgeClick : undefined}
        onPaneContextMenu={!isView ? handlePaneContextMenu : undefined}
      >
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function RoadmapGraph(props: RoadmapGraphProps) {
  const { nodes, edges, mode, onNodesChange } = props;

  // Cache measured dimensions so rfNodes can include them on every render.
  // React Flow's adoptUserNodes resets `measured` whenever it receives new node
  // objects (our .map() always creates new refs), which causes visibility:hidden.
  // Including the cached measured value lets nodeHasDimensions() return true
  // immediately, preventing the stuck-hidden state after position changes.
  const measuredRef = useRef<Map<string, { width: number; height: number }>>(new Map());

  // Intercept dimensions changes to populate the cache before forwarding.
  const wrappedOnNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      for (const c of changes) {
        if (c.type === 'dimensions' && 'dimensions' in c && c.dimensions) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          measuredRef.current.set(c.id, c.dimensions as any);
        }
      }
      onNodesChange?.(changes);
    },
    [onNodesChange],
  );

  const rfNodes = nodes
    .filter((n) => n.positionX != null && n.positionY != null)
    .map((n) => ({
      id: n.id,
      type: 'roadmapNode' as const,
      position: { x: n.positionX!, y: n.positionY! },
      selected: (n as { selected?: boolean }).selected ?? false,
      data: { title: n.title, nodeType: n.type, targetRoadmapId: n.targetRoadmapId },
      // Include cached measured so nodes stay visible after external position updates
      measured: measuredRef.current.get(n.id),
    }));

  const rfEdges = mapEdges(edges);
  const isView = mode === 'view';

  return (
    <ReactFlowProvider>
      <GraphCanvas
        {...props}
        onNodesChange={wrappedOnNodesChange}
        rfNodes={rfNodes}
        rfEdges={rfEdges}
        isView={isView}
      />
    </ReactFlowProvider>
  );
}
