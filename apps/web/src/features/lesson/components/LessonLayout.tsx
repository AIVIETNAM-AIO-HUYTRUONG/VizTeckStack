"use client";

import Link from "next/link";
import { LessonPageShell, LessonPageLayout } from "@vizteck/core";
import type { LessonShellNode, PageTree, PageTreeNode } from "@vizteck/core";
import type { NodeItem } from "@/lib/gql";

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface LessonLayoutProps {
  node: NodeItem;
  tree: PageTree | null;
}

export function LessonLayout({ node, tree }: LessonLayoutProps) {
  const shellNode: LessonShellNode = {
    id: node.id,
    title: node.title,
    coverImage: node.coverImage ?? null,
    icon: node.icon ?? null,
    content: node.content ?? null,
    type: node.type,
  };

  return (
    <div id="main-content" className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50 h-14 flex items-center gap-3 px-4 bg-bg-1 border-b border-border flex-shrink-0">
        {tree && (
          <Link
            href={`/roadmap/${tree.rootSlug}`}
            aria-label={`Back to ${tree.rootTitle}`}
            className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1 focus:outline-none focus:ring-2 focus:ring-indigo rounded-sm px-1 -ml-1 transition-colors motion-reduce:transition-none"
          >
            <BackIcon />
            <span className="hidden sm:inline">{tree.rootTitle}</span>
          </Link>
        )}
        {tree && <span className="text-border select-none">·</span>}
        <span className="text-sm font-medium text-text-1 truncate min-w-0 flex-1">
          {node.title}
        </span>
      </div>

      <LessonPageLayout
        tree={tree ?? undefined}
        currentNodeId={node.id}
        getLessonHref={(n: PageTreeNode) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
        getRoadmapHref={(n: PageTreeNode) => n.slug ? `/roadmap/${n.slug}` : undefined}
      >
        <LessonPageShell mode="view" node={shellNode} />
      </LessonPageLayout>
    </div>
  );
}
