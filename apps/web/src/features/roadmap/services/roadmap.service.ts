import { normalizeNodeType } from '@/features/lesson/services/node.service';
import type { NodeItem } from '@/features/lesson/services/node.service';

export type { NodeItem };

export interface RoadmapItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  status?: string;
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
  const all = Array.isArray(data) ? data : data.roadmaps ?? [];
  return all.filter((r) => r.status === 'PUBLIC');
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
