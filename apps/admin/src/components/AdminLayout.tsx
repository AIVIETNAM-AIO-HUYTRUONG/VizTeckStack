'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@vizteck/ui';
import { ThemeToggle } from './ThemeToggle';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('admin_token');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-bg-0">
      <header className="h-14 bg-bg-1 border-b border-border px-6 flex items-center justify-between">
        <span className="font-display font-semibold text-lg text-text-1">
          VizTeckStack Admin
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
