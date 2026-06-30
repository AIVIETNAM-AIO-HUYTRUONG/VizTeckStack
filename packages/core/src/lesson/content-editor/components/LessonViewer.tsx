'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useEffect, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { parseBlocks } from '../../utils/utils';

export interface LessonViewerProps {
  contentJson: string;
}

// React.lazy in LessonPageShell does not prevent SSR in Next.js; BlockNote's
// useCreateBlockNote accesses `window` at hook-call time. Moving BlockNote hooks
// into this inner component and guarding the outer with a mounted flag ensures
// they only run on the client.
function LessonViewerInner({ contentJson }: LessonViewerProps) {
  const blocks = parseBlocks(contentJson);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote(blocks ? { initialContent: blocks as any } : {});

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  if (!blocks) {
    return <div className="text-text-2 text-sm py-6">No content available.</div>;
  }

  return <BlockNoteView editor={editor} editable={false} theme={theme} />;
}

export function LessonViewer({ contentJson }: LessonViewerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;
  return <LessonViewerInner contentJson={contentJson} />;
}
