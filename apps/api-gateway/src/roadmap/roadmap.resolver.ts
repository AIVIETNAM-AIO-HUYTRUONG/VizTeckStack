import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/types';
import { ListRoadmapsUseCase } from '../application/use-cases/roadmap/list-roadmaps.use-case';
import { GetRoadmapUseCase } from '../application/use-cases/roadmap/get-roadmap.use-case';
import { CreateRoadmapUseCase } from '../application/use-cases/roadmap/create-roadmap.use-case';
import { UpdateRoadmapUseCase } from '../application/use-cases/roadmap/update-roadmap.use-case';
import { DeleteRoadmapUseCase } from '../application/use-cases/roadmap/delete-roadmap.use-case';
import { UpsertGraphUseCase } from '../application/use-cases/roadmap/upsert-graph.use-case';
import { GetRoadmapTreeUseCase } from '../application/use-cases/roadmap/get-roadmap-tree.use-case';
import { SearchNodesUseCase } from '../application/use-cases/roadmap/search-nodes.use-case';
import {
  RoadmapDto, RoadmapDetailDto, NodeTypeEnum,
  CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput,
  RoadmapTreeDto, SearchResultDto,
} from './roadmap.dto';

function normalizeNodeType(type: unknown): NodeTypeEnum {
  return type === 'ROADMAP' ? NodeTypeEnum.ROADMAP : NodeTypeEnum.LESSON;
}

@Resolver()
export class RoadmapResolver {
  constructor(
    private readonly listRoadmapsUseCase: ListRoadmapsUseCase,
    private readonly getRoadmapUseCase: GetRoadmapUseCase,
    private readonly createRoadmapUseCase: CreateRoadmapUseCase,
    private readonly updateRoadmapUseCase: UpdateRoadmapUseCase,
    private readonly deleteRoadmapUseCase: DeleteRoadmapUseCase,
    private readonly upsertGraphUseCase: UpsertGraphUseCase,
    private readonly getRoadmapTreeUseCase: GetRoadmapTreeUseCase,
    private readonly searchNodesUseCase: SearchNodesUseCase,
  ) {}

  @Query(() => [RoadmapDto])
  roadmaps(): Promise<RoadmapDto[]> {
    return this.listRoadmapsUseCase.execute() as Promise<RoadmapDto[]>;
  }

  @Query(() => RoadmapDetailDto, { nullable: true })
  async roadmap(@Args('slug') slug: string): Promise<RoadmapDetailDto | null> {
    const [detail, allRoadmaps] = await Promise.all([
      this.getRoadmapUseCase.execute(slug),
      this.listRoadmapsUseCase.execute(),
    ]);
    if (!detail) return null;
    const idToSlug = new Map(allRoadmaps.map(r => [r.id, r.slug]));
    return {
      roadmap: detail.roadmap as RoadmapDto,
      nodes: detail.nodes.map(n => ({
        ...n,
        type: normalizeNodeType(n.type),
        content: n.content ? JSON.stringify(n.content) : undefined,
        targetRoadmapSlug: n.targetRoadmapId ? idToSlug.get(n.targetRoadmapId) : undefined,
      })) as any,
      edges: detail.edges as any,
    };
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.SUPER_ADMIN)
  @Mutation(() => RoadmapDto)
  createRoadmap(@Args('input') input: CreateRoadmapInput): Promise<RoadmapDto> {
    return this.createRoadmapUseCase.execute(input) as Promise<RoadmapDto>;
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.SUPER_ADMIN)
  @Mutation(() => RoadmapDto)
  updateRoadmap(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRoadmapInput,
  ): Promise<RoadmapDto> {
    return this.updateRoadmapUseCase.execute(id, input) as Promise<RoadmapDto>;
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => Boolean)
  async deleteRoadmap(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.deleteRoadmapUseCase.execute(id);
    return true;
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.SUPER_ADMIN)
  @Mutation(() => RoadmapDetailDto)
  async upsertGraph(
    @Args('roadmapId', { type: () => ID }) roadmapId: string,
    @Args('nodes', { type: () => [NodeInput] }) nodes: NodeInput[],
    @Args('edges', { type: () => [EdgeInput] }) edges: EdgeInput[],
  ): Promise<RoadmapDetailDto> {
    const nodeInputs = nodes.map(n => ({
      ...n,
      type: n.type as 'ROADMAP' | 'LESSON',
      content: n.content ? JSON.parse(n.content) : null,
    }));
    const detail = await this.upsertGraphUseCase.execute(roadmapId, nodeInputs, edges);
    return {
      roadmap: detail.roadmap as RoadmapDto,
      nodes: detail.nodes.map(n => ({
        ...n,
        type: normalizeNodeType(n.type),
        content: n.content ? JSON.stringify(n.content) : undefined,
      })) as any,
      edges: detail.edges as any,
    };
  }

  @Query(() => RoadmapTreeDto, { nullable: true })
  roadmapTree(@Args('slug') slug: string): Promise<RoadmapTreeDto> {
    return this.getRoadmapTreeUseCase.execute(slug) as Promise<RoadmapTreeDto>;
  }

  @Query(() => [SearchResultDto])
  async search(
    @Args('q') q: string,
    @Args('titleOnly', { nullable: true, defaultValue: false }) titleOnly: boolean,
    @Args('roadmapId', { type: () => ID, nullable: true }) roadmapId?: string,
    @Context() ctx?: { req: { headers: { authorization?: string } } },
  ): Promise<SearchResultDto[]> {
    const token = ctx?.req?.headers?.authorization?.replace('Bearer ', '');
    const isAdmin = Boolean(token && token === process.env.ADMIN_TOKEN);
    const results = await this.searchNodesUseCase.execute({ q, titleOnly, roadmapId }, isAdmin);
    return results.map(r => ({
      ...r,
      type: normalizeNodeType(r.type),
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    })) as SearchResultDto[];
  }
}
