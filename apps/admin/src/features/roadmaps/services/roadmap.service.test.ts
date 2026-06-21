import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap, cycleStatus } from './roadmap.service';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api';
const mockApiFetch = vi.mocked(apiFetch);

describe('roadmap.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getRoadmaps', () => {
    it('returns roadmaps array from response', async () => {
      mockApiFetch.mockResolvedValue({
        json: async () => ({ roadmaps: [{ id: '1', slug: 'test', title: 'Test' }] }),
      } as Response);
      const result = await getRoadmaps();
      expect(result).toEqual([{ id: '1', slug: 'test', title: 'Test' }]);
      expect(mockApiFetch).toHaveBeenCalledWith('/api/roadmaps');
    });

    it('returns empty array when roadmaps key is absent', async () => {
      mockApiFetch.mockResolvedValue({ json: async () => ({}) } as Response);
      const result = await getRoadmaps();
      expect(result).toEqual([]);
    });
  });

  describe('createRoadmap', () => {
    it('calls POST /api/roadmaps with serialized data', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      await createRoadmap({ title: 'My Road', slug: 'my-road', description: 'desc' });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/roadmaps',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'My Road', slug: 'my-road', description: 'desc' }),
        }),
      );
    });
  });

  describe('updateRoadmap', () => {
    it('calls PUT /api/roadmaps/:id with partial data', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      await updateRoadmap('abc', { title: 'New Title' });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/roadmaps/abc',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ title: 'New Title' }) }),
      );
    });
  });

  describe('deleteRoadmap', () => {
    it('calls DELETE /api/roadmaps/:id', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      await deleteRoadmap('abc');
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/roadmaps/abc',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('cycleStatus', () => {
    it('cycles DRAFT → PUBLIC and calls PUT', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X', status: 'DRAFT' });
      expect(next).toBe('PUBLIC');
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/roadmaps/abc',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ status: 'PUBLIC' }) }),
      );
    });

    it('cycles PUBLIC → PRIVATE', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X', status: 'PUBLIC' });
      expect(next).toBe('PRIVATE');
    });

    it('cycles PRIVATE → DRAFT', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X', status: 'PRIVATE' });
      expect(next).toBe('DRAFT');
    });

    it('treats undefined status as DRAFT and cycles to PUBLIC', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X' });
      expect(next).toBe('PUBLIC');
    });
  });
});
