/// <reference types="vitest/globals" />
import { fetchRoadmapTree } from './tree.service';
import type { PageTree } from '@vizteck/lesson';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockOk = (data: unknown) =>
  mockFetch.mockResolvedValue({ ok: true, json: async () => data } as Response);

beforeEach(() => vi.clearAllMocks());

const sampleTree: PageTree = {
  rootSlug: 'frontend',
  rootTitle: 'Frontend',
  nodes: [
    { id: 'n1', title: 'Intro', type: 'LESSON', roadmapSlug: 'frontend', roadmapId: 'r1' },
  ],
};

it('returns tree on successful fetch', async () => {
  mockOk(sampleTree);
  const result = await fetchRoadmapTree('frontend');
  expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/roadmaps/frontend/tree`, { cache: 'no-store' });
  expect(result).toEqual(sampleTree);
});

it('returns null on non-ok response', async () => {
  mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
  const result = await fetchRoadmapTree('nonexistent');
  expect(result).toBeNull();
});

it('returns null when response lacks rootSlug', async () => {
  mockOk({ rootTitle: 'X', nodes: [] });
  const result = await fetchRoadmapTree('frontend');
  expect(result).toBeNull();
});

it('returns null when fetch throws', async () => {
  mockFetch.mockRejectedValue(new Error('network'));
  const result = await fetchRoadmapTree('frontend');
  expect(result).toBeNull();
});
