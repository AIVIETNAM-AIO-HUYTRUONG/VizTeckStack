'use client';

import React from 'react';
import { Button, cn } from '@vizteck/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { STATUS_CYCLE, STATUS_LABEL, STATUS_CLASS } from '@vizteck/core';

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

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  function handleStatusClick() {
    if (!roadmapStatus || !onChangeStatus) return;
    onChangeStatus(STATUS_CYCLE[roadmapStatus] ?? 'DRAFT');
  }

  return (
    <div className="h-14 bg-bg-1 border-b border-border px-4 flex items-center justify-between flex-shrink-0">
      {/* Left: back + title + status badge */}
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex-shrink-0 gap-1.5">
          <BackIcon />
          <span className="hidden sm:inline">Roadmaps</span>
        </Button>

        <span className="text-border select-none hidden sm:inline">·</span>

        <span className="text-sm font-medium text-text-1 truncate min-w-0">{roadmapTitle}</span>

        {roadmapStatus && (
          <button
            onClick={handleStatusClick}
            title="Click to cycle status"
            className={cn(
              'flex-shrink-0 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full',
              'cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1',
              'transition-colors motion-reduce:transition-none',
              STATUS_CLASS[roadmapStatus] ?? STATUS_CLASS.DRAFT,
            )}
          >
            {STATUS_LABEL[roadmapStatus] ?? roadmapStatus}
          </button>
        )}
      </div>

      {/* Right: ThemeToggle + Add Node + Save Graph */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ThemeToggle />
        <Button variant="secondary" size="sm" onClick={onAddNode}>
          Add Node
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={saving ? undefined : onSave}
          isLoading={saving}
          disabled={saving}
          aria-label={dirty && !saving ? 'Save Graph (unsaved changes)' : 'Save Graph'}
          className={cn(dirty && !saving && 'bg-warning border-warning hover:bg-warning/90 focus:ring-warning')}
        >
          {saving ? 'Saving…' : 'Save Graph'}
        </Button>
      </div>
    </div>
  );
}
