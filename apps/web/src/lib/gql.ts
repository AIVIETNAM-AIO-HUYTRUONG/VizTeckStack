import { GraphQLClient } from 'graphql-request';
import {
  ListRoadmapsDocument,
  GetRoadmapDocument,
  GetNodeDocument,
  GetNodeBreadcrumbDocument,
  GetRoadmapTreeDocument,
  type ListRoadmapsQuery,
  type GetRoadmapQuery,
  type GetNodeQuery,
  type GetNodeBreadcrumbQuery,
  type GetRoadmapTreeQuery,
} from '@vizteck/graphql-client';
import type { BreadcrumbItem, PageTree } from '@vizteck/lesson';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const gqlClient = new GraphQLClient(`${API}/graphql`, {
  fetch: (url: RequestInfo | URL, init?: RequestInit) =>
    fetch(url, { ...init, cache: 'no-store' }),
});

export interface RoadmapItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  status?: string;
}

export interface NodeItem {
  id: string;
  roadmapId: string;
  type: 'ROADMAP' | 'LESSON';
  title: string;
  positionX: number | null;
  positionY: number | null;
  targetRoadmapId?: string;
  targetRoadmapSlug?: string;
  content?: string;
  coverImage?: string;
  icon?: string;
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

export async function fetchRoadmaps(): Promise<RoadmapItem[]> {
  const data = await gqlClient.request<ListRoadmapsQuery>(ListRoadmapsDocument);
  return ((data.roadmaps ?? []) as RoadmapItem[]).filter((r) => r.status === 'PUBLIC');
}

export async function fetchRoadmap(slug: string): Promise<RoadmapDetail> {
  const data = await gqlClient.request<GetRoadmapQuery>(GetRoadmapDocument, { slug });
  const detail = data.roadmap;
  return {
    roadmap: detail?.roadmap as RoadmapItem | undefined,
    nodes: (detail?.nodes ?? []).map((n) => ({
      ...n,
      positionX: n.positionX ?? null,
      positionY: n.positionY ?? null,
      targetRoadmapId: n.targetRoadmapId ?? undefined,
      targetRoadmapSlug: n.targetRoadmapSlug ?? undefined,
      content: n.content ?? undefined,
      coverImage: n.coverImage ?? undefined,
      icon: n.icon ?? undefined,
    })) as NodeItem[],
    edges: (detail?.edges ?? []) as EdgeItem[],
  };
}

export async function fetchNode(id: string): Promise<NodeItem> {
  const data = await gqlClient.request<GetNodeQuery>(GetNodeDocument, { id });
  if (!data.node) throw new Error(`fetchNode(${id}): not found`);
  const n = data.node;
  return {
    ...n,
    positionX: n.positionX ?? null,
    positionY: n.positionY ?? null,
    targetRoadmapId: n.targetRoadmapId ?? undefined,
    targetRoadmapSlug: n.targetRoadmapSlug ?? undefined,
    content: n.content ?? undefined,
    coverImage: n.coverImage ?? undefined,
    icon: n.icon ?? undefined,
  } as NodeItem;
}

export async function fetchBreadcrumb(nodeId: string): Promise<BreadcrumbItem[]> {
  try {
    const data = await gqlClient.request<GetNodeBreadcrumbQuery>(GetNodeBreadcrumbDocument, {
      id: nodeId,
    });
    return (data.nodeBreadcrumb ?? []) as BreadcrumbItem[];
  } catch {
    return [];
  }
}

export async function fetchRoadmapTree(slug: string): Promise<PageTree | null> {
  try {
    const data = await gqlClient.request<GetRoadmapTreeQuery>(GetRoadmapTreeDocument, { slug });
    const tree = data.roadmapTree;
    if (!tree?.rootSlug) return null;
    return tree as unknown as PageTree;
  } catch {
    return null;
  }
}
