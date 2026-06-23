"use client";

import { LessonPageShell } from "@vizteck/lesson";
import type { LessonShellNode, BreadcrumbItem } from "@vizteck/lesson";
import type { NodeItem } from "@/features/lesson/services/node.service";

interface LessonLayoutProps {
  node: NodeItem;
  breadcrumb: BreadcrumbItem[];
}

export function LessonLayout({ node, breadcrumb }: LessonLayoutProps) {
  const shellNode: LessonShellNode = {
    id: node.id,
    title: node.title,
    coverImage: node.coverImage ?? null,
    icon: node.icon ?? null,
    content: node.content ?? null,
    type: node.type,
  };

  return (
    <LessonPageShell
      mode="view"
      node={shellNode}
      breadcrumb={breadcrumb}
      getLinkHref={(item) =>
        item.slug ? `/roadmap/${item.slug}` : undefined
      }
    />
  );
}
