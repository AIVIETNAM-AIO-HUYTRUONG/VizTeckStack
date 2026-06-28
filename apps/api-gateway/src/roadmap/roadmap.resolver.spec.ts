import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapResolver } from './roadmap.resolver';
import { ListRoadmapsUseCase } from '../application/use-cases/roadmap/list-roadmaps.use-case';
import { GetRoadmapUseCase } from '../application/use-cases/roadmap/get-roadmap.use-case';
import { CreateRoadmapUseCase } from '../application/use-cases/roadmap/create-roadmap.use-case';
import { UpdateRoadmapUseCase } from '../application/use-cases/roadmap/update-roadmap.use-case';
import { DeleteRoadmapUseCase } from '../application/use-cases/roadmap/delete-roadmap.use-case';
import { UpsertGraphUseCase } from '../application/use-cases/roadmap/upsert-graph.use-case';
import { GetRoadmapTreeUseCase } from '../application/use-cases/roadmap/get-roadmap-tree.use-case';
import { SearchNodesUseCase } from '../application/use-cases/roadmap/search-nodes.use-case';

const mockRoadmap = { id: '1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null, status: 'PUBLIC', createdAt: new Date() };

const mockUseCases = {
  listRoadmapsUseCase: { execute: jest.fn().mockResolvedValue([mockRoadmap]) },
  getRoadmapUseCase: { execute: jest.fn().mockResolvedValue({ roadmap: mockRoadmap, nodes: [], edges: [] }) },
  createRoadmapUseCase: { execute: jest.fn() },
  updateRoadmapUseCase: { execute: jest.fn() },
  deleteRoadmapUseCase: { execute: jest.fn() },
  upsertGraphUseCase: { execute: jest.fn() },
  getRoadmapTreeUseCase: { execute: jest.fn() },
  searchNodesUseCase: { execute: jest.fn().mockResolvedValue([]) },
};

describe('RoadmapResolver', () => {
  let resolver: RoadmapResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapResolver,
        { provide: ListRoadmapsUseCase, useValue: mockUseCases.listRoadmapsUseCase },
        { provide: GetRoadmapUseCase, useValue: mockUseCases.getRoadmapUseCase },
        { provide: CreateRoadmapUseCase, useValue: mockUseCases.createRoadmapUseCase },
        { provide: UpdateRoadmapUseCase, useValue: mockUseCases.updateRoadmapUseCase },
        { provide: DeleteRoadmapUseCase, useValue: mockUseCases.deleteRoadmapUseCase },
        { provide: UpsertGraphUseCase, useValue: mockUseCases.upsertGraphUseCase },
        { provide: GetRoadmapTreeUseCase, useValue: mockUseCases.getRoadmapTreeUseCase },
        { provide: SearchNodesUseCase, useValue: mockUseCases.searchNodesUseCase },
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
    expect(result?.roadmap?.slug).toBe('frontend');
    expect(result?.nodes).toHaveLength(0);
  });

  it('search() returns results', async () => {
    mockUseCases.searchNodesUseCase.execute.mockResolvedValueOnce([{
      id: 'n1', type: 'LESSON', title: 'HTML', icon: null, coverImage: null,
      roadmapSlug: 'frontend', roadmapTitle: 'Frontend', roadmapId: 'r1',
      updatedAt: new Date(), breadcrumb: ['Frontend', 'HTML'],
    }]);
    const result = await resolver.search('HTML', false, undefined, { req: { headers: {} } });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('HTML');
    expect(result[0].type).toBe('LESSON');
  });
});
