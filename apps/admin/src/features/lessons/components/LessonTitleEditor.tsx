'use client';

import { useState, useEffect, useRef } from 'react';
import type { SaveStatus } from '../hooks/useLessonEditor';

interface LessonTitleEditorProps {
  title: string;
  saveStatus: SaveStatus;
  onSave: (title: string) => Promise<void>;
}

export function LessonTitleEditor({ title, saveStatus, onSave }: LessonTitleEditorProps) {
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(title); }, [title]);

  async function handleBlur() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) return;
    await onSave(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') inputRef.current?.blur();
    if (e.key === 'Escape') {
      setDraft(title);
      inputRef.current?.blur();
    }
  }

  const statusLabel =
    saveStatus === 'saving' ? 'Saving…' :
    saveStatus === 'saved' ? 'Saved' :
    saveStatus === 'error' ? 'Error saving title' :
    null;

  return (
    <div className="mb-6">
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label="Lesson title"
        maxLength={300}
        className="w-full font-display text-2xl font-bold text-text-1 bg-transparent border-none outline-none focus:ring-0 placeholder:text-text-3"
        placeholder="Untitled"
      />
      {statusLabel && (
        <span
          className={`block text-xs mt-1 ${saveStatus === 'error' ? 'text-red-500' : 'text-text-2'}`}
        >
          {statusLabel}
        </span>
      )}
    </div>
  );
}
