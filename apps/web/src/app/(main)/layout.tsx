import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchButton } from '@/components/SearchButton';
import { AdminSwitch } from '@/components/AdminSwitch';
import { SearchModalWrapper } from '@/features/search/SearchModalWrapper';
import { SearchProvider } from '@/features/search/SearchContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <SearchModalWrapper />
      <header className="h-14 px-4 sm:px-6 flex items-center justify-between bg-bg-1 border-b border-border">
        <a href="/" className="font-display font-bold text-lg text-text-1 no-underline tracking-tight">
          VizTeck<span className="text-indigo">Stack</span>
        </a>
        <div className="flex items-center gap-2">
          <AdminSwitch />
          <SearchButton />
          <ThemeToggle />
        </div>
      </header>
      <main id="main-content" className="pb-[env(safe-area-inset-bottom)]">
        {children}
      </main>
    </SearchProvider>
  );
}
