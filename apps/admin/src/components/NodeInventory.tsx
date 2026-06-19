'use client';

import React from 'react';
import { NodeBadge } from '@vizteck/ui';
import type { NodeItem } from '@vizteck/graph';

interface NodeInventoryProps {
  nodes: NodeItem[];
  onDeleteNode: (id: string) => void;
  onEditNode: (id: string) => void;
}

export function NodeInventory({ nodes, onDeleteNode, onEditNode }: NodeInventoryProps) {
  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>,
    nodeId: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dt = event.dataTransfer as any;
    dt.setData('nodeId', nodeId);
    dt.effectAllowed = 'move';
  }

  return (
    <div className="bg-bg-1 border-t border-border flex-shrink-0" style={{ height: 220 }}>
      {/* Section header */}
      <div className="bg-bg-2 border-b border-border px-4 flex items-center justify-between" style={{ height: 32 }}>
        <span
          className="text-text-2 font-semibold uppercase"
          style={{ fontSize: 12, letterSpacing: '0.08em' }}
        >
          Node Inventory
        </span>
        <span className="text-text-3" style={{ fontSize: 12 }}>
          {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
        </span>
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto" style={{ height: 188 }}>
        {nodes.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-3 text-sm">
            No nodes yet. Right-click on the canvas or click Add Node to create one.
          </div>
        )}
        {nodes.map((node) => {
          const placed = node.positionX != null && node.positionY != null;
          return (
            <div
              key={node.id}
              className="border-b border-border flex items-center px-2 gap-2 hover:bg-bg-2 cursor-default"
              style={{ minHeight: 44 }}
            >
              {/* Drag handle */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, node.id)}
                aria-label="Drag to place on canvas"
                role="button"
                tabIndex={0}
                className="flex-shrink-0 flex items-center justify-center text-text-3 cursor-grab select-none"
                style={{ width: 40, height: '100%', minHeight: 44 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    // keyboard drag not supported — noop
                  }
                }}
              >
                ⠿
              </div>

              {/* Type badge */}
              <NodeBadge type={node.type} />

              {/* Title */}
              <span
                className="flex-1 text-sm text-text-1 truncate cursor-pointer hover:text-indigo"
                onClick={() => onEditNode(node.id)}
              >
                {node.title}
              </span>

              {/* Status chip */}
              {placed ? (
                <span
                  className="flex-shrink-0 font-mono text-indigo bg-indigo-lt rounded-full px-2"
                  style={{ fontSize: 11 }}
                >
                  Placed
                </span>
              ) : (
                <span
                  className="flex-shrink-0 font-mono text-text-3 bg-bg-2 rounded-full px-2"
                  style={{ fontSize: 11 }}
                >
                  Unplaced
                </span>
              )}

              {/* Delete button */}
              <button
                onClick={() => onDeleteNode(node.id)}
                className="flex-shrink-0 text-sm font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
