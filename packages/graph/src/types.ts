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
