import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapResolver } from './roadmap.resolver';
import { RoadmapGrpcClient } from './roadmap.grpc-client';

const mockClient = {
  getRoadmaps: jest.fn().mockResolvedValue({ roadmaps: [{ id: '1', slug: 'frontend', title: 'Frontend', description: '', coverImage: '' }] }),
  getRoadmap: jest.fn().mockResolvedValue({ roadmap: { id: '1', slug: 'frontend', title: 'Frontend' }, nodes: [], edges: [] }),
  searchNodes: jest.fn().mockResolvedValue({ results: [] }),
};

describe('RoadmapResolver', () => {
  let resolver: RoadmapResolver;
  let grpc: RoadmapGrpcClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapResolver,
        { provide: RoadmapGrpcClient, useValue: mockClient },
      ],
    }).compile();
    resolver = module.get<RoadmapResolver>(RoadmapResolver);
    grpc = module.get<RoadmapGrpcClient>(RoadmapGrpcClient);
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

  it('search() returns filtered results', async () => {
    const mockResults = {
      results: [{
        id: 'n1', type: 1, title: 'HTML', icon: '', coverImage: '',
        roadmapSlug: 'frontend', roadmapTitle: 'Frontend',
        roadmapId: 'r1', updatedAt: '2026-06-20T00:00:00.000Z', breadcrumb: ['Frontend', 'HTML'],
      }],
    };
    const mockList = { roadmaps: [{ id: 'r1', slug: 'frontend', status: 'PUBLIC' }] };
    jest.spyOn(grpc, 'searchNodes' as any).mockResolvedValue(mockResults);
    jest.spyOn(grpc, 'getRoadmaps' as any).mockResolvedValue(mockList);
    const result = await resolver.search('HTML', false, undefined, { req: { headers: {} } });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('HTML');
    expect(result[0].type).toBe('LESSON');
  });
});
