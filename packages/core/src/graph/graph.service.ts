// packages/core/src/graph/graph.service.ts
import {
  ListRoadmapsDocument,
  GetRoadmapDocument,
  UpsertGraphDocument,
  NodeType,
  type ListRoadmapsQuery,
  type GetRoadmapQuery,
  type UpsertGraphMutationVariables,
} from '@vizteck/graphql-client';
import type { ApolloLike } from '../roadmap/types';
import type { NodeItem, EdgeItem } from './types';
import type { EditorNode, EditorEdge, GraphData, RoadmapEntry } from './types';

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

export async function loadGraph(
  client: ApolloLike,
  slug: string,
  roadmapId: string,
): Promise<GraphData> {
  const [graphResult, roadmapsResult] = await Promise.all([
    client.query<GetRoadmapQuery>({
      query: GetRoadmapDocument,
      variables: { slug },
    }),
    client.query<ListRoadmapsQuery>({
      query: ListRoadmapsDocument,
    }),
  ]);

  const detail = graphResult.data.roadmap;
  if (!detail) throw new Error(`Failed to load graph for slug: ${slug}`);

  const nodes: EditorNode[] = (detail.nodes ?? []).map((n) => ({
    ...(n as unknown as NodeItem),
    type: normalizeNodeType(n.type),
  }));
  const edges: EditorEdge[] = (detail.edges ?? []).map((e) => ({
    ...(e as unknown as EdgeItem),
  }));
  const savedSnapshot = makeSnapshot(nodes, edges);

  let restoredNodes = nodes;
  let restoredEdges = edges;
  if (typeof window !== 'undefined') {
    const draftJson = sessionStorage.getItem(`graph-draft-${roadmapId}`);
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson) as { nodes: EditorNode[]; edges: EditorEdge[]; baseSnapshot?: string };
        // Only restore draft if DB hasn't changed since the draft was created.
        // A missing baseSnapshot means the draft is from an older format — treat as stale.
        if (
          draft.baseSnapshot === savedSnapshot &&
          makeSnapshot(draft.nodes, draft.edges) !== savedSnapshot
        ) {
          restoredNodes = draft.nodes;
          restoredEdges = draft.edges;
        } else {
          sessionStorage.removeItem(`graph-draft-${roadmapId}`);
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
  client: ApolloLike,
  roadmapId: string,
  nodes: EditorNode[],
  edges: EditorEdge[],
): Promise<void> {
  const { data } = await client.mutate({
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
    } as UpsertGraphMutationVariables,
  });
  // ponytail: ApolloLike.mutate returns { data? } not { errors? }; errors surface as thrown exceptions via Apollo's error policy
  void data;
}
