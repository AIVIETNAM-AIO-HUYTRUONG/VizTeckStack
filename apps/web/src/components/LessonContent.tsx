'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

interface LessonContentProps {
  contentJson: string;
}

function parseBlocks(json: string): unknown[] | undefined {
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

export function LessonContent({ contentJson }: LessonContentProps) {
  const blocks = parseBlocks(contentJson);

  // useCreateBlockNote must be called unconditionally (React hook rules)
  // Pass initialContent only when blocks are valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote(blocks ? { initialContent: blocks as any } : {});

  if (!blocks) {
    return (
      <div
        style={{
          color: 'var(--text-3)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          padding: '24px 0',
        }}
      >
        No content available.
      </div>
    );
  }

  return <BlockNoteView editor={editor} editable={false} theme="light" />;
}
