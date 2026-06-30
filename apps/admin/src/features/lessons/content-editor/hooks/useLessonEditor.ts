'use client';

import { useLessonEditor } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export type { SaveStatus, UseLessonEditorResult, LessonNode } from '@vizteck/core';

// ponytail: thin wrapper — injects adminApolloClient
export function useAdminLessonEditor(nodeId: string) {
  return useLessonEditor(adminApolloClient, nodeId);
}
