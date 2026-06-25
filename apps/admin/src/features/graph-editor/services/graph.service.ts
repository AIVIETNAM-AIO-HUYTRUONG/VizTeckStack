import { adminApolloClient } from '@/lib/apolloClient';
import {
  ListRoadmapsDocument,
  GetRoadmapDocument,
  UpsertGraphDocument,
  NodeType,
  type ListRoadmapsQuery,
  type GetRoadmapQuery,
  type UpsertGraphMutationVariables,
} from '@vizteck/graphql-client';
import type { NodeItem, EdgeItem } from '@vizteck/graph';

export interface EditorNode extends NodeItem {
  selected?: boolean;
}

export type EditorEdge = EdgeItem;

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
  const [graphResult, roadmapsResult] = await Promise.all([
    adminApolloClient.query<GetRoadmapQuery>({
      query: GetRoadmapDocument,
      variables: { slug },
    }),
    adminApolloClient.query<ListRoadmapsQuery>({
      query: ListRoadmapsDocument,
    }),
  ]);

  const detail = graphResult.data.roadmap;
  if (!detail) throw new Error(`Failed to load graph for slug: ${slug}`);

  const nodes: EditorNode[] = (detail.nodes ?? []).map((n) => ({
    ...(n as unknown as NodeItem),
    type: normalizeNodeType(n.type),
  }));
  const edges: EditorEdge[] = (detail.edges ?? []).map((e) => ({ ...(e as unknown as EdgeItem) }));
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
    roadmapTitle: detail.roadmap?.title ?? '',
    roadmapStatus: detail.roadmap?.status ?? 'DRAFT',
    nodes: restoredNodes,
    edges: restoredEdges,
    allRoadmaps: (roadmapsResult.data.roadmaps ?? []) as RoadmapEntry[],
    savedSnapshot,
  };
}

export async function saveGraph(
  roadmapId: string,
  nodes: EditorNode[],
  edges: EditorEdge[],
): Promise<void> {
  const { errors } = await adminApolloClient.mutate<unknown, UpsertGraphMutationVariables>({
    mutation: UpsertGraphDocument,
    variables: {
      roadmapId,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type === 'ROADMAP' ? NodeType.Roadmap : NodeType.Lesson,
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
    },
  });

  if (errors?.length) throw new Error(`Save failed: ${errors[0].message}`);
}
