import { Resolver, Query, Mutation, Args, ID, Context } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { RoadmapGrpcClient } from "./roadmap.grpc-client";
import { AdminGuard } from "../auth/admin.guard";
import {
  RoadmapDto,
  RoadmapDetailDto,
  NodeDto,
  NodeTypeEnum,
  CreateRoadmapInput,
  UpdateRoadmapInput,
  NodeInput,
  EdgeInput,
  RoadmapTreeDto,
  SearchResultDto,
} from "./roadmap.dto";

function normalizeNodeType(type: unknown): NodeTypeEnum {
  if (type === 0 || type === "ROADMAP") return NodeTypeEnum.ROADMAP;
  if (type === 1 || type === "LESSON") return NodeTypeEnum.LESSON;
  return NodeTypeEnum.LESSON;
}

function normalizeNodes(nodes: any[], idToSlug: Map<string, string>): NodeDto[] {
  return (nodes ?? []).map((n) => ({
    ...n,
    type: normalizeNodeType(n.type),
    targetRoadmapSlug: n.targetRoadmapId ? idToSlug.get(n.targetRoadmapId) : undefined,
  }));
}

@Resolver()
export class RoadmapResolver {
  constructor(private readonly grpc: RoadmapGrpcClient) {}

  @Query(() => [RoadmapDto])
  async roadmaps(): Promise<RoadmapDto[]> {
    const result = await this.grpc.getRoadmaps();
    return result.roadmaps ?? [];
  }

  @Query(() => RoadmapDetailDto, { nullable: true })
  async roadmap(@Args("slug") slug: string): Promise<RoadmapDetailDto> {
    const [result, listResult] = await Promise.all([
      this.grpc.getRoadmap(slug),
      this.grpc.getRoadmaps(),
    ]) as [any, any];
    const idToSlug = new Map<string, string>(
      (listResult.roadmaps ?? []).map((r: any) => [r.id, r.slug]),
    );
    return { ...result, nodes: normalizeNodes(result.nodes ?? [], idToSlug), edges: result.edges ?? [] };
  }

  @UseGuards(AdminGuard)
  @Mutation(() => RoadmapDto)
  createRoadmap(@Args("input") input: CreateRoadmapInput): Promise<RoadmapDto> {
    return this.grpc.createRoadmap(input);
  }

  @UseGuards(AdminGuard)
  @Mutation(() => RoadmapDto)
  updateRoadmap(
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateRoadmapInput,
  ): Promise<RoadmapDto> {
    return this.grpc.updateRoadmap({ id, ...input });
  }

  @UseGuards(AdminGuard)
  @Mutation(() => Boolean)
  async deleteRoadmap(
    @Args("id", { type: () => ID }) id: string,
  ): Promise<boolean> {
    const result = await this.grpc.deleteRoadmap(id);
    return result.success;
  }

  @UseGuards(AdminGuard)
  @Mutation(() => RoadmapDetailDto)
  async upsertGraph(
    @Args("roadmapId", { type: () => ID }) roadmapId: string,
    @Args("nodes", { type: () => [NodeInput] }) nodes: NodeInput[],
    @Args("edges", { type: () => [EdgeInput] }) edges: EdgeInput[],
  ): Promise<RoadmapDetailDto> {
    const result = await this.grpc.upsertGraph({ roadmapId, nodes, edges }) as any;
    return { ...result, nodes: normalizeNodes(result.nodes ?? [], new Map()), edges: result.edges ?? [] };
  }

  @Query(() => RoadmapTreeDto, { nullable: true })
  async roadmapTree(@Args("slug") slug: string): Promise<RoadmapTreeDto> {
    return this.grpc.getRoadmapTree(slug);
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
    const raw = await this.grpc.searchNodes({ q, titleOnly, roadmapId: roadmapId ?? '' }) as { results?: any[] };
    const items: any[] = raw.results ?? [];

    let filtered = items;
    if (!isAdmin) {
      const listRaw = await this.grpc.getRoadmaps() as { roadmaps?: any[] };
      const publicIds = new Set(
        (listRaw.roadmaps ?? [])
          .filter((r: any) => r.status === 'PUBLIC')
          .map((r: any) => r.id),
      );
      filtered = items.filter((r: any) => publicIds.has(r.roadmapId));
    }

    return filtered.map((r: any) => ({
      id: r.id,
      type: r.type === 0 ? NodeTypeEnum.ROADMAP : NodeTypeEnum.LESSON,
      title: r.title,
      icon: r.icon || undefined,
      coverImage: r.coverImage || undefined,
      roadmapSlug: r.roadmapSlug,
      roadmapTitle: r.roadmapTitle,
      roadmapId: r.roadmapId,
      updatedAt: r.updatedAt,
      breadcrumb: r.breadcrumb ?? [],
    }));
  }

}
