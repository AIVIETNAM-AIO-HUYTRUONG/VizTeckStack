# Notion Sidebar Page Tree — Design Spec

**Date:** 2026-06-23
**Feature branch:** `feature/notion-sidebar-tree`
**Phase:** B of 5 (Sidebar Page Tree — left navigation panel)
**Scope:** Add a collapsible sidebar showing the current root roadmap's page tree (sub-roadmaps + lessons) alongside the lesson page. Appears on both `apps/web` (read-only) and `apps/admin` (edit navigation). Phase A (Page Shell) must be complete first.

---

## Context

Phase A delivered: cover image, icon picker, breadcrumb, `LessonPageShell` full-width layout.

Phase B adds a **left navigation panel** — the Notion-style sidebar that shows the roadmap tree so the learner/editor can navigate between lessons without going back to the roadmap graph view.

Original 5-phase plan:
- A. Page Shell ✅
- **B. Sidebar Page Tree ← this spec**
- C. Table of contents
- D. Comments
- E. Version history

---

## Layout

```
┌────────────────────────────────────────────────────────────────┐
│  [≡]  Frontend Roadmap              NAV (apps/web header)      │
├──────────────┬─────────────────────────────────────────────────┤
│              │                                                  │
│  Frontend    │  [COVER IMAGE — full width]                     │
│  ├ HTML&CSS  │  Frontend › HTML & CSS › Box Model  ← overlay   │
│  │ ├ Box ◄──┤│                                                  │
│  │ └ Flexbox ││  The CSS Box Model          ← H1 title         │
│  └ JavaScript│  ──────────────────────────────────────────     │
│    └ Vars    │  [BlockNote content]                             │
│              │                                                  │
│  [collapse]  │                                                  │
└──────────────┴─────────────────────────────────────────────────┘
```

- Sidebar width: **260px** when open, **0px** (hidden) when collapsed
- Collapse toggle button: visible at all times (top of sidebar or edge)
- Collapsed state persisted to `localStorage('lesson-sidebar-collapsed')`
- Current lesson highlighted in tree
- Path to current lesson auto-expanded on load
- Smooth CSS transition on collapse/expand

---

## Sidebar Content (Option C)

Shows the **root roadmap's tree** — from root down to sub-roadmaps and their lessons. Does NOT show sibling roadmaps.

Example: viewing "Box Model" (in HTML & CSS, child of Frontend):

```
Frontend Roadmap          ← root, non-clickable header
  ├── HTML & CSS          ← ROADMAP node: click → navigate + expand
  │     ├── Box Model ◄   ← current lesson, highlighted
  │     └── Flexbox
  └── JavaScript          ← collapsed by default (not in current path)
        └── Variables
```

- `ROADMAP` nodes: click → navigate to `/roadmap/[slug]` (web) or `/roadmaps/[id]` (admin) AND expand children
- `LESSON` nodes: click → navigate to lesson page
- Auto-expand: path from root to current lesson is expanded on mount
- Other branches: collapsed by default

---

## Data Model Changes

**No DB schema changes.** Tree is assembled at query time from existing `Node` and `Roadmap` tables.

Add to `packages/lesson/src/types.ts`:

```ts
export interface PageTreeNode {
  id: string;              // node id
  title: string;
  type: 'LESSON' | 'ROADMAP';
  // ROADMAP nodes:
  slug?: string;           // targetRoadmap slug (web: /roadmap/[slug])
  targetRoadmapId?: string;// targetRoadmap UUID (admin: /roadmaps/[id])
  // LESSON nodes:
  roadmapSlug?: string;    // parent roadmap slug (web: /roadmap/[slug]/node/[id])
  roadmapId?: string;      // parent roadmap UUID (admin: /roadmaps/[id]/nodes/[nodeId])
  children?: PageTreeNode[];
}

export interface PageTree {
  rootSlug: string;
  rootTitle: string;
  nodes: PageTreeNode[];
}
```

---

## Proto (`packages/proto/roadmap.proto`)

Add new messages and RPC:

```protobuf
message RoadmapTreeNode {
  string id               = 1;
  string title            = 2;
  string type             = 3;  // "LESSON" | "ROADMAP"
  string slug             = 4;  // targetRoadmap slug (ROADMAP nodes, for web)
  string targetRoadmapId  = 5;  // targetRoadmap UUID (ROADMAP nodes, for admin)
  string roadmapSlug      = 6;  // parent roadmap slug (LESSON nodes, for web)
  string roadmapId        = 7;  // parent roadmap UUID (LESSON nodes, for admin)
  repeated RoadmapTreeNode children = 8;
}

message RoadmapTreeRequest  { string slug = 1; }

message RoadmapTreeResponse {
  string rootSlug  = 1;
  string rootTitle = 2;
  repeated RoadmapTreeNode nodes = 3;
}

// Add to service RoadmapService:
rpc GetRoadmapTree(RoadmapTreeRequest) returns (RoadmapTreeResponse);
```

---

## Backend: svc-roadmap

### `getRoadmapTree({ slug })`

```
1. db.roadmap.findUnique({ where: { slug } })         → rootRoadmap
2. db.node.findMany({ where: { roadmapId: rootRoadmap.id } }) → rootNodes
3. For each rootNode:
   - type=LESSON  → { id, title, type, roadmapSlug: rootRoadmap.slug, roadmapId: rootRoadmap.id }
   - type=ROADMAP → fetch targetRoadmap + its nodes (depth 2 only):
       db.roadmap.findUnique({ where: { id: node.targetRoadmapId } }) → subRoadmap
       db.node.findMany({ where: { roadmapId: subRoadmap.id } })      → subNodes
       children = subNodes.map(n => { id, title, type, roadmapSlug: subRoadmap.slug, roadmapId: subRoadmap.id })
       node result: { id, title, type: 'ROADMAP', slug: subRoadmap.slug, targetRoadmapId: subRoadmap.id }
4. Return { rootSlug, rootTitle, nodes }
```

Depth is fixed at 2 (root nodes + their sub-roadmap children). No recursion guard needed — depth is not dynamic.

### Tests (Jest, TDD)

- `getRoadmapTree` returns correct tree for a roadmap with mixed LESSON + ROADMAP nodes
- `getRoadmapTree` returns empty nodes array for roadmap with no nodes
- `getRoadmapTree` returns empty response for unknown slug
- Sub-roadmap children are correctly nested with `roadmapSlug`/`roadmapId` filled

---

## Backend: api-gateway

### REST endpoint

```
GET /api/roadmaps/:slug/tree
```

- Public — no `AdminGuard`
- Controller: `RoadmapRestController.getRoadmapTree(slug)`
- Calls `grpcClient.getRoadmapTree({ slug })`
- Maps proto `RoadmapTreeNode` → `RoadmapTreeNodeDto` (mirrors `PageTreeNode` shape)
- Returns `{ rootSlug, rootTitle, nodes: RoadmapTreeNodeDto[] }`

### GraphQL

```graphql
type Query {
  roadmapTree(slug: String!): RoadmapTreeDto
}
```

### DTOs

```ts
class RoadmapTreeNodeDto {
  id: string;
  title: string;
  type: string;
  slug?: string;           // ROADMAP nodes
  targetRoadmapId?: string;// ROADMAP nodes
  roadmapSlug?: string;    // LESSON nodes
  roadmapId?: string;      // LESSON nodes
  children?: RoadmapTreeNodeDto[];
}

class RoadmapTreeDto {
  rootSlug: string;
  rootTitle: string;
  nodes: RoadmapTreeNodeDto[];
}
```

---

## packages/lesson — New Components

All components use `"use client"`. No `next` dependency — plain `<a>` tags, `useEffect` for localStorage.

### `src/PageTreeItem.tsx`

```ts
interface PageTreeItemProps {
  node: PageTreeNode;
  depth: number;
  currentNodeId?: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  getLessonHref: (node: PageTreeNode) => string;
  getRoadmapHref?: (node: PageTreeNode) => string | undefined;
}
```

Renders:
- Indent based on `depth`
- Icon: `📄` for LESSON, `📁`/`📂` (open/closed) for ROADMAP
- Title as `<a>` (lesson) or `<button>` + `<a>` (roadmap: expand + navigate)
- Current node gets `bg-indigo/10 text-indigo` highlight
- Children rendered recursively when `isExpanded`

### `src/PageTreeSidebar.tsx`

```ts
interface PageTreeSidebarProps {
  tree: PageTree;
  currentNodeId?: string;
  getLessonHref: (node: PageTreeNode) => string;
  getRoadmapHref?: (node: PageTreeNode) => string | undefined;
}
```

- Manages `expandedIds: Set<string>` (state) — auto-seeds path to `currentNodeId` on mount
- Renders root roadmap title (non-clickable header)
- Renders `PageTreeItem` for each top-level node
- `onToggle`: adds/removes id from `expandedIds`
- Semantic tokens: `bg-bg-1`, `text-text-1/2/3`, `border-border`

### `src/LessonPageLayout.tsx`

```ts
interface LessonPageLayoutProps {
  tree?: PageTree;
  currentNodeId?: string;
  getLessonHref: (node: PageTreeNode) => string;
  getRoadmapHref?: (node: PageTreeNode) => string | undefined;
  children: React.ReactNode;  // LessonPageShell
}
```

- `isCollapsed` state, initialized from `localStorage('lesson-sidebar-collapsed')`
- `useEffect` to persist collapse state changes
- Layout: `flex flex-row h-full`
- Sidebar: `w-[260px] shrink-0 transition-all overflow-hidden` (w-0 when collapsed)
- Toggle button: fixed at top-left edge, always visible
- If `tree` is undefined: renders children only (no sidebar)

### `src/index.ts` — add exports

```ts
export { LessonPageLayout } from './LessonPageLayout';
export { PageTreeSidebar } from './PageTreeSidebar';
export { PageTreeItem } from './PageTreeItem';
export type { PageTreeNode, PageTree } from './types';
```

### Tests (Vitest + jsdom)

- `PageTreeItem`: renders lesson link; renders folder icon for ROADMAP; highlights current node
- `PageTreeSidebar`: auto-expands path to current node; toggle expands/collapses branch
- `LessonPageLayout`: reads localStorage on mount; persists collapse to localStorage; hides sidebar when `tree` undefined

---

## apps/web

### New file: `src/features/lesson/services/tree.service.ts`

```ts
export async function fetchRoadmapTree(slug: string): Promise<PageTree | null>
// GET /api/roadmaps/${slug}/tree, { cache: 'no-store' }
// Returns null on non-ok response
```

Tests: success, 404 → null, malformed JSON → null.

### `src/app/roadmap/[slug]/node/[id]/page.tsx`

```ts
const { slug, id } = await params;

const [nodeResult, breadcrumbResult, treeResult] = await Promise.allSettled([
  fetchNode(id),
  fetchBreadcrumb(id),
  fetchRoadmapTree(slug),    // parallel — slug already known from URL
]);

const tree = treeResult.status === 'fulfilled' ? treeResult.value : null;
```

Pass `tree` and `slug` (as `rootSlug`) to `LessonLayout`.

### `src/features/lesson/components/LessonLayout.tsx`

```tsx
interface LessonLayoutProps {
  node: NodeItem;
  breadcrumb: BreadcrumbItem[];
  tree: PageTree | null;
}

// Wraps LessonPageShell in LessonPageLayout:
<LessonPageLayout
  tree={tree ?? undefined}
  currentNodeId={node.id}
  getLessonHref={(n) => `/roadmap/${n.roadmapSlug}/node/${n.id}`}
  getRoadmapHref={(n) => n.slug ? `/roadmap/${n.slug}` : undefined}
>
  <LessonPageShell mode="view" node={shellNode} breadcrumb={breadcrumb}
    getLinkHref={(item) => item.slug ? `/roadmap/${item.slug}` : undefined}
  />
</LessonPageLayout>
```

---

## apps/admin

### New file: `src/features/lessons/services/lesson.service.ts` (extend)

Add:
```ts
export async function fetchBreadcrumb(nodeId: string): Promise<BreadcrumbItem[]>
export async function fetchRoadmapTree(nodeId: string): Promise<PageTree | null>
// fetchRoadmapTree: calls GET /api/nodes/:nodeId/breadcrumb → gets rootSlug → calls GET /api/roadmaps/:rootSlug/tree
// Returns null if either step fails
```

### New hook: `src/features/lessons/hooks/usePageTree.ts`

```ts
export function usePageTree(nodeId: string): PageTree | null
// useEffect: fetchBreadcrumb(nodeId) → breadcrumb[0].slug → fetchRoadmapTree(slug)
// Returns null until loaded (non-blocking — sidebar appears progressively)
```

### `src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx` (extend)

```tsx
const tree = usePageTree(nodeId);

// Wrap existing LessonPageShell with LessonPageLayout:
<LessonPageLayout
  tree={tree ?? undefined}
  currentNodeId={nodeId}
  getLessonHref={(n) => `/roadmaps/${n.roadmapId}/nodes/${n.id}`}
  getRoadmapHref={(n) => n.targetRoadmapId
    ? `/roadmaps/${n.targetRoadmapId}`  // navigate to sub-roadmap graph editor
    : undefined
  }
>
  <LessonPageShell ... />   {/* unchanged from Phase A */}
</LessonPageLayout>
```

---

## Error Handling & Edge Cases

| Scenario | Behavior |
|---|---|
| Tree fetch fails (network/404) | `tree = null` → `LessonPageLayout` renders without sidebar |
| Roadmap has no sub-roadmaps | Sidebar shows flat list of lessons |
| Lesson not in tree (data inconsistency) | No item highlighted — no crash |
| localStorage unavailable (SSR) | `isCollapsed` defaults to `false`; `useEffect` guards `typeof window` |
| Empty tree (`nodes: []`) | Sidebar renders root title only |

---

## Non-Goals (Phase B)

- Search within sidebar
- Drag-to-reorder lessons
- Right-click context menu
- Real-time updates when admin adds a lesson
- Deep nesting beyond 2 levels (root → sub-roadmap → lesson)
- Mobile-specific collapsed behavior (mobile uses same localStorage state)

---

## File Summary

| File | Action |
|---|---|
| `packages/proto/roadmap.proto` | Modify — add `RoadmapTreeNode`, `RoadmapTreeRequest/Response`, `GetRoadmapTree` RPC |
| `apps/svc-roadmap/src/roadmap/roadmap.service.ts` | Modify — add `getRoadmapTree` |
| `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts` | Modify — add 4 tests |
| `apps/api-gateway/src/roadmap/roadmap.grpc-client.ts` | Modify — add `getRoadmapTree` |
| `apps/api-gateway/src/roadmap/roadmap.dto.ts` | Modify — add DTOs |
| `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts` | Modify — add GET endpoint |
| `apps/api-gateway/src/roadmap/roadmap.resolver.ts` | Modify — add GraphQL query |
| `packages/lesson/src/types.ts` | Modify — add `PageTreeNode`, `PageTree` |
| `packages/lesson/src/PageTreeItem.tsx` | Create |
| `packages/lesson/src/PageTreeSidebar.tsx` | Create |
| `packages/lesson/src/LessonPageLayout.tsx` | Create |
| `packages/lesson/src/index.ts` | Modify — export new components |
| `packages/lesson/src/PageTreeItem.spec.tsx` | Create |
| `packages/lesson/src/PageTreeSidebar.spec.tsx` | Create |
| `packages/lesson/src/LessonPageLayout.spec.tsx` | Create |
| `apps/web/src/features/lesson/services/tree.service.ts` | Create |
| `apps/web/src/features/lesson/services/tree.service.test.ts` | Create |
| `apps/web/src/features/lesson/components/LessonLayout.tsx` | Modify |
| `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` | Modify |
| `apps/admin/src/features/lessons/services/lesson.service.ts` | Modify — add fetchBreadcrumb, fetchRoadmapTree |
| `apps/admin/src/features/lessons/hooks/usePageTree.ts` | Create |
| `apps/admin/src/features/lessons/hooks/usePageTree.spec.ts` | Create |
| `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx` | Modify |
