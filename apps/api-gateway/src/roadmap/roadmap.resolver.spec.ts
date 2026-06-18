import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapResolver } from './roadmap.resolver';
import { RoadmapGrpcClient } from './roadmap.grpc-client';

const mockClient = {
  getRoadmaps: jest.fn().mockResolvedValue({ roadmaps: [{ id: '1', slug: 'frontend', title: 'Frontend', description: '', coverImage: '' }] }),
  getRoadmap: jest.fn().mockResolvedValue({ roadmap: { id: '1', slug: 'frontend', title: 'Frontend' }, nodes: [], edges: [] }),
};

describe('RoadmapResolver', () => {
  let resolver: RoadmapResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapResolver,
        { provide: RoadmapGrpcClient, useValue: mockClient },
      ],
    }).compile();
    resolver = module.get<RoadmapResolver>(RoadmapResolver);
  });

  it('roadmaps() returns array', async () => {
    const result = await resolver.roadmaps();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('frontend');
  });

  it('roadmap(slug) returns detail', async () => {
    const result = await resolver.roadmap('frontend');
    expect(result.roadmap?.slug).toBe('frontend');
    expect(result.nodes).toHaveLength(0);
  });
});
