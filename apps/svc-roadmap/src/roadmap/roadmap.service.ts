import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status as GrpcStatus } from "@grpc/grpc-js";
import { Prisma, db, type Roadmap, type Node as PrismaNode } from "@vizteck/db";
import {
  Empty,
  RoadmapList,
  SlugRequest,
  RoadmapDetail,
  IdRequest,
  NodeDetail,
  CreateRoadmapRequest,
  RoadmapItem,
  UpdateRoadmapRequest,
  BoolResponse,
  UpsertGraphRequest,
  UpdateNodeContentRequest,
  UpdateNodeTitleRequest,
  UpdateNodeCoverRequest,
  UpdateNodeIconRequest,
  BreadcrumbResponse,
  NodeItem,
  RoadmapTreeRequest,
  RoadmapTreeResponse,
  RoadmapTreeNode,
  SearchRequest,
  SearchResponse,
} from "@vizteck/proto";

function toRoadmapItem(r: Roadmap): RoadmapItem {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description ?? "",
    coverImage: r.coverImage ?? "",
    status: r.status ?? "DRAFT",
  };
}

function toNodeItem(n: PrismaNode): NodeItem {
  return {
    id: n.id,
    roadmapId: n.roadmapId,
    type: n.type === "ROADMAP" ? 0 : 1,
    title: n.title,
    positionX: n.positionX ?? 0,
    positionY: n.positionY ?? 0,
    targetRoadmapId: n.targetRoadmapId ?? "",
    content: n.content ? JSON.stringify(n.content) : "",
    coverImage: n.coverImage ?? "",
    icon: n.icon ?? "",
  };
}

@Injectable()
export class RoadmapService {
  async getRoadmaps(_: Empty): Promise<RoadmapList> {
    const roadmaps = await db.roadmap.findMany({
      orderBy: { createdAt: "asc" },
    });
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
      edges: allEdges.map((e: any) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        label: e.label ?? "",
      })),
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
      targetRoadmap: node.targetRoadmap
        ? toRoadmapItem(node.targetRoadmap)
        : undefined,
    };
  }

  async createRoadmap(req: CreateRoadmapRequest): Promise<RoadmapItem> {
    try {
      const r = await db.roadmap.create({
        data: {
          slug: req.slug,
          title: req.title,
          description: req.description || null,
          coverImage: req.coverImage || null,
        },
      });
      return toRoadmapItem(r);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new RpcException({
          code: GrpcStatus.ALREADY_EXISTS,
          message: `Roadmap with slug '${req.slug}' already exists`,
        });
      }
      throw e;
    }
  }

  async updateRoadmap(req: UpdateRoadmapRequest): Promise<RoadmapItem> {
    try {
      const r = await db.roadmap.update({
        where: { id: req.id },
        data: {
          title: req.title || undefined,
          description: req.description || undefined,
          coverImage: req.coverImage || undefined,
          // status is a string on the wire; only update if provided
          ...(req.status ? { status: req.status as any } : {}),
        },
      });
      return toRoadmapItem(r);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          message: `Roadmap '${req.id}' not found`,
        });
      }
      throw e;
    }
  }

  async deleteRoadmap({ id }: IdRequest): Promise<BoolResponse> {
    try {
      await db.roadmap.delete({ where: { id } });
      return { success: true };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          message: `Roadmap '${id}' not found`,
        });
      }
      throw e;
    }
  }

  async upsertGraph(req: UpsertGraphRequest): Promise<RoadmapDetail> {
    try {
      await db.$transaction(async (tx: any) => {
        // Delete edges first (FK constraint), then nodes
        const existingNodes = await tx.node.findMany({
          where: { roadmapId: req.roadmapId },
          select: { id: true },
        });
        const nodeIds = existingNodes.map((n: any) => n.id);
        await tx.edge.deleteMany({ where: { sourceId: { in: nodeIds } } });
        await tx.node.deleteMany({ where: { roadmapId: req.roadmapId } });

        for (const n of req.nodes ?? []) {
          await tx.node.create({
            data: {
              id: n.id || undefined,
              roadmap: { connect: { id: req.roadmapId } },
              type: n.type === 0 ? "ROADMAP" : "LESSON",
              title: n.title,
              // proto3 double defaults to 0 for unset — treat 0 as unplaced (null in DB)
              ...(n.positionX ? { positionX: n.positionX } : {}),
              ...(n.positionY ? { positionY: n.positionY } : {}),
              ...(n.targetRoadmapId
                ? { targetRoadmap: { connect: { id: n.targetRoadmapId } } }
                : {}),
              content: n.content ? JSON.parse(n.content) : null,
            },
          });
        }

        for (const e of req.edges ?? []) {
          await tx.edge.create({
            data: {
              sourceId: e.sourceId,
              targetId: e.targetId,
              label: e.label || null,
            },
          });
        }
      });
    } catch (err: any) {
      console.error("[upsertGraph] transaction error:", err?.message ?? err);
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: err?.message ?? "upsertGraph failed",
      });
    }

    const roadmap = await db.roadmap.findUnique({
      where: { id: req.roadmapId },
      select: { slug: true },
    });
    return this.getRoadmap({ slug: roadmap?.slug ?? "" });
  }

  async updateNodeContent({
    id,
    content,
  }: UpdateNodeContentRequest): Promise<NodeItem> {
    try {
      const node = await db.node.update({
        where: { id },
        data: { content: content ? JSON.parse(content) : null },
      });
      return toNodeItem(node);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          message: `Node '${id}' not found`,
        });
      }
      throw e;
    }
  }

  async updateNodeTitle({
    id,
    title,
  }: UpdateNodeTitleRequest): Promise<NodeItem> {
    try {
      const node = await db.node.update({
        where: { id },
        data: { title },
      });
      return toNodeItem(node);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          message: `Node '${id}' not found`,
        });
      }
      throw e;
    }
  }

  async updateNodeCover({
    id,
    coverImage,
  }: UpdateNodeCoverRequest): Promise<NodeItem> {
    try {
      const node = await db.node.update({
        where: { id },
        data: { coverImage: coverImage || null },
      });
      return toNodeItem(node);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          message: `Node '${id}' not found`,
        });
      }
      throw e;
    }
  }

  async updateNodeIcon({ id, icon }: UpdateNodeIconRequest): Promise<NodeItem> {
    try {
      const node = await db.node.update({
        where: { id },
        data: { icon: icon || null },
      });
      return toNodeItem(node);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          message: `Node '${id}' not found`,
        });
      }
      throw e;
    }
  }

  async getRoadmapTree({
    slug,
  }: RoadmapTreeRequest): Promise<RoadmapTreeResponse> {
    const root = await db.roadmap.findUnique({ where: { slug } });
    if (!root) return { rootSlug: "", rootTitle: "", nodes: [] };

    const rootNodes = await db.node.findMany({ where: { roadmapId: root.id } });

    // N+1 queries intentional at depth-2 fixed scope: 1 root + 2 per ROADMAP node.
    // When depth > 2 is needed, replace with a single Prisma query using include.
    const nodes: RoadmapTreeNode[] = await Promise.all(
      rootNodes.map(async (n): Promise<RoadmapTreeNode> => {
        if (n.type === "LESSON") {
          return {
            id: n.id,
            title: n.title,
            type: "LESSON",
            slug: "",
            targetRoadmapId: "",
            roadmapSlug: root.slug,
            roadmapId: root.id,
            children: [],
          };
        }
        // ROADMAP node
        if (!n.targetRoadmapId) {
          return {
            id: n.id,
            title: n.title,
            type: "ROADMAP",
            slug: "",
            targetRoadmapId: "",
            roadmapSlug: "",
            roadmapId: "",
            children: [],
          };
        }
        const subRoadmap = await db.roadmap.findUnique({
          where: { id: n.targetRoadmapId },
        });
        if (!subRoadmap) {
          return {
            id: n.id,
            title: n.title,
            type: "ROADMAP",
            slug: "",
            targetRoadmapId: n.targetRoadmapId,
            roadmapSlug: "",
            roadmapId: "",
            children: [],
          };
        }
        const subNodes = await db.node.findMany({
          where: { roadmapId: subRoadmap.id },
        });
        const children: RoadmapTreeNode[] = subNodes.map((sn) => ({
          id: sn.id,
          title: sn.title,
          type: sn.type,
          slug: "",
          targetRoadmapId: sn.targetRoadmapId ?? "",
          roadmapSlug: subRoadmap.slug,
          roadmapId: subRoadmap.id,
          children: [],
        }));
        return {
          id: n.id,
          title: n.title,
          type: "ROADMAP",
          slug: subRoadmap.slug,
          targetRoadmapId: subRoadmap.id,
          roadmapSlug: "",
          roadmapId: "",
          children,
        };
      }),
    );

    return { rootSlug: root.slug, rootTitle: root.title, nodes };
  }

  async searchNodes({
    q,
    titleOnly,
    roadmapId,
  }: SearchRequest): Promise<SearchResponse> {
    type Row = {
      id: string;
      type: string;
      title: string;
      icon: string | null;
      coverImage: string | null;
      roadmapId: string;
      updatedAt: Date;
      roadmapSlug: string;
      roadmapTitle: string;
    };
    const toResult = (row: Row) => ({
      id: row.id,
      type: row.type === "ROADMAP" ? 0 : 1,
      title: row.title,
      icon: row.icon ?? "",
      coverImage: row.coverImage ?? "",
      roadmapSlug: row.roadmapSlug,
      roadmapTitle: row.roadmapTitle,
      roadmapId: row.roadmapId,
      updatedAt: row.updatedAt.toISOString(),
      breadcrumb: [row.roadmapTitle, row.title],
    });

    const isEmptyQuery = !q || q.length === 0;

    if (!isEmptyQuery && q.length < 2) return { results: [] };

    if (isEmptyQuery) {
      const whereClause = roadmapId
        ? Prisma.sql`WHERE n."roadmapId" = ${roadmapId}`
        : Prisma.empty;
      const rows = await db.$queryRaw<Row[]>`
        SELECT n.id, n.type, n.title, n.icon,
               n."coverImage", n."roadmapId", n."updatedAt",
               r.slug as "roadmapSlug", r.title as "roadmapTitle"
        FROM "Node" n
        JOIN "Roadmap" r ON n."roadmapId" = r.id
        ${whereClause}
        ORDER BY r.title ASC, n."updatedAt" DESC
        LIMIT 50
      `;
      return { results: rows.map(toResult) };
    }

    const like = `%${q}%`;
    const contentClause = titleOnly
      ? Prisma.empty
      : Prisma.sql`OR n.content::text ILIKE ${like}`;
    const roadmapClause = roadmapId
      ? Prisma.sql`AND n."roadmapId" = ${roadmapId}`
      : Prisma.empty;

    const rows = await db.$queryRaw<Row[]>`
      SELECT n.id, n.type, n.title, n.icon,
             n."coverImage", n."roadmapId", n."updatedAt",
             r.slug as "roadmapSlug", r.title as "roadmapTitle"
      FROM "Node" n
      JOIN "Roadmap" r ON n."roadmapId" = r.id
      WHERE (n.title ILIKE ${like} ${contentClause})
      ${roadmapClause}
      ORDER BY n."updatedAt" DESC
      LIMIT 20
    `;

    return { results: rows.map(toResult) };
  }

  async getNodeBreadcrumb({ id }: IdRequest): Promise<BreadcrumbResponse> {
    const node = await db.node.findUnique({ where: { id } });
    if (!node) return { items: [] };

    const chain: Array<{ title: string; slug: string; nodeId: string }> = [];
    chain.unshift({ title: node.title, slug: "", nodeId: node.id });

    let currentRoadmapId = node.roadmapId;
    const visited = new Set<string>();

    while (true) {
      if (visited.has(currentRoadmapId)) break;
      visited.add(currentRoadmapId);

      const parentNode = await db.node.findFirst({
        where: { type: "ROADMAP", targetRoadmapId: currentRoadmapId },
        include: { targetRoadmap: true },
      });

      if (parentNode) {
        chain.unshift({
          title: parentNode.title,
          slug: parentNode.targetRoadmap?.slug ?? "",
          nodeId: parentNode.id,
        });
        currentRoadmapId = parentNode.roadmapId;
      } else {
        const rootRoadmap = await db.roadmap.findUnique({
          where: { id: currentRoadmapId },
        });
        if (rootRoadmap) {
          chain.unshift({
            title: rootRoadmap.title,
            slug: rootRoadmap.slug,
            nodeId: "",
          });
        }
        break;
      }
    }

    return { items: chain };
  }
}
