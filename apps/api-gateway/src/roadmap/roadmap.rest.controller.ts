import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoadmapGrpcClient } from './roadmap.grpc-client';
import { AdminGuard } from '../auth/admin.guard';
import { CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput } from './roadmap.dto';

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

  @Get('nodes/:id')
  @ApiOperation({ summary: 'Get node detail (includes lesson content)' })
  @ApiParam({ name: 'id', type: String })
  getNode(@Param('id') id: string) { return this.grpc.getNode(id); }

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
}
