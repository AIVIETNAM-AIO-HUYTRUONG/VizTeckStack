import { adminApolloClient } from '@/lib/apolloClient';
import {
  ListRoadmapsDocument,
  CreateRoadmapDocument,
  UpdateRoadmapDocument,
  DeleteRoadmapDocument,
  type ListRoadmapsQuery,
  type CreateRoadmapMutationVariables,
  type UpdateRoadmapMutationVariables,
} from '@vizteck/graphql-client';

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
  const { data } = await adminApolloClient.query<ListRoadmapsQuery>({
    query: ListRoadmapsDocument,
  });
  return (data.roadmaps ?? []) as Roadmap[];
}

export async function createRoadmap(input: CreateRoadmapInput): Promise<void> {
  await adminApolloClient.mutate<unknown, CreateRoadmapMutationVariables>({
    mutation: CreateRoadmapDocument,
    variables: { input },
  });
}

export async function updateRoadmap(id: string, input: UpdateRoadmapInput): Promise<void> {
  await adminApolloClient.mutate<unknown, UpdateRoadmapMutationVariables>({
    mutation: UpdateRoadmapDocument,
    variables: { id, input },
  });
}

export async function deleteRoadmap(id: string): Promise<void> {
  await adminApolloClient.mutate({
    mutation: DeleteRoadmapDocument,
    variables: { id },
  });
}

export async function cycleStatus(roadmap: Roadmap): Promise<string> {
  const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
  await updateRoadmap(roadmap.id, { status: next });
  return next;
}
