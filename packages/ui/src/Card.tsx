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
      className={`bg-bg-1 border border-border rounded-lg p-5 flex flex-col gap-3 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <NodeBadge type={type} />

      <div>
        <h3 className="font-display text-base font-bold text-text-1 m-0">
          {title}
        </h3>
        {description && (
          <p className="font-body text-sm text-text-2 mt-1 mb-0">
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
