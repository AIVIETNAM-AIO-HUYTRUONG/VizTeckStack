"use client";

import { useState, useEffect } from 'react';
import { PageTreeItem } from './PageTreeItem';
import type { PageTree, PageTreeNode } from './types';

export interface PageTreeSidebarProps {
  tree: PageTree;
  currentNodeId?: string;
  getLessonHref: (node: PageTreeNode) => string;
  getRoadmapHref?: (node: PageTreeNode) => string | undefined;
}

function findPathToNode(nodes: PageTreeNode[], targetId: string): Set<string> {
  for (const node of nodes) {
    if (node.id === targetId) return new Set<string>();
    if (node.children?.length) {
      const childPath = findPathToNode(node.children, targetId);
      if (childPath !== null) {
        childPath.add(node.id);
        return childPath;
      }
    }
  }
  return null as unknown as Set<string>;
}

export function PageTreeSidebar({ tree, currentNodeId, getLessonHref, getRoadmapHref }: PageTreeSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (!currentNodeId) return new Set();
    return findPathToNode(tree.nodes, currentNodeId) ?? new Set();
  });

  useEffect(() => {
    if (!currentNodeId) return;
    const path = findPathToNode(tree.nodes, currentNodeId);
    if (path) setExpandedIds(path);
  }, [currentNodeId, tree.nodes]);

  const onToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto py-3 px-2">
      <div className="px-2 pb-2 mb-1 border-b border-border">
        <span className="text-xs font-semibold text-text-3 uppercase tracking-wider">
          {tree.rootTitle}
        </span>
      </div>
      {tree.nodes.map((node) => (
        <PageTreeItem
          key={node.id}
          node={node}
          depth={0}
          currentNodeId={currentNodeId}
          isExpanded={expandedIds.has(node.id)}
          onToggle={onToggle}
          getLessonHref={getLessonHref}
          getRoadmapHref={getRoadmapHref}
        />
      ))}
    </div>
  );
}
