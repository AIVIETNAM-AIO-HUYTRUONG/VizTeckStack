export type NodeType = 'ROADMAP' | 'LESSON';

export interface Node {
  id: string;
  roadmapId: string;
  type: NodeType;
  title: string;
  positionX: number | null;
  positionY: number | null;
  targetRoadmapId: string | null;
  content: unknown | null;
  coverImage: string | null;
  icon: string | null;
  updatedAt: Date;
}

export interface NodeUpdateData {
  title?: string;
  content?: unknown | null;
  coverImage?: string | null;
  icon?: string | null;
}
