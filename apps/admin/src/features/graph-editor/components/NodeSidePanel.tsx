'use client';

import React, { useState, useEffect } from 'react';
import { Button, NodeBadge } from '@vizteck/ui';
import type { NodeType } from '@vizteck/ui';
import type { RoadmapEntry } from '../services/graph.service';

interface NodeSidePanelProps {
  mode: 'create' | 'edit';
  initial?: { title: string; type: NodeType; targetRoadmapId?: string };
  allRoadmaps: RoadmapEntry[];
  onSubmit: (data: {
    title: string;
    type: NodeType;
    targetRoadmapId?: string;
    targetRoadmapSlug?: string;
  }) => void;
  onClose: () => void;
}

export function NodeSidePanel({ mode, initial, allRoadmaps, onSubmit, onClose }: NodeSidePanelProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<NodeType>(initial?.type ?? 'ROADMAP');
  const [targetRoadmapId, setTargetRoadmapId] = useState(initial?.targetRoadmapId ?? '');

  // Sync when initial changes (switching from create to edit)
  useEffect(() => {
    setTitle(initial?.title ?? '');
    setType(initial?.type ?? 'ROADMAP');
    setTargetRoadmapId(initial?.targetRoadmapId ?? '');
  }, [initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const selectedRoadmap = allRoadmaps.find((r) => r.id === targetRoadmapId);
    onSubmit({
      title: title.trim(),
      type,
      targetRoadmapId: type === 'ROADMAP' ? targetRoadmapId || undefined : undefined,
      targetRoadmapSlug: type === 'ROADMAP' ? selectedRoadmap?.slug : undefined,
    });
  }

  const headingText = mode === 'create' ? 'Create Node' : 'Edit Node';
  const submitLabel = mode === 'create' ? 'Create Node' : 'Save Changes';

  return (
    <>
      <div className="absolute inset-0 z-10" onClick={onClose} aria-hidden="true" />
      <div
        className="absolute top-0 right-0 bottom-0 z-20 bg-bg-1 border-l border-border flex flex-col"
        style={{ width: 320, transform: 'translateX(0)', transition: 'transform 200ms ease-out' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span className="text-sm font-semibold text-text-1">{headingText}</span>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-text-3 hover:text-text-1 text-lg leading-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1 rounded"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="node-title" className="text-sm font-semibold text-text-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="node-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Node title"
                className="w-full px-3 py-2 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="node-type" className="text-sm font-semibold text-text-1">
                Type
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="node-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as NodeType)}
                  className="flex-1 px-3 py-2 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo"
                >
                  <option value="ROADMAP">ROADMAP</option>
                  <option value="LESSON">LESSON</option>
                </select>
                <NodeBadge type={type} />
              </div>
            </div>

            {type === 'ROADMAP' && (
              <div className="flex flex-col gap-1">
                <label htmlFor="node-target-roadmap" className="text-sm font-semibold text-text-1">
                  Links to roadmap
                </label>
                <select
                  id="node-target-roadmap"
                  value={targetRoadmapId}
                  onChange={(e) => setTargetRoadmapId(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo"
                >
                  <option value="">— none —</option>
                  {allRoadmaps.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-3">
                  Clicking this node on the canvas will navigate to the selected roadmap.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border flex-shrink-0">
            <Button variant="ghost" type="button" onClick={onClose}>
              Discard
            </Button>
            <Button variant="primary" type="submit">
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
