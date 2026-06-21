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

const NODE_TYPE_MAP: Record<number | string, 'ROADMAP' | 'LESSON'> = {
  0: 'ROADMAP',
  1: 'LESSON',
};

export function normalizeNodeType(t: unknown): 'ROADMAP' | 'LESSON' {
  if (t === 'ROADMAP' || t === 'LESSON') return t;
  return NODE_TYPE_MAP[t as number] ?? 'LESSON';
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchNode(id: string): Promise<NodeItem> {
  const res = await fetch(`${API}/api/nodes/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchNode(${id}): ${res.status}`);
  const raw = await res.json() as { node?: Partial<NodeItem> } | Partial<NodeItem>;
  const n = (raw as { node?: Partial<NodeItem> }).node ?? (raw as Partial<NodeItem>);
  return { ...n, type: normalizeNodeType(n.type) } as NodeItem;
}
