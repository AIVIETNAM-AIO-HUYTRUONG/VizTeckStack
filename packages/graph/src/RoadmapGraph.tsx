'use client';
import '@xyflow/react/dist/style.css';
import React, { type MouseEvent } from 'react';
import {
  ReactFlow, Controls, ReactFlowProvider,
  type Node,
  type OnNodesChange, type OnEdgesChange,
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
  /** Called on right-click on empty canvas area — receives the canvas-space position */
  onPaneContextMenu?: (event: MouseEvent, position: { x: number; y: number }) => void;
}

export function RoadmapGraph({
  nodes, edges, mode, onNodeClick, onNodesChange, onEdgesChange, onPaneContextMenu,
}: RoadmapGraphProps) {
  const rfNodes = nodes
    .filter((n) => n.positionX != null && n.positionY != null)
    .map((n) => ({
      id: n.id,
      type: 'roadmapNode' as const,
      position: { x: n.positionX!, y: n.positionY! },
      data: { title: n.title, nodeType: n.type, targetRoadmapId: n.targetRoadmapId },
    }));

  const rfEdges = edges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    label: e.label,
  }));

  const isView = mode === 'view';

  function handleNodeClick(_event: MouseEvent, rfNode: Node) {
    if (onNodeClick) {
      const original = nodes.find((n) => n.id === rfNode.id);
      if (original) {
        onNodeClick(original);
      }
    }
  }

  function handlePaneContextMenu(event: React.MouseEvent | globalThis.MouseEvent) {
    if (onPaneContextMenu) {
      event.preventDefault();
      const { clientX, clientY } = event as React.MouseEvent;
      onPaneContextMenu(event as MouseEvent, { x: clientX, y: clientY });
    }
  }

  return (
    <div className="w-full h-full bg-bg-1">
      <ReactFlowProvider>
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
          onPaneContextMenu={!isView ? handlePaneContextMenu : undefined}
        >
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
