import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLesson, updateLessonContent, updateLessonTitle } from './lesson.service';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
import { apiFetch } from '@/lib/api';
const mockFetch = vi.mocked(apiFetch);

const mockNode = {
  id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro', content: '[]',
};

describe('fetchLesson', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the node on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ node: mockNode }),
    } as Response);

    const result = await fetchLesson('n1');
    expect(result.id).toBe('n1');
    expect(mockFetch).toHaveBeenCalledWith('/api/nodes/n1');
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(fetchLesson('n1')).rejects.toThrow('Failed to fetch lesson');
  });

  it('throws when node is missing from response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    await expect(fetchLesson('n1')).rejects.toThrow('Lesson not found');
  });
});

describe('updateLessonContent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls PATCH /api/nodes/:id/content', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    await updateLessonContent('n1', '[]');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/nodes/n1/content',
      expect.objectContaining({ method: 'PATCH' }),
    );
    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as { body: string }).body,
    ) as { content: string };
    expect(body.content).toBe('[]');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 500, text: async () => 'Internal error',
    } as Response);
    await expect(updateLessonContent('n1', '[]')).rejects.toThrow('Save failed');
  });
});

describe('updateLessonTitle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls PATCH /api/nodes/:id/title', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    await updateLessonTitle('n1', 'New Title');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/nodes/n1/title',
      expect.objectContaining({ method: 'PATCH' }),
    );
    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as { body: string }).body,
    ) as { title: string };
    expect(body.title).toBe('New Title');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 500, text: async () => 'error',
    } as Response);
    await expect(updateLessonTitle('n1', 'x')).rejects.toThrow('Update title failed');
  });
});
