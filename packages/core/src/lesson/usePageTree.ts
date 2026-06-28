// packages/core/src/lesson/usePageTree.ts
'use client';

import { useState, useEffect } from 'react';
import type { ApolloLike } from '../roadmap/types';
import type { PageTree } from './types';
import { fetchRoadmapTree } from './lesson.service';

export function usePageTree(client: ApolloLike, nodeId: string): PageTree | null {
  const [tree, setTree] = useState<PageTree | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRoadmapTree(client, nodeId)
      .then((t) => { if (!cancelled) setTree(t); })
      .catch(() => { if (!cancelled) setTree(null); });
    return () => { cancelled = true; };
  }, [client, nodeId]);

  return tree;
}
