'use client';
import '@xyflow/react/dist/style.css';
import { type MouseEvent } from 'react';
import { ReactFlow, Controls, ReactFlowProvider, type Node } from '@xyflow/react';
import { RoadmapNode } from './RoadmapNode';
import type { NodeItem, EdgeItem } from './types';

// nodeTypes must be defined at module scope (stable reference — prevents remount on render)
const nodeTypes = { roadmapNode: RoadmapNode };

export interface RoadmapGraphProps {
  nodes: NodeItem[];
  edges: EdgeItem[];
  mode: 'view' | 'edit';
  onNodeClick?: (node: NodeItem) => void;
}

export function RoadmapGraph({ nodes, edges, mode, onNodeClick }: RoadmapGraphProps) {
  const rfNodes = nodes.map((n) => ({
    id: n.id,
    type: 'roadmapNode' as const,
    position: { x: n.positionX, y: n.positionY },
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

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-1, #F4F6FB)' }}>
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
        >
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
