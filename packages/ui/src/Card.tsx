import React from 'react';
import { NodeBadge, NodeType } from './NodeBadge';

export interface CardProps {
  type: NodeType;
  title: string;
  description?: string;
  miniGraph?: React.ReactNode;
  onClick?: () => void;
}

export function Card({ type, title, description, miniGraph, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-1, #FFFFFF)',
        border: '1px solid var(--border, #E2E8F0)',
        borderRadius: 16,
        padding: 20,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <NodeBadge type={type} />

      <div>
        <h3
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-1, #0F172A)',
            margin: 0,
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              color: 'var(--text-2, #475569)',
              margin: '4px 0 0 0',
            }}
          >
            {description}
          </p>
        )}
      </div>

      {miniGraph && (
        <div
          style={{
            backgroundColor: 'var(--bg-2, #F1F3F9)',
            borderRadius: 10,
            overflow: 'hidden',
            minHeight: 80,
          }}
        >
          {miniGraph}
        </div>
      )}
    </div>
  );
}
