// packages/core/src/lesson/useLessonEditor.ts
'use client';

import { useState, useEffect } from 'react';
import type { ApolloLike } from '../../../roadmap/types';
import { fetchLesson, updateLessonContent, updateLessonTitle } from '../../lesson.service';
import type { LessonNode, SaveStatus, UseLessonEditorResult } from '../../types';

export function useLessonEditor(
  client: ApolloLike,
  nodeId: string,
): UseLessonEditorResult {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lesson, setLesson] = useState<LessonNode | null>(null);
  const [titleSaveStatus, setTitleSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    fetchLesson(client, nodeId)
      .then((l) => { if (!cancelled) setLesson(l); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [client, nodeId]);

  async function handleSaveContent(contentJson: string): Promise<void> {
    await updateLessonContent(client, nodeId, contentJson);
    setLesson((prev) => (prev ? { ...prev, content: contentJson } : prev));
  }

  async function handleSaveTitle(title: string): Promise<void> {
    if (titleSaveStatus === 'saving') return;
    setTitleSaveStatus('saving');
    try {
      await updateLessonTitle(client, nodeId, title);
      setLesson((prev) => (prev ? { ...prev, title } : prev));
      setTitleSaveStatus('saved');
      setTimeout(() => setTitleSaveStatus('idle'), 2000);
    } catch {
      setTitleSaveStatus('error');
    }
  }

  return { loading, notFound, lesson, titleSaveStatus, handleSaveContent, handleSaveTitle };
}
