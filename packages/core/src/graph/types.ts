// packages/core/src/graph/types.ts
// NodeItem, EdgeItem, GraphNodeType were previously in packages/graph/src/types.ts
export type GraphNodeType = 'ROADMAP' | 'LESSON';

export interface NodeItem {
  id: string;
  roadmapId: string;
  type: GraphNodeType;
  title: string;
  positionX: number | null;
  positionY: number | null;
  targetRoadmapId?: string;
  targetRoadmapSlug?: string;
  content?: string;
}

export interface EdgeItem {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

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
