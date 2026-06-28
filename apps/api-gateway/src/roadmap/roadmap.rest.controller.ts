import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { ListRoadmapsUseCase } from '../application/use-cases/roadmap/list-roadmaps.use-case';
import { GetRoadmapUseCase } from '../application/use-cases/roadmap/get-roadmap.use-case';
import { CreateRoadmapUseCase } from '../application/use-cases/roadmap/create-roadmap.use-case';
import { UpdateRoadmapUseCase } from '../application/use-cases/roadmap/update-roadmap.use-case';
import { DeleteRoadmapUseCase } from '../application/use-cases/roadmap/delete-roadmap.use-case';
import { UpsertGraphUseCase } from '../application/use-cases/roadmap/upsert-graph.use-case';
import { GetRoadmapTreeUseCase } from '../application/use-cases/roadmap/get-roadmap-tree.use-case';
import { SearchNodesUseCase } from '../application/use-cases/roadmap/search-nodes.use-case';
import { GetNodeUseCase } from '../application/use-cases/node/get-node.use-case';
import { GetNodeBreadcrumbUseCase } from '../application/use-cases/node/get-node-breadcrumb.use-case';
import { UpdateNodeContentUseCase } from '../application/use-cases/node/update-node-content.use-case';
import { UpdateNodeTitleUseCase } from '../application/use-cases/node/update-node-title.use-case';
import { UpdateNodeCoverUseCase } from '../application/use-cases/node/update-node-cover.use-case';
import { UpdateNodeIconUseCase } from '../application/use-cases/node/update-node-icon.use-case';
import {
  CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput,
  UpdateNodeContentInput, UpdateNodeTitleInput, UpdateNodeCoverInput, UpdateNodeIconInput,
  RoadmapTreeDto, SearchResultDto,
} from './roadmap.dto';

@ApiTags('roadmaps')
@Controller('api')
export class RoadmapRestController {
  constructor(
    private readonly listRoadmapsUseCase: ListRoadmapsUseCase,
    private readonly getRoadmapUseCase: GetRoadmapUseCase,
    private readonly createRoadmapUseCase: CreateRoadmapUseCase,
    private readonly updateRoadmapUseCase: UpdateRoadmapUseCase,
    private readonly deleteRoadmapUseCase: DeleteRoadmapUseCase,
    private readonly upsertGraphUseCase: UpsertGraphUseCase,
    private readonly getRoadmapTreeUseCase: GetRoadmapTreeUseCase,
    private readonly searchNodesUseCase: SearchNodesUseCase,
    private readonly getNodeUseCase: GetNodeUseCase,
    private readonly getNodeBreadcrumbUseCase: GetNodeBreadcrumbUseCase,
    private readonly updateNodeContentUseCase: UpdateNodeContentUseCase,
    private readonly updateNodeTitleUseCase: UpdateNodeTitleUseCase,
    private readonly updateNodeCoverUseCase: UpdateNodeCoverUseCase,
    private readonly updateNodeIconUseCase: UpdateNodeIconUseCase,
  ) {}

  @Get('roadmaps')
  @ApiOperation({ summary: 'List all roadmaps' })
  getRoadmaps() { return this.listRoadmapsUseCase.execute(); }

  @Get('roadmaps/:slug')
  @ApiOperation({ summary: 'Get roadmap by slug with nodes and edges' })
  @ApiParam({ name: 'slug', type: String })
  async getRoadmap(@Param('slug') slug: string) {
    const [detail, allRoadmaps] = await Promise.all([
      this.getRoadmapUseCase.execute(slug),
      this.listRoadmapsUseCase.execute(),
    ]);
    if (!detail) return null;
    const idToSlug = new Map(allRoadmaps.map(r => [r.id, r.slug]));
    return {
      ...detail,
      nodes: detail.nodes.map(n => ({
        ...n,
        content: n.content ? JSON.stringify(n.content) : undefined,
        targetRoadmapSlug: n.targetRoadmapId ? idToSlug.get(n.targetRoadmapId) : undefined,
      })),
    };
  }

  @Get('roadmaps/:slug/tree')
  @ApiOperation({ summary: 'Get page tree for a roadmap by slug' })
  @ApiParam({ name: 'slug', type: String })
  getRoadmapTree(@Param('slug') slug: string): Promise<RoadmapTreeDto> {
    return this.getRoadmapTreeUseCase.execute(slug) as Promise<RoadmapTreeDto>;
  }

  @Get('nodes/:id')
  @ApiOperation({ summary: 'Get node detail (includes lesson content)' })
  @ApiParam({ name: 'id', type: String })
  async getNode(@Param('id') id: string) {
    const detail = await this.getNodeUseCase.execute(id);
    if (!detail) return null;
    return { ...detail.node, content: detail.node.content ? JSON.stringify(detail.node.content) : undefined };
  }

  @UseGuards(AdminGuard)
  @Get('admin/validate')
  @ApiOperation({ summary: 'Validate admin token — returns 200 if valid, 401 if not' })
  @ApiBearerAuth()
  validateToken() { return { ok: true }; }

  @UseGuards(AdminGuard)
  @Post('roadmaps')
  @ApiOperation({ summary: 'Create roadmap' })
  @ApiBearerAuth()
  createRoadmap(@Body() body: CreateRoadmapInput) { return this.createRoadmapUseCase.execute(body); }

  @UseGuards(AdminGuard)
  @Put('roadmaps/:id')
  @ApiOperation({ summary: 'Update roadmap metadata' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateRoadmap(@Param('id') id: string, @Body() body: UpdateRoadmapInput) {
    return this.updateRoadmapUseCase.execute(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete('roadmaps/:id')
  @ApiOperation({ summary: 'Delete roadmap' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  deleteRoadmap(@Param('id') id: string) { return this.deleteRoadmapUseCase.execute(id); }

  @UseGuards(AdminGuard)
  @Post('roadmaps/:id/graph')
  @ApiOperation({ summary: 'Upsert full graph (nodes + edges) for a roadmap' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  upsertGraph(@Param('id') id: string, @Body() body: { nodes: NodeInput[]; edges: EdgeInput[] }) {
    const nodeInputs = body.nodes.map(n => ({ ...n, type: n.type as 'ROADMAP' | 'LESSON', content: n.content ? JSON.parse(n.content) : null }));
    return this.upsertGraphUseCase.execute(id, nodeInputs, body.edges);
  }

  @UseGuards(AdminGuard)
  @Patch('nodes/:id/content')
  @ApiOperation({ summary: 'Update lesson content (targeted — no graph upsert)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateNodeContent(@Param('id') id: string, @Body() body: UpdateNodeContentInput) {
    return this.updateNodeContentUseCase.execute(id, body.content);
  }

  @UseGuards(AdminGuard)
  @Patch('nodes/:id/title')
  @ApiOperation({ summary: 'Update node title' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateNodeTitle(@Param('id') id: string, @Body() body: UpdateNodeTitleInput) {
    return this.updateNodeTitleUseCase.execute(id, body.title);
  }

  @UseGuards(AdminGuard)
  @Patch('nodes/:id/cover')
  @ApiOperation({ summary: 'Update node cover image' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateNodeCover(@Param('id') id: string, @Body() body: UpdateNodeCoverInput) {
    return this.updateNodeCoverUseCase.execute(id, body.coverImage ?? '');
  }

  @UseGuards(AdminGuard)
  @Patch('nodes/:id/icon')
  @ApiOperation({ summary: 'Update node icon' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateNodeIcon(@Param('id') id: string, @Body() body: UpdateNodeIconInput) {
    return this.updateNodeIconUseCase.execute(id, body.icon ?? '');
  }

  @UseGuards(AdminGuard)
  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search nodes and roadmaps (full-text) — Swagger docs only, use GraphQL in FE' })
  async searchNodes(
    @Query('q') q: string,
    @Query('titleOnly') titleOnly?: string,
    @Query('roadmapId') roadmapId?: string,
  ): Promise<SearchResultDto[]> {
    const results = await this.searchNodesUseCase.execute({ q: q ?? '', titleOnly: titleOnly === 'true', roadmapId }, true);
    return results.map(r => ({ ...r, updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt })) as SearchResultDto[];
  }

  @Get('nodes/:id/breadcrumb')
  @ApiOperation({ summary: 'Get node breadcrumb path' })
  @ApiParam({ name: 'id', type: String })
  async getNodeBreadcrumb(@Param('id') id: string) {
    const items = await this.getNodeBreadcrumbUseCase.execute(id);
    return items.map(item => ({ title: item.title, slug: item.slug ?? null, nodeId: item.nodeId ?? null }));
  }
}
