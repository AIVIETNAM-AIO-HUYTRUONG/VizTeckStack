'use client';

import React from 'react';
import { Button } from '@vizteck/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { STATUS_CYCLE, STATUS_LABEL, STATUS_CLASS } from '@/features/roadmaps/services/roadmap.service';

interface GraphToolbarProps {
  roadmapTitle: string;
  dirty: boolean;
  saving: boolean;
  roadmapStatus?: string;
  onAddNode: () => void;
  onSave: () => void;
  onBack: () => void;
  onChangeStatus?: (next: string) => void;
}

export function GraphToolbar({
  roadmapTitle,
  dirty,
  saving,
  roadmapStatus,
  onAddNode,
  onSave,
  onBack,
  onChangeStatus,
}: GraphToolbarProps) {
  const saveLabel = saving ? 'Saving…' : 'Save Graph';

  const saveButtonClass = saving
    ? 'px-4 py-2 text-sm font-semibold text-white bg-indigo rounded-sm opacity-60 cursor-not-allowed'
    : dirty
      ? 'px-4 py-2 text-sm font-semibold text-white rounded-sm cursor-pointer bg-[#F59E0B] hover:bg-[#D97706] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-1'
      : 'px-4 py-2 text-sm font-semibold text-white bg-indigo rounded-sm cursor-pointer hover:bg-indigo-mid focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1';

  function handleStatusClick() {
    if (!roadmapStatus || !onChangeStatus) return;
    onChangeStatus(STATUS_CYCLE[roadmapStatus] ?? 'DRAFT');
  }

  return (
    <div className="h-12 bg-bg-1 border-b border-border px-4 flex items-center justify-between flex-shrink-0">
      {/* Left: back + title + status badge */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Roadmaps
        </Button>
        <span className="text-sm font-semibold text-text-1">{roadmapTitle}</span>
        {roadmapStatus && (
          <button
            onClick={handleStatusClick}
            title="Click to cycle status"
            className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full cursor-pointer focus:outline-none transition-colors ${STATUS_CLASS[roadmapStatus] ?? STATUS_CLASS.DRAFT}`}
          >
            {STATUS_LABEL[roadmapStatus] ?? roadmapStatus}
          </button>
        )}
      </div>

      {/* Right: ThemeToggle + Add Node + Save Graph */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="secondary" onClick={onAddNode}>
          Add Node
        </Button>
        <button
          onClick={saving ? undefined : onSave}
          disabled={saving}
          aria-label={dirty && !saving ? 'Save Graph (unsaved changes)' : 'Save Graph'}
          className={saveButtonClass}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
