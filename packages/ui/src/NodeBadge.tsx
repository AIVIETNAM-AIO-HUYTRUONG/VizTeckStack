import React from 'react';

export type NodeType = 'ROADMAP' | 'LESSON';

export interface NodeBadgeProps {
  type: NodeType;
}

const BADGE_CLASSES: Record<NodeType, string> = {
  ROADMAP: 'bg-indigo-lt text-indigo dark:bg-indigo/20 dark:text-indigo-mid',
  LESSON:  'bg-emerald-lt text-emerald dark:bg-emerald/20 dark:text-emerald-400',
};

export function NodeBadge({ type }: NodeBadgeProps) {
  const cls = BADGE_CLASSES[type] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span
      className={`${cls} font-mono text-[9px] font-bold px-2 py-[2px] rounded-full uppercase tracking-[0.05em] inline-block`}
    >
      {type}
    </span>
  );
}
