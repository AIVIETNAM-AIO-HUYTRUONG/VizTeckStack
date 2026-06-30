'use client';

import { useGraphEditor, updateRoadmap } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export type { EditorNode, EditorEdge, RoadmapEntry } from '@vizteck/core';

// ponytail: thin wrapper — injects adminApolloClient and updateRoadmap
export function useAdminGraphEditor(id: string, slug: string | null) {
  return useGraphEditor(adminApolloClient, updateRoadmap, id, slug);
}
