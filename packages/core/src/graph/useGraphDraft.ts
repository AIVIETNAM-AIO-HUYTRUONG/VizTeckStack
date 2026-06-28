'use client';

import { useEffect } from 'react';
import type { EditorNode, EditorEdge } from './types';

export function useGraphDraft(
  id: string,
  nodes: EditorNode[],
  edges: EditorEdge[],
  dirty: boolean,
  loading: boolean,
) {
  useEffect(() => {
    if (loading) return;
    if (dirty) {
      sessionStorage.setItem(`graph-draft-${id}`, JSON.stringify({ nodes, edges }));
    } else {
      sessionStorage.removeItem(`graph-draft-${id}`);
    }
  }, [nodes, edges, loading, dirty, id]);
}
