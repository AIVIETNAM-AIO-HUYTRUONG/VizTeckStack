jest.mock('@vizteck/db', () => ({
  ...jest.requireActual('@vizteck/db'),
  db: {
    roadmap: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    node: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    edge: {},
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  },
}));

import { db } from '@vizteck/db';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaRoadmapRepository } from './prisma-roadmap.repository';

describe('PrismaRoadmapRepository', () => {
  let repo: PrismaRoadmapRepository;

  beforeEach(() => {
    repo = new PrismaRoadmapRepository();
    jest.clearAllMocks();
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  it('findAll returns roadmap list', async () => {
    (db.roadmap.findMany as jest.Mock).mockResolvedValue([
      { id: 'r1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null, status: 'PUBLIC', createdAt: new Date() },
    ]);
    const result = await repo.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('frontend');
  });

  // ─── findBySlug ─────────────────────────────────────────────────────────────

  it('findBySlug returns null when not found', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await repo.findBySlug('nonexistent');
    expect(result).toBeNull();
  });

  it('findBySlug returns detail with nodes and edges', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValue({
      id: 'r1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null, status: 'PUBLIC', createdAt: new Date(),
      nodes: [
        { id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'HTML', positionX: 0, positionY: 0, targetRoadmapId: null, content: null, updatedAt: new Date(),
          edges: [{ id: 'e1', sourceId: 'n1', targetId: 'n2', label: null }] },
      ],
    });
    const result = await repo.findBySlug('frontend');
    expect(result?.roadmap.slug).toBe('frontend');
    expect(result?.nodes).toHaveLength(1);
    expect(result?.edges).toHaveLength(1);
    expect(result?.edges[0].id).toBe('e1');
  });

  // ─── create / update / delete ────────────────────────────────────────────────

  it('create throws ConflictException on duplicate slug (P2002)', async () => {
    const { Prisma } = jest.requireActual('@vizteck/db') as any;
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
    });
    (db.roadmap.create as jest.Mock).mockRejectedValue(err);
    await expect(repo.create({ slug: 'dup', title: 'Dup' })).rejects.toThrow(ConflictException);
  });

  it('update throws NotFoundException when roadmap missing (P2025)', async () => {
    const { Prisma } = jest.requireActual('@vizteck/db') as any;
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
    });
    (db.roadmap.update as jest.Mock).mockRejectedValue(err);
    await expect(repo.update('missing', { title: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('delete throws NotFoundException when roadmap missing (P2025)', async () => {
    const { Prisma } = jest.requireActual('@vizteck/db') as any;
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
    });
    (db.roadmap.delete as jest.Mock).mockRejectedValue(err);
    await expect(repo.delete('missing')).rejects.toThrow(NotFoundException);
  });

  // ─── updateNodeField ─────────────────────────────────────────────────────────

  it('updateNodeField calls db.node.update with correct data', async () => {
    const stored = { id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro', positionX: 0, positionY: 0, targetRoadmapId: null, content: null, coverImage: null, icon: null, updatedAt: new Date() };
    (db.node.update as jest.Mock).mockResolvedValue(stored);
    await repo.updateNodeField('n1', { title: 'New Title' });
    expect(db.node.update).toHaveBeenCalledWith({ where: { id: 'n1' }, data: { title: 'New Title' } });
  });

  it('updateNodeField passes null coverImage when empty string provided', async () => {
    const stored = { id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'x', positionX: 0, positionY: 0, targetRoadmapId: null, content: null, coverImage: null, icon: null, updatedAt: new Date() };
    (db.node.update as jest.Mock).mockResolvedValue(stored);
    await repo.updateNodeField('n1', { coverImage: null });
    expect(db.node.update).toHaveBeenCalledWith({ where: { id: 'n1' }, data: { coverImage: null } });
  });

  it('updateNodeField throws NotFoundException on P2025', async () => {
    const { Prisma } = jest.requireActual('@vizteck/db') as any;
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
    });
    (db.node.update as jest.Mock).mockRejectedValue(err);
    await expect(repo.updateNodeField('missing', { title: 'x' })).rejects.toThrow(NotFoundException);
  });

  // ─── getNodeBreadcrumb ───────────────────────────────────────────────────────

  it('getNodeBreadcrumb returns 1-item chain for root roadmap lesson', async () => {
    (db.node.findUnique as jest.Mock).mockResolvedValue({ id: 'n1', title: 'Box Model', roadmapId: 'r1' });
    (db.node.findFirst as jest.Mock).mockResolvedValue(null);
    (db.roadmap.findUnique as jest.Mock).mockResolvedValue({ id: 'r1', title: 'Frontend Roadmap', slug: 'frontend' });

    const result = await repo.getNodeBreadcrumb('n1');
    expect(result).toEqual([
      { title: 'Frontend Roadmap', slug: 'frontend', nodeId: null },
      { title: 'Box Model', slug: null, nodeId: 'n1' },
    ]);
  });

  it('getNodeBreadcrumb returns nested chain for sub-roadmap lesson', async () => {
    (db.node.findUnique as jest.Mock).mockResolvedValue({ id: 'n2', title: 'CSS Selectors', roadmapId: 'r2' });
    (db.node.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: 'nx', title: 'HTML & CSS', roadmapId: 'r1', targetRoadmap: { slug: 'html-css' } })
      .mockResolvedValueOnce(null);
    (db.roadmap.findUnique as jest.Mock).mockResolvedValue({ id: 'r1', title: 'Frontend Roadmap', slug: 'frontend' });

    const result = await repo.getNodeBreadcrumb('n2');
    expect(result).toEqual([
      { title: 'Frontend Roadmap', slug: 'frontend', nodeId: null },
      { title: 'HTML & CSS', slug: 'html-css', nodeId: 'nx' },
      { title: 'CSS Selectors', slug: null, nodeId: 'n2' },
    ]);
  });

  it('getNodeBreadcrumb returns empty array when node not found', async () => {
    (db.node.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await repo.getNodeBreadcrumb('missing');
    expect(result).toEqual([]);
  });

  // ─── getRoadmapTree ──────────────────────────────────────────────────────────

  const ROOT = { id: 'r1', slug: 'frontend', title: 'Frontend' };
  const SUB  = { id: 'r2', slug: 'html-css', title: 'HTML & CSS' };

  it('getRoadmapTree returns correct tree with mixed LESSON + ROADMAP nodes', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(ROOT).mockResolvedValueOnce(SUB);
    (db.node.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'n1', title: 'Intro', type: 'LESSON', roadmapId: 'r1', targetRoadmapId: null },
        { id: 'n2', title: 'HTML & CSS', type: 'ROADMAP', roadmapId: 'r1', targetRoadmapId: 'r2' },
      ])
      .mockResolvedValueOnce([
        { id: 'n3', title: 'Box Model', type: 'LESSON', roadmapId: 'r2', targetRoadmapId: null },
      ]);

    const result = await repo.getRoadmapTree('frontend');

    expect(result.rootSlug).toBe('frontend');
    expect(result.nodes).toHaveLength(2);

    const lessonNode = result.nodes.find(n => n.id === 'n1')!;
    expect(lessonNode.type).toBe('LESSON');
    expect(lessonNode.roadmapSlug).toBe('frontend');
    expect(lessonNode.roadmapId).toBe('r1');

    const roadmapNode = result.nodes.find(n => n.id === 'n2')!;
    expect(roadmapNode.type).toBe('ROADMAP');
    expect(roadmapNode.slug).toBe('html-css');
    expect(roadmapNode.targetRoadmapId).toBe('r2');
    expect(roadmapNode.children).toHaveLength(1);
    expect(roadmapNode.children[0].id).toBe('n3');
    expect(roadmapNode.children[0].roadmapSlug).toBe('html-css');
    expect(roadmapNode.children[0].roadmapId).toBe('r2');
  });

  it('getRoadmapTree returns empty nodes for roadmap with no nodes', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(ROOT);
    (db.node.findMany as jest.Mock).mockResolvedValueOnce([]);
    const result = await repo.getRoadmapTree('frontend');
    expect(result.rootSlug).toBe('frontend');
    expect(result.nodes).toEqual([]);
  });

  it('getRoadmapTree returns empty response for unknown slug', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const result = await repo.getRoadmapTree('nonexistent');
    expect(result).toEqual({ rootSlug: '', rootTitle: '', nodes: [] });
  });

  it('getRoadmapTree: ROADMAP node with null targetRoadmapId yields null slug and no children', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(ROOT);
    (db.node.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 'n2', title: 'Orphan ROADMAP', type: 'ROADMAP', roadmapId: 'r1', targetRoadmapId: null },
    ]);
    const result = await repo.getRoadmapTree('frontend');
    expect(result.nodes[0].children).toEqual([]);
    expect(result.nodes[0].slug).toBeNull();
    expect(result.nodes[0].targetRoadmapId).toBeNull();
  });

  // ─── searchNodes ─────────────────────────────────────────────────────────────

  const mockRow = {
    id: 'n1', type: 'LESSON', title: 'HTML Basics', icon: null, coverImage: null,
    roadmapId: 'r1', updatedAt: new Date('2026-06-20T10:00:00Z'),
    roadmapSlug: 'frontend', roadmapTitle: 'Frontend',
  };

  it('searchNodes returns matching nodes', async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValue([mockRow]);
    const result = await repo.searchNodes({ q: 'HTML', titleOnly: false });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('HTML Basics');
    expect(result[0].type).toBe('LESSON');
    expect(result[0].roadmapSlug).toBe('frontend');
    expect(result[0].breadcrumb).toEqual(['Frontend', 'HTML Basics']);
  });

  it('searchNodes returns empty array when q < 2 characters', async () => {
    const result = await repo.searchNodes({ q: 'H', titleOnly: false });
    expect(result).toHaveLength(0);
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it('searchNodes returns all nodes when q is empty string', async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValue([mockRow]);
    const result = await repo.searchNodes({ q: '', titleOnly: false });
    expect(result).toHaveLength(1);
    expect(db.$queryRaw).toHaveBeenCalled();
  });

  it('searchNodes maps ROADMAP type correctly', async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValue([{ ...mockRow, type: 'ROADMAP' }]);
    const result = await repo.searchNodes({ q: 'HTML', titleOnly: false });
    expect(result[0].type).toBe('ROADMAP');
  });
});
