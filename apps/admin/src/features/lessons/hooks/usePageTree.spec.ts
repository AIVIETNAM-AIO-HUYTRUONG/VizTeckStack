/// <reference types="vitest/globals" />
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminPageTree } from './usePageTree';
import type { PageTree } from '@vizteck/core';

vi.mock('@/lib/apolloClient', () => ({ adminApolloClient: {} }));

const mockFetchTree = vi.fn();

vi.mock('@vizteck/core', () => ({
  usePageTree: (_client: unknown, nodeId: string) => {
    const { useState, useEffect } = require('react');
    const [tree, setTree] = useState(null);
    useEffect(() => {
      let cancelled = false;
      mockFetchTree(nodeId)
        .then((t: PageTree | null) => { if (!cancelled) setTree(t); })
        .catch(() => { if (!cancelled) setTree(null); });
      return () => { cancelled = true; };
    }, [nodeId]);
    return tree;
  },
}));

const sampleTree: PageTree = {
  rootSlug: 'frontend',
  rootTitle: 'Frontend',
  nodes: [
    { id: 'n1', title: 'Intro', type: 'LESSON', roadmapSlug: 'frontend', roadmapId: 'r1' },
  ],
};

beforeEach(() => vi.clearAllMocks());

it('returns null initially then resolves to tree', async () => {
  mockFetchTree.mockResolvedValue(sampleTree);
  const { result } = renderHook(() => useAdminPageTree('n1'));
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).toEqual(sampleTree));
  expect(mockFetchTree).toHaveBeenCalledWith('n1');
});

it('returns null when fetchRoadmapTree returns null', async () => {
  mockFetchTree.mockResolvedValue(null);
  const { result } = renderHook(() => useAdminPageTree('n1'));
  await waitFor(() => expect(mockFetchTree).toHaveBeenCalledTimes(1));
  expect(result.current).toBeNull();
});

it('returns null when fetchRoadmapTree throws', async () => {
  mockFetchTree.mockRejectedValue(new Error('network'));
  const { result } = renderHook(() => useAdminPageTree('n1'));
  await waitFor(() => expect(mockFetchTree).toHaveBeenCalledTimes(1));
  expect(result.current).toBeNull();
});
