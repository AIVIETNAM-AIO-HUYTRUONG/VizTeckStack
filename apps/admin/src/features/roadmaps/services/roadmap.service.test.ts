import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap, cycleStatus } from './roadmap.service';

vi.mock('@/lib/apolloClient', () => ({
  adminApolloClient: { query: vi.fn(), mutate: vi.fn() },
}));

import { adminApolloClient } from '@/lib/apolloClient';
const mockQuery = vi.mocked(adminApolloClient.query);
const mockMutate = vi.mocked(adminApolloClient.mutate);

describe('roadmap.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getRoadmaps', () => {
    it('returns roadmaps array from response', async () => {
      mockQuery.mockResolvedValue({
        data: { roadmaps: [{ id: '1', slug: 'test', title: 'Test' }] },
      } as never);
      const result = await getRoadmaps();
      expect(result).toEqual([{ id: '1', slug: 'test', title: 'Test' }]);
      expect(mockQuery).toHaveBeenCalledOnce();
    });

    it('returns empty array when roadmaps key is absent', async () => {
      mockQuery.mockResolvedValue({ data: { roadmaps: null } } as never);
      const result = await getRoadmaps();
      expect(result).toEqual([]);
    });
  });

  describe('createRoadmap', () => {
    it('calls CreateRoadmap mutation with input', async () => {
      mockMutate.mockResolvedValue({} as never);
      await createRoadmap({ title: 'My Road', slug: 'my-road', description: 'desc' });
      const call = mockMutate.mock.calls[0][0] as unknown as { variables: { input: Record<string, string> } };
      expect(call.variables.input).toMatchObject({ title: 'My Road', slug: 'my-road' });
    });
  });

  describe('updateRoadmap', () => {
    it('calls UpdateRoadmap mutation with id and input', async () => {
      mockMutate.mockResolvedValue({} as never);
      await updateRoadmap('abc', { title: 'New Title' });
      const call = mockMutate.mock.calls[0][0] as unknown as { variables: { id: string; input: Record<string, string> } };
      expect(call.variables.id).toBe('abc');
      expect(call.variables.input).toMatchObject({ title: 'New Title' });
    });
  });

  describe('deleteRoadmap', () => {
    it('calls DeleteRoadmap mutation with id', async () => {
      mockMutate.mockResolvedValue({} as never);
      await deleteRoadmap('abc');
      const call = mockMutate.mock.calls[0][0] as unknown as { variables: { id: string } };
      expect(call.variables.id).toBe('abc');
    });
  });

  describe('cycleStatus', () => {
    it('cycles DRAFT → PUBLIC', async () => {
      mockMutate.mockResolvedValue({} as never);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X', status: 'DRAFT' });
      expect(next).toBe('PUBLIC');
    });

    it('cycles PUBLIC → PRIVATE', async () => {
      mockMutate.mockResolvedValue({} as never);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X', status: 'PUBLIC' });
      expect(next).toBe('PRIVATE');
    });

    it('cycles PRIVATE → DRAFT', async () => {
      mockMutate.mockResolvedValue({} as never);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X', status: 'PRIVATE' });
      expect(next).toBe('DRAFT');
    });

    it('treats undefined status as DRAFT and cycles to PUBLIC', async () => {
      mockMutate.mockResolvedValue({} as never);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X' });
      expect(next).toBe('PUBLIC');
    });
  });
});
