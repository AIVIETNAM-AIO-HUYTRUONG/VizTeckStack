import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/types';
import { GetNodeUseCase } from '../application/use-cases/node/get-node.use-case';
import { GetNodeBreadcrumbUseCase } from '../application/use-cases/node/get-node-breadcrumb.use-case';
import { UpdateNodeContentUseCase } from '../application/use-cases/node/update-node-content.use-case';
import { UpdateNodeTitleUseCase } from '../application/use-cases/node/update-node-title.use-case';
import { UpdateNodeCoverUseCase } from '../application/use-cases/node/update-node-cover.use-case';
import { UpdateNodeIconUseCase } from '../application/use-cases/node/update-node-icon.use-case';
import { NodeDto, BreadcrumbItemDto } from './roadmap.dto';

function toNodeDto(node: any): NodeDto {
  const type = node.type === 'ROADMAP' ? 'ROADMAP' : 'LESSON';
  return { ...node, type, content: node.content ? JSON.stringify(node.content) : undefined };
}

@Resolver()
export class NodeResolver {
  constructor(
    private readonly getNodeUseCase: GetNodeUseCase,
    private readonly getNodeBreadcrumbUseCase: GetNodeBreadcrumbUseCase,
    private readonly updateNodeContentUseCase: UpdateNodeContentUseCase,
    private readonly updateNodeTitleUseCase: UpdateNodeTitleUseCase,
    private readonly updateNodeCoverUseCase: UpdateNodeCoverUseCase,
    private readonly updateNodeIconUseCase: UpdateNodeIconUseCase,
  ) {}

  @Query(() => NodeDto, { nullable: true })
  async node(@Args('id', { type: () => ID }) id: string): Promise<NodeDto | null> {
    const detail = await this.getNodeUseCase.execute(id);
    if (!detail) return null;
    return toNodeDto(detail.node);
  }

  @Query(() => [BreadcrumbItemDto])
  async nodeBreadcrumb(@Args('id', { type: () => ID }) id: string): Promise<BreadcrumbItemDto[]> {
    const items = await this.getNodeBreadcrumbUseCase.execute(id);
    return items.map(item => ({ title: item.title, slug: item.slug ?? undefined, nodeId: item.nodeId ?? undefined }));
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.SUPER_ADMIN)
  @Mutation(() => NodeDto)
  async updateNodeContent(@Args('id', { type: () => ID }) id: string, @Args('content') content: string): Promise<NodeDto> {
    return toNodeDto(await this.updateNodeContentUseCase.execute(id, content));
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.SUPER_ADMIN)
  @Mutation(() => NodeDto)
  async updateNodeTitle(@Args('id', { type: () => ID }) id: string, @Args('title') title: string): Promise<NodeDto> {
    return toNodeDto(await this.updateNodeTitleUseCase.execute(id, title));
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.SUPER_ADMIN)
  @Mutation(() => NodeDto)
  async updateNodeCover(@Args('id', { type: () => ID }) id: string, @Args('coverImage', { nullable: true }) coverImage?: string): Promise<NodeDto> {
    return toNodeDto(await this.updateNodeCoverUseCase.execute(id, coverImage ?? ''));
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.SUPER_ADMIN)
  @Mutation(() => NodeDto)
  async updateNodeIcon(@Args('id', { type: () => ID }) id: string, @Args('icon', { nullable: true }) icon?: string): Promise<NodeDto> {
    return toNodeDto(await this.updateNodeIconUseCase.execute(id, icon ?? ''));
  }
}
