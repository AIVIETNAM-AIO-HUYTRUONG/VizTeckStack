import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminGraphEditor } from './useGraphEditor';

vi.mock('@vizteck/core', () => ({
  loadGraph: vi.fn(),
  saveGraph: vi.fn(),
  makeSnapshot: vi.fn((nodes: unknown[], edges: unknown[]) =>
    JSON.stringify({ nodes, edges }),
  ),
  updateRoadmap: vi.fn(),
  useGraphEditor: vi.fn(),
}));

vi.mock('@/lib/apolloClient', () => ({
  adminApolloClient: { query: vi.fn(), mutate: vi.fn() },
}));

import { useGraphEditor } from '@vizteck/core';
const mockUseGraphEditor = vi.mocked(useGraphEditor);

const mockReturn = {
  loading: false,
  saving: false,
  saveError: '',
  dirty: false,
  roadmapTitle: 'Test Roadmap',
  roadmapStatus: 'DRAFT',
  editorNodes: [],
  editorEdges: [],
  allRoadmaps: [],
  setEditorNodes: vi.fn(),
  setEditorEdges: vi.fn(),
  handleSave: vi.fn(),
  handleChangeStatus: vi.fn(),
};

describe('useAdminGraphEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGraphEditor.mockReturnValue(mockReturn);
  });

  it('delegates to useGraphEditor with adminApolloClient', () => {
    renderHook(() => useAdminGraphEditor('id-1', 'test-slug'));
    expect(mockUseGraphEditor).toHaveBeenCalledOnce();
    const [, , id, slug] = mockUseGraphEditor.mock.calls[0];
    expect(id).toBe('id-1');
    expect(slug).toBe('test-slug');
  });

  it('passes null slug through', () => {
    renderHook(() => useAdminGraphEditor('id-1', null));
    const [, , , slug] = mockUseGraphEditor.mock.calls[0];
    expect(slug).toBeNull();
  });

  it('returns the hook result', () => {
    const { result } = renderHook(() => useAdminGraphEditor('id-1', 'test-slug'));
    expect(result.current.roadmapTitle).toBe('Test Roadmap');
    expect(result.current.loading).toBe(false);
  });
});
