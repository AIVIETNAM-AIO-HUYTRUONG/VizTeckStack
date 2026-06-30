"use client";

import { useState, useEffect } from 'react';
import { PageTreeSidebar } from './PageTreeSidebar';
import type { PageTree, PageTreeNode } from '../types';

export interface LessonPageLayoutProps {
  tree?: PageTree;
  currentNodeId?: string;
  getLessonHref: (node: PageTreeNode) => string;
  getRoadmapHref?: (node: PageTreeNode) => string | undefined;
  children: React.ReactNode;
}

const STORAGE_KEY = 'lesson-sidebar-collapsed';

export function LessonPageLayout({
  tree, currentNodeId, getLessonHref, getRoadmapHref, children,
}: LessonPageLayoutProps) {
  // Default true (collapsed): prevents overlay appearing on first mobile visit
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setIsCollapsed(stored === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  if (!tree) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen relative">
      {/* Mobile backdrop — tapping outside closes the sidebar */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar
          Mobile:  fixed overlay, toggle via translateX
          Desktop: static flex panel, toggle via width  */}
      <div
        data-testid="lesson-sidebar"
        className={[
          'bg-bg-1 border-r border-border overflow-y-auto',
          // Mobile: fixed left drawer
          'fixed inset-y-0 left-0 z-40 w-[260px]',
          'transition-transform duration-200 ease-out motion-reduce:transition-none',
          isCollapsed ? '-translate-x-full' : 'translate-x-0',
          // Desktop (sm+): static, width-based collapse
          'sm:relative sm:inset-auto sm:z-auto sm:shrink-0 sm:translate-x-0',
          'sm:transition-[width] sm:duration-200 sm:ease-out sm:motion-reduce:transition-none',
          isCollapsed ? 'sm:w-0 sm:overflow-hidden' : 'sm:w-[260px]',
        ].join(' ')}
      >
        <PageTreeSidebar
          tree={tree}
          currentNodeId={currentNodeId}
          getLessonHref={getLessonHref}
          getRoadmapHref={getRoadmapHref}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 relative">
        {/* Toggle button
            Mobile: fixed just below lesson header (z-50, above sidebar z-40)
            top-[70px] = h-14 lesson header (56px) + 14px gap
            Desktop: absolute inside content column  */}
        <button
          type="button"
          aria-label="toggle sidebar"
          onClick={() => setIsCollapsed((c) => !c)}
          className={[
            'flex items-center justify-center',
            'bg-bg-1 border border-border text-text-3',
            'hover:text-text-1 hover:border-indigo',
            'transition-colors motion-reduce:transition-none',
            'focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1',
            'rounded-md',
            // Mobile: fixed, 44×44px touch target, above sidebar
            'fixed top-[70px] left-2 z-50 w-11 h-11 text-base',
            // Desktop: absolute within content, 24×24px (mouse-primary)
            'sm:absolute sm:top-3 sm:left-2 sm:z-10 sm:w-6 sm:h-6 sm:text-xs sm:rounded',
          ].join(' ')}
        >
          {isCollapsed ? '›' : '‹'}
        </button>
        {children}
      </div>
    </div>
  );
}
