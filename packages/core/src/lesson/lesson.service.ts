// packages/core/src/lesson/lesson.service.ts
import {
  GetNodeDocument,
  GetNodeBreadcrumbDocument,
  GetRoadmapTreeDocument,
  UpdateNodeContentDocument,
  UpdateNodeTitleDocument,
  UpdateNodeCoverDocument,
  UpdateNodeIconDocument,
  type GetNodeQuery,
  type GetNodeBreadcrumbQuery,
  type GetRoadmapTreeQuery,
} from '@vizteck/graphql-client';
import type { ApolloLike } from '../roadmap/types';
import type { BreadcrumbItem, PageTree, LessonNode } from './types';

export async function fetchLesson(client: ApolloLike, nodeId: string): Promise<LessonNode> {
  const { data } = await client.query<GetNodeQuery>({
    query: GetNodeDocument,
    variables: { id: nodeId },
  });
  if (!data.node) throw new Error('Lesson not found');
  return data.node as LessonNode;
}

export async function updateLessonContent(
  client: ApolloLike,
  nodeId: string,
  content: string,
): Promise<void> {
  await client.mutate({
    mutation: UpdateNodeContentDocument,
    variables: { id: nodeId, content },
  });
}

export async function updateLessonTitle(
  client: ApolloLike,
  nodeId: string,
  title: string,
): Promise<void> {
  await client.mutate({
    mutation: UpdateNodeTitleDocument,
    variables: { id: nodeId, title },
  });
}

export async function updateNodeCover(
  client: ApolloLike,
  nodeId: string,
  coverImage: string | null,
): Promise<void> {
  await client.mutate({
    mutation: UpdateNodeCoverDocument,
    variables: { id: nodeId, coverImage: coverImage ?? undefined },
  });
}

export async function updateNodeIcon(
  client: ApolloLike,
  nodeId: string,
  icon: string | null,
): Promise<void> {
  await client.mutate({
    mutation: UpdateNodeIconDocument,
    variables: { id: nodeId, icon: icon ?? undefined },
  });
}

export async function fetchBreadcrumb(
  client: ApolloLike,
  nodeId: string,
): Promise<BreadcrumbItem[]> {
  try {
    const { data } = await client.query<GetNodeBreadcrumbQuery>({
      query: GetNodeBreadcrumbDocument,
      variables: { id: nodeId },
    });
    return (data.nodeBreadcrumb ?? []) as BreadcrumbItem[];
  } catch {
    return [];
  }
}

export async function fetchRoadmapTree(
  client: ApolloLike,
  nodeId: string,
): Promise<PageTree | null> {
  const crumbs = await fetchBreadcrumb(client, nodeId);
  const rootSlug = crumbs[0]?.slug;
  if (!rootSlug) return null;
  try {
    const { data } = await client.query<GetRoadmapTreeQuery>({
      query: GetRoadmapTreeDocument,
      variables: { slug: rootSlug },
    });
    const tree = data.roadmapTree;
    if (!tree?.rootSlug) return null;
    return tree as unknown as PageTree;
  } catch {
    return null;
  }
}
