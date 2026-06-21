'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useEffect, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { Button } from '@vizteck/ui';

// ---------------------------------------------------------------------------
// Helper — safely parse stored BlockNote JSON into a blocks array.
// Returns undefined for empty/invalid JSON so the editor starts fresh.
// ---------------------------------------------------------------------------
function tryParseBlocks(json: string): unknown[] | undefined {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as unknown[];
    }
  } catch {
    // Invalid JSON — return undefined
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Save status type
// ---------------------------------------------------------------------------
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ---------------------------------------------------------------------------
// LessonEditor props
// ---------------------------------------------------------------------------
interface LessonEditorProps {
  /** BlockNote JSON string (stored content, may be empty or malformed). */
  initialContentJson: string;
  /** Called with the serialized JSON string on save. Must reject on failure. */
  onSave: (contentJson: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// LessonEditor — editable BlockNote wrapper with dark-mode detection
// ---------------------------------------------------------------------------
export function LessonEditor({ initialContentJson, onSave }: LessonEditorProps) {
  const blocks = tryParseBlocks(initialContentJson);

  // useCreateBlockNote must be called unconditionally (React hook rules)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote(blocks ? { initialContent: blocks as any } : {});

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveTimerRef] = useState<{ id: ReturnType<typeof setTimeout> | null }>({ id: null });

  // Dark-mode detection: watch document.documentElement.classList via MutationObserver
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Cleanup saved-flash timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.id !== null) clearTimeout(saveTimerRef.id);
    };
  }, [saveTimerRef]);

  // ---- Save handler -------------------------------------------------------

  async function handleSave() {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');

    try {
      await onSave(JSON.stringify(editor.document));
      setSaveStatus('saved');
      // Revert label to "Save Lesson" after 2 seconds
      if (saveTimerRef.id !== null) clearTimeout(saveTimerRef.id);
      saveTimerRef.id = setTimeout(() => {
        setSaveStatus('idle');
        saveTimerRef.id = null;
      }, 2000);
    } catch {
      setSaveStatus('error');
    }
  }

  // ---- Derive button label and disabled state -----------------------------

  const buttonLabel =
    saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save Lesson';
  const buttonDisabled = saveStatus === 'saving';

  // ---- Render -------------------------------------------------------------

  return (
    <div>
      {/* Toolbar row — Save Lesson button right-aligned */}
      <div className="flex justify-end mb-2">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={buttonDisabled}
          style={buttonDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
        >
          {buttonLabel}
        </Button>
      </div>

      {/* Error banner */}
      {saveStatus === 'error' && (
        <div
          className="mb-2 px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm"
        >
          Failed to save. Please try again.
        </div>
      )}

      {/* BlockNote editor */}
      <div
        className="bg-bg-1 border border-border rounded-md px-6 py-4"
        style={{ minHeight: 400 }}
      >
        <BlockNoteView editor={editor} editable={true} theme={theme} />
      </div>
    </div>
  );
}
