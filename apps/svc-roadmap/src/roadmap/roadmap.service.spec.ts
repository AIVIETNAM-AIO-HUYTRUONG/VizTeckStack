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
      update: jest.fn(),
    },
    edge: {},
    $transaction: jest.fn(),
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
});
