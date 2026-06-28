import type { Roadmap } from '../entities/roadmap.entity';
import type { Node, NodeUpdateData } from '../entities/node.entity';
import type { Edge } from '../entities/edge.entity';

export interface CreateRoadmapData {
  slug: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
}

export interface UpdateRoadmapData {
  title?: string;
  description?: string;
  coverImage?: string;
  status?: string;
}

export interface NodeInputData {
  id?: string;
  type: 'ROADMAP' | 'LESSON';
  title: string;
  positionX?: number | null;
  positionY?: number | null;
  targetRoadmapId?: string | null;
  content?: unknown | null;
}

export interface EdgeInputData {
  sourceId: string;
  targetId: string;
  label?: string | null;
}

export interface RoadmapDetail {
  roadmap: Roadmap;
  nodes: Node[];
  edges: Edge[];
}

export interface NodeDetail {
  node: Node;
  targetRoadmap?: Roadmap | null;
}

export interface BreadcrumbItem {
  title: string;
  slug: string | null;
  nodeId: string | null;
}

export interface SearchParams {
  q: string;
  titleOnly: boolean;
  roadmapId?: string;
}

export interface SearchResult {
  id: string;
  type: 'ROADMAP' | 'LESSON';
  title: string;
  icon: string | null;
  coverImage: string | null;
  roadmapSlug: string;
  roadmapTitle: string;
  roadmapId: string;
  updatedAt: Date;
  breadcrumb: string[];
}

export interface RoadmapTreeNode {
  id: string;
  title: string;
  type: string;
  slug: string | null;
  targetRoadmapId: string | null;
  roadmapSlug: string | null;
  roadmapId: string | null;
  children: RoadmapTreeNode[];
}

export interface RoadmapTree {
  rootSlug: string;
  rootTitle: string;
  nodes: RoadmapTreeNode[];
}

export interface IRoadmapRepository {
  findAll(): Promise<Roadmap[]>;
  findBySlug(slug: string): Promise<RoadmapDetail | null>;
  findNodeById(id: string): Promise<NodeDetail | null>;
  create(data: CreateRoadmapData): Promise<Roadmap>;
  update(id: string, data: UpdateRoadmapData): Promise<Roadmap>;
  delete(id: string): Promise<void>;
  upsertGraph(roadmapId: string, nodes: NodeInputData[], edges: EdgeInputData[]): Promise<RoadmapDetail>;
  updateNodeField(id: string, data: NodeUpdateData): Promise<Node>;
  getNodeBreadcrumb(id: string): Promise<BreadcrumbItem[]>;
  getRoadmapTree(slug: string): Promise<RoadmapTree>;
  searchNodes(params: SearchParams): Promise<SearchResult[]>;
}
