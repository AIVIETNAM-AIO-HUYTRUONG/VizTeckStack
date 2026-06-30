import {
  ListRoadmapsDocument,
  CreateRoadmapDocument,
  UpdateRoadmapDocument,
  DeleteRoadmapDocument,
  type ListRoadmapsQuery,
} from '@vizteck/graphql-client';
import { STATUS_CYCLE } from './utils/constants';
import type { ApolloLike, Roadmap, CreateRoadmapInput, UpdateRoadmapInput } from './types';

export async function getRoadmaps(client: ApolloLike): Promise<Roadmap[]> {
  const { data } = await client.query<ListRoadmapsQuery>({
    query: ListRoadmapsDocument,
  });
  return (data.roadmaps ?? []) as Roadmap[];
}

export async function createRoadmap(
  client: ApolloLike,
  input: CreateRoadmapInput,
): Promise<void> {
  await client.mutate({
    mutation: CreateRoadmapDocument,
    variables: { input },
  });
}

export async function updateRoadmap(
  client: ApolloLike,
  id: string,
  input: UpdateRoadmapInput,
): Promise<void> {
  await client.mutate({
    mutation: UpdateRoadmapDocument,
    variables: { id, input },
  });
}

export async function deleteRoadmap(client: ApolloLike, id: string): Promise<void> {
  await client.mutate({
    mutation: DeleteRoadmapDocument,
    variables: { id },
  });
}

export async function cycleStatus(client: ApolloLike, roadmap: Roadmap): Promise<string> {
  const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
  await updateRoadmap(client, roadmap.id, { status: next });
  return next;
}
