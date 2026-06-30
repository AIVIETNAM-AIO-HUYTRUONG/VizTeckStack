// packages/core/src/lesson/useLessonPageShell.ts
'use client';

import { useEffect, useState } from 'react';
import type { ApolloLike } from '../../roadmap/types';
import { updateNodeCover, updateNodeIcon } from '../lesson.service';

export function useLessonPageShell(
  client: ApolloLike,
  nodeId: string,
  initialCover: string | null | undefined,
  initialIcon: string | null | undefined,
) {
  const [cover, setCoverState] = useState<string | null>(initialCover ?? null);
  const [icon, setIconState] = useState<string | null>(initialIcon ?? null);

  useEffect(() => {
    if (initialCover !== undefined) setCoverState(initialCover ?? null);
  }, [initialCover]);

  useEffect(() => {
    if (initialIcon !== undefined) setIconState(initialIcon ?? null);
  }, [initialIcon]);

  const setCover = async (url: string | null) => {
    const prev = cover;
    setCoverState(url);
    try {
      await updateNodeCover(client, nodeId, url);
    } catch {
      setCoverState(prev);
    }
  };

  const setIcon = async (value: string | null) => {
    const prev = icon;
    setIconState(value);
    try {
      await updateNodeIcon(client, nodeId, value);
    } catch {
      setIconState(prev);
    }
  };

  return { cover, icon, setCover, setIcon };
}
