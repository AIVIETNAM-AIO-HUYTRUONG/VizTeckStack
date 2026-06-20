import { apiFetch } from '@/lib/api';
import type { NodeItem, EdgeItem } from '@vizteck/graph';

export interface EditorNode extends NodeItem {
  selected?: boolean;
}

export interface EditorEdge extends EdgeItem {}

export interface RoadmapEntry {
  id: string;
  title: string;
  slug: string;
}

export interface GraphData {
  roadmapTitle: string;
  roadmapStatus: string;
  nodes: EditorNode[];
  edges: EditorEdge[];
  allRoadmaps: RoadmapEntry[];
  savedSnapshot: string;
}

export function normalizeNodeType(type: unknown): 'ROADMAP' | 'LESSON' {
  if (type === 0 || type === 'ROADMAP') return 'ROADMAP';
  return 'LESSON';
}

export function makeSnapshot(nodes: EditorNode[], edges: EditorEdge[]): string {
  return JSON.stringify({
    nodes: nodes.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      positionX: n.positionX,
      positionY: n.positionY,
      targetRoadmapId: n.targetRoadmapId ?? null,
      content: n.content ?? null,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sourceId: e.sourceId,
      targetId: e.targetId,
      label: e.label ?? null,
    })),
  });
}

export async function loadGraph(slug: string, roadmapId: string): Promise<GraphData> {
  const [graphRes, roadmapsRes] = await Promise.all([
    apiFetch(`/api/roadmaps/${slug}`),
    apiFetch('/api/roadmaps'),
  ]);

  if (!graphRes.ok) throw new Error(`Failed to load graph: ${graphRes.status}`);

  const data = (await graphRes.json()) as {
    roadmap: { title: string; status?: string };
    nodes?: NodeItem[];
    edges?: EdgeItem[];
  };

  const roadmapsData = roadmapsRes.ok
    ? ((await roadmapsRes.json()) as { roadmaps?: RoadmapEntry[] })
    : { roadmaps: [] };

  const nodes: EditorNode[] = (data.nodes ?? []).map((n) => ({
    ...n,
    type: normalizeNodeType(n.type),
  }));
  const edges: EditorEdge[] = (data.edges ?? []).map((e) => ({ ...e }));
  const savedSnapshot = makeSnapshot(nodes, edges);

  // Restore sessionStorage draft if present and different from API state
  let restoredNodes = nodes;
  let restoredEdges = edges;
  if (typeof window !== 'undefined') {
    const draftJson = sessionStorage.getItem(`graph-draft-${roadmapId}`);
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson) as { nodes: EditorNode[]; edges: EditorEdge[] };
        if (makeSnapshot(draft.nodes, draft.edges) !== savedSnapshot) {
          restoredNodes = draft.nodes;
          restoredEdges = draft.edges;
        }
      } catch {
        sessionStorage.removeItem(`graph-draft-${roadmapId}`);
      }
    }
  }

  return {
    roadmapTitle: data.roadmap?.title ?? '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roadmapStatus: (data.roadmap as any)?.status ?? 'DRAFT',
    nodes: restoredNodes,
    edges: restoredEdges,
    allRoadmaps: roadmapsData.roadmaps ?? [],
    savedSnapshot,
  };
}

export async function saveGraph(
  roadmapId: string,
  nodes: EditorNode[],
  edges: EditorEdge[],
): Promise<void> {
  const res = await apiFetch(`/api/roadmaps/${roadmapId}/graph`, {
    method: 'POST',
    body: JSON.stringify({
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        positionX: n.positionX ?? undefined,
        positionY: n.positionY ?? undefined,
        targetRoadmapId: n.targetRoadmapId,
        content: n.content,
      })),
      edges: edges.map((e) => ({
        sourceId: e.sourceId,
        targetId: e.targetId,
        label: e.label,
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Save failed: ${text || res.status}`);
  }
}
