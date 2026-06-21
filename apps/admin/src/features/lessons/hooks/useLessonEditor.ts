'use client';

import { useState, useEffect } from 'react';
import {
  fetchLesson,
  updateLessonContent,
  updateLessonTitle,
  type LessonNode,
} from '../services/lesson.service';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseLessonEditorResult {
  loading: boolean;
  notFound: boolean;
  lesson: LessonNode | null;
  titleSaveStatus: SaveStatus;
  handleSaveContent: (contentJson: string) => Promise<void>;
  handleSaveTitle: (title: string) => Promise<void>;
}

export function useLessonEditor(nodeId: string): UseLessonEditorResult {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lesson, setLesson] = useState<LessonNode | null>(null);
  const [titleSaveStatus, setTitleSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    fetchLesson(nodeId)
      .then((l) => { if (!cancelled) setLesson(l); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [nodeId]);

  async function handleSaveContent(contentJson: string): Promise<void> {
    await updateLessonContent(nodeId, contentJson);
    setLesson((prev) => (prev ? { ...prev, content: contentJson } : prev));
  }

  async function handleSaveTitle(title: string): Promise<void> {
    if (titleSaveStatus === 'saving') return;
    setTitleSaveStatus('saving');
    try {
      await updateLessonTitle(nodeId, title);
      setLesson((prev) => (prev ? { ...prev, title } : prev));
      setTitleSaveStatus('saved');
      setTimeout(() => setTitleSaveStatus('idle'), 2000);
    } catch {
      setTitleSaveStatus('error');
    }
  }

  return { loading, notFound, lesson, titleSaveStatus, handleSaveContent, handleSaveTitle };
}
