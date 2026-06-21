'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useEffect, useState } from 'react';
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote(blocks ? { initialContent: blocks as any } : {});

  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  if (!blocks) {
    return (
      <div className="text-text-3 text-sm py-6">
        No content available.
      </div>
    );
  }

  return <BlockNoteView editor={editor} editable={false} theme={theme ?? 'light'} />;
}
