export interface RoadmapItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
}

export interface NodeItem {
  id: string;
  roadmapId: string;
  type: 'ROADMAP' | 'LESSON';
  title: string;
  positionX: number;
  positionY: number;
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

export interface RoadmapDetail {
  roadmap?: RoadmapItem;
  nodes: NodeItem[];
  edges: EdgeItem[];
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchRoadmaps(): Promise<RoadmapItem[]> {
  const res = await fetch(`${API}/api/roadmaps`, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`fetchRoadmaps: ${res.status}`);
  const data = await res.json() as { roadmaps?: RoadmapItem[] } | RoadmapItem[];
  return Array.isArray(data) ? data : (data as { roadmaps?: RoadmapItem[] }).roadmaps ?? [];
}

export async function fetchRoadmap(slug: string): Promise<RoadmapDetail> {
  const res = await fetch(`${API}/api/roadmaps/${slug}`, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`fetchRoadmap(${slug}): ${res.status}`);
  return res.json() as Promise<RoadmapDetail>;
}

export async function fetchNode(id: string): Promise<NodeItem> {
  const res = await fetch(`${API}/api/nodes/${id}`, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`fetchNode(${id}): ${res.status}`);
  return res.json() as Promise<NodeItem>;
}
