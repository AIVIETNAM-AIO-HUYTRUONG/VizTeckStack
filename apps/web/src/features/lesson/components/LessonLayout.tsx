"use client";

import { LessonPageShell, LessonPageLayout } from "@vizteck/lesson";
import type { LessonShellNode, BreadcrumbItem, PageTree, PageTreeNode } from "@vizteck/lesson";
import type { NodeItem } from "@/lib/gql";

interface LessonLayoutProps {
  node: NodeItem;
  breadcrumb: BreadcrumbItem[];
  tree: PageTree | null;
}

export function LessonLayout({ node, breadcrumb, tree }: LessonLayoutProps) {
  const shellNode: LessonShellNode = {
    id: node.id,
    title: node.title,
    coverImage: node.coverImage ?? null,
    icon: node.icon ?? null,
    content: node.content ?? null,
    type: node.type,
  };

  return (
    <LessonPageLayout
      tree={tree ?? undefined}
      currentNodeId={node.id}
      getLessonHref={(n: PageTreeNode) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
      getRoadmapHref={(n: PageTreeNode) => n.slug ? `/roadmap/${n.slug}` : undefined}
    >
      <LessonPageShell
        mode="view"
        node={shellNode}
        breadcrumb={breadcrumb}
        getLinkHref={(item: BreadcrumbItem) =>
          item.slug ? `/roadmap/${item.slug}` : undefined
        }
      />
    </LessonPageLayout>
  );
}
