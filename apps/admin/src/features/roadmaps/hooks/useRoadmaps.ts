'use client';

import { useRoadmaps } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export type { ModalState } from '@vizteck/core';

// ponytail: thin wrapper — injects adminApolloClient; callers import hook from here
export function useAdminRoadmaps() {
  return useRoadmaps(adminApolloClient);
}
