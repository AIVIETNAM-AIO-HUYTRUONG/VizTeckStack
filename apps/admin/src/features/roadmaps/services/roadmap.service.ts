import { apiFetch } from '@/lib/api';

export interface Roadmap {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status?: string;
}

export interface CreateRoadmapInput {
  title: string;
  slug: string;
  description: string;
}

export interface UpdateRoadmapInput {
  title?: string;
  description?: string;
  status?: string;
}

export const STATUS_CYCLE: Record<string, string> = {
  DRAFT: 'PUBLIC',
  PUBLIC: 'PRIVATE',
  PRIVATE: 'DRAFT',
};

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLIC: 'Public',
  PRIVATE: 'Private',
};

export const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'bg-bg-2 text-text-3 border border-border',
  PUBLIC:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700',
  PRIVATE:
    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700',
};

export async function getRoadmaps(): Promise<Roadmap[]> {
  const res = await apiFetch('/api/roadmaps');
  const data = (await res.json()) as { roadmaps?: Roadmap[] };
  return data.roadmaps ?? [];
}

export async function createRoadmap(data: CreateRoadmapInput): Promise<void> {
  await apiFetch('/api/roadmaps', {
    method: 'POST',
    body: JSON.stringify({ title: data.title, slug: data.slug, description: data.description }),
  });
}

export async function updateRoadmap(id: string, data: UpdateRoadmapInput): Promise<void> {
  await apiFetch(`/api/roadmaps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRoadmap(id: string): Promise<void> {
  await apiFetch(`/api/roadmaps/${id}`, { method: 'DELETE' });
}

export async function cycleStatus(roadmap: Roadmap): Promise<string> {
  const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
  await apiFetch(`/api/roadmaps/${roadmap.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: next }),
  });
  return next;
}
