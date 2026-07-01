'use client';
import { useUsers } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

// ponytail: thin wrapper — injects adminApolloClient; callers import hook from here
export function useAdminUsers() {
  return useUsers(adminApolloClient);
}
