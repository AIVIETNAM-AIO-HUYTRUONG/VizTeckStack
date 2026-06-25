import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('fetch', vi.fn());
const mockFetch = vi.mocked(fetch);

import { normalizeNodeType, fetchNode, fetchBreadcrumb } from './node.service';

const BASE = 'http://localhost:3000';

function mockOk(data: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
}

describe('normalizeNodeType', () => {
  it('maps numeric 0 to ROADMAP', () => {
    expect(normalizeNodeType(0)).toBe('ROADMAP');
  });

  it('maps numeric 1 to LESSON', () => {
    expect(normalizeNodeType(1)).toBe('LESSON');
  });

  it('passes through string ROADMAP', () => {
    expect(normalizeNodeType('ROADMAP')).toBe('ROADMAP');
  });

  it('passes through string LESSON', () => {
    expect(normalizeNodeType('LESSON')).toBe('LESSON');
  });

  it('falls back to LESSON for unknown values', () => {
    expect(normalizeNodeType(null)).toBe('LESSON');
    expect(normalizeNodeType('UNKNOWN')).toBe('LESSON');
  });
});

describe('fetchNode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the correct API endpoint', async () => {
    mockOk({ node: { id: 'n1', type: 'LESSON', title: 'T', roadmapId: 'r1', positionX: 0, positionY: 0 } });
    await fetchNode('n1');
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/nodes/n1`, { cache: 'no-store' });
  });

  it('unwraps { node: {...} } response shape', async () => {
    mockOk({ node: { id: 'n1', type: 'LESSON', title: 'Intro', roadmapId: 'r1', positionX: 0, positionY: 0 } });
    const result = await fetchNode('n1');
    expect(result.id).toBe('n1');
    expect(result.type).toBe('LESSON');
  });

  it('accepts flat response shape (no .node wrapper)', async () => {
    mockOk({ id: 'n2', type: 0, title: 'R', roadmapId: 'r1', positionX: 0, positionY: 0 });
    const result = await fetchNode('n2');
    expect(result.id).toBe('n2');
    expect(result.type).toBe('ROADMAP');
  });

  it('normalizes numeric type from wire format', async () => {
    mockOk({ node: { id: 'n3', type: 0, title: 'R', roadmapId: 'r1', positionX: 0, positionY: 0 } });
    const result = await fetchNode('n3');
    expect(result.type).toBe('ROADMAP');
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(fetchNode('missing')).rejects.toThrow('fetchNode(missing): 404');
  });
});

describe('fetchBreadcrumb', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the correct API endpoint and returns breadcrumb items', async () => {
    const items = [
      { title: 'Frontend', slug: 'frontend', nodeId: null },
      { title: 'Box Model', slug: null, nodeId: 'n1' },
    ];
    mockOk(items);
    const result = await fetchBreadcrumb('n1');
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/nodes/n1/breadcrumb`, { cache: 'no-store' });
    expect(result).toEqual(items);
  });

  it('returns empty array on fetch failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    const result = await fetchBreadcrumb('missing');
    expect(result).toEqual([]);
  });

  it('returns empty array on non-array response', async () => {
    mockOk(null);
    const result = await fetchBreadcrumb('n1');
    expect(result).toEqual([]);
  });
});
