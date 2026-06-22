"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { parseBlocks } from "./utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface LessonEditorProps {
  initialContentJson: string;
  onSave: (contentJson: string) => Promise<void>;
}

export function LessonEditor({ initialContentJson, onSave }: LessonEditorProps) {
  const blocks = parseBlocks(initialContentJson);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote(blocks ? { initialContent: blocks as any } : {});

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; });

  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const executeSave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus("saving");
    try {
      await onSaveRef.current(JSON.stringify(editor.document));
      isSavingRef.current = false;
      setSaveStatus("saved");
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
        idleTimerRef.current = null;
      }, 2000);
    } catch {
      isSavingRef.current = false;
      setSaveStatus("error");
    }
  }, [editor]);

  const handleChange = useCallback(() => {
    if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void executeSave();
    }, 2000);
  }, [executeSave]);

  return (
    <div>
      <div className="flex justify-end mb-2 min-h-[28px] items-center">
        {saveStatus === "saving" && (
          <span className="text-xs text-text-3">Saving…</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-text-3">Saved</span>
        )}
        {saveStatus === "error" && (
          <button
            type="button"
            onClick={() => void executeSave()}
            className="text-xs text-red-500 hover:underline cursor-pointer"
          >
            Failed to save — click to retry
          </button>
        )}
      </div>

      <div
        className="bg-bg-1 border border-border rounded-md px-6 py-4"
        style={{ minHeight: 400 }}
      >
        <BlockNoteView editor={editor} editable={true} theme={theme} onChange={handleChange} />
      </div>
    </div>
  );
}
