// apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapService } from './roadmap.service';

jest.mock('@vizteck/db', () => ({
  db: {
    roadmap: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    node: { findUnique: jest.fn() },
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
});
