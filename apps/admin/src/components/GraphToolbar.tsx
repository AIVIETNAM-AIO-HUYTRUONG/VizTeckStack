'use client';

import React from 'react';
import { Button } from '@vizteck/ui';

interface GraphToolbarProps {
  roadmapTitle: string;
  dirty: boolean;
  saving: boolean;
  onAddNode: () => void;
  onSave: () => void;
  onBack: () => void;
}

export function GraphToolbar({
  roadmapTitle,
  dirty,
  saving,
  onAddNode,
  onSave,
  onBack,
}: GraphToolbarProps) {
  const saveLabel = saving ? 'Saving…' : 'Save Graph';

  const saveButtonClass = saving
    ? 'px-4 py-2 text-sm font-semibold text-white bg-indigo rounded-sm opacity-60 cursor-not-allowed'
    : dirty
      ? 'px-4 py-2 text-sm font-semibold text-white rounded-sm cursor-pointer bg-[#F59E0B] hover:bg-[#D97706] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-1'
      : 'px-4 py-2 text-sm font-semibold text-white bg-indigo rounded-sm cursor-pointer hover:bg-indigo-mid focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1';

  return (
    <div className="h-12 bg-bg-1 border-b border-border px-4 flex items-center justify-between flex-shrink-0">
      {/* Left: back + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Roadmaps
        </Button>
        <span className="text-sm font-semibold text-text-1">{roadmapTitle}</span>
      </div>

      {/* Right: Add Node + Save Graph */}
      <div className="flex items-center gap-2">
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
