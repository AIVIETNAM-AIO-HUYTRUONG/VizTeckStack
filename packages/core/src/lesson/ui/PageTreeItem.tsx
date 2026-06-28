"use client";

import type { PageTreeNode } from "../types";

export interface PageTreeItemProps {
  node: PageTreeNode;
  depth: number;
  currentNodeId?: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  getLessonHref: (node: PageTreeNode) => string;
  getRoadmapHref?: (node: PageTreeNode) => string | undefined;
}

export function PageTreeItem({
  node,
  depth,
  currentNodeId,
  isExpanded,
  onToggle,
  getLessonHref,
  getRoadmapHref,
}: PageTreeItemProps) {
  const isCurrent = node.id === currentNodeId;
  const indent = depth * 12;

  if (node.type === "LESSON") {
    const href = getLessonHref(node);
    return (
      <div style={{ paddingLeft: `${indent}px` }}>
        <a
          href={href}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${
            isCurrent
              ? "bg-indigo/10 text-indigo font-medium"
              : "text-text-2 hover:bg-bg-2 hover:text-text-1"
          }`}
        >
          <span className="shrink-0 text-xs" aria-hidden="true">
            📄
          </span>
          <span className="truncate">{node.title}</span>
        </a>
      </div>
    );
  }

  // ROADMAP node
  const roadmapHref = getRoadmapHref?.(node);
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div style={{ paddingLeft: `${indent}px` }}>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          className="flex items-center gap-1.5 flex-1 px-2 py-1 rounded text-sm text-text-2 hover:bg-bg-2 hover:text-text-1 transition-colors text-left"
        >
          <span className="shrink-0 text-xs" aria-hidden="true">
            {isExpanded ? "📂" : "📁"}
          </span>
          {roadmapHref ? (
            <a
              href={roadmapHref}
              onClick={(e) => e.stopPropagation()}
              className="truncate hover:underline"
            >
              {node.title}
            </a>
          ) : (
            <span className="truncate">{node.title}</span>
          )}
        </button>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => {
            // isExpanded is always false here: at depth-2, children are LESSON nodes with no subtrees
            return (
              <PageTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                currentNodeId={currentNodeId}
                isExpanded={false}
                onToggle={onToggle}
                getLessonHref={getLessonHref}
                getRoadmapHref={getRoadmapHref}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
