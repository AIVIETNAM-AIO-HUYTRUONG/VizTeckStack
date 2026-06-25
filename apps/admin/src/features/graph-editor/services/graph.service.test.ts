import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeNodeType, makeSnapshot, loadGraph, saveGraph } from './graph.service';
import type { EditorNode, EditorEdge } from './graph.service';

vi.mock('@/lib/apolloClient', () => ({
  adminApolloClient: { query: vi.fn(), mutate: vi.fn() },
}));

import { adminApolloClient } from '@/lib/apolloClient';
const mockQuery = vi.mocked(adminApolloClient.query);
const mockMutate = vi.mocked(adminApolloClient.mutate);

const nodeA: EditorNode = {
  id: 'n1',
  roadmapId: 'r1',
  type: 'LESSON',
  title: 'Intro',
  positionX: 10,
  positionY: 20,
};

const edgeA: EditorEdge = {
  id: 'e1',
  sourceId: 'n1',
  targetId: 'n2',
};

describe('normalizeNodeType', () => {
  it('maps numeric 0 to ROADMAP', () => {
    expect(normalizeNodeType(0)).toBe('ROADMAP');
  });

  it('maps string "ROADMAP" to ROADMAP', () => {
    expect(normalizeNodeType('ROADMAP')).toBe('ROADMAP');
  });

  it('maps numeric 1 to LESSON', () => {
    expect(normalizeNodeType(1)).toBe('LESSON');
  });

  it('maps string "LESSON" to LESSON', () => {
    expect(normalizeNodeType('LESSON')).toBe('LESSON');
  });

  it('maps unknown value to LESSON as fallback', () => {
    expect(normalizeNodeType(null)).toBe('LESSON');
    expect(normalizeNodeType(undefined)).toBe('LESSON');
  });
});

describe('makeSnapshot', () => {
  it('produces stable JSON across identical inputs', () => {
    const snap1 = makeSnapshot([nodeA], [edgeA]);
    const snap2 = makeSnapshot([nodeA], [edgeA]);
    expect(snap1).toBe(snap2);
  });

  it('produces different output when node position changes', () => {
    const snap1 = makeSnapshot([nodeA], []);
    const movedNode = { ...nodeA, positionX: 999 };
    const snap2 = makeSnapshot([movedNode], []);
    expect(snap1).not.toBe(snap2);
  });

  it('omits undefined content as null', () => {
    const snap = makeSnapshot([nodeA], []);
    const parsed = JSON.parse(snap) as { nodes: { content: unknown }[] };
    expect(parsed.nodes[0].content).toBeNull();
  });
});

describe('loadGraph', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns parsed roadmap data', async () => {
    mockQuery
      .mockResolvedValueOnce({
        data: {
          roadmap: {
            roadmap: { id: 'r1', title: 'My Roadmap', slug: 'my-roadmap', status: 'PUBLIC' },
            nodes: [{ id: 'n1', roadmapId: 'r1', type: 0, title: 'Node 1', positionX: 0, positionY: 0 }],
            edges: [],
          },
        },
      } as never)
      .mockResolvedValueOnce({
        data: { roadmaps: [{ id: 'r2', slug: 'other', title: 'Other' }] },
      } as never);

    const data = await loadGraph('my-roadmap', 'r1');
    expect(data.roadmapTitle).toBe('My Roadmap');
    expect(data.roadmapStatus).toBe('PUBLIC');
    expect(data.nodes[0].type).toBe('ROADMAP');
    expect(data.allRoadmaps).toHaveLength(1);
  });

  it('throws when graph fetch fails', async () => {
    mockQuery
      .mockResolvedValueOnce({ data: { roadmap: null } } as never)
      .mockResolvedValueOnce({ data: { roadmaps: [] } } as never);

    await expect(loadGraph('missing', 'r1')).rejects.toThrow('Failed to load graph');
  });
});

describe('saveGraph', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls UpsertGraph mutation with nodes and edges', async () => {
    mockMutate.mockResolvedValue({ errors: undefined } as never);
    await saveGraph('r1', [nodeA], [edgeA]);
    expect(mockMutate).toHaveBeenCalledOnce();
    const call = mockMutate.mock.calls[0][0] as unknown as { variables: { roadmapId: string; nodes: unknown[]; edges: unknown[] } };
    expect(call.variables.roadmapId).toBe('r1');
    expect(call.variables.nodes).toHaveLength(1);
    expect(call.variables.edges).toHaveLength(1);
  });

  it('throws on GraphQL errors', async () => {
    mockMutate.mockResolvedValue({ errors: [{ message: '500' }] } as never);
    await expect(saveGraph('r1', [], [])).rejects.toThrow('Save failed');
  });
});
