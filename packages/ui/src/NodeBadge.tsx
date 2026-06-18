import React from 'react';

export type NodeType = 'ROADMAP' | 'LESSON';

export interface NodeBadgeProps {
  type: NodeType;
}

const BADGE_STYLES: Record<NodeType, { bg: string; color: string; label: string }> = {
  ROADMAP: { bg: '#EEF2FF', color: '#4F46E5', label: 'ROADMAP' },
  LESSON:  { bg: '#ECFDF5', color: '#059669', label: 'LESSON'  },
};

export function NodeBadge({ type }: NodeBadgeProps) {
  const s = BADGE_STYLES[type];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'inline-block',
      }}
    >
      {s.label}
    </span>
  );
}
