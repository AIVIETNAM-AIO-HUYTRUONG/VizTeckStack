// apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapService } from './roadmap.service';

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

describe('RoadmapService', () => {
  let service: RoadmapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoadmapService],
    }).compile();
    service = module.get<RoadmapService>(RoadmapService);
    jest.clearAllMocks();
  });

  it('getRoadmaps returns roadmap list', async () => {
    (db.roadmap.findMany as jest.Mock).mockResolvedValue([
      { id: 'r1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null },
    ]);
    const result = await service.getRoadmaps({});
    expect(result.roadmaps).toHaveLength(1);
    expect(result.roadmaps[0].slug).toBe('frontend');
  });

  it('getRoadmap returns detail with nodes and edges', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValue({
      id: 'r1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null,
      nodes: [
        { id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'HTML', positionX: 0, positionY: 0, targetRoadmapId: null, content: null, edges: [], edgesTarget: [] },
      ],
    });
    const result = await service.getRoadmap({ slug: 'frontend' });
    expect(result.roadmap?.slug).toBe('frontend');
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
  });

  describe('updateNodeContent', () => {
    it('updates content and returns NodeItem', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
        positionX: 0, positionY: 0, targetRoadmapId: null,
        content: [{ type: 'paragraph', content: [] }],
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);

      const result = await service.updateNodeContent({
        id: 'n1',
        content: JSON.stringify([{ type: 'paragraph', content: [] }]),
      });

      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { content: [{ type: 'paragraph', content: [] }] },
      });
      expect(result.id).toBe('n1');
      expect(result.content).toBe(JSON.stringify([{ type: 'paragraph', content: [] }]));
    });

    it('throws RpcException NOT_FOUND when node missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { Prisma } = jest.requireActual('@vizteck/db') as any;
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
      });
      (db.node.update as jest.Mock).mockRejectedValue(err);

      await expect(service.updateNodeContent({ id: 'missing', content: '[]' }))
        .rejects.toMatchObject({ error: { code: 5 } });
    });
  });

  describe('updateNodeTitle', () => {
    it('updates title and returns NodeItem', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'New Title',
        positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);

      const result = await service.updateNodeTitle({ id: 'n1', title: 'New Title' });

      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { title: 'New Title' },
      });
      expect(result.title).toBe('New Title');
    });

    it('throws RpcException NOT_FOUND when node missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { Prisma } = jest.requireActual('@vizteck/db') as any;
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
      });
      (db.node.update as jest.Mock).mockRejectedValue(err);

      await expect(service.updateNodeTitle({ id: 'missing', title: 'x' }))
        .rejects.toMatchObject({ error: { code: 5 } });
    });
  });

  describe('updateNodeCover', () => {
    it('updates coverImage and returns NodeItem', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
        positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
        coverImage: 'https://cdn.example.com/cover.jpg', icon: null,
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);
      const result = await service.updateNodeCover({ id: 'n1', coverImage: 'https://cdn.example.com/cover.jpg' });
      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { coverImage: 'https://cdn.example.com/cover.jpg' },
      });
      expect(result.coverImage).toBe('https://cdn.example.com/cover.jpg');
    });

    it('clears coverImage when empty string', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
        positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
        coverImage: null, icon: null,
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);
      await service.updateNodeCover({ id: 'n1', coverImage: '' });
      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { coverImage: null },
      });
    });

    it('throws NOT_FOUND when node missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { Prisma } = jest.requireActual('@vizteck/db') as any;
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
      });
      (db.node.update as jest.Mock).mockRejectedValue(err);
      await expect(service.updateNodeCover({ id: 'missing', coverImage: 'x' }))
        .rejects.toMatchObject({ error: { code: 5 } });
    });
  });

  describe('updateNodeIcon', () => {
    it('updates icon and returns NodeItem', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
        positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
        coverImage: null, icon: '⚡',
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);
      const result = await service.updateNodeIcon({ id: 'n1', icon: '⚡' });
      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { icon: '⚡' },
      });
      expect(result.icon).toBe('⚡');
    });

    it('clears icon when empty string', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
        positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
        coverImage: null, icon: null,
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);
      await service.updateNodeIcon({ id: 'n1', icon: '' });
      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { icon: null },
      });
    });

    it('throws NOT_FOUND when node missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { Prisma } = jest.requireActual('@vizteck/db') as any;
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
      });
      (db.node.update as jest.Mock).mockRejectedValue(err);
      await expect(service.updateNodeIcon({ id: 'missing', icon: '⚡' }))
        .rejects.toMatchObject({ error: { code: 5 } });
    });
  });

  describe('getNodeBreadcrumb', () => {
    it('returns 1-item chain for root roadmap lesson', async () => {
      (db.node.findUnique as jest.Mock).mockResolvedValue({
        id: 'n1', title: 'Box Model', roadmapId: 'r1',
        coverImage: null, icon: null,
      });
      (db.node.findFirst as jest.Mock).mockResolvedValue(null); // no parent
      (db.roadmap.findUnique as jest.Mock).mockResolvedValue({
        id: 'r1', title: 'Frontend Roadmap', slug: 'frontend',
      });
      const result = await service.getNodeBreadcrumb({ id: 'n1' });
      expect(result.items).toEqual([
        { title: 'Frontend Roadmap', slug: 'frontend', nodeId: '' },
        { title: 'Box Model', slug: '', nodeId: 'n1' },
      ]);
    });

    it('returns nested chain for sub-roadmap lesson', async () => {
      (db.node.findUnique as jest.Mock).mockResolvedValue({
        id: 'n2', title: 'CSS Selectors', roadmapId: 'r2',
        coverImage: null, icon: null,
      });
      // First call: find parent of r2 → Node X in Roadmap r1
      (db.node.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 'nx', title: 'HTML & CSS', roadmapId: 'r1',
          targetRoadmap: { slug: 'html-css' },
        })
        .mockResolvedValueOnce(null); // no parent of r1
      (db.roadmap.findUnique as jest.Mock).mockResolvedValue({
        id: 'r1', title: 'Frontend Roadmap', slug: 'frontend',
      });
      const result = await service.getNodeBreadcrumb({ id: 'n2' });
      expect(result.items).toEqual([
        { title: 'Frontend Roadmap', slug: 'frontend', nodeId: '' },
        { title: 'HTML & CSS', slug: 'html-css', nodeId: 'nx' },
        { title: 'CSS Selectors', slug: '', nodeId: 'n2' },
      ]);
    });

    it('returns empty array when node not found', async () => {
      (db.node.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.getNodeBreadcrumb({ id: 'missing' });
      expect(result.items).toEqual([]);
    });
  });

  describe('getRoadmapTree', () => {
    const ROOT = { id: 'r1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null, status: 'PUBLIC' };
    const SUB = { id: 'r2', slug: 'html-css', title: 'HTML & CSS', description: null, coverImage: null, status: 'PUBLIC' };

    it('returns correct tree for roadmap with mixed LESSON + ROADMAP nodes', async () => {
      (db.roadmap.findUnique as jest.Mock)
        .mockResolvedValueOnce(ROOT)   // first call: root roadmap
        .mockResolvedValueOnce(SUB);   // second call: sub-roadmap
      (db.node.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { id: 'n1', title: 'Intro', type: 'LESSON', roadmapId: 'r1', targetRoadmapId: null, coverImage: null, icon: null },
          { id: 'n2', title: 'HTML & CSS', type: 'ROADMAP', roadmapId: 'r1', targetRoadmapId: 'r2', coverImage: null, icon: null },
        ])  // root nodes
        .mockResolvedValueOnce([
          { id: 'n3', title: 'Box Model', type: 'LESSON', roadmapId: 'r2', targetRoadmapId: null, coverImage: null, icon: null },
        ]);  // sub-roadmap nodes
      const result = await service.getRoadmapTree({ slug: 'frontend' });
      expect(result.rootSlug).toBe('frontend');
      expect(result.rootTitle).toBe('Frontend');
      expect(result.nodes).toHaveLength(2);
      const lessonNode = result.nodes.find((n) => n.id === 'n1')!;
      expect(lessonNode.type).toBe('LESSON');
      expect(lessonNode.roadmapSlug).toBe('frontend');
      expect(lessonNode.roadmapId).toBe('r1');
      const roadmapNode = result.nodes.find((n) => n.id === 'n2')!;
      expect(roadmapNode.type).toBe('ROADMAP');
      expect(roadmapNode.slug).toBe('html-css');
      expect(roadmapNode.targetRoadmapId).toBe('r2');
      expect(roadmapNode.children).toHaveLength(1);
      expect(roadmapNode.children![0].id).toBe('n3');
      expect(roadmapNode.children![0].roadmapSlug).toBe('html-css');
      expect(roadmapNode.children![0].roadmapId).toBe('r2');
    });

    it('returns empty nodes array for roadmap with no nodes', async () => {
      (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(ROOT);
      (db.node.findMany as jest.Mock).mockResolvedValueOnce([]);
      const result = await service.getRoadmapTree({ slug: 'frontend' });
      expect(result.rootSlug).toBe('frontend');
      expect(result.nodes).toEqual([]);
    });

    it('returns empty response for unknown slug', async () => {
      (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.getRoadmapTree({ slug: 'nonexistent' });
      expect(result.rootSlug).toBe('');
      expect(result.rootTitle).toBe('');
      expect(result.nodes).toEqual([]);
    });

    it('sub-roadmap ROADMAP node with null targetRoadmapId yields no children', async () => {
      (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(ROOT);
      (db.node.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'n2', title: 'Orphan ROADMAP', type: 'ROADMAP', roadmapId: 'r1', targetRoadmapId: null, coverImage: null, icon: null },
      ]);
      const result = await service.getRoadmapTree({ slug: 'frontend' });
      expect(result.nodes[0].children).toEqual([]);
      expect(result.nodes[0].slug).toBe('');
      expect(result.nodes[0].targetRoadmapId).toBe('');
    });
  });

  describe('searchNodes', () => {
    const mockRow = {
      id: 'n1',
      type: 'LESSON',
      title: 'HTML Basics',
      icon: null,
      coverImage: null,
      roadmapId: 'r1',
      updatedAt: new Date('2026-06-20T10:00:00Z'),
      roadmapSlug: 'frontend',
      roadmapTitle: 'Frontend',
    };

    it('returns matching nodes by title', async () => {
      (db.$queryRaw as jest.Mock).mockResolvedValue([mockRow]);
      const result = await service.searchNodes({ q: 'HTML', titleOnly: false, roadmapId: '' });
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('HTML Basics');
      expect(result.results[0].roadmapSlug).toBe('frontend');
      expect(result.results[0].type).toBe(1);
      expect(result.results[0].updatedAt).toBe('2026-06-20T10:00:00.000Z');
    });

    it('returns empty array when q is shorter than 2 characters', async () => {
      const result = await service.searchNodes({ q: 'H', titleOnly: false, roadmapId: '' });
      expect(result.results).toHaveLength(0);
      expect(db.$queryRaw).not.toHaveBeenCalled();
    });

    it('returns all nodes when q is empty string', async () => {
      (db.$queryRaw as jest.Mock).mockResolvedValue([mockRow]);
      const result = await service.searchNodes({ q: '', titleOnly: false, roadmapId: '' });
      expect(result.results).toHaveLength(1);
      expect(db.$queryRaw).toHaveBeenCalled();
    });

    it('maps ROADMAP type node to type=0', async () => {
      (db.$queryRaw as jest.Mock).mockResolvedValue([{ ...mockRow, type: 'ROADMAP' }]);
      const result = await service.searchNodes({ q: 'HTML', titleOnly: false, roadmapId: '' });
      expect(result.results[0].type).toBe(0);
    });

    it('includes breadcrumb as [roadmapTitle, nodeTitle]', async () => {
      (db.$queryRaw as jest.Mock).mockResolvedValue([mockRow]);
      const result = await service.searchNodes({ q: 'HTML', titleOnly: false, roadmapId: '' });
      expect(result.results[0].breadcrumb).toEqual(['Frontend', 'HTML Basics']);
    });
  });
});
