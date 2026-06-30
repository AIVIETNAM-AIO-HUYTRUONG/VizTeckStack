import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNodeActions } from './useNodeActions';
import type { UseNodeActionsParams } from './useNodeActions';
import type { EditorNode, EditorEdge } from '@vizteck/core';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@vizteck/graph', () => ({
  applyEdgeChanges: vi.fn(
    (changes: { type: string; id: string }[], edges: { id: string }[]) => {
      const removed = new Set(
        changes.filter((c) => c.type === 'remove').map((c) => c.id),
      );
      return edges.filter((e) => !removed.has(e.id));
    },
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParams(overrides: Partial<UseNodeActionsParams> = {}): UseNodeActionsParams {
  return {
    id: 'roadmap-1',
    slug: 'my-roadmap',
    setEditorNodes: vi.fn(),
    setEditorEdges: vi.fn(),
    setPanel: vi.fn(),
    confirmNavigation: vi.fn().mockReturnValue(true),
    setPendingNavUrl: vi.fn(),
    ...overrides,
  };
}

function captureUpdater<T>(setter: ReturnType<typeof vi.fn>): (prev: T) => T {
  const call = setter.mock.calls[setter.mock.calls.length - 1];
  return call[0] as (prev: T) => T;
}

const NODE_A: EditorNode = {
  id: 'n-a', roadmapId: 'roadmap-1', type: 'LESSON', title: 'Alpha',
  positionX: 100, positionY: 200,
};
const NODE_B: EditorNode = {
  id: 'n-b', roadmapId: 'roadmap-1', type: 'ROADMAP', title: 'Beta',
  positionX: 50, positionY: 60,
};
const EDGE_1: EditorEdge = { id: 'e-1', sourceId: 'n-a', targetId: 'n-b' };
const EDGE_2: EditorEdge = { id: 'e-2', sourceId: 'n-b', targetId: 'n-a' };

// ---------------------------------------------------------------------------

describe('useNodeActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // suppress crypto.randomUUID not available in jsdom
    vi.stubGlobal('crypto', { randomUUID: () => 'generated-uuid' });
  });

  // ── handleNodesChange ──────────────────────────────────────────────────────

  describe('handleNodesChange', () => {
    it('updates node position on position change', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleNodesChange([
          { type: 'position', id: 'n-a', position: { x: 300, y: 400 } },
        ]);
      });

      expect(params.setEditorNodes).toHaveBeenCalledOnce();
      const updater = captureUpdater<EditorNode[]>(params.setEditorNodes as ReturnType<typeof vi.fn>);
      const updated = updater([NODE_A, NODE_B]);
      expect(updated[0]).toMatchObject({ id: 'n-a', positionX: 300, positionY: 400 });
      expect(updated[1]).toBe(NODE_B);
    });

    it('ignores non-position/select changes (e.g. add)', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleNodesChange([{ type: 'add', item: NODE_A } as never]);
      });

      expect(params.setEditorNodes).not.toHaveBeenCalled();
    });

    it('applies select change', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleNodesChange([{ type: 'select', id: 'n-a', selected: true }]);
      });

      const updater = captureUpdater<EditorNode[]>(params.setEditorNodes as ReturnType<typeof vi.fn>);
      const updated = updater([NODE_A]);
      expect(updated[0].selected).toBe(true);
    });
  });

  // ── handleEdgesChange ──────────────────────────────────────────────────────

  describe('handleEdgesChange', () => {
    it('removes an edge when a remove change is applied', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleEdgesChange([{ type: 'remove', id: 'e-1' }]);
      });

      const updater = captureUpdater<EditorEdge[]>(params.setEditorEdges as ReturnType<typeof vi.fn>);
      const updated = updater([EDGE_1, EDGE_2]);
      expect(updated.map((e) => e.id)).toEqual(['e-2']);
    });
  });

  // ── handleConnect ──────────────────────────────────────────────────────────

  describe('handleConnect', () => {
    it('adds a new edge from connection', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleConnect({ source: 'n-a', target: 'n-b', sourceHandle: null, targetHandle: null });
      });

      const updater = captureUpdater<EditorEdge[]>(params.setEditorEdges as ReturnType<typeof vi.fn>);
      const updated = updater([]);
      expect(updated).toHaveLength(1);
      expect(updated[0]).toMatchObject({ sourceId: 'n-a', targetId: 'n-b' });
    });

    it('does nothing when source or target is null', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleConnect({ source: null as never, target: 'n-b', sourceHandle: null, targetHandle: null });
      });

      expect(params.setEditorEdges).not.toHaveBeenCalled();
    });
  });

  // ── handleNodesDelete ──────────────────────────────────────────────────────

  describe('handleNodesDelete', () => {
    it('UNPLACEs node: sets positionX/Y to null, keeps node in list', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleNodesDelete([{ id: 'n-a' }]);
      });

      const updater = captureUpdater<EditorNode[]>(params.setEditorNodes as ReturnType<typeof vi.fn>);
      const updated = updater([NODE_A, NODE_B]);
      expect(updated).toHaveLength(2);
      expect(updated[0]).toMatchObject({ id: 'n-a', positionX: null, positionY: null });
      expect(updated[1]).toBe(NODE_B);
    });
  });

  // ── handlePaneContextMenu ──────────────────────────────────────────────────

  describe('handlePaneContextMenu', () => {
    it('opens side panel in create mode at the dropped position', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handlePaneContextMenu({} as React.MouseEvent, { x: 10, y: 20 });
      });

      expect(params.setPanel).toHaveBeenCalledWith({
        open: true, mode: 'create', flowPosition: { x: 10, y: 20 },
      });
    });
  });

  // ── handleEdgeClick ───────────────────────────────────────────────────────

  describe('handleEdgeClick', () => {
    it('removes the clicked edge', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleEdgeClick('e-1');
      });

      const updater = captureUpdater<EditorEdge[]>(params.setEditorEdges as ReturnType<typeof vi.fn>);
      const updated = updater([EDGE_1, EDGE_2]);
      expect(updated.map((e) => e.id)).toEqual(['e-2']);
    });
  });

  // ── handleDropNode ────────────────────────────────────────────────────────

  describe('handleDropNode', () => {
    it('repositions an existing node', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleDropNode('n-a', { x: 500, y: 600 });
      });

      const updater = captureUpdater<EditorNode[]>(params.setEditorNodes as ReturnType<typeof vi.fn>);
      const updated = updater([NODE_A, NODE_B]);
      expect(updated[0]).toMatchObject({ id: 'n-a', positionX: 500, positionY: 600 });
    });

    it('creates a new ROADMAP node from newRoadmap: payload', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      const payload = `newRoadmap:target-id:target-slug:${encodeURIComponent('My Roadmap')}`;
      act(() => {
        result.current.handleDropNode(payload, { x: 100, y: 200 });
      });

      const updater = captureUpdater<EditorNode[]>(params.setEditorNodes as ReturnType<typeof vi.fn>);
      const updated = updater([NODE_A]);
      expect(updated).toHaveLength(2);
      expect(updated[1]).toMatchObject({
        type: 'ROADMAP',
        title: 'My Roadmap',
        targetRoadmapId: 'target-id',
        targetRoadmapSlug: 'target-slug',
        positionX: 100,
        positionY: 200,
        roadmapId: 'roadmap-1',
      });
    });

    it('decodes URL-encoded title containing colons', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      const title = 'React: From Zero to Hero';
      const payload = `newRoadmap:target-id:target-slug:${encodeURIComponent(title)}`;
      act(() => {
        result.current.handleDropNode(payload, { x: 0, y: 0 });
      });

      const updater = captureUpdater<EditorNode[]>(params.setEditorNodes as ReturnType<typeof vi.fn>);
      const updated = updater([]);
      expect(updated[0].title).toBe('React: From Zero to Hero');
    });

    it('skips duplicate newRoadmap node (same targetRoadmapId)', () => {
      const existingRoadmapNode: EditorNode = {
        id: 'n-existing', roadmapId: 'roadmap-1', type: 'ROADMAP',
        title: 'Already Here', positionX: 0, positionY: 0, targetRoadmapId: 'target-id',
      };
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      const payload = `newRoadmap:target-id:target-slug:${encodeURIComponent('My Roadmap')}`;
      act(() => {
        result.current.handleDropNode(payload, { x: 100, y: 200 });
      });

      const updater = captureUpdater<EditorNode[]>(params.setEditorNodes as ReturnType<typeof vi.fn>);
      const updated = updater([existingRoadmapNode]);
      expect(updated).toHaveLength(1);
    });
  });

  // ── handleNodeClick ───────────────────────────────────────────────────────

  describe('handleNodeClick', () => {
    it('navigates to lesson editor for LESSON node', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleNodeClick({ id: 'n-a', type: 'LESSON' } as never);
      });

      expect(mockPush).toHaveBeenCalledWith('/roadmaps/roadmap-1/nodes/n-a?slug=my-roadmap');
    });

    it('navigates to target roadmap for ROADMAP node with target', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleNodeClick({
          id: 'n-b', type: 'ROADMAP',
          targetRoadmapId: 'target-rm-id',
          targetRoadmapSlug: 'target-slug',
        } as never);
      });

      expect(mockPush).toHaveBeenCalledWith('/roadmaps/target-rm-id?slug=target-slug');
    });

    it('opens edit panel for ROADMAP node without a target', () => {
      const params = makeParams();
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleNodeClick({ id: 'n-b', type: 'ROADMAP' } as never);
      });

      expect(params.setPanel).toHaveBeenCalledWith({ open: true, mode: 'edit', nodeId: 'n-b' });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ── handleBack ────────────────────────────────────────────────────────────

  describe('handleBack', () => {
    it('navigates to /roadmaps when confirmNavigation returns true', () => {
      const params = makeParams({ confirmNavigation: vi.fn().mockReturnValue(true) });
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleBack();
      });

      expect(mockPush).toHaveBeenCalledWith('/roadmaps');
      expect(params.setPendingNavUrl).not.toHaveBeenCalled();
    });

    it('sets pendingNavUrl when confirmNavigation returns false', () => {
      const params = makeParams({ confirmNavigation: vi.fn().mockReturnValue(false) });
      const { result } = renderHook(() => useNodeActions(params));

      act(() => {
        result.current.handleBack();
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(params.setPendingNavUrl).toHaveBeenCalledWith('/roadmaps');
    });
  });
});
