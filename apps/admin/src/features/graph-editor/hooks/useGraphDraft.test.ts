import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGraphDraft } from './useGraphDraft';
import type { EditorNode, EditorEdge } from '../services/graph.service';

const NODES: EditorNode[] = [
  { id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Node 1', positionX: 10, positionY: 20 },
];
const EDGES: EditorEdge[] = [{ id: 'e1', sourceId: 'n1', targetId: 'n2' }];
const KEY = 'graph-draft-rm-1';

describe('useGraphDraft', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('does nothing while loading=true', () => {
    renderHook(() => useGraphDraft('rm-1', NODES, EDGES, true, true));
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('does nothing while loading=true even if dirty', () => {
    renderHook(() => useGraphDraft('rm-1', NODES, EDGES, true, true));
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('writes draft to sessionStorage when dirty=true and not loading', () => {
    renderHook(() => useGraphDraft('rm-1', NODES, EDGES, true, false));
    const stored = sessionStorage.getItem(KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual({ nodes: NODES, edges: EDGES });
  });

  it('removes draft from sessionStorage when dirty=false and not loading', () => {
    sessionStorage.setItem(KEY, 'stale-data');
    renderHook(() => useGraphDraft('rm-1', NODES, EDGES, false, false));
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('scopes key to the roadmap id', () => {
    renderHook(() => useGraphDraft('roadmap-abc', NODES, EDGES, true, false));
    expect(sessionStorage.getItem('graph-draft-roadmap-abc')).not.toBeNull();
    expect(sessionStorage.getItem('graph-draft-rm-1')).toBeNull();
  });
});
