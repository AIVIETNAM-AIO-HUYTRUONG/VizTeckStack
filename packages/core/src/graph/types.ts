// packages/core/src/graph/types.ts
// Note: NodeItem and EdgeItem are temporarily imported from @vizteck/graph.
// Task 5 will inline them here and remove the @vizteck/graph dependency.
import type { NodeItem, EdgeItem } from '@vizteck/graph';

export type { NodeItem, EdgeItem };
export type { GraphNodeType } from '@vizteck/graph';

export interface EditorNode extends NodeItem {
  selected?: boolean;
}

export type EditorEdge = EdgeItem;

export interface RoadmapEntry {
  id: string;
  title: string;
  slug: string;
}

export interface GraphData {
  roadmapTitle: string;
  roadmapStatus: string;
  nodes: EditorNode[];
  edges: EditorEdge[];
  allRoadmaps: RoadmapEntry[];
  savedSnapshot: string;
}

export interface SidePanelState {
  open: boolean;
  mode: 'create' | 'edit';
  nodeId?: string;
  flowPosition?: { x: number; y: number };
}
