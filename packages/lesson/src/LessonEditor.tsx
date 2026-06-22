"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { Button } from "@vizteck/ui";
import { parseBlocks } from "./utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface LessonEditorProps {
  initialContentJson: string;
  onSave: (contentJson: string) => Promise<void>;
}

export function LessonEditor({
  initialContentJson,
  onSave,
}: LessonEditorProps) {
  const blocks = parseBlocks(initialContentJson);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote(
    blocks ? { initialContent: blocks as any } : {},
  );

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveTimerRef] = useState<{ id: ReturnType<typeof setTimeout> | null }>(
    { id: null },
  );

  useEffect(() => {
    const update = () =>
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      );
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.id !== null) clearTimeout(saveTimerRef.id);
    };
  }, [saveTimerRef]);

  async function handleSave() {
    if (saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      await onSave(JSON.stringify(editor.document));
      setSaveStatus("saved");
      if (saveTimerRef.id !== null) clearTimeout(saveTimerRef.id);
      saveTimerRef.id = setTimeout(() => {
        setSaveStatus("idle");
        saveTimerRef.id = null;
      }, 2000);
    } catch {
      setSaveStatus("error");
    }
  }

  const buttonLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : "Save Lesson";
  const buttonDisabled = saveStatus === "saving";

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={buttonDisabled}
          style={
            buttonDisabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined
          }
        >
          {buttonLabel}
        </Button>
      </div>

      {saveStatus === "error" && (
        <div className="mb-2 px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm">
          Failed to save. Please try again.
        </div>
      )}

      <div
        className="bg-bg-1 border border-border rounded-md px-6 py-4"
        style={{ minHeight: 400 }}
      >
        <BlockNoteView editor={editor} editable={true} theme={theme} />
      </div>
    </div>
  );
}
