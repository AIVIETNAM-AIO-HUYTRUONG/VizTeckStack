import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Prisma, db } from '@vizteck/db';
import type { IRoadmapRepository, CreateRoadmapData, UpdateRoadmapData, NodeInputData, EdgeInputData, RoadmapDetail, NodeDetail, BreadcrumbItem, SearchParams, SearchResult, RoadmapTree, RoadmapTreeNode } from '../../domain/repositories/roadmap.repository';
import type { Roadmap } from '../../domain/entities/roadmap.entity';
import type { Node, NodeUpdateData } from '../../domain/entities/node.entity';
import type { Edge } from '../../domain/entities/edge.entity';

@Injectable()
export class PrismaRoadmapRepository implements IRoadmapRepository {
  findAll(): Promise<Roadmap[]> {
    return db.roadmap.findMany({ orderBy: { createdAt: 'asc' } }) as Promise<Roadmap[]>;
  }

  async findBySlug(slug: string): Promise<RoadmapDetail | null> {
    const r = await db.roadmap.findUnique({
      where: { slug },
      include: { nodes: { include: { edges: true } } },
    });
    if (!r) return null;
    const edges: Edge[] = r.nodes.flatMap((n: any) => n.edges);
    return { roadmap: r as Roadmap, nodes: r.nodes as Node[], edges };
  }

  async findNodeById(id: string): Promise<NodeDetail | null> {
    const node = await db.node.findUnique({
      where: { id },
      include: { targetRoadmap: true },
    });
    if (!node) return null;
    return {
      node: node as Node,
      targetRoadmap: node.targetRoadmap as Roadmap | null,
    };
  }

  async create(data: CreateRoadmapData): Promise<Roadmap> {
    try {
      return await db.roadmap.create({ data }) as Roadmap;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Roadmap with slug '${data.slug}' already exists`);
      }
      throw e;
    }
  }

  async update(id: string, data: UpdateRoadmapData): Promise<Roadmap> {
    try {
      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.coverImage) updateData.coverImage = data.coverImage;
      if (data.status) updateData.status = data.status;
      return await db.roadmap.update({ where: { id }, data: updateData }) as Roadmap;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`Roadmap '${id}' not found`);
      }
      throw e;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await db.roadmap.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`Roadmap '${id}' not found`);
      }
      throw e;
    }
  }

  async upsertGraph(roadmapId: string, nodes: NodeInputData[], edges: EdgeInputData[]): Promise<RoadmapDetail> {
    try {
      await db.$transaction(async (tx: any) => {
        const existingNodes = await tx.node.findMany({ where: { roadmapId }, select: { id: true } });
        const nodeIds = existingNodes.map((n: any) => n.id);
        await tx.edge.deleteMany({ where: { sourceId: { in: nodeIds } } });
        await tx.node.deleteMany({ where: { roadmapId } });

        for (const n of nodes) {
          await tx.node.create({
            data: {
              id: n.id || undefined,
              roadmap: { connect: { id: roadmapId } },
              type: n.type === 'ROADMAP' ? 'ROADMAP' : 'LESSON',
              title: n.title,
              ...(n.positionX ? { positionX: n.positionX } : {}),
              ...(n.positionY ? { positionY: n.positionY } : {}),
              ...(n.targetRoadmapId ? { targetRoadmap: { connect: { id: n.targetRoadmapId } } } : {}),
              content: n.content ?? null,
            },
          });
        }

        for (const e of edges) {
          await tx.edge.create({ data: { sourceId: e.sourceId, targetId: e.targetId, label: e.label ?? null } });
        }
      });
    } catch (err: any) {
      throw new InternalServerErrorException(err?.message ?? 'upsertGraph failed');
    }

    const roadmap = await db.roadmap.findUnique({ where: { id: roadmapId }, select: { slug: true } });
    const detail = await this.findBySlug(roadmap?.slug ?? '');
    return detail!;
  }

  async updateNodeField(id: string, data: NodeUpdateData): Promise<Node> {
    try {
      return await db.node.update({ where: { id }, data: data as any }) as Node;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`Node '${id}' not found`);
      }
      throw e;
    }
  }

  async getNodeBreadcrumb(id: string): Promise<BreadcrumbItem[]> {
    const node = await db.node.findUnique({ where: { id } });
    if (!node) return [];

    const chain: BreadcrumbItem[] = [];
    chain.unshift({ title: node.title, slug: null, nodeId: node.id });

    let currentRoadmapId = node.roadmapId;
    const visited = new Set<string>();

    while (true) {
      if (visited.has(currentRoadmapId)) break;
      visited.add(currentRoadmapId);

      const parentNode = await db.node.findFirst({
        where: { type: 'ROADMAP', targetRoadmapId: currentRoadmapId },
        include: { targetRoadmap: true },
      });

      if (parentNode) {
        chain.unshift({ title: parentNode.title, slug: (parentNode as any).targetRoadmap?.slug ?? null, nodeId: parentNode.id });
        currentRoadmapId = parentNode.roadmapId;
      } else {
        const rootRoadmap = await db.roadmap.findUnique({ where: { id: currentRoadmapId } });
        if (rootRoadmap) chain.unshift({ title: rootRoadmap.title, slug: rootRoadmap.slug, nodeId: null });
        break;
      }
    }

    return chain;
  }

  async getRoadmapTree(slug: string): Promise<RoadmapTree> {
    const root = await db.roadmap.findUnique({ where: { slug } });
    if (!root) return { rootSlug: '', rootTitle: '', nodes: [] };

    const rootNodes = await db.node.findMany({ where: { roadmapId: root.id } });

    // ponytail: N+1 intentional at depth-2 fixed scope — replace with include when depth > 2 is needed
    const nodes: RoadmapTreeNode[] = await Promise.all(
      rootNodes.map(async (n: any): Promise<RoadmapTreeNode> => {
        if (n.type === 'LESSON') {
          return { id: n.id, title: n.title, type: 'LESSON', slug: null, targetRoadmapId: null, roadmapSlug: root.slug, roadmapId: root.id, children: [] };
        }
        if (!n.targetRoadmapId) {
          return { id: n.id, title: n.title, type: 'ROADMAP', slug: null, targetRoadmapId: null, roadmapSlug: null, roadmapId: null, children: [] };
        }
        const subRoadmap = await db.roadmap.findUnique({ where: { id: n.targetRoadmapId } });
        if (!subRoadmap) {
          return { id: n.id, title: n.title, type: 'ROADMAP', slug: null, targetRoadmapId: n.targetRoadmapId, roadmapSlug: null, roadmapId: null, children: [] };
        }
        const subNodes = await db.node.findMany({ where: { roadmapId: subRoadmap.id } });
        const children: RoadmapTreeNode[] = subNodes.map((sn: any) => ({
          id: sn.id, title: sn.title, type: sn.type, slug: null,
          targetRoadmapId: sn.targetRoadmapId ?? null, roadmapSlug: subRoadmap.slug, roadmapId: subRoadmap.id, children: [],
        }));
        return { id: n.id, title: n.title, type: 'ROADMAP', slug: subRoadmap.slug, targetRoadmapId: subRoadmap.id, roadmapSlug: null, roadmapId: null, children };
      }),
    );

    return { rootSlug: root.slug, rootTitle: root.title, nodes };
  }

  async searchNodes({ q, titleOnly, roadmapId }: SearchParams): Promise<SearchResult[]> {
    type Row = { id: string; type: string; title: string; icon: string | null; coverImage: string | null; roadmapId: string; updatedAt: Date; roadmapSlug: string; roadmapTitle: string };
    const toResult = (row: Row): SearchResult => ({
      id: row.id, type: row.type === 'ROADMAP' ? 'ROADMAP' : 'LESSON',
      title: row.title, icon: row.icon, coverImage: row.coverImage,
      roadmapSlug: row.roadmapSlug, roadmapTitle: row.roadmapTitle,
      roadmapId: row.roadmapId, updatedAt: row.updatedAt,
      breadcrumb: [row.roadmapTitle, row.title],
    });

    const isEmptyQuery = !q || q.length === 0;
    if (!isEmptyQuery && q.length < 2) return [];

    if (isEmptyQuery) {
      const whereClause = roadmapId ? Prisma.sql`WHERE n."roadmapId" = ${roadmapId}` : Prisma.empty;
      const rows = await db.$queryRaw<Row[]>`
        SELECT n.id, n.type, n.title, n.icon, n."coverImage", n."roadmapId", n."updatedAt",
               r.slug as "roadmapSlug", r.title as "roadmapTitle"
        FROM "Node" n JOIN "Roadmap" r ON n."roadmapId" = r.id
        ${whereClause}
        ORDER BY r.title ASC, n."updatedAt" DESC LIMIT 50
      `;
      return rows.map(toResult);
    }

    const like = `%${q}%`;
    const contentClause = titleOnly ? Prisma.empty : Prisma.sql`OR n.content::text ILIKE ${like}`;
    const roadmapClause = roadmapId ? Prisma.sql`AND n."roadmapId" = ${roadmapId}` : Prisma.empty;

    const rows = await db.$queryRaw<Row[]>`
      SELECT n.id, n.type, n.title, n.icon, n."coverImage", n."roadmapId", n."updatedAt",
             r.slug as "roadmapSlug", r.title as "roadmapTitle"
      FROM "Node" n JOIN "Roadmap" r ON n."roadmapId" = r.id
      WHERE (n.title ILIKE ${like} ${contentClause}) ${roadmapClause}
      ORDER BY n."updatedAt" DESC LIMIT 20
    `;
    return rows.map(toResult);
  }
}
