# Notion Page Shell — Design Spec

**Date:** 2026-06-23
**Feature branch:** `feature/notion-lesson` (continue) or new `feature/notion-page-shell`
**Phase:** A of 5 (Page Shell — cover image, icon, breadcrumb, full-width layout)
**Scope:** Transform the lesson page into a Notion-style page with hero cover image, emoji/icon picker, nested breadcrumb, and full-width content. Admin has full edit rights; web is read-only display.

---

## Context

The lesson feature currently has a 2-column layout (content left + 280px sidebar with MiniGraph, Progress card, Back button). This spec replaces it with a Notion-style page shell.

This is **Phase A** of a 5-phase Notion-like experience:
- **A. Page Shell** ← this spec
- B. Sidebar page tree (left nav)
- C. Table of contents
- D. Comments
- E. Version history

---

## Layout: Hero Cover (Option C)

```
┌─────────────────────────────────────────────────────┐
│  NAV                                                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  [COVER IMAGE — full width, 200px tall]               │
│  Frontend Roadmap › HTML & CSS › Box Model  ← overlay│
│                                              top-left │
│ ⚡ ← icon floats at bottom-left of cover              │
├─────────────────────────────────────────────────────┤
│  The CSS Box Model                 ← H1 title        │
│  LESSON                            ← meta            │
│  ─────────────────────────────────────────           │
│  [Full-width BlockNote content]                       │
│  max-w-[860px] centered                               │
└─────────────────────────────────────────────────────┘
```

**Empty states:**
- No cover → gradient fallback `from-indigo to-indigo/60`
- No icon → default `📄`
- Breadcrumb fetch fail → degrade to `Roadmap title › Lesson title` (2 levels)

---

## Database

Add 2 nullable fields to `Node` model in `packages/db/prisma/schema.prisma`:

```prisma
model Node {
  ...existing fields...
  coverImage  String?  // R2 public URL or external URL
  icon        String?  // Unicode emoji ("⚡"), text (":rocket:"), or Lucide icon name ("Zap")
}
```

Single migration. No changes to `Roadmap`, `Edge`, or enums.

**Breadcrumb** is computed at query time — no stored field needed. Algorithm:
1. Load `Node.roadmapId` → `Roadmap`
2. Find `Node[type=ROADMAP, targetRoadmapId=currentRoadmapId]` in parent roadmap
3. Repeat until no parent found (root roadmap)
4. Reverse chain → `[Root Roadmap, ..., Parent Node, Lesson Node]`

---

## Proto (`packages/proto/roadmap.proto`)

Add to `NodeItem` message (field 8 is already `content`):

```protobuf
string coverImage = 9;  // empty string = no cover
string icon = 10;        // empty string = no icon
```

Add new messages and RPCs:

```protobuf
message UpdateNodeCoverRequest {
  string id = 1;
  string coverImage = 2;  // empty string = remove cover
}

message UpdateNodeIconRequest {
  string id = 1;
  string icon = 2;  // empty string = remove icon
}

message BreadcrumbItem {
  string title = 1;
  string slug = 2;    // empty string = no slug
  string nodeId = 3;  // empty string = root roadmap item
}

message BreadcrumbResponse {
  repeated BreadcrumbItem items = 1;
}
```

New RPCs in `RoadmapService`:

```protobuf
rpc UpdateNodeCover (UpdateNodeCoverRequest) returns (NodeItem);
rpc UpdateNodeIcon (UpdateNodeIconRequest) returns (NodeItem);
rpc GetNodeBreadcrumb (IdRequest) returns (BreadcrumbResponse);
```

Run `cd packages/proto && node generate.js` after editing.

---

## API (`apps/api-gateway`)

### REST (Swagger)

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| `PATCH` | `/api/nodes/:id/cover` | AdminGuard | `{ coverImage: string \| null }` | null removes cover |
| `PATCH` | `/api/nodes/:id/icon` | AdminGuard | `{ icon: string \| null }` | null removes icon |
| `GET` | `/api/nodes/:id/breadcrumb` | Public | — | Returns `BreadcrumbItem[]` |
| `POST` | `/api/upload/cover` | AdminGuard | multipart `file` | Returns `{ url: string }` |

`BreadcrumbItem`:
```ts
{ title: string; slug: string | null; nodeId: string | null }
```

Example response for `/api/nodes/:id/breadcrumb`:
```json
[
  { "title": "Frontend Roadmap", "slug": "frontend", "nodeId": null },
  { "title": "HTML & CSS", "slug": "html-css", "nodeId": "clx..." },
  { "title": "Box Model", "slug": null, "nodeId": "cly..." }
]
```

### GraphQL (FE ↔ BE)

```graphql
type BreadcrumbItem {
  title: String!
  slug: String
  nodeId: String
}

extend type Node {
  coverImage: String
  icon: String
}

extend type Query {
  nodeBreadcrumb(id: String!): [BreadcrumbItem!]!
}

extend type Mutation {
  updateNodeCover(id: String!, coverImage: String): Node!
  updateNodeIcon(id: String!, icon: String): Node!
  uploadNodeCover(id: String!, file: Upload!): String!  # returns URL
}
```

### Uploadthing Upload Flow

Storage: **Uploadthing** (uploadthing.com — free tier 2GB, sign in with Google, no credit card).

Upload happens client-side via `@uploadthing/react` — no custom upload controller needed in api-gateway.

Flow:
1. Admin selects file in `CoverUploadModal`
2. `useUploadThing("coverUploader")` hook uploads directly to Uploadthing CDN
3. Hook returns `{ url: string }` — Uploadthing CDN URL
4. Admin calls `updateNodeCover` mutation with URL
5. UI updates optimistically

Uploadthing route config (new file `apps/admin/src/app/api/uploadthing/core.ts`):
```ts
import { createUploadthing } from "uploadthing/next";
const f = createUploadthing();

export const ourFileRouter = {
  coverUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(() => ({ uploadedBy: "admin" }))
    .onUploadComplete(({ file }) => ({ url: file.url })),
};
```

Env vars (add to `apps/admin/.env.example`):
```
UPLOADTHING_TOKEN=
```

**No changes to api-gateway** — upload is handled entirely in the admin Next.js app via Uploadthing's built-in API route.

---

## svc-roadmap (`apps/svc-roadmap`)

New gRPC methods to add:

```protobuf
rpc UpdateNodeCover(UpdateNodeCoverRequest) returns (NodeItem);
rpc UpdateNodeIcon(UpdateNodeIconRequest) returns (NodeItem);
rpc GetNodeBreadcrumb(GetNodeBreadcrumbRequest) returns (BreadcrumbResponse);
```

Each calls a single `db.node.update` (cover/icon) or the breadcrumb traversal query. Never uses `UpsertGraph`.

---

## Shared Components (`packages/lesson`)

Following the `LessonEditor` / `LessonViewer` pattern — shared display logic lives in `packages/lesson`, imported by both admin and web.

**`LessonPageShell.tsx`**
- Props: `mode: "edit" | "view"`, `node: NodeItem`, `breadcrumb: BreadcrumbItem[]`
- Edit mode (admin): renders `CoverImage` wrapper + `IconPicker` + `LessonTitleEditor` + `LessonEditor`
- View mode (web): renders `CoverDisplay` + `BreadcrumbDisplay` + `<h1>` title + `LessonViewer`
- Callbacks (edit mode only): `onCoverChange(url: string | null)`, `onIconChange(value: string | null)`

**`CoverDisplay.tsx`**
- Props: `coverImage?: string`, `icon?: string`, `breadcrumb: BreadcrumbItem[]`
- Hero cover (full-width, `h-[200px] object-cover`) — or gradient fallback when no image
- Breadcrumb overlay top-left inside cover
- Icon floating bottom-left of cover
- No interactive controls — pure display

**`BreadcrumbDisplay.tsx`**
- Props: `items: BreadcrumbItem[]`
- All items except last are `<a>` links; last item (current page) is non-clickable `text-text-1`

---

## Admin UI (`apps/admin`)

### Admin-only components (`src/features/lessons/components/`)

**`CoverImage.tsx`**
- Wraps `<CoverDisplay>` from `@vizteck/lesson`
- Adds hover state: shows 3 buttons (`Upload`, `Paste URL`, `Remove`)
- `Upload` → opens `CoverUploadModal`
- `Paste URL` → inline input appears, calls `onCoverChange(url)`
- `Remove` → calls `onCoverChange(null)`

**`CoverUploadModal.tsx`**
- 2-tab modal: `Upload file` | `Paste URL`
- Upload tab: drag-and-drop area + file input → `POST /api/upload/cover` → calls `onCoverChange(url)`
- URL tab: text input + confirm → calls `onCoverChange(url)` directly
- Shows upload progress indicator

**`IconPicker.tsx`**
- Wraps the floating icon element from `CoverDisplay`
- Click → dropdown with 3 tabs:
  - `Emoji` — grid of common emojis (searchable), selecting calls `onIconChange(emoji)`
  - `Text` — free-text input, calls `onIconChange(text)`
  - `Icons` — Lucide icon grid (~40 icons), calls `onIconChange(iconName)`
- `Remove` button → calls `onIconChange(null)`

### New hook (`src/features/lessons/hooks/`)

**`useLessonPageShell.ts`**
- State: `cover: string | null`, `icon: string | null`
- Optimistic update: update local state immediately, call GraphQL mutation, rollback on error
- Exports: `setCover(url)`, `setIcon(value)`, `removeCover()`, `removeIcon()`

### No changes to:
- `useLessonEditor` (autosave unchanged)
- `LessonTitleEditor` (blur-to-save unchanged)
- BlockNote editor wiring

---

## Web Viewer (`apps/web`)

### `LessonLayout.tsx` — full rewrite

Replace 2-column layout with:
```tsx
import { LessonPageShell } from '@vizteck/lesson';

<LessonPageShell
  mode="view"
  node={node}
  breadcrumb={breadcrumb}
/>
```

Remove: sidebar (MiniGraph, Progress card, Back button), `roadmapNodes`/`roadmapEdges` props.

### `LessonPage` server component (`app/roadmap/[slug]/node/[id]/page.tsx`)

```ts
const [nodeResult, breadcrumbResult] = await Promise.allSettled([
  fetchNode(id),
  fetchBreadcrumb(id),  // GET /api/nodes/:id/breadcrumb
]);
// nodeResult rejected → 404
// breadcrumbResult rejected → pass [] to LessonPageShell (CoverDisplay degrades gracefully)
```

### Responsive
- Cover: full viewport width, `h-[200px]`
- Content: `max-w-[860px] mx-auto px-6 md:px-12`

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Uploadthing upload fails | Show error toast in modal, stay on upload modal |
| `updateNodeCover` mutation fails | Rollback to previous cover, show error toast |
| `updateNodeIcon` mutation fails | Rollback to previous icon, show error toast |
| Breadcrumb API fails | Degrade: show `Roadmap title › Lesson title` |
| Cover URL is broken/404 | `<img onError>` falls back to gradient |

---

## Package Boundaries

Following the same pattern as `LessonEditor` / `LessonViewer`:

**`packages/lesson/src/`** — shared between admin and web:
- `LessonPageShell.tsx` — layout shell with props: `mode: "edit"|"view"`, optional callbacks `onCoverChange`, `onIconChange`
- `CoverDisplay.tsx` — renders cover image (or gradient fallback), breadcrumb overlay, icon float — display only, no edit controls
- `BreadcrumbDisplay.tsx` — renders breadcrumb path with links

**`apps/admin/src/features/lessons/components/`** — admin-only (wraps shared components with edit controls):
- `CoverImage.tsx` — wraps `CoverDisplay` + adds hover upload/URL/remove buttons
- `CoverUploadModal.tsx` — 2-tab modal (file upload + paste URL)
- `IconPicker.tsx` — 3-tab dropdown (Emoji / Text / Icons)

This keeps `packages/lesson` as the source of truth for lesson UI, consistent with CLAUDE.md: *"When adding lesson display to apps/web, import from @vizteck/lesson."*

---

## Files Modified / Created

### New files
| Path | Purpose |
|------|---------|
| `packages/lesson/src/LessonPageShell.tsx` | Shared page shell (edit + view mode) |
| `packages/lesson/src/CoverDisplay.tsx` | Shared cover + breadcrumb + icon display |
| `packages/lesson/src/BreadcrumbDisplay.tsx` | Shared breadcrumb renderer |
| `apps/admin/src/features/lessons/components/CoverImage.tsx` | Admin cover editor (wraps CoverDisplay) |
| `apps/admin/src/features/lessons/components/CoverUploadModal.tsx` | Upload/URL modal |
| `apps/admin/src/features/lessons/components/IconPicker.tsx` | 3-tab icon picker |
| `apps/admin/src/features/lessons/hooks/useLessonPageShell.ts` | Cover/icon state + mutations |
| `apps/admin/src/app/api/uploadthing/core.ts` | Uploadthing file router (coverUploader) |
| `apps/admin/src/app/api/uploadthing/route.ts` | Uploadthing Next.js API route handler |

### Modified files
| Path | Change |
|------|--------|
| `packages/db/prisma/schema.prisma` | Add `coverImage`, `icon` to `Node` |
| `packages/lesson/src/index.ts` | Export new shared components |
| `packages/proto/roadmap.proto` | Add `coverImage`, `icon` to `NodeItem` (fields 9, 10); new request messages; new RPCs |
| `apps/svc-roadmap/src/roadmap.service.ts` | Implement UpdateNodeCover, UpdateNodeIcon, GetNodeBreadcrumb |
| `apps/svc-roadmap/src/roadmap.controller.ts` | Wire new gRPC handlers |
| `apps/api-gateway/src/nodes/nodes.controller.ts` | Add PATCH cover/icon, GET breadcrumb |
| `apps/api-gateway/src/nodes/nodes.resolver.ts` | Add GraphQL queries/mutations |
| `apps/api-gateway/src/app.module.ts` | Import UploadModule |
| `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx` | Use LessonPageShell (edit mode) |
| `apps/web/src/features/lesson/components/LessonLayout.tsx` | Full rewrite — use LessonPageShell (view mode) from @vizteck/lesson |
| `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` | Add breadcrumb fetch |

---

## Quality Control / Testing

Following the project's testing conventions (see CLAUDE.md testing table).

### svc-roadmap — Jest (`*.spec.ts`)

| Test | What to verify |
|------|---------------|
| `UpdateNodeCover` — success | Returns `NodeItem` with updated `coverImage` |
| `UpdateNodeCover` — null clears field | `coverImage` is `null` after passing empty string |
| `UpdateNodeCover` — node not found | Throws `RpcException NOT_FOUND` |
| `UpdateNodeIcon` — success | Returns `NodeItem` with updated `icon` |
| `UpdateNodeIcon` — node not found | Throws `RpcException NOT_FOUND` |
| `GetNodeBreadcrumb` — root roadmap lesson | Returns 1-item chain `[RootRoadmap]` |
| `GetNodeBreadcrumb` — nested lesson | Returns full chain `[Root, SubRoadmapNode, Lesson]` |
| `GetNodeBreadcrumb` — node not found | Returns empty array (degrade gracefully) |

### api-gateway — Jest (`*.spec.ts`)

| Test | What to verify |
|------|---------------|
| `PATCH /api/nodes/:id/cover` — 200 | Calls svc-roadmap, returns updated node |
| `PATCH /api/nodes/:id/cover` — 401 | No token → Unauthorized |
| `PATCH /api/nodes/:id/icon` — 200 | Calls svc-roadmap, returns updated node |
| `GET /api/nodes/:id/breadcrumb` — 200 | Returns `BreadcrumbItem[]` |
| GraphQL `updateNodeCover` mutation | Returns `Node` with updated `coverImage` |
| GraphQL `nodeBreadcrumb` query | Returns `BreadcrumbItem[]` |

### admin — Vitest (`*.spec.tsx`)

| Test | What to verify |
|------|---------------|
| `useLessonPageShell` — `setCover` | Calls `updateNodeCover` mutation, updates local state |
| `useLessonPageShell` — rollback on error | Reverts cover to previous value when mutation fails |
| `useLessonPageShell` — `setIcon` | Calls `updateNodeIcon` mutation, updates local state |
| `IconPicker` — tab switching | Renders Emoji/Text/Icons tabs, selecting calls `onIconChange` |
| `CoverImage` — hover shows controls | Upload/Paste URL/Remove buttons visible on hover |

### packages/lesson — Vitest (`*.spec.tsx`)

| Test | What to verify |
|------|---------------|
| `CoverDisplay` — with image | Renders `<img>` with correct `src` |
| `CoverDisplay` — no image | Renders gradient fallback (no `<img>`) |
| `CoverDisplay` — with icon | Renders icon in floating element |
| `CoverDisplay` — no icon | Renders default `📄` |
| `BreadcrumbDisplay` — links | All items except last are `<a>` tags |
| `BreadcrumbDisplay` — current item | Last item has no `href` |
| `LessonPageShell` view mode | Renders `CoverDisplay` + title + `LessonViewer`, no edit controls |
| `LessonPageShell` edit mode | Renders `CoverImage` + `IconPicker` + `LessonEditor` |

### E2E — Playwright (requires apps running)

| Scenario | Steps |
|----------|-------|
| Admin sets cover via URL | Navigate to lesson admin → paste URL → verify cover displays |
| Admin sets emoji icon | Click icon → Emoji tab → select emoji → verify icon updates |
| Web viewer shows cover | Navigate to web lesson page → verify cover image rendered |
| Web breadcrumb navigates | Click breadcrumb item → verify navigation to correct roadmap |
| Cover image fallback | Remove cover in admin → verify gradient shows on web |

---

## Out of Scope (deferred to later phases)

- Left sidebar page tree (Phase B)
- Table of contents (Phase C)
- Comments (Phase D)
- Version history (Phase E)
- Cover image for Roadmap entity (already has `coverImage` field — separate feature)
- MiniGraph (removed from lesson page, may reappear in Phase B sidebar)
- Progress tracking (removed, deferred)
