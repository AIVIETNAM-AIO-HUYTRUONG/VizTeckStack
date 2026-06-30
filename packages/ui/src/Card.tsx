import React from 'react';
import { NodeBadge, NodeType } from './NodeBadge';

export interface CardProps {
  type: NodeType;
  title: string;
  description?: string;
  miniGraph?: React.ReactNode;
  onClick?: () => void;
  /** Required when onClick is provided — describes the card action for screen readers */
  'aria-label'?: string;
}

export function Card({ type, title, description, miniGraph, onClick, 'aria-label': ariaLabel }: CardProps) {
  const interactive = !!onClick;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={interactive ? handleKeyDown : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      className={[
        'bg-bg-1 border border-border rounded-lg p-5 flex flex-col gap-3',
        'transition-all duration-200 motion-reduce:transition-none',
        interactive
          ? 'cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(79,70,229,0.10)] focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1'
          : 'cursor-default',
        'group-hover:-translate-y-1.5 group-hover:shadow-[0_8px_24px_rgba(79,70,229,0.10)]',
      ].join(' ')}
    >
      <NodeBadge type={type} />

      <div className="min-w-0">
        <h3 className="font-display text-base font-bold text-text-1 m-0 line-clamp-2 text-wrap-balance">
          {title}
        </h3>
        {description && (
          <p className="font-body text-sm text-text-2 mt-1 mb-0 line-clamp-3">
            {description}
          </p>
        )}
      </div>

      {miniGraph && (
        <div className="bg-bg-2 rounded-md overflow-hidden min-h-[80px]">
          {miniGraph}
        </div>
      )}
    </div>
  );
}
