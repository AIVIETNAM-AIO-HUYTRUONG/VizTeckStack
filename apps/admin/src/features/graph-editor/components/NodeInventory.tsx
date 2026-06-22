'use client';

import React, { useState, useMemo } from 'react';
import { NodeBadge } from '@vizteck/ui';
import type { NodeItem } from '@vizteck/graph';
import type { RoadmapEntry } from '../services/graph.service';

export type { RoadmapEntry };

type FilterType = 'ALL' | 'ROADMAP' | 'LESSON';

interface NodeInventoryProps {
  nodes: NodeItem[];
  allRoadmaps: RoadmapEntry[];
  onDeleteNode: (id: string) => void;
  onEditNode: (id: string) => void;
  /** Adds a roadmap as an unplaced ROADMAP node in the graph */
  onAddRoadmapLink: (roadmap: RoadmapEntry) => void;
}

export function NodeInventory({
  nodes, allRoadmaps, onDeleteNode, onEditNode, onAddRoadmapLink,
}: NodeInventoryProps) {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const availableRoadmaps = useMemo(() => {
    const linkedRoadmapIds = new Set(
      nodes.filter((n) => n.type === 'ROADMAP' && n.targetRoadmapId).map((n) => n.targetRoadmapId!),
    );
    return allRoadmaps.filter((r) => !linkedRoadmapIds.has(r.id) && !dismissedIds.has(r.id));
  }, [nodes, allRoadmaps, dismissedIds]);

  const filteredNodes = filter === 'ALL' ? nodes : nodes.filter((n) => n.type === filter);
  const showAvailable = filter === 'ALL' || filter === 'ROADMAP';
  const totalCount = nodes.length + availableRoadmaps.length;

  function handleNodeDrag(e: React.DragEvent, nodeId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e.dataTransfer as any).setData('nodeId', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleRoadmapDrag(e: React.DragEvent, roadmap: RoadmapEntry) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e.dataTransfer as any).setData('nodeId', `newRoadmap:${roadmap.id}:${roadmap.slug}:${encodeURIComponent(roadmap.title)}`);
    e.dataTransfer.effectAllowed = 'move';
  }

  function dismiss(roadmapId: string) {
    setDismissedIds((prev) => new Set([...prev, roadmapId]));
  }

  // ── Collapsed ─────────────────────────────────────────────────
  if (!open) {
    return (
      <div
        className="flex-shrink-0 flex flex-col items-center bg-bg-1 border-r border-border pt-1 gap-1"
        style={{ width: 32 }}
      >
        <button
          onClick={() => setOpen(true)}
          title="Open Inventory"
          className="w-7 h-7 flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-bg-2 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo"
          style={{ fontSize: 16 }}
        >
          ›
        </button>
      </div>
    );
  }

  // ── Open ──────────────────────────────────────────────────────
  return (
    <div className="flex-shrink-0 flex flex-col bg-bg-1 border-r border-border" style={{ width: 260 }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-3 border-b border-border"
        style={{ height: 36 }}
      >
        <span className="text-[11px] font-semibold text-text-2 uppercase tracking-[0.08em]">
          Inventory{' '}
          <span className="text-text-3 font-normal normal-case tracking-normal">({totalCount})</span>
        </span>
        <button
          onClick={() => setOpen(false)}
          title="Collapse"
          className="text-text-3 hover:text-text-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo rounded leading-none"
          style={{ fontSize: 18 }}
        >
          ‹
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex-shrink-0 flex border-b border-border" style={{ height: 30 }}>
        {(['ALL', 'ROADMAP', 'LESSON'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 text-[10px] font-semibold uppercase tracking-wider cursor-pointer focus:outline-none transition-colors
              ${filter === f
                ? 'text-indigo border-b-2 border-indigo bg-indigo/5'
                : 'text-text-3 hover:text-text-2 border-b-2 border-transparent'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">

        {/* Empty state */}
        {filteredNodes.length === 0 && (!showAvailable || availableRoadmaps.length === 0) && (
          <div className="flex flex-col items-center justify-center h-32 text-text-3 text-xs text-center px-4 gap-1">
            <span>No nodes yet.</span>
            <span style={{ fontSize: 10 }}>Right-click canvas or use Add Node.</span>
          </div>
        )}

        {/* ── Graph nodes ─────────────────────────────────── */}
        {filteredNodes.map((node) => {
          const placed = node.positionX != null && node.positionY != null;
          return (
            <div
              key={node.id}
              className="group flex items-center gap-1 px-2 border-b border-border hover:bg-bg-2"
              style={{ minHeight: 44 }}
            >
              <div
                draggable
                onDragStart={(e) => handleNodeDrag(e, node.id)}
                role="button"
                tabIndex={0}
                aria-label="Drag to place on canvas"
                onKeyDown={() => {}}
                className="flex-shrink-0 text-text-3 cursor-grab select-none w-5 flex items-center justify-center"
              >
                ⠿
              </div>

              <NodeBadge type={node.type} />

              <span className="flex-1 text-sm text-text-1 truncate min-w-0">
                {node.title}
              </span>

              <span
                className={`flex-shrink-0 rounded-full font-mono ${
                  placed
                    ? 'text-indigo bg-indigo-lt'
                    : 'text-text-3 bg-bg-2 border border-border'
                }`}
                style={{ fontSize: 9, padding: '1px 5px' }}
              >
                {placed ? 'on canvas' : 'off'}
              </span>

              <button
                onClick={() => onEditNode(node.id)}
                className="flex-shrink-0 text-[10px] font-semibold text-text-3 hover:text-indigo px-1 py-0.5 rounded cursor-pointer focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteNode(node.id)}
                className="flex-shrink-0 text-[10px] font-semibold text-red-400 hover:text-red-600 px-1 py-0.5 rounded cursor-pointer focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Del
              </button>
            </div>
          );
        })}

        {/* ── Available roadmaps ──────────────────────────── */}
        {showAvailable && availableRoadmaps.length > 0 && (
          <>
            <div
              className="flex items-center px-3 border-b border-border bg-bg-2 text-text-3 font-semibold uppercase"
              style={{ height: 20, fontSize: 9, letterSpacing: '0.06em' }}
            >
              Available roadmaps
            </div>
            {availableRoadmaps.map((roadmap) => (
              <div
                key={roadmap.id}
                className="group flex items-center gap-1 px-2 border-b border-border hover:bg-bg-2"
                style={{ minHeight: 40 }}
              >
                <div
                  draggable
                  onDragStart={(e) => handleRoadmapDrag(e, roadmap)}
                  role="button"
                  tabIndex={0}
                  aria-label="Drag to place on canvas"
                  onKeyDown={() => {}}
                  className="flex-shrink-0 text-text-3 cursor-grab select-none w-5 flex items-center justify-center"
                >
                  ⠿
                </div>

                <NodeBadge type="ROADMAP" />

                <span className="flex-1 text-sm text-text-2 truncate min-w-0">
                  {roadmap.title}
                </span>

                {/* "Add" = adds as unplaced node (then Edit/Del appear like any node) */}
                <button
                  onClick={() => onAddRoadmapLink(roadmap)}
                  className="flex-shrink-0 text-[10px] font-semibold text-text-3 hover:text-indigo px-1 py-0.5 rounded cursor-pointer focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Add
                </button>
                {/* Dismiss from palette (doesn't delete the roadmap) */}
                <button
                  onClick={() => dismiss(roadmap.id)}
                  className="flex-shrink-0 text-[10px] text-text-3 hover:text-red-500 px-1 py-0.5 rounded cursor-pointer focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
