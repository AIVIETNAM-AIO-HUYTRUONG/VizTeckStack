import { apiFetch } from '@/lib/api';

export interface LessonNode {
  id: string;
  roadmapId: string;
  type: string;
  title: string;
  content?: string;
  coverImage?: string | null;
  icon?: string | null;
}

export async function fetchLesson(nodeId: string): Promise<LessonNode> {
  const res = await apiFetch(`/api/nodes/${nodeId}`);
  if (!res.ok) throw new Error(`Failed to fetch lesson: ${res.status}`);
  const data = (await res.json()) as { node?: LessonNode };
  if (!data.node) throw new Error('Lesson not found');
  return data.node;
}

export async function updateLessonContent(nodeId: string, content: string): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/content`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status}): ${await res.text()}`);
}

export async function updateLessonTitle(nodeId: string, title: string): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/title`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Update title failed (${res.status}): ${await res.text()}`);
}

export async function updateNodeCover(nodeId: string, coverImage: string | null): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/cover`, {
    method: 'PATCH',
    body: JSON.stringify({ coverImage }),
  });
  if (!res.ok) throw new Error(`Update cover failed (${res.status}): ${await res.text()}`);
}

export async function updateNodeIcon(nodeId: string, icon: string | null): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/icon`, {
    method: 'PATCH',
    body: JSON.stringify({ icon }),
  });
  if (!res.ok) throw new Error(`Update icon failed (${res.status}): ${await res.text()}`);
}
