import { useState, useEffect } from 'react';
import type { PageTree } from '@vizteck/lesson';
import { fetchRoadmapTree } from '../services/lesson.service';

export function usePageTree(nodeId: string): PageTree | null {
  const [tree, setTree] = useState<PageTree | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRoadmapTree(nodeId)
      .then((t) => { if (!cancelled) setTree(t); })
      .catch(() => { if (!cancelled) setTree(null); });
    return () => { cancelled = true; };
  }, [nodeId]);

  return tree;
}
