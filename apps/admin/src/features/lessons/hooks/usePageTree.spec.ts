/// <reference types="vitest/globals" />
import { renderHook, waitFor } from '@testing-library/react';
import { usePageTree } from './usePageTree';
import * as lessonService from '../services/lesson.service';
import type { PageTree } from '@vizteck/lesson';

vi.mock('../services/lesson.service');

const mockFetchTree = vi.mocked(lessonService.fetchRoadmapTree);

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
  const { result } = renderHook(() => usePageTree('n1'));
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).toEqual(sampleTree));
  expect(mockFetchTree).toHaveBeenCalledWith('n1');
});

it('returns null when fetchRoadmapTree returns null', async () => {
  mockFetchTree.mockResolvedValue(null);
  const { result } = renderHook(() => usePageTree('n1'));
  await waitFor(() => expect(mockFetchTree).toHaveBeenCalledTimes(1));
  expect(result.current).toBeNull();
});

it('returns null when fetchRoadmapTree throws', async () => {
  mockFetchTree.mockRejectedValue(new Error('network'));
  const { result } = renderHook(() => usePageTree('n1'));
  await waitFor(() => expect(mockFetchTree).toHaveBeenCalledTimes(1));
  expect(result.current).toBeNull();
});
