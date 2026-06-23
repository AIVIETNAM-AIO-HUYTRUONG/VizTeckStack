import type { PageTree } from '@vizteck/lesson';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchRoadmapTree(slug: string): Promise<PageTree | null> {
  try {
    const res = await fetch(`${API}/api/roadmaps/${slug}/tree`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json() as Partial<PageTree>;
    if (!data.rootSlug) return null;
    return data as PageTree;
  } catch {
    return null;
  }
}
