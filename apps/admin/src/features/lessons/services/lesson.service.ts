import { adminApolloClient } from '@/lib/apolloClient';
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
import type { BreadcrumbItem, PageTree } from '@vizteck/lesson';

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
  const { data } = await adminApolloClient.query<GetNodeQuery>({
    query: GetNodeDocument,
    variables: { id: nodeId },
  });
  if (!data.node) throw new Error('Lesson not found');
  return data.node as LessonNode;
}

export async function updateLessonContent(nodeId: string, content: string): Promise<void> {
  const { errors } = await adminApolloClient.mutate({
    mutation: UpdateNodeContentDocument,
    variables: { id: nodeId, content },
  });
  if (errors?.length) throw new Error(`Save failed: ${errors[0].message}`);
}

export async function updateLessonTitle(nodeId: string, title: string): Promise<void> {
  const { errors } = await adminApolloClient.mutate({
    mutation: UpdateNodeTitleDocument,
    variables: { id: nodeId, title },
  });
  if (errors?.length) throw new Error(`Update title failed: ${errors[0].message}`);
}

export async function updateNodeCover(nodeId: string, coverImage: string | null): Promise<void> {
  const { errors } = await adminApolloClient.mutate({
    mutation: UpdateNodeCoverDocument,
    variables: { id: nodeId, coverImage: coverImage ?? undefined },
  });
  if (errors?.length) throw new Error(`Update cover failed: ${errors[0].message}`);
}

export async function updateNodeIcon(nodeId: string, icon: string | null): Promise<void> {
  const { errors } = await adminApolloClient.mutate({
    mutation: UpdateNodeIconDocument,
    variables: { id: nodeId, icon: icon ?? undefined },
  });
  if (errors?.length) throw new Error(`Update icon failed: ${errors[0].message}`);
}

export async function fetchBreadcrumb(nodeId: string): Promise<BreadcrumbItem[]> {
  try {
    const { data } = await adminApolloClient.query<GetNodeBreadcrumbQuery>({
      query: GetNodeBreadcrumbDocument,
      variables: { id: nodeId },
    });
    return (data.nodeBreadcrumb ?? []) as BreadcrumbItem[];
  } catch {
    return [];
  }
}

export async function fetchRoadmapTree(nodeId: string): Promise<PageTree | null> {
  const crumbs = await fetchBreadcrumb(nodeId);
  const rootSlug = crumbs[0]?.slug;
  if (!rootSlug) return null;
  try {
    const { data } = await adminApolloClient.query<GetRoadmapTreeQuery>({
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
