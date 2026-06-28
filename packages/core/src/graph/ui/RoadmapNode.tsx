'use client';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { NodeBadge } from '@vizteck/ui';
import type { GraphNodeType } from '../types';

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
        className="bg-bg-1 rounded-md px-[18px] py-[10px] min-w-[120px] text-center border-2"
        style={{ borderColor }}
      >
        <NodeBadge type={data.nodeType} />
        <div className="font-mono text-xs mt-1 text-text-1">
          {data.title}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
