'use client';
import { useUser } from '@clerk/nextjs';

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3002';

export function AdminSwitch() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;

  if (!user) {
    return (
      <a
        href={`${ADMIN_URL}/login`}
        className="text-xs font-semibold text-text-2 hover:text-text-1 border border-border rounded px-2.5 py-1 transition-colors"
      >
        Sign In
      </a>
    );
  }

  const role = (user.publicMetadata as Record<string, unknown>)?.role;
  if (!role) return null;

  return (
    <a
      href={`${ADMIN_URL}/roadmaps`}
      className="text-xs font-semibold text-indigo border border-indigo rounded px-2.5 py-1 hover:bg-indigo hover:text-white transition-colors"
    >
      Admin CMS
    </a>
  );
}
