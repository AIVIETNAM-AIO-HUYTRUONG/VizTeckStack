'use client';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { NodeBadge } from '@vizteck/ui';
import type { GraphNodeType } from './types';

export interface RoadmapNodeData extends Record<string, unknown> {
  title: string;
  nodeType: GraphNodeType;
  targetRoadmapId?: string;
}

type RoadmapNodeProps = NodeProps<Node<RoadmapNodeData>>;

const BORDER_COLOR: Record<GraphNodeType, string> = {
  ROADMAP: '#4F46E5',
  LESSON: '#059669',
};

export function RoadmapNode({ data }: RoadmapNodeProps) {
  const borderColor = BORDER_COLOR[data.nodeType] ?? '#4F46E5';

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          border: `2px solid ${borderColor}`,
          background: 'var(--bg-1, #ffffff)',
          borderRadius: 10,
          padding: '10px 18px',
          minWidth: 120,
          textAlign: 'center',
        }}
      >
        <NodeBadge type={data.nodeType} />
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            marginTop: 4,
            color: 'var(--text-1, #0F172A)',
          }}
        >
          {data.title}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
