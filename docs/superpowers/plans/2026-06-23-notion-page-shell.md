# Notion Page Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the lesson page into a Notion-style page with hero cover image, emoji/icon picker, nested breadcrumb, and full-width content — admin has full edit rights, web is read-only display.

**Architecture:** Feature slices across DB → Proto → svc-roadmap → api-gateway → packages/lesson (shared UI) → apps/admin → apps/web. Upload handled client-side via Uploadthing in admin (no api-gateway change). Shared display components live in `packages/lesson`; admin-specific edit controls live in `apps/admin`.

**Tech Stack:** Prisma (DB migration), gRPC/Protobuf (internal), NestJS REST + GraphQL/Apollo (API), Uploadthing + `@uploadthing/react` + `@uploadthing/next` (file upload), React 19, Next.js 15 App Router, Tailwind semantic tokens, Vitest (admin/web), Jest (svc-roadmap/api-gateway).

## Global Constraints

- Tailwind: always use semantic tokens (`bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `bg-indigo`) — never hardcode hex.
- TypeScript strict: no new `any` unless existing file already uses it.
- `apps/web` fetches: always `{ cache: 'no-store' }`.
- `packages/*` must not import from `apps/*`.
- `packages/lesson` does not have `next` as a dependency — use plain `<a>` tags, not `next/link`.
- Conventional Commits: `feat:`, `fix:`, `chore:` — lowercase, no trailing period.
- Proto field numbers: `NodeItem.content = 8` is taken — use `9` for `coverImage`, `10` for `icon`.
- Never save lesson content via `UpsertGraph` — use targeted PATCH endpoints only.
- After editing `roadmap.proto`, always regenerate via `cd packages/proto && node generate.js` (not `pnpm proto:gen` — Turborepo may replay cache).

---

### Task 1: DB migration — add coverImage and icon to Node

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

**Interfaces:**
- Produces: `Node.coverImage: String?` and `Node.icon: String?` available in all subsequent DB queries.

- [ ] **Step 1: Add fields to Node model**

Open `packages/db/prisma/schema.prisma`. Find the `Node` model and add two lines after `content`:

```prisma
model Node {
  id              String   @id @default(cuid())
  roadmapId       String
  roadmap         Roadmap  @relation("RoadmapNodes", fields: [roadmapId], references: [id], onDelete: Cascade)
  type            NodeType
  title           String
  positionX       Float?
  positionY       Float?
  targetRoadmapId String?
  targetRoadmap   Roadmap? @relation("NodeTarget", fields: [targetRoadmapId], references: [id])
  content         Json?
  coverImage      String?
  icon            String?
  edges           Edge[]   @relation("EdgeSource")
  edgesTarget     Edge[]   @relation("EdgeTarget")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

- [ ] **Step 2: Create and apply migration**

```bash
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:migrate
```

When prompted for migration name, enter: `add_node_cover_image_and_icon`

Expected output: `The following migration(s) have been created and applied from your new schema: migrations/20260623_add_node_cover_image_and_icon/migration.sql`

- [ ] **Step 3: Verify schema compiles**

```bash
pnpm --filter @vizteck/db build
```

Expected: exits 0 with no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations/
git commit -m "chore: add coverImage and icon fields to Node model"
```

---

### Task 2: Proto — add fields, messages, RPCs; regenerate

**Files:**
- Modify: `packages/proto/roadmap.proto`

**Interfaces:**
- Produces: TypeScript types `UpdateNodeCoverRequest`, `UpdateNodeIconRequest`, `BreadcrumbItem`, `BreadcrumbResponse` exported from `@vizteck/proto`. `NodeItem` gains `coverImage` (field 9) and `icon` (field 10).

- [ ] **Step 1: Update proto file**

Replace the full contents of `packages/proto/roadmap.proto` with:

```protobuf
syntax = "proto3";
package roadmap;

enum NodeType {
  ROADMAP = 0;
  LESSON = 1;
}

message Empty {}

message BoolResponse {
  bool success = 1;
}

message IdRequest {
  string id = 1;
}

message SlugRequest {
  string slug = 1;
}

message RoadmapItem {
  string id = 1;
  string slug = 2;
  string title = 3;
  string description = 4;
  string coverImage = 5;
  string status = 6;
}

message NodeItem {
  string id = 1;
  string roadmapId = 2;
  NodeType type = 3;
  string title = 4;
  double positionX = 5;
  double positionY = 6;
  string targetRoadmapId = 7;
  string content = 8;
  string coverImage = 9;
  string icon = 10;
}

message EdgeItem {
  string id = 1;
  string sourceId = 2;
  string targetId = 3;
  string label = 4;
}

message RoadmapList {
  repeated RoadmapItem roadmaps = 1;
}

message RoadmapDetail {
  RoadmapItem roadmap = 1;
  repeated NodeItem nodes = 2;
  repeated EdgeItem edges = 3;
}

message NodeDetail {
  NodeItem node = 1;
  RoadmapItem targetRoadmap = 2;
}

message CreateRoadmapRequest {
  string slug = 1;
  string title = 2;
  string description = 3;
  string coverImage = 4;
}

message UpdateRoadmapRequest {
  string id = 1;
  string title = 2;
  string description = 3;
  string coverImage = 4;
  string status = 5;
}

message NodeInput {
  string id = 1;
  NodeType type = 2;
  string title = 3;
  double positionX = 4;
  double positionY = 5;
  string targetRoadmapId = 6;
  string content = 7;
}

message EdgeInput {
  string sourceId = 1;
  string targetId = 2;
  string label = 3;
}

message UpsertGraphRequest {
  string roadmapId = 1;
  repeated NodeInput nodes = 2;
  repeated EdgeInput edges = 3;
}

message UpdateNodeContentRequest {
  string id = 1;
  string content = 2;
}

message UpdateNodeTitleRequest {
  string id = 1;
  string title = 2;
}

message UpdateNodeCoverRequest {
  string id = 1;
  string coverImage = 2;
}

message UpdateNodeIconRequest {
  string id = 1;
  string icon = 2;
}

message BreadcrumbItem {
  string title = 1;
  string slug = 2;
  string nodeId = 3;
}

message BreadcrumbResponse {
  repeated BreadcrumbItem items = 1;
}

service RoadmapService {
  rpc GetRoadmaps (Empty) returns (RoadmapList);
  rpc GetRoadmap (SlugRequest) returns (RoadmapDetail);
  rpc GetNode (IdRequest) returns (NodeDetail);
  rpc CreateRoadmap (CreateRoadmapRequest) returns (RoadmapItem);
  rpc UpdateRoadmap (UpdateRoadmapRequest) returns (RoadmapItem);
  rpc DeleteRoadmap (IdRequest) returns (BoolResponse);
  rpc UpsertGraph (UpsertGraphRequest) returns (RoadmapDetail);
  rpc UpdateNodeContent (UpdateNodeContentRequest) returns (NodeItem);
  rpc UpdateNodeTitle (UpdateNodeTitleRequest) returns (NodeItem);
  rpc UpdateNodeCover (UpdateNodeCoverRequest) returns (NodeItem);
  rpc UpdateNodeIcon (UpdateNodeIconRequest) returns (NodeItem);
  rpc GetNodeBreadcrumb (IdRequest) returns (BreadcrumbResponse);
}
```

- [ ] **Step 2: Regenerate TypeScript types**

```bash
cd packages/proto && node generate.js
```

Expected: regenerates `packages/proto/src/generated/` files (or equivalent output directory for this project). Check `node generate.js` output for success message.

- [ ] **Step 3: Verify TypeScript compilation**

```bash
pnpm --filter @vizteck/svc-roadmap exec tsc --noEmit
pnpm --filter @vizteck/api-gateway exec tsc --noEmit
```

Expected: both exit 0. (New message types are now importable from `@vizteck/proto`.)

- [ ] **Step 4: Commit**

```bash
git add packages/proto/
git commit -m "feat: add coverImage, icon to NodeItem; add UpdateNodeCover, UpdateNodeIcon, GetNodeBreadcrumb RPCs"
```

---

### Task 3: svc-roadmap — implement new service methods and wire controller

**Files:**
- Modify: `apps/svc-roadmap/src/roadmap/roadmap.service.ts`
- Modify: `apps/svc-roadmap/src/roadmap/roadmap.controller.ts`
- Modify: `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts`

**Interfaces:**
- Produces: `RoadmapService.updateNodeCover`, `.updateNodeIcon`, `.getNodeBreadcrumb` — called by Task 4's GRPC client.
- `toNodeItem` updated to include `coverImage` and `icon`.

- [ ] **Step 1: Write failing tests**

Add to the bottom of `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts` (before the closing `}`):

First, update the mock to add `findFirst` to `db.node`:

Find this block in the mock:
```ts
    node: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
```

Replace with:
```ts
    node: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
```

Then add the new test suites (before the last `}` of `describe('RoadmapService', ...)`):

```ts
  describe('updateNodeCover', () => {
    it('updates coverImage and returns NodeItem', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
        positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
        coverImage: 'https://cdn.example.com/cover.jpg', icon: null,
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);
      const result = await service.updateNodeCover({ id: 'n1', coverImage: 'https://cdn.example.com/cover.jpg' });
      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { coverImage: 'https://cdn.example.com/cover.jpg' },
      });
      expect(result.coverImage).toBe('https://cdn.example.com/cover.jpg');
    });

    it('clears coverImage when empty string', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
        positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
        coverImage: null, icon: null,
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);
      await service.updateNodeCover({ id: 'n1', coverImage: '' });
      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { coverImage: null },
      });
    });

    it('throws NOT_FOUND when node missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { Prisma } = jest.requireActual('@vizteck/db') as any;
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
      });
      (db.node.update as jest.Mock).mockRejectedValue(err);
      await expect(service.updateNodeCover({ id: 'missing', coverImage: 'x' }))
        .rejects.toMatchObject({ error: { code: 5 } });
    });
  });

  describe('updateNodeIcon', () => {
    it('updates icon and returns NodeItem', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
        positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
        coverImage: null, icon: '⚡',
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);
      const result = await service.updateNodeIcon({ id: 'n1', icon: '⚡' });
      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { icon: '⚡' },
      });
      expect(result.icon).toBe('⚡');
    });

    it('clears icon when empty string', async () => {
      const stored = {
        id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
        positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
        coverImage: null, icon: null,
      };
      (db.node.update as jest.Mock).mockResolvedValue(stored);
      await service.updateNodeIcon({ id: 'n1', icon: '' });
      expect(db.node.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { icon: null },
      });
    });

    it('throws NOT_FOUND when node missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { Prisma } = jest.requireActual('@vizteck/db') as any;
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
      });
      (db.node.update as jest.Mock).mockRejectedValue(err);
      await expect(service.updateNodeIcon({ id: 'missing', icon: '⚡' }))
        .rejects.toMatchObject({ error: { code: 5 } });
    });
  });

  describe('getNodeBreadcrumb', () => {
    it('returns 1-item chain for root roadmap lesson', async () => {
      (db.node.findUnique as jest.Mock).mockResolvedValue({
        id: 'n1', title: 'Box Model', roadmapId: 'r1',
        coverImage: null, icon: null,
      });
      (db.node.findFirst as jest.Mock).mockResolvedValue(null); // no parent
      (db.roadmap.findUnique as jest.Mock).mockResolvedValue({
        id: 'r1', title: 'Frontend Roadmap', slug: 'frontend',
      });
      const result = await service.getNodeBreadcrumb({ id: 'n1' });
      expect(result.items).toEqual([
        { title: 'Frontend Roadmap', slug: 'frontend', nodeId: '' },
        { title: 'Box Model', slug: '', nodeId: 'n1' },
      ]);
    });

    it('returns nested chain for sub-roadmap lesson', async () => {
      (db.node.findUnique as jest.Mock).mockResolvedValue({
        id: 'n2', title: 'CSS Selectors', roadmapId: 'r2',
        coverImage: null, icon: null,
      });
      // First call: find parent of r2 → Node X in Roadmap r1
      (db.node.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 'nx', title: 'HTML & CSS', roadmapId: 'r1',
          targetRoadmap: { slug: 'html-css' },
        })
        .mockResolvedValueOnce(null); // no parent of r1
      (db.roadmap.findUnique as jest.Mock).mockResolvedValue({
        id: 'r1', title: 'Frontend Roadmap', slug: 'frontend',
      });
      const result = await service.getNodeBreadcrumb({ id: 'n2' });
      expect(result.items).toEqual([
        { title: 'Frontend Roadmap', slug: 'frontend', nodeId: '' },
        { title: 'HTML & CSS', slug: 'html-css', nodeId: 'nx' },
        { title: 'CSS Selectors', slug: '', nodeId: 'n2' },
      ]);
    });

    it('returns empty array when node not found', async () => {
      (db.node.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.getNodeBreadcrumb({ id: 'missing' });
      expect(result.items).toEqual([]);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @vizteck/svc-roadmap test
```

Expected: new tests FAIL with "service.updateNodeCover is not a function" (or similar).

- [ ] **Step 3: Update `toNodeItem` to include new fields**

In `apps/svc-roadmap/src/roadmap/roadmap.service.ts`, find the `toNodeItem` function:

```ts
function toNodeItem(n: PrismaNode) {
  return {
    id: n.id, roadmapId: n.roadmapId,
    type: n.type === 'ROADMAP' ? 0 : 1,
    title: n.title, positionX: n.positionX ?? 0, positionY: n.positionY ?? 0,
    targetRoadmapId: n.targetRoadmapId ?? '',
    content: n.content ? JSON.stringify(n.content) : '',
  };
}
```

Replace with:

```ts
function toNodeItem(n: PrismaNode) {
  return {
    id: n.id, roadmapId: n.roadmapId,
    type: n.type === 'ROADMAP' ? 0 : 1,
    title: n.title, positionX: n.positionX ?? 0, positionY: n.positionY ?? 0,
    targetRoadmapId: n.targetRoadmapId ?? '',
    content: n.content ? JSON.stringify(n.content) : '',
    coverImage: n.coverImage ?? '',
    icon: n.icon ?? '',
  };
}
```

- [ ] **Step 4: Add three new service methods**

Add these methods at the end of the `RoadmapService` class (after `updateNodeTitle`), before the closing `}`:

```ts
  async updateNodeCover({ id, coverImage }: UpdateNodeCoverRequest): Promise<NodeItem> {
    try {
      const node = await db.node.update({
        where: { id },
        data: { coverImage: coverImage || null },
      });
      return toNodeItem(node);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new RpcException({ code: GrpcStatus.NOT_FOUND, message: `Node '${id}' not found` });
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
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new RpcException({ code: GrpcStatus.NOT_FOUND, message: `Node '${id}' not found` });
      }
      throw e;
    }
  }

  async getNodeBreadcrumb({ id }: IdRequest): Promise<BreadcrumbResponse> {
    const node = await db.node.findUnique({ where: { id } });
    if (!node) return { items: [] };

    const chain: Array<{ title: string; slug: string; nodeId: string }> = [];
    chain.unshift({ title: node.title, slug: '', nodeId: node.id });

    let currentRoadmapId = node.roadmapId;

    while (true) {
      const parentNode = await db.node.findFirst({
        where: { type: 'ROADMAP', targetRoadmapId: currentRoadmapId },
        include: { targetRoadmap: true },
      });

      if (parentNode) {
        chain.unshift({
          title: parentNode.title,
          slug: parentNode.targetRoadmap?.slug ?? '',
          nodeId: parentNode.id,
        });
        currentRoadmapId = parentNode.roadmapId;
      } else {
        const rootRoadmap = await db.roadmap.findUnique({ where: { id: currentRoadmapId } });
        if (rootRoadmap) {
          chain.unshift({ title: rootRoadmap.title, slug: rootRoadmap.slug, nodeId: '' });
        }
        break;
      }
    }

    return { items: chain };
  }
```

- [ ] **Step 5: Update imports in roadmap.service.ts**

Find the import line:
```ts
import {
  Empty, RoadmapList, SlugRequest, RoadmapDetail, IdRequest,
  NodeDetail, CreateRoadmapRequest, RoadmapItem, UpdateRoadmapRequest,
  BoolResponse, UpsertGraphRequest, UpdateNodeContentRequest, UpdateNodeTitleRequest,
  NodeItem,
} from '@vizteck/proto';
```

Replace with:
```ts
import {
  Empty, RoadmapList, SlugRequest, RoadmapDetail, IdRequest,
  NodeDetail, CreateRoadmapRequest, RoadmapItem, UpdateRoadmapRequest,
  BoolResponse, UpsertGraphRequest, UpdateNodeContentRequest, UpdateNodeTitleRequest,
  NodeItem, UpdateNodeCoverRequest, UpdateNodeIconRequest, BreadcrumbResponse,
} from '@vizteck/proto';
```

- [ ] **Step 6: Wire new gRPC handlers in controller**

In `apps/svc-roadmap/src/roadmap/roadmap.controller.ts`, find the import:
```ts
import { Empty, SlugRequest, IdRequest, CreateRoadmapRequest, UpdateRoadmapRequest, UpsertGraphRequest, UpdateNodeContentRequest, UpdateNodeTitleRequest } from '@vizteck/proto';
```

Replace with:
```ts
import { Empty, SlugRequest, IdRequest, CreateRoadmapRequest, UpdateRoadmapRequest, UpsertGraphRequest, UpdateNodeContentRequest, UpdateNodeTitleRequest, UpdateNodeCoverRequest, UpdateNodeIconRequest } from '@vizteck/proto';
```

Then add three handlers at the end of the `RoadmapController` class (before closing `}`):

```ts
  @GrpcMethod('RoadmapService', 'UpdateNodeCover')
  updateNodeCover(data: UpdateNodeCoverRequest) { return this.svc.updateNodeCover(data); }

  @GrpcMethod('RoadmapService', 'UpdateNodeIcon')
  updateNodeIcon(data: UpdateNodeIconRequest) { return this.svc.updateNodeIcon(data); }

  @GrpcMethod('RoadmapService', 'GetNodeBreadcrumb')
  getNodeBreadcrumb(data: IdRequest) { return this.svc.getNodeBreadcrumb(data); }
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
pnpm --filter @vizteck/svc-roadmap test
```

Expected: all 15 tests pass (6 existing + 9 new).

- [ ] **Step 8: Verify TypeScript**

```bash
pnpm --filter @vizteck/svc-roadmap exec tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 9: Commit**

```bash
git add apps/svc-roadmap/src/roadmap/
git commit -m "feat: implement UpdateNodeCover, UpdateNodeIcon, GetNodeBreadcrumb in svc-roadmap"
```

---

### Task 4: api-gateway — GRPC client, REST endpoints, GraphQL, DTOs

**Files:**
- Modify: `apps/api-gateway/src/roadmap/roadmap.grpc-client.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.dto.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.resolver.ts`

**Interfaces:**
- Produces: REST `PATCH /api/nodes/:id/cover`, `PATCH /api/nodes/:id/icon`, `GET /api/nodes/:id/breadcrumb`. GraphQL `updateNodeCover`, `updateNodeIcon`, `nodeBreadcrumb`. Consumed by Tasks 10 and 11.

- [ ] **Step 1: Add new methods to GRPC client**

In `apps/api-gateway/src/roadmap/roadmap.grpc-client.ts`, find the `GrpcRoadmapService` interface and add three new method signatures:

```ts
interface GrpcRoadmapService {
  getRoadmaps(data: object): Observable<any>;
  getRoadmap(data: { slug: string }): Observable<any>;
  getNode(data: { id: string }): Observable<any>;
  createRoadmap(data: object): Observable<any>;
  updateRoadmap(data: object): Observable<any>;
  deleteRoadmap(data: { id: string }): Observable<any>;
  upsertGraph(data: object): Observable<any>;
  updateNodeContent(data: { id: string; content: string }): Observable<any>;
  updateNodeTitle(data: { id: string; title: string }): Observable<any>;
  updateNodeCover(data: { id: string; coverImage: string }): Observable<any>;
  updateNodeIcon(data: { id: string; icon: string }): Observable<any>;
  getNodeBreadcrumb(data: { id: string }): Observable<any>;
}
```

Then add three methods at the end of the `RoadmapGrpcClient` class (before closing `}`):

```ts
  updateNodeCover(id: string, coverImage: string) {
    return firstValueFrom(this.svc.updateNodeCover({ id, coverImage }));
  }
  updateNodeIcon(id: string, icon: string) {
    return firstValueFrom(this.svc.updateNodeIcon({ id, icon }));
  }
  getNodeBreadcrumb(id: string) {
    return firstValueFrom(this.svc.getNodeBreadcrumb({ id }));
  }
```

- [ ] **Step 2: Add new DTOs**

In `apps/api-gateway/src/roadmap/roadmap.dto.ts`:

1. Add `coverImage` and `icon` to `NodeDto` — after the `content` field:

```ts
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg' })
  coverImage?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ example: '⚡' })
  icon?: string;
```

2. Add new types at the end of the file:

```ts
@ObjectType()
export class BreadcrumbItemDto {
  @Field() @ApiProperty({ example: 'Frontend Roadmap' }) title!: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'frontend' }) slug?: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'clx...' }) nodeId?: string;
}

@InputType()
export class UpdateNodeCoverInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg', description: 'null removes the cover' })
  coverImage?: string;
}

@InputType()
export class UpdateNodeIconInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: '⚡', description: 'null removes the icon' })
  icon?: string;
}
```

- [ ] **Step 3: Add REST endpoints to controller**

In `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`:

1. Update the import to add new DTO types:

```ts
import {
  CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput,
  UpdateNodeContentInput, UpdateNodeTitleInput,
  UpdateNodeCoverInput, UpdateNodeIconInput,
} from './roadmap.dto';
```

2. Add three new route handlers at the end of the class (before closing `}`):

```ts
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
```

- [ ] **Step 4: Add GraphQL queries/mutations to resolver**

In `apps/api-gateway/src/roadmap/roadmap.resolver.ts`:

1. Update the import to add new types:

```ts
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
```

2. Add three new resolver methods at the end of the `RoadmapResolver` class (before closing `}`):

```ts
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
```

- [ ] **Step 5: Verify TypeScript and run existing tests**

```bash
pnpm --filter @vizteck/api-gateway exec tsc --noEmit
pnpm --filter @vizteck/api-gateway test
```

Expected: TypeScript exits 0, existing 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api-gateway/src/roadmap/
git commit -m "feat: add cover/icon/breadcrumb endpoints to api-gateway REST and GraphQL"
```

---

### Task 5: Uploadthing setup in admin

**Files:**
- Create: `apps/admin/src/app/api/uploadthing/core.ts`
- Create: `apps/admin/src/app/api/uploadthing/route.ts`
- Modify: `apps/admin/.env.example`
- Modify: `apps/admin/package.json` (add dependency)

**Interfaces:**
- Produces: `POST /api/uploadthing` handler and `useUploadThing("coverUploader")` hook available in admin components (Task 9).

- [ ] **Step 1: Install Uploadthing packages**

```bash
pnpm --filter @vizteck/admin add uploadthing @uploadthing/react @uploadthing/next
```

Expected: packages added to `apps/admin/package.json` and installed.

- [ ] **Step 2: Create file router**

Create `apps/admin/src/app/api/uploadthing/core.ts`:

```ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  coverUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

- [ ] **Step 3: Create API route handler**

Create `apps/admin/src/app/api/uploadthing/route.ts`:

```ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
```

- [ ] **Step 4: Add env variable to .env.example**

In `apps/admin/.env.example`, add at the end:

```
# Uploadthing (sign in at uploadthing.com with Google — free tier 2GB)
UPLOADTHING_TOKEN=
```

- [ ] **Step 5: Verify TypeScript**

```bash
pnpm --filter @vizteck/admin exec tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/app/api/uploadthing/ apps/admin/.env.example apps/admin/package.json pnpm-lock.yaml
git commit -m "feat: add uploadthing file upload route to admin"
```

---

### Task 6: packages/lesson — shared types, BreadcrumbDisplay, CoverDisplay

**Files:**
- Create: `packages/lesson/src/types.ts`
- Create: `packages/lesson/src/BreadcrumbDisplay.tsx`
- Create: `packages/lesson/src/CoverDisplay.tsx`
- Create: `packages/lesson/src/BreadcrumbDisplay.spec.tsx`
- Create: `packages/lesson/src/CoverDisplay.spec.tsx`

**Interfaces:**
- Produces: `BreadcrumbItem`, `LessonShellNode` types; `BreadcrumbDisplay`, `CoverDisplay` components — consumed by Tasks 7, 9, 10, 11.

- [ ] **Step 1: Create shared types file**

Create `packages/lesson/src/types.ts`:

```ts
export interface BreadcrumbItem {
  title: string;
  slug: string | null;
  nodeId: string | null;
}

export interface LessonShellNode {
  id: string;
  title: string;
  coverImage: string | null;
  icon: string | null;
  content: string | null;
  type: "LESSON" | "ROADMAP";
}
```

- [ ] **Step 2: Write failing tests for BreadcrumbDisplay**

Create `packages/lesson/src/BreadcrumbDisplay.spec.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { BreadcrumbDisplay } from "./BreadcrumbDisplay";
import type { BreadcrumbItem } from "./types";

const items: BreadcrumbItem[] = [
  { title: "Frontend Roadmap", slug: "frontend", nodeId: null },
  { title: "HTML & CSS", slug: "html-css", nodeId: "clx1" },
  { title: "Box Model", slug: null, nodeId: "cly1" },
];

it("renders all breadcrumb titles", () => {
  render(<BreadcrumbDisplay items={items} />);
  expect(screen.getByText("Frontend Roadmap")).toBeDefined();
  expect(screen.getByText("HTML & CSS")).toBeDefined();
  expect(screen.getByText("Box Model")).toBeDefined();
});

it("last item is not a link", () => {
  render(<BreadcrumbDisplay items={items} />);
  const lastItem = screen.getByText("Box Model");
  expect(lastItem.tagName).not.toBe("A");
});

it("non-last items with getLinkHref are links", () => {
  render(
    <BreadcrumbDisplay
      items={items}
      getLinkHref={(item) => item.slug ? `/roadmap/${item.slug}` : undefined}
    />
  );
  const link = screen.getByText("Frontend Roadmap").closest("a");
  expect(link?.getAttribute("href")).toBe("/roadmap/frontend");
});

it("renders nothing for empty items", () => {
  const { container } = render(<BreadcrumbDisplay items={[]} />);
  expect(container.firstChild).toBeNull();
});
```

- [ ] **Step 3: Verify tests fail**

```bash
pnpm --filter @vizteck/lesson exec vitest run --reporter=verbose 2>&1 | head -20
```

Expected: FAIL — "Cannot find module './BreadcrumbDisplay'".

- [ ] **Step 4: Implement BreadcrumbDisplay**

Create `packages/lesson/src/BreadcrumbDisplay.tsx`:

```tsx
import type { BreadcrumbItem } from "./types";

export interface BreadcrumbDisplayProps {
  items: BreadcrumbItem[];
  variant?: "default" | "overlay";
  getLinkHref?: (item: BreadcrumbItem) => string | undefined;
}

export function BreadcrumbDisplay({
  items,
  variant = "default",
  getLinkHref,
}: BreadcrumbDisplayProps) {
  if (items.length === 0) return null;

  const isOverlay = variant === "overlay";
  const linkClass = isOverlay
    ? "text-white/60 hover:text-white/90 transition-colors"
    : "text-text-3 hover:text-text-2 transition-colors";
  const sepClass = isOverlay ? "text-white/40" : "text-text-3";
  const currentClass = isOverlay ? "text-white/90" : "text-text-1";

  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const href = !isLast && getLinkHref ? getLinkHref(item) : undefined;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className={sepClass}>›</span>}
            {isLast ? (
              <span className={currentClass}>{item.title}</span>
            ) : href ? (
              <a href={href} className={linkClass}>
                {item.title}
              </a>
            ) : (
              <span className={linkClass}>{item.title}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5: Write failing tests for CoverDisplay**

Create `packages/lesson/src/CoverDisplay.spec.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverDisplay } from "./CoverDisplay";

it("renders img when coverImage provided", () => {
  render(
    <CoverDisplay
      coverImage="https://example.com/img.jpg"
      icon="⚡"
      breadcrumb={[]}
    />
  );
  expect(screen.getByRole("img").getAttribute("src")).toBe(
    "https://example.com/img.jpg"
  );
});

it("renders gradient fallback when no coverImage", () => {
  const { container } = render(
    <CoverDisplay coverImage={null} icon={null} breadcrumb={[]} />
  );
  const gradient = container.querySelector(".bg-gradient-to-br");
  expect(gradient).not.toBeNull();
});

it("renders default icon when icon is null", () => {
  render(<CoverDisplay coverImage={null} icon={null} breadcrumb={[]} />);
  expect(screen.getByText("📄")).toBeDefined();
});

it("renders provided icon", () => {
  render(<CoverDisplay coverImage={null} icon="🚀" breadcrumb={[]} />);
  expect(screen.getByText("🚀")).toBeDefined();
});

it("calls onIconClick when icon is clicked", async () => {
  const user = userEvent.setup();
  const onIconClick = vi.fn();
  render(
    <CoverDisplay
      coverImage={null}
      icon="⚡"
      breadcrumb={[]}
      onIconClick={onIconClick}
    />
  );
  await user.click(screen.getByText("⚡"));
  expect(onIconClick).toHaveBeenCalledOnce();
});
```

- [ ] **Step 6: Implement CoverDisplay**

Create `packages/lesson/src/CoverDisplay.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { BreadcrumbItem } from "./types";
import { BreadcrumbDisplay } from "./BreadcrumbDisplay";

export interface CoverDisplayProps {
  coverImage: string | null;
  icon: string | null;
  breadcrumb: BreadcrumbItem[];
  onIconClick?: () => void;
}

export function CoverDisplay({
  coverImage,
  icon,
  breadcrumb,
  onIconClick,
}: CoverDisplayProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!coverImage && !imgError;

  return (
    <div className="relative w-full h-[200px]">
      {showImage ? (
        <img
          src={coverImage!}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-indigo to-indigo/60" />
      )}

      {breadcrumb.length > 0 && (
        <div className="absolute top-3 left-4">
          <BreadcrumbDisplay items={breadcrumb} variant="overlay" />
        </div>
      )}

      <div
        className={`absolute left-4 -bottom-5 w-10 h-10 bg-bg-0 border border-border rounded-lg flex items-center justify-center text-2xl z-10 select-none${onIconClick ? " cursor-pointer hover:border-indigo transition-colors" : ""}`}
        onClick={onIconClick}
      >
        {icon || "📄"}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Check packages/lesson has a vitest config**

```bash
ls packages/lesson/
```

If there is no `vitest.config.ts` in `packages/lesson/`, create `packages/lesson/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

And create `packages/lesson/src/test-setup.ts`:

```ts
import "@testing-library/jest-dom";
```

And add test dev dependencies:
```bash
pnpm --filter @vizteck/lesson add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

And add `"test": "vitest run"` to `packages/lesson/package.json` scripts.

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm --filter @vizteck/lesson test
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add packages/lesson/src/types.ts packages/lesson/src/BreadcrumbDisplay.tsx packages/lesson/src/BreadcrumbDisplay.spec.tsx packages/lesson/src/CoverDisplay.tsx packages/lesson/src/CoverDisplay.spec.tsx packages/lesson/
git commit -m "feat: add BreadcrumbDisplay, CoverDisplay, shared types to packages/lesson"
```

---

### Task 7: packages/lesson — LessonPageShell

**Files:**
- Create: `packages/lesson/src/LessonPageShell.tsx`
- Create: `packages/lesson/src/LessonPageShell.spec.tsx`
- Modify: `packages/lesson/src/index.ts`

**Interfaces:**
- Produces: `LessonPageShell` with `mode="edit"|"view"` — consumed by Task 10 (admin) and Task 11 (web).

- [ ] **Step 1: Write failing tests**

Create `packages/lesson/src/LessonPageShell.spec.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { LessonPageShell } from "./LessonPageShell";
import type { LessonShellNode, BreadcrumbItem } from "./types";

const node: LessonShellNode = {
  id: "n1",
  title: "Box Model",
  coverImage: null,
  icon: "⚡",
  content: "[]",
  type: "LESSON",
};

const breadcrumb: BreadcrumbItem[] = [
  { title: "Frontend", slug: "frontend", nodeId: null },
];

it("view mode renders title", () => {
  render(<LessonPageShell mode="view" node={node} breadcrumb={breadcrumb} />);
  expect(screen.getByRole("heading", { name: "Box Model" })).toBeDefined();
});

it("view mode renders icon via CoverDisplay", () => {
  render(<LessonPageShell mode="view" node={node} breadcrumb={breadcrumb} />);
  expect(screen.getByText("⚡")).toBeDefined();
});

it("edit mode renders coverSlot when provided", () => {
  render(
    <LessonPageShell
      mode="edit"
      node={node}
      breadcrumb={breadcrumb}
      coverSlot={<div data-testid="custom-cover">custom</div>}
    />
  );
  expect(screen.getByTestId("custom-cover")).toBeDefined();
});

it("edit mode renders titleSlot when provided", () => {
  render(
    <LessonPageShell
      mode="edit"
      node={node}
      breadcrumb={breadcrumb}
      titleSlot={<h1 data-testid="custom-title">custom title</h1>}
    />
  );
  expect(screen.getByTestId("custom-title")).toBeDefined();
});

it("edit mode uses default title when titleSlot not provided", () => {
  render(<LessonPageShell mode="edit" node={node} breadcrumb={breadcrumb} />);
  expect(screen.getByRole("heading", { name: "Box Model" })).toBeDefined();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @vizteck/lesson test
```

Expected: new tests FAIL — "Cannot find module './LessonPageShell'".

- [ ] **Step 3: Implement LessonPageShell**

Create `packages/lesson/src/LessonPageShell.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { CoverDisplay } from "./CoverDisplay";
import type { BreadcrumbItem, LessonShellNode } from "./types";

const LessonViewer = dynamic(
  () => import("./LessonViewer").then((m) => m.LessonViewer),
  {
    ssr: false,
    loading: () => (
      <div className="text-text-3 text-sm py-6">Loading content…</div>
    ),
  }
);

export interface LessonPageShellProps {
  mode: "edit" | "view";
  node: LessonShellNode;
  breadcrumb: BreadcrumbItem[];
  coverSlot?: React.ReactNode;
  titleSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
}

export function LessonPageShell({
  mode,
  node,
  breadcrumb,
  coverSlot,
  titleSlot,
  contentSlot,
}: LessonPageShellProps) {
  const cover = coverSlot ?? (
    <CoverDisplay
      coverImage={node.coverImage}
      icon={node.icon}
      breadcrumb={breadcrumb}
    />
  );

  const title = titleSlot ?? (
    <h1 className="font-display font-bold text-[32px] leading-tight text-text-1 mt-8 mb-4">
      {node.title}
    </h1>
  );

  if (mode === "edit") {
    return (
      <div>
        {cover}
        <div className="max-w-[860px] mx-auto px-6 md:px-12 pb-12 pt-8">
          {title}
          {contentSlot}
        </div>
      </div>
    );
  }

  return (
    <div>
      {cover}
      <div className="max-w-[860px] mx-auto px-6 md:px-12 pb-12 pt-8">
        {title}
        {node.type === "LESSON" ? (
          <LessonViewer contentJson={node.content ?? "[]"} />
        ) : (
          <p className="text-text-3 text-sm">
            This node does not contain lesson content.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Export from index**

Replace the full contents of `packages/lesson/src/index.ts` with:

```ts
export { LessonEditor } from './LessonEditor';
export type { LessonEditorProps } from './LessonEditor';
export { LessonViewer } from './LessonViewer';
export type { LessonViewerProps } from './LessonViewer';
export { LessonPageShell } from './LessonPageShell';
export type { LessonPageShellProps } from './LessonPageShell';
export { CoverDisplay } from './CoverDisplay';
export type { CoverDisplayProps } from './CoverDisplay';
export { BreadcrumbDisplay } from './BreadcrumbDisplay';
export type { BreadcrumbDisplayProps } from './BreadcrumbDisplay';
export type { BreadcrumbItem, LessonShellNode } from './types';
```

- [ ] **Step 5: Run all tests**

```bash
pnpm --filter @vizteck/lesson test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/lesson/src/LessonPageShell.tsx packages/lesson/src/LessonPageShell.spec.tsx packages/lesson/src/index.ts
git commit -m "feat: add LessonPageShell to packages/lesson"
```

---

### Task 8: apps/admin — IconPicker component

**Files:**
- Create: `apps/admin/src/features/lessons/components/IconPicker.tsx`
- Create: `apps/admin/src/features/lessons/components/IconPicker.spec.tsx`

**Interfaces:**
- Produces: `<IconPicker icon={string|null} onIconChange={(v: string|null) => void} />` — used by Task 9's `CoverImage`.

- [ ] **Step 1: Write failing tests**

Create `apps/admin/src/features/lessons/components/IconPicker.spec.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconPicker } from "./IconPicker";

it("renders trigger with current icon", () => {
  render(<IconPicker icon="⚡" onIconChange={() => {}} isOpen={false} onToggle={() => {}} />);
  expect(screen.getByText("⚡")).toBeDefined();
});

it("renders default icon when icon is null", () => {
  render(<IconPicker icon={null} onIconChange={() => {}} isOpen={false} onToggle={() => {}} />);
  expect(screen.getByText("📄")).toBeDefined();
});

it("calls onToggle when trigger is clicked", async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  render(<IconPicker icon="⚡" onIconChange={() => {}} isOpen={false} onToggle={onToggle} />);
  await user.click(screen.getByText("⚡"));
  expect(onToggle).toHaveBeenCalledOnce();
});

it("shows emoji tab when open", () => {
  render(<IconPicker icon="⚡" onIconChange={() => {}} isOpen={true} onToggle={() => {}} />);
  expect(screen.getByText("Emoji")).toBeDefined();
  expect(screen.getByText("Text")).toBeDefined();
  expect(screen.getByText("Icons")).toBeDefined();
});

it("calls onIconChange when emoji is selected", async () => {
  const user = userEvent.setup();
  const onIconChange = vi.fn();
  render(<IconPicker icon={null} onIconChange={onIconChange} isOpen={true} onToggle={() => {}} />);
  await user.click(screen.getByText("🚀"));
  expect(onIconChange).toHaveBeenCalledWith("🚀");
});

it("calls onIconChange(null) when Remove is clicked", async () => {
  const user = userEvent.setup();
  const onIconChange = vi.fn();
  render(<IconPicker icon="⚡" onIconChange={onIconChange} isOpen={true} onToggle={() => {}} />);
  await user.click(screen.getByText("Remove"));
  expect(onIconChange).toHaveBeenCalledWith(null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @vizteck/admin test -- --reporter=verbose 2>&1 | grep -A5 "IconPicker"
```

Expected: FAIL — "Cannot find module './IconPicker'".

- [ ] **Step 3: Implement IconPicker**

Create `apps/admin/src/features/lessons/components/IconPicker.tsx`:

```tsx
"use client";

import { useState } from "react";

const EMOJI_LIST = [
  "🚀", "📘", "🎯", "💡", "🔥", "⭐", "🌐", "🛠️", "📦", "🧩",
  "✨", "⚡", "💻", "🔑", "🎨", "📊", "🔧", "🌟", "🏆", "🎓",
  "📝", "🔍", "💎", "🚀",
];

const LUCIDE_ICONS = [
  "Zap", "Rocket", "BookOpen", "Target", "Lightbulb", "Flame",
  "Star", "Globe", "Wrench", "Package", "Puzzle", "Sparkles",
  "Code", "Database", "Server", "Terminal", "Layout", "Layers",
  "Box", "ArrowRight", "Check", "Link", "Lock", "FileText",
];

type Tab = "emoji" | "text" | "icons";

export interface IconPickerProps {
  icon: string | null;
  onIconChange: (value: string | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function IconPicker({ icon, onIconChange, isOpen, onToggle }: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("emoji");
  const [textInput, setTextInput] = useState(icon ?? "");

  const handleSelect = (value: string | null) => {
    onIconChange(value);
    onToggle(); // close after selection
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <div
        className="w-10 h-10 bg-bg-0 border border-border rounded-lg flex items-center justify-center text-2xl cursor-pointer hover:border-indigo transition-colors select-none"
        onClick={onToggle}
      >
        {icon || "📄"}
      </div>

      {/* Picker dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-12 z-50 w-56 bg-bg-1 border border-border rounded-xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["emoji", "text", "icons"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-indigo border-b-2 border-indigo"
                    : "text-text-3 hover:text-text-2"
                }`}
              >
                {tab === "emoji" ? "Emoji" : tab === "text" ? "Text" : "Icons"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-3">
            {activeTab === "emoji" && (
              <div className="grid grid-cols-6 gap-1">
                {EMOJI_LIST.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleSelect(e)}
                    className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-bg-2 transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "text" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type or paste emoji/text"
                  className="w-full bg-bg-0 border border-border rounded-lg px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-indigo"
                />
                <button
                  type="button"
                  disabled={!textInput.trim()}
                  onClick={() => handleSelect(textInput.trim() || null)}
                  className="w-full py-2 text-sm font-medium bg-indigo text-white rounded-lg disabled:opacity-40"
                >
                  Set
                </button>
              </div>
            )}

            {activeTab === "icons" && (
              <div className="grid grid-cols-4 gap-1">
                {LUCIDE_ICONS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelect(name)}
                    className={`py-1.5 text-[10px] text-text-3 hover:text-text-1 hover:bg-bg-2 rounded transition-colors truncate ${
                      icon === name ? "bg-bg-2 text-indigo" : ""
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Remove */}
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full py-1.5 text-xs text-text-3 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @vizteck/admin test -- --reporter=verbose 2>&1 | grep -A5 "IconPicker"
```

Expected: all 6 IconPicker tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/features/lessons/components/IconPicker.tsx apps/admin/src/features/lessons/components/IconPicker.spec.tsx
git commit -m "feat: add IconPicker component to admin"
```

---

### Task 9: apps/admin — CoverImage and CoverUploadModal

**Files:**
- Create: `apps/admin/src/features/lessons/components/CoverImage.tsx`
- Create: `apps/admin/src/features/lessons/components/CoverUploadModal.tsx`
- Create: `apps/admin/src/features/lessons/components/CoverImage.spec.tsx`

**Interfaces:**
- Consumes: `CoverDisplay` from `@vizteck/lesson`; `IconPicker` from Task 8; `useUploadThing` from `@uploadthing/react` (Task 5).
- Produces: `<CoverImage cover icon breadcrumb onCoverChange onIconChange />` — used by Task 10.

- [ ] **Step 1: Write failing tests for CoverImage**

Create `apps/admin/src/features/lessons/components/CoverImage.spec.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverImage } from "./CoverImage";

it("renders without cover — shows gradient", () => {
  const { container } = render(
    <CoverImage
      cover={null}
      icon={null}
      breadcrumb={[]}
      onCoverChange={() => {}}
      onIconChange={() => {}}
    />
  );
  expect(container.querySelector(".bg-gradient-to-br")).not.toBeNull();
});

it("shows cover controls on hover", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <CoverImage
      cover={null}
      icon={null}
      breadcrumb={[]}
      onCoverChange={() => {}}
      onIconChange={() => {}}
    />
  );
  const wrapper = container.firstChild as HTMLElement;
  await user.hover(wrapper);
  expect(screen.getByText("Upload")).toBeDefined();
  expect(screen.getByText("Paste URL")).toBeDefined();
});

it("calls onCoverChange(null) when Remove is clicked", async () => {
  const user = userEvent.setup();
  const onCoverChange = vi.fn();
  const { container } = render(
    <CoverImage
      cover="https://example.com/img.jpg"
      icon={null}
      breadcrumb={[]}
      onCoverChange={onCoverChange}
      onIconChange={() => {}}
    />
  );
  const wrapper = container.firstChild as HTMLElement;
  await user.hover(wrapper);
  await user.click(screen.getByText("Remove"));
  expect(onCoverChange).toHaveBeenCalledWith(null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @vizteck/admin test -- --reporter=verbose 2>&1 | grep -A5 "CoverImage"
```

Expected: FAIL — "Cannot find module './CoverImage'".

- [ ] **Step 3: Implement CoverUploadModal**

Create `apps/admin/src/features/lessons/components/CoverUploadModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useUploadThing } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export interface CoverUploadModalProps {
  onUploaded: (url: string) => void;
  onClose: () => void;
}

export function CoverUploadModal({ onUploaded, onClose }: CoverUploadModalProps) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startUpload } = useUploadThing<OurFileRouter>("coverUploader", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.ufsUrl) {
        onUploaded(res[0].ufsUrl);
        onClose();
      }
      setUploading(false);
    },
    onUploadError: (e) => {
      setError(e.message);
      setUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    await startUpload([file]);
  };

  const handleUrlConfirm = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onUploaded(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-1 border border-border rounded-xl w-[400px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-sm text-text-1">Set cover image</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-3 hover:text-text-1 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["upload", "url"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "text-indigo border-b-2 border-indigo"
                  : "text-text-3 hover:text-text-2"
              }`}
            >
              {t === "upload" ? "Upload file" : "Paste URL"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === "upload" && (
            <div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-indigo transition-colors">
                <span className="text-3xl mb-2">📁</span>
                <span className="text-sm text-text-2 font-medium">
                  {uploading ? "Uploading…" : "Click to upload"}
                </span>
                <span className="text-xs text-text-3 mt-1">PNG, JPG, WebP — max 4MB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={handleFileChange}
                />
              </label>
              {error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
              )}
            </div>
          )}

          {tab === "url" && (
            <div className="space-y-3">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-bg-0 border border-border rounded-lg px-3 py-2.5 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-indigo"
                onKeyDown={(e) => e.key === "Enter" && handleUrlConfirm()}
              />
              <button
                type="button"
                onClick={handleUrlConfirm}
                disabled={!urlInput.trim()}
                className="w-full py-2.5 text-sm font-medium bg-indigo text-white rounded-lg disabled:opacity-40 hover:bg-indigo/90 transition-colors"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement CoverImage**

Create `apps/admin/src/features/lessons/components/CoverImage.tsx`:

```tsx
"use client";

import { useState } from "react";
import { CoverDisplay } from "@vizteck/lesson";
import type { BreadcrumbItem } from "@vizteck/lesson";
import { IconPicker } from "./IconPicker";
import { CoverUploadModal } from "./CoverUploadModal";

export interface CoverImageProps {
  cover: string | null;
  icon: string | null;
  breadcrumb: BreadcrumbItem[];
  onCoverChange: (url: string | null) => void;
  onIconChange: (value: string | null) => void;
}

export function CoverImage({
  cover,
  icon,
  breadcrumb,
  onCoverChange,
  onIconChange,
}: CoverImageProps) {
  const [hovered, setHovered] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowUrlInput(false); }}
    >
      {/* CoverDisplay with icon click wired to IconPicker */}
      <CoverDisplay
        coverImage={cover}
        icon={icon}
        breadcrumb={breadcrumb}
        onIconClick={() => setPickerOpen((o) => !o)}
      />

      {/* IconPicker positioned at bottom-left (over the floating icon) */}
      <div className="absolute left-4 bottom-[-20px] z-20">
        <IconPicker
          icon={icon}
          onIconChange={onIconChange}
          isOpen={pickerOpen}
          onToggle={() => setPickerOpen((o) => !o)}
        />
      </div>

      {/* Cover edit controls — show on hover */}
      {hovered && (
        <div className="absolute bottom-2 right-3 flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-black/50 backdrop-blur-sm border border-white/20 rounded px-2.5 py-1 text-xs text-white hover:bg-black/70 transition-colors"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput((v) => !v)}
            className="bg-black/50 backdrop-blur-sm border border-white/20 rounded px-2.5 py-1 text-xs text-white hover:bg-black/70 transition-colors"
          >
            Paste URL
          </button>
          {cover && (
            <button
              type="button"
              onClick={() => onCoverChange(null)}
              className="bg-black/50 backdrop-blur-sm border border-white/20 rounded px-2.5 py-1 text-xs text-white hover:bg-black/70 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* Inline URL input */}
      {showUrlInput && (
        <div className="absolute bottom-10 right-3 z-20 flex gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://example.com/img.jpg"
            className="bg-bg-0 border border-border rounded px-2.5 py-1 text-xs text-text-1 placeholder:text-text-3 focus:outline-none focus:border-indigo w-64"
            onKeyDown={(e) => {
              if (e.key === "Enter" && urlValue.trim()) {
                onCoverChange(urlValue.trim());
                setShowUrlInput(false);
                setUrlValue("");
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              if (urlValue.trim()) onCoverChange(urlValue.trim());
              setShowUrlInput(false);
              setUrlValue("");
            }}
            className="bg-indigo text-white rounded px-2.5 py-1 text-xs"
          >
            Set
          </button>
        </div>
      )}

      {/* Upload modal */}
      {modalOpen && (
        <CoverUploadModal
          onUploaded={(url) => { onCoverChange(url); setModalOpen(false); }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm --filter @vizteck/admin test -- --reporter=verbose 2>&1 | grep -A5 "CoverImage"
```

Expected: all 3 CoverImage tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/features/lessons/components/CoverImage.tsx apps/admin/src/features/lessons/components/CoverUploadModal.tsx apps/admin/src/features/lessons/components/CoverImage.spec.tsx
git commit -m "feat: add CoverImage and CoverUploadModal to admin"
```

---

### Task 10: apps/admin — useLessonPageShell hook + update service + wire lesson page

**Files:**
- Modify: `apps/admin/src/features/lessons/services/lesson.service.ts`
- Create: `apps/admin/src/features/lessons/hooks/useLessonPageShell.ts`
- Create: `apps/admin/src/features/lessons/hooks/useLessonPageShell.spec.ts`
- Modify: `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`

**Interfaces:**
- Consumes: `CoverImage` (Task 9), `IconPicker` (Task 8), `LessonPageShell` from `@vizteck/lesson` (Task 7), new REST endpoints (Task 4).
- Produces: redesigned admin lesson page with Notion-style shell.

- [ ] **Step 1: Update lesson.service.ts — add coverImage/icon to LessonNode and new API calls**

Replace the full contents of `apps/admin/src/features/lessons/services/lesson.service.ts` with:

```ts
import { apiFetch } from '@/lib/api';

export interface LessonNode {
  id: string;
  roadmapId: string;
  type: string;
  title: string;
  content?: string;
  coverImage?: string | null;
  icon?: string | null;
}

export async function fetchLesson(nodeId: string): Promise<LessonNode> {
  const res = await apiFetch(`/api/nodes/${nodeId}`);
  if (!res.ok) throw new Error(`Failed to fetch lesson: ${res.status}`);
  const data = (await res.json()) as { node?: LessonNode };
  if (!data.node) throw new Error('Lesson not found');
  return data.node;
}

export async function updateLessonContent(nodeId: string, content: string): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/content`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status}): ${await res.text()}`);
}

export async function updateLessonTitle(nodeId: string, title: string): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/title`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Update title failed (${res.status}): ${await res.text()}`);
}

export async function updateNodeCover(nodeId: string, coverImage: string | null): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/cover`, {
    method: 'PATCH',
    body: JSON.stringify({ coverImage }),
  });
  if (!res.ok) throw new Error(`Update cover failed (${res.status}): ${await res.text()}`);
}

export async function updateNodeIcon(nodeId: string, icon: string | null): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/icon`, {
    method: 'PATCH',
    body: JSON.stringify({ icon }),
  });
  if (!res.ok) throw new Error(`Update icon failed (${res.status}): ${await res.text()}`);
}
```

- [ ] **Step 2: Write failing tests for useLessonPageShell**

Create `apps/admin/src/features/lessons/hooks/useLessonPageShell.spec.ts`:

```ts
import { renderHook, act } from "@testing-library/react";
import { useLessonPageShell } from "./useLessonPageShell";
import * as lessonService from "../services/lesson.service";

vi.mock("../services/lesson.service");

const mockUpdateCover = vi.mocked(lessonService.updateNodeCover);
const mockUpdateIcon = vi.mocked(lessonService.updateNodeIcon);

it("initializes cover and icon from initial values", () => {
  const { result } = renderHook(() =>
    useLessonPageShell("n1", "https://example.com/img.jpg", "⚡")
  );
  expect(result.current.cover).toBe("https://example.com/img.jpg");
  expect(result.current.icon).toBe("⚡");
});

it("setCover updates local state and calls API", async () => {
  mockUpdateCover.mockResolvedValue(undefined);
  const { result } = renderHook(() => useLessonPageShell("n1", null, null));
  await act(async () => {
    await result.current.setCover("https://cdn.example.com/new.jpg");
  });
  expect(result.current.cover).toBe("https://cdn.example.com/new.jpg");
  expect(mockUpdateCover).toHaveBeenCalledWith("n1", "https://cdn.example.com/new.jpg");
});

it("setCover rolls back on API error", async () => {
  mockUpdateCover.mockRejectedValue(new Error("Network error"));
  const { result } = renderHook(() => useLessonPageShell("n1", "https://old.jpg", null));
  await act(async () => {
    await result.current.setCover("https://new.jpg");
  });
  expect(result.current.cover).toBe("https://old.jpg");
});

it("setIcon updates local state and calls API", async () => {
  mockUpdateIcon.mockResolvedValue(undefined);
  const { result } = renderHook(() => useLessonPageShell("n1", null, null));
  await act(async () => {
    await result.current.setIcon("🚀");
  });
  expect(result.current.icon).toBe("🚀");
  expect(mockUpdateIcon).toHaveBeenCalledWith("n1", "🚀");
});

it("setIcon rolls back on API error", async () => {
  mockUpdateIcon.mockRejectedValue(new Error("fail"));
  const { result } = renderHook(() => useLessonPageShell("n1", null, "⚡"));
  await act(async () => {
    await result.current.setIcon("🚀");
  });
  expect(result.current.icon).toBe("⚡");
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
pnpm --filter @vizteck/admin test -- --reporter=verbose 2>&1 | grep -A5 "useLessonPageShell"
```

Expected: FAIL — "Cannot find module './useLessonPageShell'".

- [ ] **Step 4: Implement useLessonPageShell**

Create `apps/admin/src/features/lessons/hooks/useLessonPageShell.ts`:

```ts
"use client";

import { useState } from "react";
import { updateNodeCover, updateNodeIcon } from "../services/lesson.service";

export function useLessonPageShell(
  nodeId: string,
  initialCover: string | null | undefined,
  initialIcon: string | null | undefined,
) {
  const [cover, setCoverState] = useState<string | null>(initialCover ?? null);
  const [icon, setIconState] = useState<string | null>(initialIcon ?? null);

  const setCover = async (url: string | null) => {
    const prev = cover;
    setCoverState(url);
    try {
      await updateNodeCover(nodeId, url);
    } catch {
      setCoverState(prev);
    }
  };

  const setIcon = async (value: string | null) => {
    const prev = icon;
    setIconState(value);
    try {
      await updateNodeIcon(nodeId, value);
    } catch {
      setIconState(prev);
    }
  };

  return { cover, icon, setCover, setIcon };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm --filter @vizteck/admin test -- --reporter=verbose 2>&1 | grep -A5 "useLessonPageShell"
```

Expected: all 5 tests pass.

- [ ] **Step 6: Rewrite admin lesson page**

Replace the full contents of `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx` with:

```tsx
"use client";

import dynamic from "next/dynamic";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { useLessonEditor } from "@/features/lessons/hooks/useLessonEditor";
import { useLessonPageShell } from "@/features/lessons/hooks/useLessonPageShell";
import { LessonTitleEditor } from "@/features/lessons/components/LessonTitleEditor";
import { CoverImage } from "@/features/lessons/components/CoverImage";
import { LessonPageShell } from "@vizteck/lesson";

const LessonEditor = dynamic(
  () => import("@vizteck/lesson").then((m) => m.LessonEditor),
  { ssr: false, loading: () => <div className="text-sm text-text-2 py-4">Loading editor…</div> }
);

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  useAuthGuard();
  const { id, nodeId } = use(params);
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";

  const {
    loading,
    notFound,
    lesson,
    titleSaveStatus,
    handleSaveContent,
    handleSaveTitle,
  } = useLessonEditor(nodeId);

  const { cover, icon, setCover, setIcon } = useLessonPageShell(
    nodeId,
    lesson?.coverImage,
    lesson?.icon,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-2 text-sm">
        Loading lesson…
      </div>
    );
  }

  if (notFound || !lesson) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <p className="text-sm text-text-2">Node not found. It may have been deleted.</p>
        <a href="/roadmaps" className="text-sm text-indigo hover:underline mt-2 inline-block">
          ← Back to Roadmaps
        </a>
      </div>
    );
  }

  const shellNode = {
    id: nodeId,
    title: lesson.title,
    coverImage: cover,
    icon,
    content: lesson.content ?? null,
    type: (lesson.type === "ROADMAP" ? "ROADMAP" : "LESSON") as "LESSON" | "ROADMAP",
  };

  return (
    <LessonPageShell
      mode="edit"
      node={shellNode}
      breadcrumb={[]}
      coverSlot={
        <CoverImage
          cover={cover}
          icon={icon}
          breadcrumb={[]}
          onCoverChange={setCover}
          onIconChange={setIcon}
        />
      }
      titleSlot={
        <LessonTitleEditor
          title={lesson.title}
          saveStatus={titleSaveStatus}
          onSave={handleSaveTitle}
        />
      }
      contentSlot={
        <LessonEditor
          initialContentJson={lesson.content ?? ""}
          onSave={handleSaveContent}
        />
      }
    />
  );
}
```

- [ ] **Step 7: Verify TypeScript**

```bash
pnpm --filter @vizteck/admin exec tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 8: Run full admin test suite**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all tests pass (including the 5 new ones).

- [ ] **Step 9: Commit**

```bash
git add apps/admin/src/features/lessons/services/lesson.service.ts apps/admin/src/features/lessons/hooks/useLessonPageShell.ts apps/admin/src/features/lessons/hooks/useLessonPageShell.spec.ts apps/admin/src/app/roadmaps/
git commit -m "feat: wire Notion page shell into admin lesson editor"
```

---

### Task 11: apps/web — fetchBreadcrumb service + LessonLayout rewrite + page.tsx update

**Files:**
- Modify: `apps/web/src/features/lesson/services/node.service.ts`
- Create: `apps/web/src/features/lesson/services/node.service.test.ts` (add new tests to existing)
- Modify: `apps/web/src/features/lesson/components/LessonLayout.tsx`
- Modify: `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx`

**Interfaces:**
- Consumes: `LessonPageShell`, `BreadcrumbItem` from `@vizteck/lesson` (Task 7); `GET /api/nodes/:id/breadcrumb` (Task 4).
- Produces: public web lesson page with Notion-style layout.

- [ ] **Step 1: Update NodeItem type and add fetchBreadcrumb**

Replace the full contents of `apps/web/src/features/lesson/services/node.service.ts` with:

```ts
import type { BreadcrumbItem } from '@vizteck/lesson';

export interface NodeItem {
  id: string;
  roadmapId: string;
  type: 'ROADMAP' | 'LESSON';
  title: string;
  positionX: number;
  positionY: number;
  targetRoadmapId?: string;
  targetRoadmapSlug?: string;
  content?: string;
  coverImage?: string | null;
  icon?: string | null;
}

const NODE_TYPE_MAP: Record<number | string, 'ROADMAP' | 'LESSON'> = {
  0: 'ROADMAP',
  1: 'LESSON',
};

export function normalizeNodeType(t: unknown): 'ROADMAP' | 'LESSON' {
  if (t === 'ROADMAP' || t === 'LESSON') return t;
  return NODE_TYPE_MAP[t as number] ?? 'LESSON';
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchNode(id: string): Promise<NodeItem> {
  const res = await fetch(`${API}/api/nodes/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchNode(${id}): ${res.status}`);
  const raw = await res.json() as { node?: Partial<NodeItem> } | Partial<NodeItem>;
  const n = (raw as { node?: Partial<NodeItem> }).node ?? (raw as Partial<NodeItem>);
  return { ...n, type: normalizeNodeType(n.type) } as NodeItem;
}

export async function fetchBreadcrumb(nodeId: string): Promise<BreadcrumbItem[]> {
  const res = await fetch(`${API}/api/nodes/${nodeId}/breadcrumb`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json() as Array<{ title: string; slug: string | null; nodeId: string | null }>;
  return Array.isArray(data) ? data : [];
}
```

- [ ] **Step 2: Add fetchBreadcrumb tests to existing test file**

Open `apps/web/src/features/lesson/services/node.service.test.ts`. Add at the end:

```ts
import { fetchBreadcrumb } from './node.service';

describe('fetchBreadcrumb', () => {
  it('returns breadcrumb items on success', async () => {
    const items = [
      { title: 'Frontend', slug: 'frontend', nodeId: null },
      { title: 'Box Model', slug: null, nodeId: 'n1' },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => items,
    });
    const result = await fetchBreadcrumb('n1');
    expect(result).toEqual(items);
  });

  it('returns empty array on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const result = await fetchBreadcrumb('missing');
    expect(result).toEqual([]);
  });

  it('returns empty array on non-array response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => null,
    });
    const result = await fetchBreadcrumb('n1');
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests to verify new tests fail**

```bash
pnpm --filter @vizteck/web test -- --reporter=verbose 2>&1 | grep -A5 "fetchBreadcrumb"
```

Expected: FAIL — "fetchBreadcrumb is not a function" (it doesn't exist yet in the service).

Wait — we already wrote it in Step 1. Re-run tests:

```bash
pnpm --filter @vizteck/web test
```

Expected: all existing tests pass + 3 new fetchBreadcrumb tests pass.

- [ ] **Step 4: Rewrite LessonLayout.tsx**

Replace the full contents of `apps/web/src/features/lesson/components/LessonLayout.tsx` with:

```tsx
"use client";

import { LessonPageShell } from "@vizteck/lesson";
import type { LessonShellNode, BreadcrumbItem } from "@vizteck/lesson";
import type { NodeItem } from "@/features/lesson/services/node.service";

interface LessonLayoutProps {
  node: NodeItem;
  breadcrumb: BreadcrumbItem[];
}

export function LessonLayout({ node, breadcrumb }: LessonLayoutProps) {
  const shellNode: LessonShellNode = {
    id: node.id,
    title: node.title,
    coverImage: node.coverImage ?? null,
    icon: node.icon ?? null,
    content: node.content ?? null,
    type: node.type,
  };

  return (
    <LessonPageShell
      mode="view"
      node={shellNode}
      breadcrumb={breadcrumb}
      getLinkHref={(item) => item.slug ? `/roadmap/${item.slug}` : undefined}
    />
  );
}
```

Wait — `LessonPageShell` doesn't accept `getLinkHref`. The `getLinkHref` prop belongs to `BreadcrumbDisplay`. Let me pass it via `LessonPageShell`. We need to update `LessonPageShell` to accept and forward this prop, OR pass a custom `coverSlot` in view mode.

Simpler fix: add `getLinkHref` to `LessonPageShellProps` and pass it down to `BreadcrumbDisplay` inside `CoverDisplay`. Update `CoverDisplay` to accept and forward it.

Update `packages/lesson/src/CoverDisplay.tsx` — add `getLinkHref` prop:

```tsx
export interface CoverDisplayProps {
  coverImage: string | null;
  icon: string | null;
  breadcrumb: BreadcrumbItem[];
  onIconClick?: () => void;
  getLinkHref?: (item: BreadcrumbItem) => string | undefined;
}

// In the component, pass getLinkHref to BreadcrumbDisplay:
<BreadcrumbDisplay items={breadcrumb} variant="overlay" getLinkHref={getLinkHref} />
```

Update `packages/lesson/src/LessonPageShell.tsx` — add `getLinkHref` prop and pass to `CoverDisplay`:

```tsx
export interface LessonPageShellProps {
  mode: "edit" | "view";
  node: LessonShellNode;
  breadcrumb: BreadcrumbItem[];
  coverSlot?: React.ReactNode;
  titleSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
  getLinkHref?: (item: BreadcrumbItem) => string | undefined;
}

// In the cover fallback:
const cover = coverSlot ?? (
  <CoverDisplay
    coverImage={node.coverImage}
    icon={node.icon}
    breadcrumb={breadcrumb}
    getLinkHref={getLinkHref}
  />
);
```

Apply these two changes before writing LessonLayout:

In `packages/lesson/src/CoverDisplay.tsx`, find:
```tsx
export interface CoverDisplayProps {
  coverImage: string | null;
  icon: string | null;
  breadcrumb: BreadcrumbItem[];
  onIconClick?: () => void;
}
```

Replace with:
```tsx
export interface CoverDisplayProps {
  coverImage: string | null;
  icon: string | null;
  breadcrumb: BreadcrumbItem[];
  onIconClick?: () => void;
  getLinkHref?: (item: BreadcrumbItem) => string | undefined;
}
```

And in the component body, find:
```tsx
      {breadcrumb.length > 0 && (
        <div className="absolute top-3 left-4">
          <BreadcrumbDisplay items={breadcrumb} variant="overlay" />
        </div>
      )}
```

Replace with:
```tsx
      {breadcrumb.length > 0 && (
        <div className="absolute top-3 left-4">
          <BreadcrumbDisplay items={breadcrumb} variant="overlay" getLinkHref={getLinkHref} />
        </div>
      )}
```

In `packages/lesson/src/LessonPageShell.tsx`, find:
```tsx
export interface LessonPageShellProps {
  mode: "edit" | "view";
  node: LessonShellNode;
  breadcrumb: BreadcrumbItem[];
  coverSlot?: React.ReactNode;
  titleSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
}

export function LessonPageShell({
  mode,
  node,
  breadcrumb,
  coverSlot,
  titleSlot,
  contentSlot,
}: LessonPageShellProps) {
  const cover = coverSlot ?? (
    <CoverDisplay
      coverImage={node.coverImage}
      icon={node.icon}
      breadcrumb={breadcrumb}
    />
  );
```

Replace with:
```tsx
export interface LessonPageShellProps {
  mode: "edit" | "view";
  node: LessonShellNode;
  breadcrumb: BreadcrumbItem[];
  coverSlot?: React.ReactNode;
  titleSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
  getLinkHref?: (item: BreadcrumbItem) => string | undefined;
}

export function LessonPageShell({
  mode,
  node,
  breadcrumb,
  coverSlot,
  titleSlot,
  contentSlot,
  getLinkHref,
}: LessonPageShellProps) {
  const cover = coverSlot ?? (
    <CoverDisplay
      coverImage={node.coverImage}
      icon={node.icon}
      breadcrumb={breadcrumb}
      getLinkHref={getLinkHref}
    />
  );
```

- [ ] **Step 5: Now write the final LessonLayout.tsx**

Replace the full contents of `apps/web/src/features/lesson/components/LessonLayout.tsx` with:

```tsx
"use client";

import { LessonPageShell } from "@vizteck/lesson";
import type { LessonShellNode, BreadcrumbItem } from "@vizteck/lesson";
import type { NodeItem } from "@/features/lesson/services/node.service";

interface LessonLayoutProps {
  node: NodeItem;
  breadcrumb: BreadcrumbItem[];
}

export function LessonLayout({ node, breadcrumb }: LessonLayoutProps) {
  const shellNode: LessonShellNode = {
    id: node.id,
    title: node.title,
    coverImage: node.coverImage ?? null,
    icon: node.icon ?? null,
    content: node.content ?? null,
    type: node.type,
  };

  return (
    <LessonPageShell
      mode="view"
      node={shellNode}
      breadcrumb={breadcrumb}
      getLinkHref={(item) =>
        item.slug ? `/roadmap/${item.slug}` : undefined
      }
    />
  );
}
```

- [ ] **Step 6: Update page.tsx to fetch breadcrumb**

Replace the full contents of `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` with:

```tsx
import { LessonLayout } from '@/features/lesson/components/LessonLayout';
import { fetchNode, fetchBreadcrumb } from '@/features/lesson/services/node.service';

export const revalidate = 0;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;

  const [nodeResult, breadcrumbResult] = await Promise.allSettled([
    fetchNode(id),
    fetchBreadcrumb(id),
  ]);

  if (nodeResult.status === 'rejected') {
    return (
      <div className="text-text-3 text-sm text-center py-16">
        Lesson not found.
      </div>
    );
  }

  const breadcrumb =
    breadcrumbResult.status === 'fulfilled' ? breadcrumbResult.value : [];

  return (
    <LessonLayout
      node={nodeResult.value}
      breadcrumb={breadcrumb}
    />
  );
}
```

Note: `slug` param is no longer needed in `LessonPage` since `fetchRoadmap` is removed (MiniGraph is gone). If the param is needed elsewhere, keep the destructure but simply don't use `slug`.

- [ ] **Step 7: Verify TypeScript for all changed packages**

```bash
pnpm --filter @vizteck/lesson exec tsc --noEmit
pnpm --filter @vizteck/web exec tsc --noEmit
pnpm --filter @vizteck/admin exec tsc --noEmit
```

Expected: all exit 0.

- [ ] **Step 8: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 9: Run lint**

```bash
pnpm lint
```

Expected: all packages exit 0.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/ packages/lesson/src/CoverDisplay.tsx packages/lesson/src/LessonPageShell.tsx
git commit -m "feat: rewrite web lesson page with Notion-style LessonPageShell"
```
