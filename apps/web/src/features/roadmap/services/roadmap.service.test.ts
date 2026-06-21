import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('fetch', vi.fn());
const mockFetch = vi.mocked(fetch);

import { fetchRoadmaps, fetchRoadmap } from './roadmap.service';

const BASE = 'http://localhost:3000';

function mockOk(data: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
}

describe('fetchRoadmaps', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the correct endpoint', async () => {
    mockOk({ roadmaps: [] });
    await fetchRoadmaps();
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/roadmaps`, { cache: 'no-store' });
  });

  it('filters out non-PUBLIC roadmaps', async () => {
    mockOk({
      roadmaps: [
        { id: '1', slug: 'a', title: 'A', status: 'PUBLIC' },
        { id: '2', slug: 'b', title: 'B', status: 'DRAFT' },
        { id: '3', slug: 'c', title: 'C', status: 'PRIVATE' },
      ],
    });
    const result = await fetchRoadmaps();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('a');
  });

  it('accepts bare array response shape', async () => {
    mockOk([
      { id: '1', slug: 'a', title: 'A', status: 'PUBLIC' },
    ]);
    const result = await fetchRoadmaps();
    expect(result).toHaveLength(1);
  });

  it('returns empty array when roadmaps list is missing', async () => {
    mockOk({});
    const result = await fetchRoadmaps();
    expect(result).toEqual([]);
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(fetchRoadmaps()).rejects.toThrow('fetchRoadmaps: 500');
  });
});

describe('fetchRoadmap', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the correct endpoint for the given slug', async () => {
    mockOk({ roadmap: { id: 'r1', slug: 'my-road', title: 'T', status: 'PUBLIC' }, nodes: [], edges: [] });
    await fetchRoadmap('my-road');
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/roadmaps/my-road`, { cache: 'no-store' });
  });

  it('normalizes numeric node types from proto wire format', async () => {
    mockOk({
      roadmap: { id: 'r1', slug: 's', title: 'T', status: 'PUBLIC' },
      nodes: [
        { id: 'n1', type: 0, title: 'R', roadmapId: 'r1', positionX: 0, positionY: 0 },
        { id: 'n2', type: 1, title: 'L', roadmapId: 'r1', positionX: 10, positionY: 10 },
      ],
      edges: [],
    });
    const result = await fetchRoadmap('s');
    expect(result.nodes[0].type).toBe('ROADMAP');
    expect(result.nodes[1].type).toBe('LESSON');
  });

  it('returns empty nodes and edges when absent from response', async () => {
    mockOk({ roadmap: { id: 'r1', slug: 's', title: 'T', status: 'PUBLIC' } });
    const result = await fetchRoadmap('s');
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(fetchRoadmap('missing')).rejects.toThrow('fetchRoadmap(missing): 404');
  });
});
