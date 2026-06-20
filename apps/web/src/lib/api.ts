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
  const res = await fetch(`${API}/api/roadmaps`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchRoadmaps: ${res.status}`);
  const data = await res.json() as { roadmaps?: RoadmapItem[] } | RoadmapItem[];
  return Array.isArray(data) ? data : (data as { roadmaps?: RoadmapItem[] }).roadmaps ?? [];
}

const NODE_TYPE_MAP: Record<number | string, 'ROADMAP' | 'LESSON'> = { 0: 'ROADMAP', 1: 'LESSON' };
function normalizeNodeType(t: unknown): 'ROADMAP' | 'LESSON' {
  if (t === 'ROADMAP' || t === 'LESSON') return t;
  return NODE_TYPE_MAP[t as number] ?? 'LESSON';
}

export async function fetchRoadmap(slug: string): Promise<RoadmapDetail> {
  const res = await fetch(`${API}/api/roadmaps/${slug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchRoadmap(${slug}): ${res.status}`);
  const raw = await res.json() as Partial<RoadmapDetail>;
  return {
    roadmap: raw.roadmap,
    nodes: (raw.nodes ?? []).map((n) => ({ ...n, type: normalizeNodeType(n.type) })),
    edges: raw.edges ?? [],
  };
}

export async function fetchNode(id: string): Promise<NodeItem> {
  const res = await fetch(`${API}/api/nodes/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchNode(${id}): ${res.status}`);
  // Response shape is { node: {...}, targetRoadmap: {...} } — extract and normalize
  const raw = await res.json() as { node?: Partial<NodeItem> } | Partial<NodeItem>;
  const n = (raw as { node?: Partial<NodeItem> }).node ?? (raw as Partial<NodeItem>);
  return { ...n, type: normalizeNodeType(n.type) } as NodeItem;
}
