import { Resolver, Query, Mutation, Args, ID } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { RoadmapGrpcClient } from "./roadmap.grpc-client";
import { AdminGuard } from "../auth/admin.guard";
import { NodeDto, BreadcrumbItemDto } from "./roadmap.dto";

function normalizeNodeType(type: unknown): "ROADMAP" | "LESSON" {
  if (type === 0 || type === "ROADMAP") return "ROADMAP";
  return "LESSON";
}

@Resolver()
export class NodeResolver {
  constructor(private readonly grpc: RoadmapGrpcClient) {}

  @Query(() => NodeDto, { nullable: true })
  async node(@Args("id", { type: () => ID }) id: string): Promise<NodeDto> {
    const result = await this.grpc.getNode(id) as { node?: any };
    if (!result.node) return null as unknown as NodeDto;
    const n = result.node;
    return { ...n, type: normalizeNodeType(n.type) } as NodeDto;
  }

  @Query(() => [BreadcrumbItemDto])
  async nodeBreadcrumb(
    @Args("id", { type: () => ID }) id: string,
  ): Promise<BreadcrumbItemDto[]> {
    const result = await this.grpc.getNodeBreadcrumb(id) as {
      items?: Array<{ title: string; slug: string; nodeId: string }>;
    };
    return (result.items ?? []).map((item) => ({
      title: item.title,
      slug: item.slug || undefined,
      nodeId: item.nodeId || undefined,
    }));
  }

  @UseGuards(AdminGuard)
  @Mutation(() => NodeDto)
  async updateNodeContent(
    @Args("id", { type: () => ID }) id: string,
    @Args("content") content: string,
  ): Promise<NodeDto> {
    const result = await this.grpc.updateNodeContent(id, content) as { node?: NodeDto } | NodeDto;
    const node = (result as any).node ?? result;
    return { ...node, type: normalizeNodeType(node.type) } as NodeDto;
  }

  @UseGuards(AdminGuard)
  @Mutation(() => NodeDto)
  async updateNodeTitle(
    @Args("id", { type: () => ID }) id: string,
    @Args("title") title: string,
  ): Promise<NodeDto> {
    const result = await this.grpc.updateNodeTitle(id, title) as { node?: NodeDto } | NodeDto;
    const node = (result as any).node ?? result;
    return { ...node, type: normalizeNodeType(node.type) } as NodeDto;
  }

  @UseGuards(AdminGuard)
  @Mutation(() => NodeDto)
  async updateNodeCover(
    @Args("id", { type: () => ID }) id: string,
    @Args("coverImage", { nullable: true }) coverImage?: string,
  ): Promise<NodeDto> {
    const result = await this.grpc.updateNodeCover(id, coverImage ?? "") as { node?: NodeDto } | NodeDto;
    const node = (result as any).node ?? result;
    return { ...node, type: normalizeNodeType(node.type) } as NodeDto;
  }

  @UseGuards(AdminGuard)
  @Mutation(() => NodeDto)
  async updateNodeIcon(
    @Args("id", { type: () => ID }) id: string,
    @Args("icon", { nullable: true }) icon?: string,
  ): Promise<NodeDto> {
    const result = await this.grpc.updateNodeIcon(id, icon ?? "") as { node?: NodeDto } | NodeDto;
    const node = (result as any).node ?? result;
    return { ...node, type: normalizeNodeType(node.type) } as NodeDto;
  }
}
