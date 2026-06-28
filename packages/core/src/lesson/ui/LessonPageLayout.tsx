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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  if (!tree) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <div
        data-testid="lesson-sidebar"
        className={`shrink-0 border-r border-border bg-bg-1 transition-all duration-200 overflow-hidden ${
          isCollapsed ? 'w-0' : 'w-[260px]'
        }`}
      >
        {!isCollapsed && (
          <PageTreeSidebar
            tree={tree}
            currentNodeId={currentNodeId}
            getLessonHref={getLessonHref}
            getRoadmapHref={getRoadmapHref}
          />
        )}
      </div>
      <div className="flex-1 min-w-0 relative">
        <button
          type="button"
          aria-label="toggle sidebar"
          onClick={() => setIsCollapsed((c) => !c)}
          className="absolute top-3 left-2 z-10 w-6 h-6 flex items-center justify-center rounded bg-bg-1 border border-border text-text-3 hover:text-text-1 hover:border-indigo transition-colors text-xs"
        >
          {isCollapsed ? '›' : '‹'}
        </button>
        {children}
      </div>
    </div>
  );
}
