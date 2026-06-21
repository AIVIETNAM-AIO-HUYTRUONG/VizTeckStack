import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGraphEditor } from './useGraphEditor';

vi.mock('../services/graph.service', () => ({
  loadGraph: vi.fn(),
  saveGraph: vi.fn(),
  makeSnapshot: vi.fn((nodes: unknown[], edges: unknown[]) =>
    JSON.stringify({ nodes, edges }),
  ),
}));

vi.mock('@/features/roadmaps/services/roadmap.service', () => ({
  updateRoadmap: vi.fn(),
}));

import { loadGraph, saveGraph } from '../services/graph.service';
const mockLoadGraph = vi.mocked(loadGraph);
const mockSaveGraph = vi.mocked(saveGraph);

const mockGraphData = {
  roadmapTitle: 'Test Roadmap',
  roadmapStatus: 'DRAFT',
  nodes: [],
  edges: [],
  allRoadmaps: [],
  savedSnapshot: '{"nodes":[],"edges":[]}',
};

describe('useGraphEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadGraph.mockResolvedValue(mockGraphData);
    mockSaveGraph.mockResolvedValue(undefined);
  });

  it('starts with loading=true', () => {
    const { result } = renderHook(() => useGraphEditor('id-1', 'test-slug'));
    expect(result.current.loading).toBe(true);
  });

  it('sets loading=false and populates title after load', async () => {
    const { result } = renderHook(() => useGraphEditor('id-1', 'test-slug'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.roadmapTitle).toBe('Test Roadmap');
    expect(result.current.roadmapStatus).toBe('DRAFT');
  });

  it('does not load when slug is null', async () => {
    renderHook(() => useGraphEditor('id-1', null));
    await act(async () => {});
    expect(mockLoadGraph).not.toHaveBeenCalled();
  });

  it('sets saveError when saveGraph throws', async () => {
    mockSaveGraph.mockRejectedValue(new Error('Save failed: 500'));
    const { result } = renderHook(() => useGraphEditor('id-1', 'test-slug'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });
    expect(result.current.saveError).toContain('Save failed');
  });

  it('clears saveError on successful save', async () => {
    mockSaveGraph.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGraphEditor('id-1', 'test-slug'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });
    expect(result.current.saveError).toBe('');
  });
});
