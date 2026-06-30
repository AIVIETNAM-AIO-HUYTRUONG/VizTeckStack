import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useGraphDraft } from './useGraphDraft';
import type { EditorNode, EditorEdge } from '@vizteck/core';

const NODES: EditorNode[] = [
  { id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Node 1', positionX: 10, positionY: 20 },
];
const EDGES: EditorEdge[] = [{ id: 'e1', sourceId: 'n1', targetId: 'n2' }];
const KEY = 'graph-draft-rm-1';

describe('useGraphDraft', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('does nothing while loading=true', () => {
    renderHook(() => useGraphDraft('rm-1', NODES, EDGES, true, true, useRef('')));
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('does nothing while loading=true even if dirty', () => {
    renderHook(() => useGraphDraft('rm-1', NODES, EDGES, true, true, useRef('')));
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('writes draft to sessionStorage when dirty=true and not loading', () => {
    renderHook(() => useGraphDraft('rm-1', NODES, EDGES, true, false, useRef('')));
    const stored = sessionStorage.getItem(KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.nodes).toEqual(NODES);
    expect(parsed.edges).toEqual(EDGES);
    expect('baseSnapshot' in parsed).toBe(true);
  });

  it('removes draft from sessionStorage when dirty=false and not loading', () => {
    sessionStorage.setItem(KEY, 'stale-data');
    renderHook(() => useGraphDraft('rm-1', NODES, EDGES, false, false, useRef('')));
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('scopes key to the roadmap id', () => {
    renderHook(() => useGraphDraft('roadmap-abc', NODES, EDGES, true, false, useRef('')));
    expect(sessionStorage.getItem('graph-draft-roadmap-abc')).not.toBeNull();
    expect(sessionStorage.getItem('graph-draft-rm-1')).toBeNull();
  });
});
