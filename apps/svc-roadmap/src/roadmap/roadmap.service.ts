import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma, db } from '@vizteck/db';
import {
  Empty, RoadmapList, SlugRequest, RoadmapDetail, IdRequest,
  NodeDetail, CreateRoadmapRequest, RoadmapItem, UpdateRoadmapRequest,
  BoolResponse, UpsertGraphRequest,
} from '@vizteck/proto';

function toRoadmapItem(r: any): RoadmapItem {
  return { id: r.id, slug: r.slug, title: r.title, description: r.description ?? '', coverImage: r.coverImage ?? '' };
}

function toNodeItem(n: any) {
  return {
    id: n.id, roadmapId: n.roadmapId,
    type: n.type === 'ROADMAP' ? 0 : 1,
    title: n.title, positionX: n.positionX, positionY: n.positionY,
    targetRoadmapId: n.targetRoadmapId ?? '',
    content: n.content ? JSON.stringify(n.content) : '',
  };
}

@Injectable()
export class RoadmapService {
  async getRoadmaps(_: Empty): Promise<RoadmapList> {
    const roadmaps = await db.roadmap.findMany({ orderBy: { createdAt: 'asc' } });
    return { roadmaps: roadmaps.map(toRoadmapItem) };
  }

  async getRoadmap({ slug }: SlugRequest): Promise<RoadmapDetail> {
    const roadmap = await db.roadmap.findUnique({
      where: { slug },
      include: { nodes: { include: { edges: true } } },
    });
    if (!roadmap) return { roadmap: undefined, nodes: [], edges: [] };

    const allEdges = roadmap.nodes.flatMap((n: any) => n.edges);
    return {
      roadmap: toRoadmapItem(roadmap),
      nodes: roadmap.nodes.map(toNodeItem),
      edges: allEdges.map((e: any) => ({ id: e.id, sourceId: e.sourceId, targetId: e.targetId, label: e.label ?? '' })),
    };
  }

  async getNode({ id }: IdRequest): Promise<NodeDetail> {
    const node = await db.node.findUnique({
      where: { id },
      include: { targetRoadmap: true },
    });
    if (!node) return { node: undefined, targetRoadmap: undefined };
    return {
      node: toNodeItem(node),
      targetRoadmap: node.targetRoadmap ? toRoadmapItem(node.targetRoadmap) : undefined,
    };
  }

  async createRoadmap(req: CreateRoadmapRequest): Promise<RoadmapItem> {
    try {
      const r = await db.roadmap.create({
        data: { slug: req.slug, title: req.title, description: req.description || null, coverImage: req.coverImage || null },
      });
      return toRoadmapItem(r);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new RpcException({ code: 6, message: `Roadmap with slug '${req.slug}' already exists` });
      }
      throw e;
    }
  }

  async updateRoadmap(req: UpdateRoadmapRequest): Promise<RoadmapItem> {
    const r = await db.roadmap.update({
      where: { id: req.id },
      data: { title: req.title || undefined, description: req.description || undefined, coverImage: req.coverImage || undefined },
    });
    return toRoadmapItem(r);
  }

  async deleteRoadmap({ id }: IdRequest): Promise<BoolResponse> {
    await db.roadmap.delete({ where: { id } });
    return { success: true };
  }

  async upsertGraph(req: UpsertGraphRequest): Promise<RoadmapDetail> {
    await db.$transaction(async (tx: any) => {
      // Delete edges first (FK constraint), then nodes
      const existingNodes = await tx.node.findMany({ where: { roadmapId: req.roadmapId }, select: { id: true } });
      const nodeIds = existingNodes.map((n: any) => n.id);
      await tx.edge.deleteMany({ where: { sourceId: { in: nodeIds } } });
      await tx.node.deleteMany({ where: { roadmapId: req.roadmapId } });

      for (const n of req.nodes ?? []) {
        await tx.node.create({
          data: {
            id: n.id || undefined,
            roadmapId: req.roadmapId,
            type: n.type === 0 ? 'ROADMAP' : 'LESSON',
            title: n.title,
            positionX: n.positionX ?? null,
            positionY: n.positionY ?? null,
            targetRoadmapId: n.targetRoadmapId || null,
            content: n.content ? JSON.parse(n.content) : null,
          },
        });
      }

      for (const e of req.edges ?? []) {
        await tx.edge.create({
          data: { sourceId: e.sourceId, targetId: e.targetId, label: e.label || null },
        });
      }
    });

    const roadmap = await db.roadmap.findUnique({
      where: { id: req.roadmapId },
      select: { slug: true },
    });
    return this.getRoadmap({ slug: roadmap?.slug ?? '' });
  }
}
