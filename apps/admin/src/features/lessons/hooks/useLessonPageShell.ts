'use client';

import { useLessonPageShell } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export function useAdminLessonPageShell(
  nodeId: string,
  initialCover: string | null | undefined,
  initialIcon: string | null | undefined,
) {
  return useLessonPageShell(adminApolloClient, nodeId, initialCover, initialIcon);
}
