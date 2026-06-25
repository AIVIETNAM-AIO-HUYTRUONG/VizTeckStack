import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLesson, updateLessonContent, updateLessonTitle } from './lesson.service';

vi.mock('@/lib/apolloClient', () => ({
  adminApolloClient: { query: vi.fn(), mutate: vi.fn() },
}));

import { adminApolloClient } from '@/lib/apolloClient';
const mockQuery = vi.mocked(adminApolloClient.query);
const mockMutate = vi.mocked(adminApolloClient.mutate);

const mockNode = { id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro', content: '[]' };

describe('fetchLesson', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the node on success', async () => {
    mockQuery.mockResolvedValue({ data: { node: mockNode } } as never);
    const result = await fetchLesson('n1');
    expect(result.id).toBe('n1');
    expect(mockQuery).toHaveBeenCalledOnce();
  });

  it('throws when node is missing from response', async () => {
    mockQuery.mockResolvedValue({ data: { node: null } } as never);
    await expect(fetchLesson('n1')).rejects.toThrow('Lesson not found');
  });

  it('throws when query rejects', async () => {
    mockQuery.mockRejectedValue(new Error('Network error'));
    await expect(fetchLesson('n1')).rejects.toThrow('Network error');
  });
});

describe('updateLessonContent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls UpdateNodeContent mutation with correct variables', async () => {
    mockMutate.mockResolvedValue({ errors: undefined } as never);
    await updateLessonContent('n1', '[]');
    const call = mockMutate.mock.calls[0][0] as unknown as { variables: { id: string; content: string } };
    expect(call.variables.id).toBe('n1');
    expect(call.variables.content).toBe('[]');
  });

  it('throws on GraphQL errors', async () => {
    mockMutate.mockResolvedValue({ errors: [{ message: 'Internal error' }] } as never);
    await expect(updateLessonContent('n1', '[]')).rejects.toThrow('Save failed');
  });
});

describe('updateLessonTitle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls UpdateNodeTitle mutation with correct variables', async () => {
    mockMutate.mockResolvedValue({ errors: undefined } as never);
    await updateLessonTitle('n1', 'New Title');
    const call = mockMutate.mock.calls[0][0] as unknown as { variables: { id: string; title: string } };
    expect(call.variables.id).toBe('n1');
    expect(call.variables.title).toBe('New Title');
  });

  it('throws on GraphQL errors', async () => {
    mockMutate.mockResolvedValue({ errors: [{ message: 'error' }] } as never);
    await expect(updateLessonTitle('n1', 'x')).rejects.toThrow('Update title failed');
  });
});
