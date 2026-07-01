'use client';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import type { AuthUser, UserRole } from '@vizteck/core';

export function useAuth(): { user: AuthUser | null; isLoading: boolean; logout: () => Promise<void> } {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerkAuth();

  const authUser: AuthUser | null = user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? '',
        name: user.fullName ?? '',
        role: ((user.publicMetadata as Record<string, unknown>)?.role ?? 'VIEWER') as UserRole,
      }
    : null;

  return {
    user: authUser,
    isLoading: !isLoaded,
    logout: () => signOut(),
  };
}
