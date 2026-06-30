'use client';

import { useEffect, type MutableRefObject } from 'react';
import type { EditorNode, EditorEdge } from '../types';

export function useGraphDraft(
  id: string,
  nodes: EditorNode[],
  edges: EditorEdge[],
  dirty: boolean,
  loading: boolean,
  savedSnapshotRef: MutableRefObject<string>,
) {
  useEffect(() => {
    if (loading) return;
    if (dirty) {
      sessionStorage.setItem(
        `graph-draft-${id}`,
        JSON.stringify({ nodes, edges, baseSnapshot: savedSnapshotRef.current }),
      );
    } else {
      sessionStorage.removeItem(`graph-draft-${id}`);
    }
  }, [nodes, edges, loading, dirty, id, savedSnapshotRef]);
}
