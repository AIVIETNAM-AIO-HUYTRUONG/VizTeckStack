'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Button, cn } from '@vizteck/ui';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/features/auth/hooks/useAdminAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { signOut } = useClerk();
  const { user } = useAuth();
  const pathname = usePathname();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const navLinks = [
    { href: '/roadmaps', label: 'Roadmaps' },
    ...(isSuperAdmin ? [{ href: '/admin/users', label: 'Users' }] : []),
  ];

  return (
    <div className="min-h-screen bg-bg-0">
      <header className="h-14 bg-bg-1 border-b border-border px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-display font-semibold text-lg text-text-1 tracking-tight">
            VizTeck<span className="text-indigo">Stack</span>{' '}Admin
          </span>
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-sm transition-colors motion-reduce:transition-none',
                  pathname.startsWith(href)
                    ? 'text-text-1 bg-bg-2 font-medium'
                    : 'text-text-2 hover:text-text-1 hover:bg-bg-2',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => signOut({ redirectUrl: '/login' })}>
            Log out
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
