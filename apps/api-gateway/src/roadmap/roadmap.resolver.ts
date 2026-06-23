import { Resolver, Query, Mutation, Args, ID } from "@nestjs/graphql";
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
  BreadcrumbItemDto,
} from "./roadmap.dto";

// Proto sends NodeType as numeric (ROADMAP=0, LESSON=1); GraphQL enum expects strings.
function normalizeNodeType(type: unknown): NodeTypeEnum {
  if (type === 0 || type === "ROADMAP") return NodeTypeEnum.ROADMAP;
  if (type === 1 || type === "LESSON") return NodeTypeEnum.LESSON;
  return NodeTypeEnum.LESSON;
}

function normalizeNodes(nodes: any[]): NodeDto[] {
  return (nodes ?? []).map((n) => ({ ...n, type: normalizeNodeType(n.type) }));
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
    const result = await this.grpc.getRoadmap(slug);
    return { ...result, nodes: normalizeNodes(result.nodes) };
  }

  @Query(() => NodeDto, { nullable: true })
  async node(@Args("id", { type: () => ID }) id: string): Promise<NodeDto> {
    const result = await this.grpc.getNode(id);
    return result.node;
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
  upsertGraph(
    @Args("roadmapId", { type: () => ID }) roadmapId: string,
    @Args("nodes", { type: () => [NodeInput] }) nodes: NodeInput[],
    @Args("edges", { type: () => [EdgeInput] }) edges: EdgeInput[],
  ): Promise<RoadmapDetailDto> {
    return this.grpc.upsertGraph({ roadmapId, nodes, edges });
  }

  @Query(() => [BreadcrumbItemDto])
  async nodeBreadcrumb(
    @Args("id", { type: () => ID }) id: string,
  ): Promise<BreadcrumbItemDto[]> {
    const result = await this.grpc.getNodeBreadcrumb(id) as { items?: Array<{ title: string; slug: string; nodeId: string }> };
    return (result.items ?? []).map((item) => ({
      title: item.title,
      slug: item.slug || undefined,
      nodeId: item.nodeId || undefined,
    }));
  }

  @UseGuards(AdminGuard)
  @Mutation(() => NodeDto)
  updateNodeCover(
    @Args("id", { type: () => ID }) id: string,
    @Args("coverImage", { nullable: true }) coverImage?: string,
  ): Promise<NodeDto> {
    return this.grpc.updateNodeCover(id, coverImage ?? '') as Promise<NodeDto>;
  }

  @UseGuards(AdminGuard)
  @Mutation(() => NodeDto)
  updateNodeIcon(
    @Args("id", { type: () => ID }) id: string,
    @Args("icon", { nullable: true }) icon?: string,
  ): Promise<NodeDto> {
    return this.grpc.updateNodeIcon(id, icon ?? '') as Promise<NodeDto>;
  }
}
