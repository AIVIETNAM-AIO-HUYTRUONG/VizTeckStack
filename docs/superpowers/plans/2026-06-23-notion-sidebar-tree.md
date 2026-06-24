# Notion Sidebar Page Tree — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible left sidebar showing the current root roadmap's page tree (sub-roadmaps + lessons) to both the public web viewer (`apps/web`) and the admin lesson editor (`apps/admin`).

**Architecture:** New `GetRoadmapTree` gRPC RPC fetches the 2-level page tree (root nodes + sub-roadmap children) from `svc-roadmap`. `api-gateway` exposes `GET /api/roadmaps/:slug/tree`. Three new React components in `packages/lesson` (`PageTreeItem`, `PageTreeSidebar`, `LessonPageLayout`) are shared between `apps/web` and `apps/admin`. Both apps wrap their existing `LessonPageShell` in `LessonPageLayout`.

**Tech Stack:** Proto3 / ts-proto, NestJS gRPC, Prisma, Next.js 15, React, Vitest, Jest

## Global Constraints

- `packages/*` must not import from `apps/*`
- All fetches in `apps/web` use `{ cache: 'no-store' }` — never `next/cache`
- No `as any` casts
- No `next` dependency in `packages/lesson` — use plain `<a>` tags and `useEffect` for `localStorage`
- All Tailwind: use semantic tokens `bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo` — never hardcode hex
- `"use client"` directive required on all interactive React components
- Proto field numbers must not be reused or conflict — new messages start fresh
- Proto type names: `RoadmapTreeNode`, `RoadmapTreeRequest`, `RoadmapTreeResponse`
- REST endpoint: `GET /api/roadmaps/:slug/tree` — public, no `AdminGuard`
- localStorage key for collapse state: `lesson-sidebar-collapsed`

---

### Task 1: Proto — Add RoadmapTree Messages and RPC

**Files:**
- Modify: `packages/proto/roadmap.proto`
- Regenerate (no manual edit): `packages/proto/generated/roadmap.ts` (via `node generate.js`)

**Interfaces:**
- Produces: `RoadmapTreeNode`, `RoadmapTreeRequest`, `RoadmapTreeResponse` TypeScript interfaces; `GetRoadmapTree` RPC method

- [ ] **Step 1: Add new messages and RPC to roadmap.proto**

Open `packages/proto/roadmap.proto`. After the `BreadcrumbResponse` message (line 130) and before the `service RoadmapService {` block (line 134), insert:

```protobuf
message RoadmapTreeNode {
  string id               = 1;
  string title            = 2;
  string type             = 3;
  string slug             = 4;
  string targetRoadmapId  = 5;
  string roadmapSlug      = 6;
  string roadmapId        = 7;
  repeated RoadmapTreeNode children = 8;
}

message RoadmapTreeRequest {
  string slug = 1;
}

message RoadmapTreeResponse {
  string rootSlug  = 1;
  string rootTitle = 2;
  repeated RoadmapTreeNode nodes = 3;
}
```

Then inside `service RoadmapService { }`, after `rpc GetNodeBreadcrumb (IdRequest) returns (BreadcrumbResponse);`, add:

```protobuf
  rpc GetRoadmapTree (RoadmapTreeRequest) returns (RoadmapTreeResponse);
```

- [ ] **Step 2: Regenerate TypeScript from proto**

```bash
cd packages/proto && node generate.js
```

Expected: `packages/proto/generated/roadmap.ts` updated with new interfaces: `RoadmapTreeNode`, `RoadmapTreeRequest`, `RoadmapTreeResponse`, and `GetRoadmapTree` entry in the service definition.

- [ ] **Step 3: Verify generated types exist**

```bash
grep -n "RoadmapTreeNode\|RoadmapTreeRequest\|RoadmapTreeResponse" packages/proto/generated/roadmap.ts
```

Expected: at least 3 lines matching, showing the interfaces were generated.

- [ ] **Step 4: Build proto package to update dist/**

```bash
pnpm --filter @vizteck/proto build
```

Expected: exits 0, `packages/proto/dist/` updated.

- [ ] **Step 5: Commit**

```bash
git add packages/proto/roadmap.proto packages/proto/generated/roadmap.ts packages/proto/dist/
git commit -m "feat: add RoadmapTree messages and GetRoadmapTree RPC to proto"
```

---

### Task 2: svc-roadmap — Implement getRoadmapTree (TDD)

**Files:**
- Modify: `apps/svc-roadmap/src/roadmap/roadmap.service.ts`
- Modify: `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts`
- Modify: `apps/svc-roadmap/src/roadmap/roadmap.controller.ts`

**Interfaces:**
- Consumes (from Task 1): `RoadmapTreeRequest`, `RoadmapTreeResponse`, `RoadmapTreeNode` from `@vizteck/proto`
- Produces: `RoadmapService.getRoadmapTree({ slug })` async method

- [ ] **Step 1: Add `findMany` mock to the test db mock**

In `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts`, the existing mock already has `db.node.findUnique` and `db.node.findFirst`. Add `findMany` to the `node` mock object:

```ts
// In the jest.mock('@vizteck/db', ...) factory, update the `node` object:
node: {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
},
```

- [ ] **Step 2: Write the 4 failing getRoadmapTree tests**

Append this `describe` block to `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts`:

```ts
describe('getRoadmapTree', () => {
  const ROOT = { id: 'r1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null, status: 'PUBLIC' };
  const SUB = { id: 'r2', slug: 'html-css', title: 'HTML & CSS', description: null, coverImage: null, status: 'PUBLIC' };

  it('returns correct tree for roadmap with mixed LESSON + ROADMAP nodes', async () => {
    (db.roadmap.findUnique as jest.Mock)
      .mockResolvedValueOnce(ROOT)   // first call: root roadmap
      .mockResolvedValueOnce(SUB);   // second call: sub-roadmap
    (db.node.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'n1', title: 'Intro', type: 'LESSON', roadmapId: 'r1', targetRoadmapId: null, coverImage: null, icon: null },
        { id: 'n2', title: 'HTML & CSS', type: 'ROADMAP', roadmapId: 'r1', targetRoadmapId: 'r2', coverImage: null, icon: null },
      ])  // root nodes
      .mockResolvedValueOnce([
        { id: 'n3', title: 'Box Model', type: 'LESSON', roadmapId: 'r2', targetRoadmapId: null, coverImage: null, icon: null },
      ]);  // sub-roadmap nodes
    const result = await service.getRoadmapTree({ slug: 'frontend' });
    expect(result.rootSlug).toBe('frontend');
    expect(result.rootTitle).toBe('Frontend');
    expect(result.nodes).toHaveLength(2);
    const lessonNode = result.nodes.find((n) => n.id === 'n1')!;
    expect(lessonNode.type).toBe('LESSON');
    expect(lessonNode.roadmapSlug).toBe('frontend');
    expect(lessonNode.roadmapId).toBe('r1');
    const roadmapNode = result.nodes.find((n) => n.id === 'n2')!;
    expect(roadmapNode.type).toBe('ROADMAP');
    expect(roadmapNode.slug).toBe('html-css');
    expect(roadmapNode.targetRoadmapId).toBe('r2');
    expect(roadmapNode.children).toHaveLength(1);
    expect(roadmapNode.children![0].id).toBe('n3');
    expect(roadmapNode.children![0].roadmapSlug).toBe('html-css');
    expect(roadmapNode.children![0].roadmapId).toBe('r2');
  });

  it('returns empty nodes array for roadmap with no nodes', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(ROOT);
    (db.node.findMany as jest.Mock).mockResolvedValueOnce([]);
    const result = await service.getRoadmapTree({ slug: 'frontend' });
    expect(result.rootSlug).toBe('frontend');
    expect(result.nodes).toEqual([]);
  });

  it('returns empty response for unknown slug', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const result = await service.getRoadmapTree({ slug: 'nonexistent' });
    expect(result.rootSlug).toBe('');
    expect(result.rootTitle).toBe('');
    expect(result.nodes).toEqual([]);
  });

  it('sub-roadmap ROADMAP node with null targetRoadmapId yields no children', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValueOnce(ROOT);
    (db.node.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 'n2', title: 'Orphan ROADMAP', type: 'ROADMAP', roadmapId: 'r1', targetRoadmapId: null, coverImage: null, icon: null },
    ]);
    const result = await service.getRoadmapTree({ slug: 'frontend' });
    expect(result.nodes[0].children).toEqual([]);
    expect(result.nodes[0].slug).toBe('');
    expect(result.nodes[0].targetRoadmapId).toBe('');
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
pnpm --filter @vizteck/svc-roadmap test -- --testPathPattern="roadmap.service.spec"
```

Expected: 4 new tests fail with "getRoadmapTree is not a function" or similar.

- [ ] **Step 4: Add getRoadmapTree import to service file**

In `apps/svc-roadmap/src/roadmap/roadmap.service.ts`, update the import from `@vizteck/proto`:

```ts
import {
  Empty, RoadmapList, SlugRequest, RoadmapDetail, IdRequest,
  NodeDetail, CreateRoadmapRequest, RoadmapItem, UpdateRoadmapRequest,
  BoolResponse, UpsertGraphRequest, UpdateNodeContentRequest, UpdateNodeTitleRequest,
  UpdateNodeCoverRequest, UpdateNodeIconRequest, BreadcrumbResponse,
  NodeItem, RoadmapTreeRequest, RoadmapTreeResponse, RoadmapTreeNode,
} from '@vizteck/proto';
```

- [ ] **Step 5: Implement getRoadmapTree in RoadmapService**

Add this method to the `RoadmapService` class in `apps/svc-roadmap/src/roadmap/roadmap.service.ts` (after `getNodeBreadcrumb`):

```ts
async getRoadmapTree({ slug }: RoadmapTreeRequest): Promise<RoadmapTreeResponse> {
  const root = await db.roadmap.findUnique({ where: { slug } });
  if (!root) return { rootSlug: '', rootTitle: '', nodes: [] };

  const rootNodes = await db.node.findMany({ where: { roadmapId: root.id } });

  const nodes: RoadmapTreeNode[] = await Promise.all(
    rootNodes.map(async (n): Promise<RoadmapTreeNode> => {
      if (n.type === 'LESSON') {
        return {
          id: n.id, title: n.title, type: 'LESSON',
          slug: '', targetRoadmapId: '',
          roadmapSlug: root.slug, roadmapId: root.id,
          children: [],
        };
      }
      // ROADMAP node
      if (!n.targetRoadmapId) {
        return {
          id: n.id, title: n.title, type: 'ROADMAP',
          slug: '', targetRoadmapId: '',
          roadmapSlug: '', roadmapId: '',
          children: [],
        };
      }
      const subRoadmap = await db.roadmap.findUnique({ where: { id: n.targetRoadmapId } });
      if (!subRoadmap) {
        return {
          id: n.id, title: n.title, type: 'ROADMAP',
          slug: '', targetRoadmapId: n.targetRoadmapId,
          roadmapSlug: '', roadmapId: '',
          children: [],
        };
      }
      const subNodes = await db.node.findMany({ where: { roadmapId: subRoadmap.id } });
      const children: RoadmapTreeNode[] = subNodes.map((sn) => ({
        id: sn.id, title: sn.title, type: sn.type,
        slug: '', targetRoadmapId: sn.targetRoadmapId ?? '',
        roadmapSlug: subRoadmap.slug, roadmapId: subRoadmap.id,
        children: [],
      }));
      return {
        id: n.id, title: n.title, type: 'ROADMAP',
        slug: subRoadmap.slug, targetRoadmapId: subRoadmap.id,
        roadmapSlug: '', roadmapId: '',
        children,
      };
    }),
  );

  return { rootSlug: root.slug, rootTitle: root.title, nodes };
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
pnpm --filter @vizteck/svc-roadmap test -- --testPathPattern="roadmap.service.spec"
```

Expected: all tests pass (including existing ones — do not break them).

- [ ] **Step 7: Expose getRoadmapTree via gRPC controller**

In `apps/svc-roadmap/src/roadmap/roadmap.controller.ts`:

1. Add `RoadmapTreeRequest` to the import from `@vizteck/proto`:

```ts
import { Empty, SlugRequest, IdRequest, CreateRoadmapRequest, UpdateRoadmapRequest, UpsertGraphRequest, UpdateNodeContentRequest, UpdateNodeTitleRequest, UpdateNodeCoverRequest, UpdateNodeIconRequest, RoadmapTreeRequest } from '@vizteck/proto';
```

2. Add the handler method to `RoadmapController`:

```ts
@GrpcMethod('RoadmapService', 'GetRoadmapTree')
getRoadmapTree(data: RoadmapTreeRequest) { return this.svc.getRoadmapTree(data); }
```

- [ ] **Step 8: Commit**

```bash
git add apps/svc-roadmap/src/roadmap/roadmap.service.ts apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts apps/svc-roadmap/src/roadmap/roadmap.controller.ts
git commit -m "feat: implement getRoadmapTree in svc-roadmap with 4 tests"
```

---

### Task 3: api-gateway — DTOs, gRPC client, REST endpoint, GraphQL query

**Files:**
- Modify: `apps/api-gateway/src/roadmap/roadmap.dto.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.grpc-client.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.resolver.ts`

**Interfaces:**
- Consumes (from Task 1): `RoadmapTreeRequest`, `RoadmapTreeResponse` from `@vizteck/proto` (via gRPC)
- Produces: `GET /api/roadmaps/:slug/tree` returning `{ rootSlug, rootTitle, nodes: RoadmapTreeNodeDto[] }`
- Produces: GraphQL `roadmapTree(slug: String!): RoadmapTreeDto`

- [ ] **Step 1: Add DTOs to roadmap.dto.ts**

Append to `apps/api-gateway/src/roadmap/roadmap.dto.ts`:

```ts
@ObjectType()
export class RoadmapTreeNodeDto {
  @Field(() => ID) @ApiProperty({ example: 'node_001' }) id!: string;
  @Field() @ApiProperty({ example: 'Box Model' }) title!: string;
  @Field() @ApiProperty({ example: 'LESSON', enum: ['LESSON', 'ROADMAP'] }) type!: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'html-css' }) slug?: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'clx...' }) targetRoadmapId?: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'frontend' }) roadmapSlug?: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'clx...' }) roadmapId?: string;
  @Field(() => [RoadmapTreeNodeDto], { nullable: true })
  @ApiPropertyOptional({ type: () => [RoadmapTreeNodeDto] })
  children?: RoadmapTreeNodeDto[];
}

@ObjectType()
export class RoadmapTreeDto {
  @Field() @ApiProperty({ example: 'frontend' }) rootSlug!: string;
  @Field() @ApiProperty({ example: 'Frontend Roadmap' }) rootTitle!: string;
  @Field(() => [RoadmapTreeNodeDto]) @ApiProperty({ type: () => [RoadmapTreeNodeDto] }) nodes!: RoadmapTreeNodeDto[];
}
```

Note: `RoadmapTreeNodeDto` references itself (`children?: RoadmapTreeNodeDto[]`) — NestJS GraphQL handles self-referential `@ObjectType()` correctly with `() => [RoadmapTreeNodeDto]` syntax.

- [ ] **Step 2: Add getRoadmapTree to gRPC client**

In `apps/api-gateway/src/roadmap/roadmap.grpc-client.ts`:

1. Add `getRoadmapTree` to the `GrpcRoadmapService` interface:

```ts
getRoadmapTree(data: { slug: string }): Observable<any>;
```

2. Add the wrapper method to `RoadmapGrpcClient`:

```ts
getRoadmapTree(slug: string) {
  return firstValueFrom(this.svc.getRoadmapTree({ slug }));
}
```

- [ ] **Step 3: Add REST endpoint to rest controller**

In `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`, add the imports:

```ts
import {
  CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput,
  UpdateNodeContentInput, UpdateNodeTitleInput,
  UpdateNodeCoverInput, UpdateNodeIconInput,
  RoadmapTreeDto,
} from './roadmap.dto';
```

Then add this method to `RoadmapRestController` (after `getNode`):

```ts
@Get('roadmaps/:slug/tree')
@ApiOperation({ summary: 'Get page tree for a roadmap by slug' })
@ApiParam({ name: 'slug', type: String })
async getRoadmapTree(@Param('slug') slug: string): Promise<RoadmapTreeDto> {
  return this.grpc.getRoadmapTree(slug);
}
```

**Important:** This endpoint must be declared BEFORE any guarded `POST roadmaps/:id` routes since Express route matching is order-sensitive. The current structure has `GET roadmaps/:slug` above `POST roadmaps` — add `GET roadmaps/:slug/tree` right after `GET roadmaps/:slug`.

- [ ] **Step 4: Add GraphQL query to resolver**

In `apps/api-gateway/src/roadmap/roadmap.resolver.ts`:

1. Add `RoadmapTreeDto` to the import from `./roadmap.dto`:

```ts
import {
  RoadmapDto, RoadmapDetailDto, NodeDto, NodeTypeEnum,
  CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput,
  BreadcrumbItemDto, RoadmapTreeDto,
} from "./roadmap.dto";
```

2. Add the query method to `RoadmapResolver`:

```ts
@Query(() => RoadmapTreeDto, { nullable: true })
async roadmapTree(@Args("slug") slug: string): Promise<RoadmapTreeDto> {
  return this.grpc.getRoadmapTree(slug);
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm --filter @vizteck/api-gateway build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api-gateway/src/roadmap/roadmap.dto.ts apps/api-gateway/src/roadmap/roadmap.grpc-client.ts apps/api-gateway/src/roadmap/roadmap.rest.controller.ts apps/api-gateway/src/roadmap/roadmap.resolver.ts
git commit -m "feat: add GetRoadmapTree to api-gateway (REST + GraphQL)"
```

---

### Task 4: packages/lesson — Types + PageTreeItem Component

**Files:**
- Modify: `packages/lesson/src/types.ts`
- Create: `packages/lesson/src/PageTreeItem.tsx`
- Create: `packages/lesson/src/PageTreeItem.spec.tsx`

**Interfaces:**
- Produces: `PageTreeNode`, `PageTree` types
- Produces: `PageTreeItem` React component

- [ ] **Step 1: Add PageTreeNode and PageTree to types.ts**

Append to `packages/lesson/src/types.ts`:

```ts
export interface PageTreeNode {
  id: string;
  title: string;
  type: 'LESSON' | 'ROADMAP';
  slug?: string;            // ROADMAP: targetRoadmap slug (web: /roadmap/[slug])
  targetRoadmapId?: string; // ROADMAP: targetRoadmap UUID (admin: /roadmaps/[id])
  roadmapSlug?: string;     // LESSON: parent roadmap slug (web: /roadmap/[slug]/node/[id])
  roadmapId?: string;       // LESSON: parent roadmap UUID (admin: /roadmaps/[id]/nodes/[nodeId])
  children?: PageTreeNode[];
}

export interface PageTree {
  rootSlug: string;
  rootTitle: string;
  nodes: PageTreeNode[];
}
```

- [ ] **Step 2: Write failing tests for PageTreeItem**

Create `packages/lesson/src/PageTreeItem.spec.tsx`:

```tsx
/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { PageTreeItem } from './PageTreeItem';
import type { PageTreeNode } from './types';

const lessonNode: PageTreeNode = {
  id: 'n1', title: 'Box Model', type: 'LESSON',
  roadmapSlug: 'html-css', roadmapId: 'r2',
};

const roadmapNode: PageTreeNode = {
  id: 'n2', title: 'HTML & CSS', type: 'ROADMAP',
  slug: 'html-css', targetRoadmapId: 'r2',
  children: [lessonNode],
};

const mockToggle = vi.fn();

it('renders lesson node as a link', () => {
  render(
    <PageTreeItem
      node={lessonNode}
      depth={1}
      isExpanded={false}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
    />
  );
  const link = screen.getByRole('link', { name: 'Box Model' });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/roadmap/html-css/node/n1');
});

it('renders ROADMAP node with folder icon and expand button', () => {
  render(
    <PageTreeItem
      node={roadmapNode}
      depth={0}
      isExpanded={false}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
      getRoadmapHref={(n) => n.slug ? `/roadmap/${n.slug}` : undefined}
    />
  );
  expect(screen.getByText('HTML & CSS')).toBeInTheDocument();
  const btn = screen.getByRole('button');
  fireEvent.click(btn);
  expect(mockToggle).toHaveBeenCalledWith('n2');
});

it('highlights current node with indigo style', () => {
  render(
    <PageTreeItem
      node={lessonNode}
      depth={1}
      currentNodeId="n1"
      isExpanded={false}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
    />
  );
  const link = screen.getByRole('link', { name: 'Box Model' });
  expect(link.className).toContain('text-indigo');
});

it('renders children when isExpanded is true', () => {
  render(
    <PageTreeItem
      node={roadmapNode}
      depth={0}
      isExpanded={true}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
    />
  );
  expect(screen.getByText('Box Model')).toBeInTheDocument();
});

it('does not render children when isExpanded is false', () => {
  render(
    <PageTreeItem
      node={roadmapNode}
      depth={0}
      isExpanded={false}
      onToggle={mockToggle}
      getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
    />
  );
  expect(screen.queryByText('Box Model')).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
pnpm --filter @vizteck/lesson test -- --testPathPattern="PageTreeItem"
```

Expected: 5 tests fail with "Cannot find module './PageTreeItem'".

- [ ] **Step 4: Implement PageTreeItem.tsx**

Create `packages/lesson/src/PageTreeItem.tsx`:

```tsx
"use client";

import type { PageTreeNode } from './types';

export interface PageTreeItemProps {
  node: PageTreeNode;
  depth: number;
  currentNodeId?: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  getLessonHref: (node: PageTreeNode) => string;
  getRoadmapHref?: (node: PageTreeNode) => string | undefined;
}

export function PageTreeItem({
  node, depth, currentNodeId, isExpanded, onToggle, getLessonHref, getRoadmapHref,
}: PageTreeItemProps) {
  const isCurrent = node.id === currentNodeId;
  const indent = depth * 12;

  if (node.type === 'LESSON') {
    const href = getLessonHref(node);
    return (
      <div style={{ paddingLeft: `${indent}px` }}>
        <a
          href={href}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${
            isCurrent
              ? 'bg-indigo/10 text-indigo font-medium'
              : 'text-text-2 hover:bg-bg-2 hover:text-text-1'
          }`}
        >
          <span className="shrink-0 text-xs">📄</span>
          <span className="truncate">{node.title}</span>
        </a>
      </div>
    );
  }

  // ROADMAP node
  const roadmapHref = getRoadmapHref?.(node);
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div style={{ paddingLeft: `${indent}px` }}>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          className="flex items-center gap-1.5 flex-1 px-2 py-1 rounded text-sm text-text-2 hover:bg-bg-2 hover:text-text-1 transition-colors text-left"
        >
          <span className="shrink-0 text-xs">{isExpanded ? '📂' : '📁'}</span>
          {roadmapHref ? (
            <a
              href={roadmapHref}
              onClick={(e) => e.stopPropagation()}
              className="truncate hover:underline"
            >
              {node.title}
            </a>
          ) : (
            <span className="truncate">{node.title}</span>
          )}
        </button>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <PageTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              currentNodeId={currentNodeId}
              isExpanded={false}
              onToggle={onToggle}
              getLessonHref={getLessonHref}
              getRoadmapHref={getRoadmapHref}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
pnpm --filter @vizteck/lesson test -- --testPathPattern="PageTreeItem"
```

Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/lesson/src/types.ts packages/lesson/src/PageTreeItem.tsx packages/lesson/src/PageTreeItem.spec.tsx
git commit -m "feat: add PageTreeNode/PageTree types and PageTreeItem component"
```

---

### Task 5: packages/lesson — PageTreeSidebar Component

**Files:**
- Create: `packages/lesson/src/PageTreeSidebar.tsx`
- Create: `packages/lesson/src/PageTreeSidebar.spec.tsx`

**Interfaces:**
- Consumes (from Task 4): `PageTreeNode`, `PageTree`, `PageTreeItem`
- Produces: `PageTreeSidebar` React component

- [ ] **Step 1: Write failing tests for PageTreeSidebar**

Create `packages/lesson/src/PageTreeSidebar.spec.tsx`:

```tsx
/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { PageTreeSidebar } from './PageTreeSidebar';
import type { PageTree } from './types';

const tree: PageTree = {
  rootSlug: 'frontend',
  rootTitle: 'Frontend',
  nodes: [
    {
      id: 'n1', title: 'HTML & CSS', type: 'ROADMAP',
      slug: 'html-css', targetRoadmapId: 'r2',
      children: [
        { id: 'n3', title: 'Box Model', type: 'LESSON', roadmapSlug: 'html-css', roadmapId: 'r2' },
        { id: 'n4', title: 'Flexbox', type: 'LESSON', roadmapSlug: 'html-css', roadmapId: 'r2' },
      ],
    },
    {
      id: 'n2', title: 'JavaScript', type: 'ROADMAP',
      slug: 'javascript', targetRoadmapId: 'r3',
      children: [
        { id: 'n5', title: 'Variables', type: 'LESSON', roadmapSlug: 'javascript', roadmapId: 'r3' },
      ],
    },
  ],
};

const getLessonHref = (n: { id: string; roadmapSlug?: string }) =>
  `/roadmap/${n.roadmapSlug}/node/${n.id}`;

it('renders root title as header', () => {
  render(<PageTreeSidebar tree={tree} getLessonHref={getLessonHref as any} />);
  expect(screen.getByText('Frontend')).toBeInTheDocument();
});

it('auto-expands path to currentNodeId on mount', () => {
  render(
    <PageTreeSidebar tree={tree} currentNodeId="n3" getLessonHref={getLessonHref as any} />
  );
  // 'HTML & CSS' is the parent of n3, should be expanded → child 'Box Model' visible
  expect(screen.getByText('Box Model')).toBeInTheDocument();
  // 'JavaScript' is not in path → collapsed → 'Variables' not visible
  expect(screen.queryByText('Variables')).not.toBeInTheDocument();
});

it('clicking a ROADMAP node toggles its children', () => {
  render(<PageTreeSidebar tree={tree} getLessonHref={getLessonHref as any} />);
  // Initially collapsed — Box Model not visible
  expect(screen.queryByText('Box Model')).not.toBeInTheDocument();
  // Click 'HTML & CSS' button to expand
  const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('HTML & CSS'))!;
  fireEvent.click(btn);
  expect(screen.getByText('Box Model')).toBeInTheDocument();
  // Click again to collapse
  fireEvent.click(btn);
  expect(screen.queryByText('Box Model')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm --filter @vizteck/lesson test -- --testPathPattern="PageTreeSidebar"
```

Expected: 3 tests fail with "Cannot find module './PageTreeSidebar'".

- [ ] **Step 3: Implement PageTreeSidebar.tsx**

Create `packages/lesson/src/PageTreeSidebar.tsx`:

```tsx
"use client";

import { useState, useEffect } from 'react';
import { PageTreeItem } from './PageTreeItem';
import type { PageTree, PageTreeNode } from './types';

export interface PageTreeSidebarProps {
  tree: PageTree;
  currentNodeId?: string;
  getLessonHref: (node: PageTreeNode) => string;
  getRoadmapHref?: (node: PageTreeNode) => string | undefined;
}

function findPathToNode(nodes: PageTreeNode[], targetId: string): Set<string> {
  for (const node of nodes) {
    if (node.id === targetId) return new Set<string>();
    if (node.children?.length) {
      const childPath = findPathToNode(node.children, targetId);
      if (childPath !== null) {
        childPath.add(node.id);
        return childPath;
      }
    }
  }
  return null as unknown as Set<string>;
}

export function PageTreeSidebar({ tree, currentNodeId, getLessonHref, getRoadmapHref }: PageTreeSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (!currentNodeId) return new Set();
    return findPathToNode(tree.nodes, currentNodeId) ?? new Set();
  });

  useEffect(() => {
    if (!currentNodeId) return;
    const path = findPathToNode(tree.nodes, currentNodeId);
    if (path) setExpandedIds(path);
  }, [currentNodeId, tree.nodes]);

  const onToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto py-3 px-2">
      <div className="px-2 pb-2 mb-1 border-b border-border">
        <span className="text-xs font-semibold text-text-3 uppercase tracking-wider">
          {tree.rootTitle}
        </span>
      </div>
      {tree.nodes.map((node) => (
        <PageTreeItem
          key={node.id}
          node={node}
          depth={0}
          currentNodeId={currentNodeId}
          isExpanded={expandedIds.has(node.id)}
          onToggle={onToggle}
          getLessonHref={getLessonHref}
          getRoadmapHref={getRoadmapHref}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm --filter @vizteck/lesson test -- --testPathPattern="PageTreeSidebar"
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/lesson/src/PageTreeSidebar.tsx packages/lesson/src/PageTreeSidebar.spec.tsx
git commit -m "feat: add PageTreeSidebar component with auto-expand path"
```

---

### Task 6: packages/lesson — LessonPageLayout + Export Updates

**Files:**
- Create: `packages/lesson/src/LessonPageLayout.tsx`
- Create: `packages/lesson/src/LessonPageLayout.spec.tsx`
- Modify: `packages/lesson/src/index.ts`

**Interfaces:**
- Consumes (from Tasks 4-5): `PageTree`, `PageTreeNode`, `PageTreeSidebar`
- Produces: `LessonPageLayout` React component; updated `@vizteck/lesson` exports

- [ ] **Step 1: Write failing tests for LessonPageLayout**

Create `packages/lesson/src/LessonPageLayout.spec.tsx`:

```tsx
/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonPageLayout } from './LessonPageLayout';
import type { PageTree } from './types';

const tree: PageTree = {
  rootSlug: 'frontend',
  rootTitle: 'Frontend',
  nodes: [
    { id: 'n1', title: 'Intro', type: 'LESSON', roadmapSlug: 'frontend', roadmapId: 'r1' },
  ],
};

const getLessonHref = (n: { id: string; roadmapSlug?: string }) =>
  `/roadmap/${n.roadmapSlug}/node/${n.id}`;

beforeEach(() => {
  localStorage.clear();
});

it('renders children', () => {
  render(
    <LessonPageLayout tree={tree} getLessonHref={getLessonHref as any}>
      <div data-testid="content">Content here</div>
    </LessonPageLayout>
  );
  expect(screen.getByTestId('content')).toBeInTheDocument();
});

it('reads initial collapsed state from localStorage', () => {
  localStorage.setItem('lesson-sidebar-collapsed', 'true');
  render(
    <LessonPageLayout tree={tree} getLessonHref={getLessonHref as any}>
      <div>Content</div>
    </LessonPageLayout>
  );
  // Sidebar should be collapsed — width 0
  const sidebar = document.querySelector('[data-testid="lesson-sidebar"]');
  expect(sidebar?.className).toContain('w-0');
});

it('persists collapse toggle to localStorage', () => {
  render(
    <LessonPageLayout tree={tree} getLessonHref={getLessonHref as any}>
      <div>Content</div>
    </LessonPageLayout>
  );
  const toggleBtn = screen.getByRole('button', { name: /toggle sidebar/i });
  fireEvent.click(toggleBtn);
  expect(localStorage.getItem('lesson-sidebar-collapsed')).toBe('true');
  fireEvent.click(toggleBtn);
  expect(localStorage.getItem('lesson-sidebar-collapsed')).toBe('false');
});

it('renders without sidebar when tree is undefined', () => {
  render(
    <LessonPageLayout getLessonHref={getLessonHref as any}>
      <div data-testid="content">Content</div>
    </LessonPageLayout>
  );
  expect(screen.getByTestId('content')).toBeInTheDocument();
  expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm --filter @vizteck/lesson test -- --testPathPattern="LessonPageLayout"
```

Expected: 4 tests fail with "Cannot find module './LessonPageLayout'".

- [ ] **Step 3: Implement LessonPageLayout.tsx**

Create `packages/lesson/src/LessonPageLayout.tsx`:

```tsx
"use client";

import { useState, useEffect } from 'react';
import { PageTreeSidebar } from './PageTreeSidebar';
import type { PageTree, PageTreeNode } from './types';

export interface LessonPageLayoutProps {
  tree?: PageTree;
  currentNodeId?: string;
  getLessonHref: (node: PageTreeNode) => string;
  getRoadmapHref?: (node: PageTreeNode) => string | undefined;
  children: React.ReactNode;
}

const STORAGE_KEY = 'lesson-sidebar-collapsed';

export function LessonPageLayout({
  tree, currentNodeId, getLessonHref, getRoadmapHref, children,
}: LessonPageLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  if (!tree) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full">
      <div
        data-testid="lesson-sidebar"
        className={`shrink-0 border-r border-border bg-bg-1 transition-all duration-200 overflow-hidden ${
          isCollapsed ? 'w-0' : 'w-[260px]'
        }`}
      >
        {!isCollapsed && (
          <PageTreeSidebar
            tree={tree}
            currentNodeId={currentNodeId}
            getLessonHref={getLessonHref}
            getRoadmapHref={getRoadmapHref}
          />
        )}
      </div>
      <div className="flex-1 min-w-0 relative">
        <button
          type="button"
          aria-label="toggle sidebar"
          onClick={() => setIsCollapsed((c) => !c)}
          className="absolute top-3 left-2 z-10 w-6 h-6 flex items-center justify-center rounded bg-bg-1 border border-border text-text-3 hover:text-text-1 hover:border-indigo transition-colors text-xs"
        >
          {isCollapsed ? '›' : '‹'}
        </button>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm --filter @vizteck/lesson test -- --testPathPattern="LessonPageLayout"
```

Expected: 4 tests pass.

- [ ] **Step 5: Update packages/lesson/src/index.ts exports**

Append to `packages/lesson/src/index.ts`:

```ts
export { LessonPageLayout } from './LessonPageLayout';
export type { LessonPageLayoutProps } from './LessonPageLayout';
export { PageTreeSidebar } from './PageTreeSidebar';
export type { PageTreeSidebarProps } from './PageTreeSidebar';
export { PageTreeItem } from './PageTreeItem';
export type { PageTreeItemProps } from './PageTreeItem';
export type { PageTreeNode, PageTree } from './types';
```

- [ ] **Step 6: Build packages/lesson to verify exports compile**

```bash
pnpm --filter @vizteck/lesson build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add packages/lesson/src/LessonPageLayout.tsx packages/lesson/src/LessonPageLayout.spec.tsx packages/lesson/src/index.ts
git commit -m "feat: add LessonPageLayout with collapse and update lesson package exports"
```

---

### Task 7: apps/web — Tree Service + LessonLayout + Page Update

**Files:**
- Create: `apps/web/src/features/lesson/services/tree.service.ts`
- Create: `apps/web/src/features/lesson/services/tree.service.test.ts`
- Modify: `apps/web/src/features/lesson/components/LessonLayout.tsx`
- Modify: `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx`

**Interfaces:**
- Consumes (from Task 3): `GET /api/roadmaps/:slug/tree`
- Consumes (from Task 6): `LessonPageLayout`, `PageTree`, `PageTreeNode` from `@vizteck/lesson`
- Produces: `fetchRoadmapTree(slug)` service function; updated web lesson page with sidebar

- [ ] **Step 1: Write failing tests for tree.service.ts**

Create `apps/web/src/features/lesson/services/tree.service.test.ts`:

```ts
/// <reference types="vitest/globals" />
import { fetchRoadmapTree } from './tree.service';
import type { PageTree } from '@vizteck/lesson';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockOk = (data: unknown) =>
  mockFetch.mockResolvedValue({ ok: true, json: async () => data } as Response);

beforeEach(() => vi.clearAllMocks());

const sampleTree: PageTree = {
  rootSlug: 'frontend',
  rootTitle: 'Frontend',
  nodes: [
    { id: 'n1', title: 'Intro', type: 'LESSON', roadmapSlug: 'frontend', roadmapId: 'r1' },
  ],
};

it('returns tree on successful fetch', async () => {
  mockOk(sampleTree);
  const result = await fetchRoadmapTree('frontend');
  expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/roadmaps/frontend/tree`, { cache: 'no-store' });
  expect(result).toEqual(sampleTree);
});

it('returns null on non-ok response', async () => {
  mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
  const result = await fetchRoadmapTree('nonexistent');
  expect(result).toBeNull();
});

it('returns null when response lacks rootSlug', async () => {
  mockOk({ rootTitle: 'X', nodes: [] });
  const result = await fetchRoadmapTree('frontend');
  expect(result).toBeNull();
});

it('returns null when fetch throws', async () => {
  mockFetch.mockRejectedValue(new Error('network'));
  const result = await fetchRoadmapTree('frontend');
  expect(result).toBeNull();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm --filter @vizteck/web test -- --testPathPattern="tree.service"
```

Expected: 4 tests fail with "Cannot find module './tree.service'".

- [ ] **Step 3: Implement tree.service.ts**

Create `apps/web/src/features/lesson/services/tree.service.ts`:

```ts
import type { PageTree } from '@vizteck/lesson';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchRoadmapTree(slug: string): Promise<PageTree | null> {
  try {
    const res = await fetch(`${API}/api/roadmaps/${slug}/tree`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json() as Partial<PageTree>;
    if (!data.rootSlug) return null;
    return data as PageTree;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm --filter @vizteck/web test -- --testPathPattern="tree.service"
```

Expected: 4 tests pass.

- [ ] **Step 5: Update LessonLayout.tsx to wrap in LessonPageLayout**

Replace the entire content of `apps/web/src/features/lesson/components/LessonLayout.tsx`:

```tsx
"use client";

import { LessonPageShell, LessonPageLayout } from "@vizteck/lesson";
import type { LessonShellNode, BreadcrumbItem, PageTree, PageTreeNode } from "@vizteck/lesson";
import type { NodeItem } from "@/features/lesson/services/node.service";

interface LessonLayoutProps {
  node: NodeItem;
  breadcrumb: BreadcrumbItem[];
  tree: PageTree | null;
}

export function LessonLayout({ node, breadcrumb, tree }: LessonLayoutProps) {
  const shellNode: LessonShellNode = {
    id: node.id,
    title: node.title,
    coverImage: node.coverImage ?? null,
    icon: node.icon ?? null,
    content: node.content ?? null,
    type: node.type,
  };

  return (
    <LessonPageLayout
      tree={tree ?? undefined}
      currentNodeId={node.id}
      getLessonHref={(n: PageTreeNode) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
      getRoadmapHref={(n: PageTreeNode) => n.slug ? `/roadmap/${n.slug}` : undefined}
    >
      <LessonPageShell
        mode="view"
        node={shellNode}
        breadcrumb={breadcrumb}
        getLinkHref={(item: BreadcrumbItem) =>
          item.slug ? `/roadmap/${item.slug}` : undefined
        }
      />
    </LessonPageLayout>
  );
}
```

- [ ] **Step 6: Update page.tsx to fetch tree in parallel**

Replace the entire content of `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx`:

```tsx
import { LessonLayout } from '@/features/lesson/components/LessonLayout';
import { fetchNode, fetchBreadcrumb } from '@/features/lesson/services/node.service';
import { fetchRoadmapTree } from '@/features/lesson/services/tree.service';

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
  const { slug, id } = await params;

  const [nodeResult, breadcrumbResult, treeResult] = await Promise.allSettled([
    fetchNode(id),
    fetchBreadcrumb(id),
    fetchRoadmapTree(slug),
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
  const tree =
    treeResult.status === 'fulfilled' ? treeResult.value : null;

  return (
    <LessonLayout
      node={nodeResult.value}
      breadcrumb={breadcrumb}
      tree={tree}
    />
  );
}
```

- [ ] **Step 7: Build apps/web to verify TypeScript**

```bash
pnpm --filter @vizteck/web build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/features/lesson/services/tree.service.ts apps/web/src/features/lesson/services/tree.service.test.ts apps/web/src/features/lesson/components/LessonLayout.tsx apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx
git commit -m "feat: wire sidebar page tree into apps/web lesson page"
```

---

### Task 8: apps/admin — fetchBreadcrumb, fetchRoadmapTree, usePageTree, Page Update

**Files:**
- Modify: `apps/admin/src/features/lessons/services/lesson.service.ts`
- Create: `apps/admin/src/features/lessons/hooks/usePageTree.ts`
- Create: `apps/admin/src/features/lessons/hooks/usePageTree.spec.ts`
- Modify: `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`

**Interfaces:**
- Consumes (from Task 3): `GET /api/nodes/:nodeId/breadcrumb` (existing), `GET /api/roadmaps/:slug/tree` (new)
- Consumes (from Task 6): `LessonPageLayout`, `PageTree`, `PageTreeNode` from `@vizteck/lesson`
- Produces: `fetchBreadcrumb(nodeId)`, `fetchRoadmapTree(nodeId)` in lesson.service; `usePageTree(nodeId)` hook

- [ ] **Step 1: Add fetchBreadcrumb and fetchRoadmapTree to lesson.service.ts**

Append to `apps/admin/src/features/lessons/services/lesson.service.ts`:

```ts
import type { BreadcrumbItem, PageTree } from '@vizteck/lesson';

export async function fetchBreadcrumb(nodeId: string): Promise<BreadcrumbItem[]> {
  const res = await apiFetch(`/api/nodes/${nodeId}/breadcrumb`);
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ title: string; slug: string | null; nodeId: string | null }>;
  return Array.isArray(data) ? data : [];
}

export async function fetchRoadmapTree(nodeId: string): Promise<PageTree | null> {
  const crumbs = await fetchBreadcrumb(nodeId);
  const rootSlug = crumbs[0]?.slug;
  if (!rootSlug) return null;
  const res = await apiFetch(`/api/roadmaps/${rootSlug}/tree`);
  if (!res.ok) return null;
  const data = (await res.json()) as Partial<PageTree>;
  if (!data.rootSlug) return null;
  return data as PageTree;
}
```

Note: `apiFetch` is already imported in `lesson.service.ts` at the top. The new functions use the same `import { apiFetch } from '@/lib/api'` that's already in the file.

- [ ] **Step 2: Write failing tests for usePageTree**

Create `apps/admin/src/features/lessons/hooks/usePageTree.spec.ts`:

```ts
/// <reference types="vitest/globals" />
import { renderHook, waitFor } from '@testing-library/react';
import { usePageTree } from './usePageTree';
import * as lessonService from '../services/lesson.service';
import type { PageTree } from '@vizteck/lesson';

vi.mock('../services/lesson.service');

const mockFetchTree = vi.mocked(lessonService.fetchRoadmapTree);

const sampleTree: PageTree = {
  rootSlug: 'frontend',
  rootTitle: 'Frontend',
  nodes: [
    { id: 'n1', title: 'Intro', type: 'LESSON', roadmapSlug: 'frontend', roadmapId: 'r1' },
  ],
};

beforeEach(() => vi.clearAllMocks());

it('returns null initially then resolves to tree', async () => {
  mockFetchTree.mockResolvedValue(sampleTree);
  const { result } = renderHook(() => usePageTree('n1'));
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).toEqual(sampleTree));
  expect(mockFetchTree).toHaveBeenCalledWith('n1');
});

it('returns null when fetchRoadmapTree returns null', async () => {
  mockFetchTree.mockResolvedValue(null);
  const { result } = renderHook(() => usePageTree('n1'));
  await waitFor(() => expect(mockFetchTree).toHaveBeenCalledTimes(1));
  expect(result.current).toBeNull();
});

it('returns null when fetchRoadmapTree throws', async () => {
  mockFetchTree.mockRejectedValue(new Error('network'));
  const { result } = renderHook(() => usePageTree('n1'));
  await waitFor(() => expect(mockFetchTree).toHaveBeenCalledTimes(1));
  expect(result.current).toBeNull();
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
pnpm --filter @vizteck/admin test -- --testPathPattern="usePageTree"
```

Expected: 3 tests fail with "Cannot find module './usePageTree'".

- [ ] **Step 4: Implement usePageTree.ts**

Create `apps/admin/src/features/lessons/hooks/usePageTree.ts`:

```ts
import { useState, useEffect } from 'react';
import type { PageTree } from '@vizteck/lesson';
import { fetchRoadmapTree } from '../services/lesson.service';

export function usePageTree(nodeId: string): PageTree | null {
  const [tree, setTree] = useState<PageTree | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRoadmapTree(nodeId)
      .then((t) => { if (!cancelled) setTree(t); })
      .catch(() => { if (!cancelled) setTree(null); });
    return () => { cancelled = true; };
  }, [nodeId]);

  return tree;
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
pnpm --filter @vizteck/admin test -- --testPathPattern="usePageTree"
```

Expected: 3 tests pass.

- [ ] **Step 6: Update admin lesson editor page to use LessonPageLayout**

Replace the entire content of `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { use } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { useLessonEditor } from "@/features/lessons/hooks/useLessonEditor";
import { useLessonPageShell } from "@/features/lessons/hooks/useLessonPageShell";
import { usePageTree } from "@/features/lessons/hooks/usePageTree";
import { LessonTitleEditor } from "@/features/lessons/components/LessonTitleEditor";
import { CoverImage } from "@/features/lessons/components/CoverImage";
import { LessonPageShell, LessonPageLayout } from "@vizteck/lesson";
import type { PageTreeNode } from "@vizteck/lesson";

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

  const tree = usePageTree(nodeId);

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
    <LessonPageLayout
      tree={tree ?? undefined}
      currentNodeId={nodeId}
      getLessonHref={(n: PageTreeNode) => `/roadmaps/${n.roadmapId}/nodes/${n.id}`}
      getRoadmapHref={(n: PageTreeNode) =>
        n.targetRoadmapId ? `/roadmaps/${n.targetRoadmapId}` : undefined
      }
    >
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
    </LessonPageLayout>
  );
}
```

- [ ] **Step 7: Build apps/admin to verify TypeScript**

```bash
pnpm --filter @vizteck/admin build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add apps/admin/src/features/lessons/services/lesson.service.ts apps/admin/src/features/lessons/hooks/usePageTree.ts apps/admin/src/features/lessons/hooks/usePageTree.spec.ts apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx
git commit -m "feat: wire sidebar page tree into apps/admin lesson editor"
```

---

## Test Run Checklist

After all 8 tasks are complete, run the full test suite:

```bash
pnpm test
```

Expected output: all tests pass. Key test files that must be green:
- `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts` (existing + 4 new)
- `packages/lesson/src/PageTreeItem.spec.tsx` (5 tests)
- `packages/lesson/src/PageTreeSidebar.spec.tsx` (3 tests)
- `packages/lesson/src/LessonPageLayout.spec.tsx` (4 tests)
- `apps/web/src/features/lesson/services/tree.service.test.ts` (4 tests)
- `apps/admin/src/features/lessons/hooks/usePageTree.spec.ts` (3 tests)
