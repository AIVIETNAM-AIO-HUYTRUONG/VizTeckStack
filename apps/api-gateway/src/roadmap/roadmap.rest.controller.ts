import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoadmapGrpcClient } from './roadmap.grpc-client';
import { AdminGuard } from '../auth/admin.guard';
import {
  CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput,
  UpdateNodeContentInput, UpdateNodeTitleInput,
  UpdateNodeCoverInput, UpdateNodeIconInput,
  RoadmapTreeDto,
} from './roadmap.dto';

@ApiTags('roadmaps')
@Controller('api')
export class RoadmapRestController {
  constructor(private readonly grpc: RoadmapGrpcClient) {}

  @Get('roadmaps')
  @ApiOperation({ summary: 'List all roadmaps' })
  getRoadmaps() { return this.grpc.getRoadmaps(); }

  @Get('roadmaps/:slug')
  @ApiOperation({ summary: 'Get roadmap by slug with nodes and edges' })
  @ApiParam({ name: 'slug', type: String })
  async getRoadmap(@Param('slug') slug: string) {
    const [detail, list] = await Promise.all([
      this.grpc.getRoadmap(slug),
      this.grpc.getRoadmaps(),
    ]);
    const idToSlug = new Map<string, string>(
      (list.roadmaps ?? []).map((r: { id: string; slug: string }) => [r.id, r.slug]),
    );
    const nodes = (detail.nodes ?? []).map((n: { type: unknown; targetRoadmapId?: string; [k: string]: unknown }) => ({
      ...n,
      ...(n.targetRoadmapId ? { targetRoadmapSlug: idToSlug.get(n.targetRoadmapId) } : {}),
    }));
    return { ...detail, nodes };
  }

  @Get('roadmaps/:slug/tree')
  @ApiOperation({ summary: 'Get page tree for a roadmap by slug' })
  @ApiParam({ name: 'slug', type: String })
  async getRoadmapTree(@Param('slug') slug: string): Promise<RoadmapTreeDto> {
    return this.grpc.getRoadmapTree(slug);
  }

  @Get('nodes/:id')
  @ApiOperation({ summary: 'Get node detail (includes lesson content)' })
  @ApiParam({ name: 'id', type: String })
  getNode(@Param('id') id: string) { return this.grpc.getNode(id); }

  @UseGuards(AdminGuard)
  @Get('admin/validate')
  @ApiOperation({ summary: 'Validate admin token — returns 200 if valid, 401 if not' })
  @ApiBearerAuth()
  validateToken() { return { ok: true }; }

  @UseGuards(AdminGuard)
  @Post('roadmaps')
  @ApiOperation({ summary: 'Create roadmap' })
  @ApiBearerAuth()
  createRoadmap(@Body() body: CreateRoadmapInput) { return this.grpc.createRoadmap(body); }

  @UseGuards(AdminGuard)
  @Put('roadmaps/:id')
  @ApiOperation({ summary: 'Update roadmap metadata' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateRoadmap(@Param('id') id: string, @Body() body: UpdateRoadmapInput) {
    return this.grpc.updateRoadmap({ id, ...body });
  }

  @UseGuards(AdminGuard)
  @Delete('roadmaps/:id')
  @ApiOperation({ summary: 'Delete roadmap' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  deleteRoadmap(@Param('id') id: string) { return this.grpc.deleteRoadmap(id); }

  @UseGuards(AdminGuard)
  @Post('roadmaps/:id/graph')
  @ApiOperation({ summary: 'Upsert full graph (nodes + edges) for a roadmap' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  upsertGraph(@Param('id') id: string, @Body() body: { nodes: NodeInput[]; edges: EdgeInput[] }) {
    return this.grpc.upsertGraph({ roadmapId: id, ...body });
  }

  @UseGuards(AdminGuard)
  @Patch('nodes/:id/content')
  @ApiOperation({ summary: 'Update lesson content (targeted — no graph upsert)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateNodeContent(@Param('id') id: string, @Body() body: UpdateNodeContentInput) {
    return this.grpc.updateNodeContent(id, body.content);
  }

  @UseGuards(AdminGuard)
  @Patch('nodes/:id/title')
  @ApiOperation({ summary: 'Update node title' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateNodeTitle(@Param('id') id: string, @Body() body: UpdateNodeTitleInput) {
    return this.grpc.updateNodeTitle(id, body.title);
  }

  @UseGuards(AdminGuard)
  @Patch('nodes/:id/cover')
  @ApiOperation({ summary: 'Update node cover image' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateNodeCover(@Param('id') id: string, @Body() body: UpdateNodeCoverInput) {
    return this.grpc.updateNodeCover(id, body.coverImage ?? '');
  }

  @UseGuards(AdminGuard)
  @Patch('nodes/:id/icon')
  @ApiOperation({ summary: 'Update node icon' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateNodeIcon(@Param('id') id: string, @Body() body: UpdateNodeIconInput) {
    return this.grpc.updateNodeIcon(id, body.icon ?? '');
  }

  @Get('nodes/:id/breadcrumb')
  @ApiOperation({ summary: 'Get node breadcrumb path' })
  @ApiParam({ name: 'id', type: String })
  async getNodeBreadcrumb(@Param('id') id: string) {
    const result = await this.grpc.getNodeBreadcrumb(id) as { items?: Array<{ title: string; slug: string; nodeId: string }> };
    return (result.items ?? []).map((item) => ({
      title: item.title,
      slug: item.slug || null,
      nodeId: item.nodeId || null,
    }));
  }
}
