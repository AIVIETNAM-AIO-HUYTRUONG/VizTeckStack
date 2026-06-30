'use client';

import { usePageTree } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export function useAdminPageTree(nodeId: string) {
  return usePageTree(adminApolloClient, nodeId);
}
