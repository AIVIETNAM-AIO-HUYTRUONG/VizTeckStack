# Phase 4: Admin CMS - Research

**Researched:** 2026-06-19
**Domain:** Next.js 16 admin app, React Flow edit mode, BlockNote editor, pnpm monorepo scaffolding
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**DEC-04-01 — Graph Editor Layout & Interaction**
- D-01: Layout is two-panel: React Flow canvas (top) + node inventory list (bottom) on `/roadmaps/[id]`
- D-02: Right-click on canvas → form panel opens on the right → creates node at that canvas position (title + type ROADMAP/LESSON)
- D-03: "Add" button in inventory list → same form panel → creates node, appears in inventory only (unplaced)
- D-04: Drag node from inventory list → drop onto canvas → node becomes placed with drop position
- D-05: Click node on canvas → side panel opens (right side) to edit title and type
- D-06: Delete from canvas = unplace (node stays in inventory, not permanently deleted)
- D-07: Delete from inventory list = permanent delete (with confirm warning dialog; edges are cascade-deleted)
- D-08: Unplaced nodes are persisted in DB → Prisma `Node.positionX` and `Node.positionY` must be made nullable (`Float?`); this is a schema migration

**DEC-04-02 — Save Graph UX**
- D-09: Explicit "Save Graph" button on canvas toolbar (not auto-save)
- D-10: Button shows unsaved-changes indicator (amber/yellow tint) when local state diverges from last-saved state
- D-11: Navigating away with unsaved changes shows a confirm dialog ("Unsaved changes — leave anyway?")
- D-12: Save Graph sends all nodes (placed + unplaced) + all edges to `POST /api/roadmaps/:id/graph`

**DEC-04-03 — Roadmap CRUD Form**
- D-13: Form fields: Title (required) + Slug (auto-generated from title, editable before submit)
- D-14: Slug auto-generation: `title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`
- D-15: Form is a modal dialog (not a separate route) — used for both Create and Edit
- D-16: Delete roadmap: button on roadmap list row + confirm dialog before calling `DELETE /api/roadmaps/:id`

**DEC-04-04 — Auth & Layout**
- D-17: Token stored in `localStorage` key `admin_token`; validate on login by calling `GET /api/roadmaps` with Bearer token — 200 = valid, 401 = invalid
- D-18: Route guard: client-side redirect to `/login` if `localStorage.admin_token` is absent or returns 401
- D-19: Logout button in header → clear `localStorage.admin_token` → redirect to `/login`
- D-20: apps/admin uses the same design tokens (indigo/emerald/font/bg) from Phase 3 design system; same ThemeToggle pattern from apps/web

### Claude's Discretion

None specified — all decisions were locked by user.

### Deferred Ideas (OUT OF SCOPE)

- Real-time collaboration (single-user admin assumed, per PROJECT.md)
- Image upload for coverImage (only title+slug in Phase 4 CRUD)
- Node description field
- Undo/Redo in graph editor (React Flow `useUndoRedo` hook available for future phase)
- Bulk node operations
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-admin-login | `/login` page: token input, validate via GET /api/roadmaps, store in localStorage, redirect to /roadmaps | Auth flow and localStorage pattern confirmed; AdminGuard in api-gateway requires `Authorization: Bearer <token>` header |
| REQ-admin-roadmap-crud | POST/PUT/DELETE /api/roadmaps + modal form with Title+Slug | All 3 REST endpoints confirmed in roadmap.rest.controller.ts; NodeInput/EdgeInput DTOs confirmed |
| REQ-admin-graph-editor | RoadmapGraph mode="edit", drag-to-place, Save Graph → POST /api/roadmaps/:id/graph | RoadmapGraph mode="edit" code confirmed; POST /api/roadmaps/:id/graph endpoint confirmed; CRITICAL: positionX/Y are currently non-nullable Float in Prisma schema — migration required |
| REQ-admin-lesson-editor | BlockNote editable editor, client-side only, save via PUT /api/nodes/:id | CRITICAL GAP: PUT /api/nodes/:id does NOT exist. No UpdateNode RPC in proto. Lesson content must be saved via POST /api/roadmaps/:id/graph (UpsertGraph) — send full node list with updated content |
</phase_requirements>

---

## Summary

Phase 4 builds `apps/admin` — a new Next.js 16 app that does not yet exist in the repository. The app must be scaffolded following the exact pattern of `apps/web` (same next.config.js, transpilePackages, tailwind.config.ts, globals.css, tsconfig.json). All APIs needed exist in `apps/api-gateway` with one critical exception: there is no `PUT /api/nodes/:id` endpoint and no `UpdateNode` RPC in the gRPC proto. Lesson content saves must go through the `POST /api/roadmaps/:id/graph` (UpsertGraph) endpoint by sending the full node list with updated content on the target node.

The `packages/graph` `RoadmapGraph` component in `mode="edit"` enables dragging and connecting but currently does not expose `onNodesChange`/`onEdgesChange` callbacks — the admin will need to wrap it or extend it to gain access to the live React Flow state for the Save Graph button. The current `RoadmapGraph` props only include `nodes`, `edges`, `mode`, and `onNodeClick`.

The Prisma schema has `Node.positionX` and `Node.positionY` as non-nullable `Float` — this must be changed to `Float?` via a migration before any unplaced-node logic can work. The migration command is `pnpm --filter @vizteck/db db:migrate`.

**Primary recommendation:** Scaffold `apps/admin` by copying the `apps/web` config files verbatim (next.config.js, tailwind.config.ts, globals.css, tsconfig.json). Handle the lesson editor save via UpsertGraph, not a missing node update endpoint. Extend `RoadmapGraph` by adding `onNodesChange`/`onEdgesChange` props to `mode="edit"`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Token authentication | Browser / Client | API / Backend (validation) | Token stored in localStorage; validation via GET /api/roadmaps returns 200/401 |
| Route guard (redirect to /login) | Browser / Client | — | Client-side redirect; no server session |
| Roadmap CRUD | API / Backend | Browser / Client (form UI) | AdminGuard + REST endpoints already exist in api-gateway |
| Graph state management | Browser / Client | — | React Flow local state; UpsertGraph is the save operation |
| Drag-to-canvas (inventory → canvas) | Browser / Client | — | HTML drag events + React Flow `screenToFlowPosition` coordinate transform |
| Node create/edit side panel | Browser / Client | — | Local React state panel; mutations sent on explicit save |
| Lesson content editing | Browser / Client | API / Backend (UpsertGraph) | BlockNote is browser-only; save via UpsertGraph sends full graph |
| Theme toggle | Browser / Client | — | localStorage + document.documentElement.classList, same as apps/web |
| Unsaved-changes navigation guard | Browser / Client | — | beforeunload + Next.js router events |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `^16.2.9` | App framework | Already in apps/web; matches monorepo standard [VERIFIED: apps/web/package.json] |
| `react` | `^19` | UI runtime | Monorepo standard [VERIFIED: apps/web/package.json] |
| `react-dom` | `^19` | DOM renderer | Monorepo standard [VERIFIED: apps/web/package.json] |
| `@xyflow/react` | `^12.11.0` | React Flow canvas (via @vizteck/graph) | Already in packages/graph [VERIFIED: packages/graph/package.json] |
| `@blocknote/react` | `^0.51.4` | Rich text editor | Already in apps/web [VERIFIED: apps/web/package.json] |
| `@blocknote/core` | `^0.51.4` | BlockNote core | Already in apps/web [VERIFIED: apps/web/package.json] |
| `@blocknote/mantine` | `^0.51.4` | BlockNote Mantine theme | Already in apps/web [VERIFIED: apps/web/package.json] |
| `@vizteck/ui` | `workspace:*` | Shared Button, Card, NodeBadge | Monorepo package [VERIFIED: codebase] |
| `@vizteck/graph` | `workspace:*` | RoadmapGraph component | Monorepo package [VERIFIED: codebase] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tailwindcss` | `^3.4.0` | CSS utility classes | All styling (copy from apps/web) [VERIFIED: apps/web/package.json] |
| `postcss` | `^8.4.0` | Tailwind processor | Required for Tailwind [VERIFIED: apps/web/package.json] |
| `autoprefixer` | `^10.4.0` | CSS vendor prefixes | Required for Tailwind [VERIFIED: apps/web/package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `POST /api/roadmaps/:id/graph` for lesson save | `PUT /api/nodes/:id` | `PUT /api/nodes/:id` does NOT exist — UpsertGraph is the only write path for node content |
| Manual drag-to-canvas with `screenToFlowPosition` | dnd-kit | `@xyflow/react` provides `screenToFlowPosition` built-in; no extra library needed |
| `useRouter` for unsaved-change guard | `beforeunload` event only | `beforeunload` catches browser close; Next.js router events needed for in-app navigation |

**Installation (apps/admin will need):**
```bash
pnpm --filter @vizteck/admin add next@^16.2.9 react@^19 react-dom@^19 @vizteck/ui@workspace:* @vizteck/graph@workspace:* @blocknote/react@^0.51.4 @blocknote/core@^0.51.4 @blocknote/mantine@^0.51.4
pnpm --filter @vizteck/admin add -D typescript@^5.4.0 @types/react@^19 @types/react-dom@^19 @types/node@^20 tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
```

---

## Package Legitimacy Audit

All packages in this phase are already present and in-use in the existing monorepo (apps/web, packages/graph). No new external packages are being introduced.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| next@^16.2.9 | npm | OK | Already in apps/web — Approved [VERIFIED: apps/web/package.json] |
| @blocknote/react@^0.51.4 | npm | OK | Already in apps/web — Approved [VERIFIED: apps/web/package.json] |
| @xyflow/react@^12.11.0 | npm | OK | Already in packages/graph — Approved [VERIFIED: packages/graph/package.json] |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious SUS:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (apps/admin, port 3002)
  /login
    → validates token: GET http://localhost:3000/api/roadmaps (Bearer token)
    → stores in localStorage.admin_token
    → redirects to /roadmaps

  /roadmaps
    → GET /api/roadmaps (Bearer token) — list roadmaps
    → POST /api/roadmaps (Bearer token) — create roadmap
    → PUT /api/roadmaps/:id (Bearer token) — update roadmap metadata
    → DELETE /api/roadmaps/:id (Bearer token) — delete roadmap

  /roadmaps/[id]
    → GET /api/roadmaps/:slug (no auth) — load graph initial state
    → POST /api/roadmaps/:id/graph (Bearer token) — save all nodes + edges

  /roadmaps/[id]/nodes/[nodeId]
    → GET /api/nodes/:id (no auth) — load node with content
    → POST /api/roadmaps/:id/graph (Bearer token) — save with updated content

    ↓

  apps/api-gateway (NestJS, port 3000)
    AdminGuard — checks Authorization: Bearer header against ADMIN_TOKEN env var
    POST /api/roadmaps/:id/graph → gRPC UpsertGraph → svc-roadmap → PostgreSQL (atomic delete+insert)
```

### Recommended Project Structure

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # AdminLayout (header + ThemeToggle + Logout)
│   │   ├── globals.css         # COPY verbatim from apps/web/src/app/globals.css
│   │   ├── login/
│   │   │   └── page.tsx        # /login — token form, localStorage.admin_token
│   │   └── roadmaps/
│   │       ├── page.tsx        # /roadmaps — list + CRUD modal
│   │       └── [id]/
│   │           ├── page.tsx    # /roadmaps/[id] — graph editor
│   │           └── nodes/
│   │               └── [nodeId]/
│   │                   └── page.tsx  # lesson editor
│   ├── components/
│   │   ├── AdminLayout.tsx     # Header h-14, ThemeToggle, Logout
│   │   ├── ThemeToggle.tsx     # COPY verbatim from apps/web/src/components/ThemeToggle.tsx
│   │   ├── ConfirmDialog.tsx   # Generic destructive confirm modal
│   │   ├── RoadmapModal.tsx    # Create/Edit modal (title + slug)
│   │   ├── NodeSidePanel.tsx   # 320px slide-in panel (Create/Edit node)
│   │   ├── NodeInventory.tsx   # Bottom zone list with drag handles
│   │   ├── GraphToolbar.tsx    # 48px toolbar (back, title, Add Node, Save Graph)
│   │   └── LessonEditor.tsx    # BlockNote wrapper ('use client', ssr: false)
│   └── lib/
│       ├── api.ts              # fetch helpers with Bearer token injection
│       └── useRouteGuard.ts    # unsaved-changes navigation guard
├── next.config.js              # COPY from apps/web + port 3002
├── tailwind.config.ts          # COPY verbatim from apps/web
├── tsconfig.json               # COPY verbatim from apps/web
├── postcss.config.js           # standard Tailwind postcss
├── package.json                # name: @vizteck/admin, port: 3002
└── .env.example                # NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Pattern 1: Monorepo App Scaffold (copy from apps/web)

**What:** Create `apps/admin` as a new pnpm workspace entry; copy config files from apps/web.
**When to use:** Whenever adding a new Next.js app to this monorepo.

`apps/admin/next.config.js` — identical to apps/web, all 6 transpilePackages:
```javascript
// Source: apps/web/next.config.js (verified 2026-06-19)
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@vizteck/ui',
    '@vizteck/graph',
    '@xyflow/react',
    '@blocknote/react',
    '@blocknote/core',
    '@blocknote/mantine',
  ],
};
module.exports = nextConfig;
```

`apps/admin/package.json` — minimum required:
```json
{
  "name": "@vizteck/admin",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start --port 3002",
    "lint": "next lint"
  }
}
```

### Pattern 2: Client-Side Route Guard

**What:** Protect all non-login routes from unauthenticated access using localStorage.
**When to use:** Every admin page component.

```typescript
// Source: CONTEXT.md DEC-04-04 D-17/D-18
// apps/admin/src/lib/useAuthGuard.ts
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGuard() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);
}
```

Token validation pattern (on login submit):
```typescript
// Source: CONTEXT.md DEC-04-04 D-17
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const res = await fetch(`${API}/api/roadmaps`, {
  headers: { Authorization: `Bearer ${token}` },
});
if (res.ok) {
  localStorage.setItem('admin_token', token);
  router.push('/roadmaps');
} else if (res.status === 401) {
  setError('Invalid token. Please try again.');
}
```

### Pattern 3: Save Graph via UpsertGraph

**What:** The only write path for graph changes is `POST /api/roadmaps/:id/graph`. It atomically replaces ALL nodes and edges.
**When to use:** Save Graph button click; also lesson content save (no PUT /api/nodes/:id exists).

```typescript
// Source: apps/api-gateway/src/roadmap/roadmap.rest.controller.ts (verified 2026-06-19)
// Payload shape (from NodeInput DTO):
interface UpsertGraphPayload {
  nodes: Array<{
    id: string;        // MUST pass existing id to preserve; empty string = new (auto-assigned by service)
    type: 'ROADMAP' | 'LESSON';
    title: string;
    positionX: number; // 0 for unplaced nodes (after Prisma migration makes this Float?)
    positionY: number; // 0 for unplaced nodes
    targetRoadmapId?: string;
    content?: string;  // BlockNote JSON as string (serialized JSON.stringify)
  }>;
  edges: Array<{
    sourceId: string;
    targetId: string;
    label?: string;
  }>;
}

// Call:
const token = localStorage.getItem('admin_token');
await fetch(`${API}/api/roadmaps/${roadmapId}/graph`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ nodes, edges }),
});
```

**Critical:** `id` field on nodes must be passed through — the svc-roadmap `upsertGraph` uses `id: n.id || undefined`, so passing the existing id preserves it. Passing an empty string triggers `undefined` (auto-assigned cuid). [VERIFIED: apps/svc-roadmap/src/roadmap/roadmap.service.ts]

### Pattern 4: Drag from Inventory List to React Flow Canvas

**What:** HTML draggable div → React Flow `onDrop` + `screenToFlowPosition` coordinate transform.
**When to use:** NodeInventory component drag handle → GraphEditor drop zone.

```typescript
// Source: @xyflow/react official docs pattern [ASSUMED - standard React Flow drag pattern]
// In NodeInventory row (drag source):
<div
  draggable
  onDragStart={(e) => {
    e.dataTransfer.setData('nodeId', node.id);
    e.dataTransfer.effectAllowed = 'move';
  }}
  aria-label="Drag to place on canvas"
  role="button"
  tabIndex={0}
>
  {/* drag handle icon */}
</div>

// In GraphEditor (drop target — wrapping ReactFlow):
<div
  onDrop={(e) => {
    e.preventDefault();
    const nodeId = e.dataTransfer.getData('nodeId');
    // rfInstance comes from useReactFlow() hook
    const position = rfInstance.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });
    // update node in local state: set positionX/Y to position.x/y
    placeNode(nodeId, position.x, position.y);
  }}
  onDragOver={(e) => e.preventDefault()}
>
  <ReactFlow ... />
</div>
```

`useReactFlow()` must be called inside a `ReactFlowProvider`. The existing `RoadmapGraph` already wraps with `ReactFlowProvider`. However the graph editor page will need access to `rfInstance.screenToFlowPosition` — this means the drop handler must live inside the `ReactFlowProvider` tree. [ASSUMED - standard pattern, verify screenToFlowPosition availability in @xyflow/react v12]

### Pattern 5: BlockNote Editor (Editable, Save via UpsertGraph)

**What:** BlockNote editable editor, loaded client-side only, saves content to node via UpsertGraph.
**When to use:** `/roadmaps/[id]/nodes/[nodeId]` lesson editor page.

```typescript
// Source: apps/web/src/components/LessonContent.tsx + CONTEXT.md (verified 2026-06-19)
// LessonEditor.tsx — 'use client'
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

export function LessonEditor({ initialContentJson, onSave }: {
  initialContentJson: string;
  onSave: (contentJson: string) => Promise<void>;
}) {
  const blocks = tryParseBlocks(initialContentJson);
  const editor = useCreateBlockNote(blocks ? { initialContent: blocks } : {});
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Read dark mode from document.documentElement.classList (same as LessonContent.tsx)
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const handleSave = async () => {
    const blocks = editor.document;
    await onSave(JSON.stringify(blocks));
  };

  return (
    <>
      <button onClick={handleSave}>Save Lesson</button>
      <BlockNoteView editor={editor} editable={true} theme={theme} />
    </>
  );
}
```

Dynamic import in page component (SSR-incompatible):
```typescript
// Source: CONTEXT.md code_context + REQUIREMENTS.md REQ-admin-lesson-editor (verified 2026-06-19)
import dynamic from 'next/dynamic';
const LessonEditor = dynamic(() => import('@/components/LessonEditor').then(m => m.LessonEditor), {
  ssr: false,
  loading: () => <div>Loading editor…</div>,
});
```

### Pattern 6: Extending RoadmapGraph for Edit Mode

**What:** The current `RoadmapGraph` in `mode="edit"` enables drag/connect but does not expose `onNodesChange`/`onEdgesChange` callbacks or `useNodes`/`useEdges` state to the parent.
**When to use:** Graph editor page needs to track dirty state and read current node positions for Save Graph.

The parent component (graph editor page) needs access to the live React Flow state. Two approaches:

**Option A (preferred — no package change):** Wrap `RoadmapGraph` with a sibling `ReactFlowProvider` consumer that uses `useNodesState`/`useEdgesState` at the page level, and pass the controlled state down to `RoadmapGraph` via extended props.

**Option B:** Add `onNodesChange` and `onEdgesChange` props to `RoadmapGraph` and wire them through to `ReactFlow`. This requires editing `packages/graph/src/RoadmapGraph.tsx`.

The CONTEXT.md canonical refs state: "extend with toolbar + save button". Option B (editing the package to add `onNodesChange`/`onEdgesChange` props) is the correct approach since it keeps React Flow state management inside the component. [ASSUMED - design decision, both approaches valid; research recommends Option B]

Extended props for `RoadmapGraph`:
```typescript
// Proposed extension to packages/graph/src/RoadmapGraph.tsx
export interface RoadmapGraphProps {
  nodes: NodeItem[];
  edges: EdgeItem[];
  mode: 'view' | 'edit';
  onNodeClick?: (node: NodeItem) => void;
  // New for edit mode:
  onNodesChange?: (nodes: Node[]) => void;  // receives updated React Flow nodes after drag
  onEdgesChange?: (edges: RFEdge[]) => void; // receives updated edges after connect/delete
  onContextMenu?: (event: MouseEvent, position: { x: number; y: number }) => void; // right-click on empty canvas
}
```

### Anti-Patterns to Avoid

- **Calling `useReactFlow()` outside `ReactFlowProvider`:** `RoadmapGraph` wraps `ReactFlowProvider` internally — any component needing `screenToFlowPosition` must be inside that provider (either inside `RoadmapGraph` or the provider must be moved up to the page level).
- **Relying on `PUT /api/nodes/:id` for lesson save:** This endpoint does not exist and is not in the proto. All node writes go through UpsertGraph.
- **Sending partial node lists to UpsertGraph:** `upsertGraph` in `svc-roadmap` does a full delete-then-insert. Sending only the updated node will delete all other nodes. Always send the complete node list.
- **Declaring `nodeTypes` inside a component:** Must be at module scope (already correctly done in `RoadmapGraph.tsx`) to prevent remount on each render.
- **Using `params` synchronously in Next.js 16 page components:** `params` is a Promise — must `await params` before destructuring. [VERIFIED: apps/web/src/app/roadmap/[slug]/page.tsx]
- **Rendering BlockNote on the server:** BlockNote is browser-only. Always use `dynamic(() => import(...), { ssr: false })`. [VERIFIED: CONTEXT.md + LessonContent.tsx]
- **Hardcoding `positionX: 0, positionY: 0` for unplaced nodes before the migration:** Prisma schema currently has non-nullable Float — migration to `Float?` must happen first.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text editing | Custom contenteditable | `@blocknote/react` | BlockNote already in apps/web; handles all editor complexity, serialization, and theming |
| Graph canvas | Custom SVG drag canvas | `@xyflow/react` (via @vizteck/graph) | React Flow handles node drag, edge connect, zoom/pan; already in packages/graph |
| Drag coordinate transform | Manual clientX/Y math | `rfInstance.screenToFlowPosition()` | Accounts for zoom, pan offset, and container position |
| Design system | New tokens/components | Copy apps/web globals.css + tailwind.config.ts verbatim | Tokens already defined and tested |
| Auth flow | JWT / sessions | `localStorage.admin_token` + `Authorization: Bearer` | CONTEXT.md DEC-04-04; AdminGuard already implemented |
| Slug generation | Complex transliteration | `title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')` | CONTEXT.md D-14; simple regex is the locked decision |

**Key insight:** Every hard UI problem in this phase already has a working solution in the monorepo (BlockNote in LessonContent.tsx, React Flow in RoadmapGraph.tsx, design tokens in globals.css). The task is wiring them together, not reinventing them.

---

## Common Pitfalls

### Pitfall 1: UpsertGraph Wipes All Nodes (Partial Save Destroys Data)

**What goes wrong:** Calling `POST /api/roadmaps/:id/graph` with only the changed node deletes all other nodes from the roadmap.
**Why it happens:** `upsertGraph` in svc-roadmap runs `tx.node.deleteMany({ where: { roadmapId } })` first, then inserts only what was provided.
**How to avoid:** Always maintain the full graph state in admin client memory. On save, send ALL nodes (placed + unplaced) plus ALL edges.
**Warning signs:** Nodes disappearing from canvas after save.

### Pitfall 2: `PUT /api/nodes/:id` Does Not Exist

**What goes wrong:** Planning for a lesson editor that calls `PUT /api/nodes/:nodeId` will fail at runtime with 404.
**Why it happens:** The proto has no `UpdateNode` RPC; the REST controller has no `@Put('nodes/:id')` handler. [VERIFIED: roadmap.rest.controller.ts, roadmap.proto]
**How to avoid:** Lesson content save must use `POST /api/roadmaps/:id/graph` (UpsertGraph) — load full graph first, update target node's `content` field, send complete payload.
**Warning signs:** REQ-admin-lesson-editor acceptance criteria says "Save Lesson triggers upsertGraph with updated content field serialised as JSON string" — the requirements document already prescribes UpsertGraph.

### Pitfall 3: `positionX`/`positionY` Non-Nullable Before Migration

**What goes wrong:** Creating an unplaced node (D-03, D-04) and sending `positionX: null` to UpsertGraph causes a Prisma validation error.
**Why it happens:** Current schema has `positionX Float` (non-nullable). [VERIFIED: packages/db/prisma/schema.prisma]
**How to avoid:** The migration (`positionX Float?`, `positionY Float?`) must be the FIRST task in the implementation. Until migrated, the NodeInput DTO also needs updating to accept optional floats.
**Warning signs:** `Argument 'positionX': Got invalid value 'null'` from Prisma.

### Pitfall 4: `useReactFlow()` / `screenToFlowPosition` Outside Provider

**What goes wrong:** Calling `useReactFlow()` in a component that is a parent of `ReactFlowProvider` throws a React context error.
**Why it happens:** `RoadmapGraph` wraps `ReactFlowProvider` internally, so any drag-drop handler in the page component cannot call `useReactFlow()`.
**How to avoid:** Move the drop handler inside the `ReactFlowProvider` tree. Either: (a) pass `onDrop` as a prop into `RoadmapGraph` so it can call `screenToFlowPosition` internally, or (b) move `ReactFlowProvider` up to the page component.
**Warning signs:** `Error: Seems like you have not used zustand provider as an ancestor` at runtime.

### Pitfall 5: `params` Must Be Awaited in Next.js 16 Page Components

**What goes wrong:** `const { id } = params` throws TypeScript error and potentially runtime error.
**Why it happens:** Next.js 16 changed `params` to a Promise. [VERIFIED: apps/web/src/app/roadmap/[slug]/page.tsx]
**How to avoid:** `const { id } = await params;` — type as `Promise<{ id: string }>`.
**Warning signs:** TypeScript error `Property 'id' does not exist on type 'Promise<...>'`.

### Pitfall 6: `transpilePackages` Must Include All 6 ESM Packages

**What goes wrong:** Import errors at build time for workspace packages that contain JSX/ESM.
**Why it happens:** `@vizteck/ui`, `@vizteck/graph`, `@xyflow/react`, `@blocknote/react`, `@blocknote/core`, `@blocknote/mantine` all use `main: ./src/index.ts` (no build step). Next.js must transpile them. [VERIFIED: apps/web/next.config.js]
**How to avoid:** Copy `apps/web/next.config.js` verbatim — all 6 packages are already listed.
**Warning signs:** `SyntaxError: Cannot use import statement in a module` during `next build`.

### Pitfall 7: apps/admin Not in pnpm-workspace.yaml

**What goes wrong:** `pnpm install` does not include `apps/admin`; workspace:* dependencies fail to resolve.
**Why it happens:** `pnpm-workspace.yaml` only includes `apps/*` and `packages/*` — adding a folder under `apps/` is sufficient. [VERIFIED: pnpm-workspace.yaml `apps/*` glob]
**How to avoid:** Create `apps/admin/` at the correct path — the glob `apps/*` automatically picks it up. No changes to `pnpm-workspace.yaml` needed.
**Warning signs:** `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` on install.

---

## Code Examples

### GET /api/roadmaps with Bearer Token

```typescript
// Source: CONTEXT.md DEC-04-04 + roadmap.rest.controller.ts (verified 2026-06-19)
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken(): string {
  return localStorage.getItem('admin_token') ?? '';
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...init.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}
```

### Prisma Schema Migration for Nullable positionX/Y

```prisma
// Source: packages/db/prisma/schema.prisma — change required (verified 2026-06-19)
// BEFORE:
//   positionX  Float
//   positionY  Float
// AFTER:
  positionX  Float?
  positionY  Float?
```

Migration command:
```bash
pnpm --filter @vizteck/db db:migrate
```

After migration, `NodeInput` DTO in `apps/api-gateway/src/roadmap/roadmap.dto.ts` also needs updating:
```typescript
// positionX and positionY become nullable in NodeInput
@Field(() => Float, { nullable: true }) @ApiPropertyOptional() positionX?: number;
@Field(() => Float, { nullable: true }) @ApiPropertyOptional() positionY?: number;
```

And the svc-roadmap `upsertGraph` must handle `null` positions:
```typescript
// positionX: n.positionX ?? 0  — use 0 as fallback for unplaced nodes in DB
```

### BlockNote Editor with Dark Mode Detection

```typescript
// Source: apps/web/src/components/LessonContent.tsx (verified 2026-06-19)
// Pattern is identical for editable editor — reuse MutationObserver approach
useEffect(() => {
  const update = () =>
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  update();
  const obs = new MutationObserver(update);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
}, []);
```

### apps/admin Tailwind Config

```typescript
// Source: apps/web/tailwind.config.ts (verified 2026-06-19) — copy verbatim + add admin content paths
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/graph/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { 0: 'var(--bg-0)', 1: 'var(--bg-1)', 2: 'var(--bg-2)' },
        border: 'var(--border)',
        text: { 1: 'var(--text-1)', 2: 'var(--text-2)', 3: 'var(--text-3)' },
        indigo: { DEFAULT: '#4F46E5', mid: '#6366F1', lt: '#EEF2FF' },
        emerald: { DEFAULT: '#059669', lt: '#ECFDF5' },
      },
      borderRadius: { sm: '6px', md: '10px', lg: '16px' },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## API Contracts (Verified from Codebase)

All endpoints verified from `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts` and `roadmap.dto.ts`.

### Public Endpoints (no auth)

| Endpoint | Response |
|----------|----------|
| `GET /api/roadmaps` | `{ roadmaps: RoadmapItem[] }` — used for token validation on login |
| `GET /api/roadmaps/:slug` | `{ roadmap, nodes, edges }` — loads graph; note: takes slug not id |
| `GET /api/nodes/:id` | `NodeDetail { node, targetRoadmap }` — loads lesson content |

### Admin Endpoints (Bearer token required)

| Endpoint | Body | Response |
|----------|------|----------|
| `POST /api/roadmaps` | `{ slug, title, description?, coverImage? }` | `RoadmapItem` |
| `PUT /api/roadmaps/:id` | `{ title?, description?, coverImage? }` — id in path, no slug update | `RoadmapItem` |
| `DELETE /api/roadmaps/:id` | none | `{ success: boolean }` |
| `POST /api/roadmaps/:id/graph` | `{ nodes: NodeInput[], edges: EdgeInput[] }` | `RoadmapDetail` |

**DOES NOT EXIST:** `PUT /api/nodes/:id` — no UpdateNode RPC in proto, no REST handler. [VERIFIED: roadmap.rest.controller.ts + roadmap.proto]

### NodeInput shape (for UpsertGraph)

```typescript
// Source: apps/api-gateway/src/roadmap/roadmap.dto.ts (verified 2026-06-19)
{
  id: string;            // existing node id; empty string → new node (auto-cuid in service)
  type: 'ROADMAP' | 'LESSON';
  title: string;
  positionX: number;     // use 0 for unplaced after migration (null not accepted by NodeInput currently)
  positionY: number;     // use 0 for unplaced after migration
  targetRoadmapId?: string;
  content?: string;      // BlockNote JSON serialized as string; service does JSON.parse on it
}
```

**Important:** The `content` field on Node is stored as `Json?` in Prisma (object), but transmitted as a string over gRPC and the REST API. The svc-roadmap `toNodeItem` function does `JSON.stringify(n.content)` on read and `JSON.parse(n.content)` on write. So the admin must send `JSON.stringify(editorBlocks)` as the content string.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class components in React | Functional components + hooks | React 16.8+ | All admin components should be functional |
| Next.js `getServerSideProps` | App Router with async server components | Next.js 13+ | Admin uses App Router (same as apps/web) |
| `pages/` directory | `app/` directory | Next.js 13+ | Confirmed: apps/web uses `app/` |
| Synchronous `params` | `params: Promise<{...}>` with `await` | Next.js 16 | MUST await params in all page components |

**Deprecated/outdated:**
- `pages/` router: apps/web uses App Router — admin must also use App Router.
- `getServerSideProps` / `getStaticProps`: replaced by async server component data fetching.
- Inline styles: CLAUDE.md pattern (recent commit `fa1fe41`) shows all inline styles replaced with Tailwind. Admin should use Tailwind utilities exclusively.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `screenToFlowPosition` is available in @xyflow/react v12 via `useReactFlow()` hook | Pattern 4 (drag-to-canvas) | Would require alternative coordinate calculation; @xyflow/react changelog should be checked |
| A2 | Extending `RoadmapGraph` props with `onNodesChange`/`onEdgesChange` is the correct approach for graph state access | Pattern 6 | Could use ReactFlowProvider at page level instead; both work |
| A3 | Tailwind content path `../../packages/ui/src/**/*.{ts,tsx}` in tailwind.config.ts covers all shared component classes | Standard Stack | Could miss classes from shared packages in prod build if path is wrong |

---

## Open Questions (RESOLVED)

1. **Lesson editor save path through UpsertGraph**
   - What we know: `PUT /api/nodes/:id` does not exist; `POST /api/roadmaps/:id/graph` is the only write path
   - What's unclear: The lesson editor page receives a `nodeId` but the UpsertGraph endpoint takes a `roadmapId`. The page must load the full graph (GET /api/roadmaps/:slug), update the target node's content, then POST all nodes+edges.
   - Recommendation: Lesson editor page loads `GET /api/nodes/:nodeId` for content AND `GET /api/roadmaps/:slug` for the full graph. On save, updates the target node in the full node list and calls UpsertGraph. This is slightly expensive but correct.

2. **`GET /api/roadmaps/:id` vs `GET /api/roadmaps/:slug` for graph editor**
   - What we know: The REST controller uses `:slug` as the route parameter, but the admin graph editor page is at `/roadmaps/[id]` (uses id). The `getRoadmap` gRPC call takes a slug, not an id.
   - What's unclear: How does the admin graph editor page (which has the roadmap `id` in the URL) load graph data via `GET /api/roadmaps/:slug`?
   - Recommendation: The roadmap list page should pass both `id` and `slug` in navigation. The graph editor page URL can use `id` but the page must store the `slug` to call the GET endpoint. Alternatively, the roadmap list loads roadmaps (which include both `id` and `slug`), and the router state can carry `slug` alongside the `id`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | Yes | v24.12.0 | — |
| pnpm | All | Yes | 10.30.2 | — |
| Docker (postgres) | DB migration | Not checked | — | Migration fails without running postgres |
| PostgreSQL | Prisma migration | Docker compose | — | `docker compose up -d postgres` |

**Missing dependencies with no fallback:**
- PostgreSQL must be running for `pnpm --filter @vizteck/db db:migrate` (Wave 0 migration task).

---

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json` — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected in apps/web (no jest.config, no vitest.config) |
| Config file | None — Wave 0 gap |
| Quick run command | n/a until framework installed |
| Full suite command | n/a until framework installed |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-admin-login | Token validation returns 200/401 correctly | manual (browser) | n/a — requires live api-gateway | N/A |
| REQ-admin-roadmap-crud | CRUD operations succeed with valid token | manual (browser) | n/a — requires live api-gateway | N/A |
| REQ-admin-graph-editor | Save Graph persists positions | manual (browser) | n/a — requires live api-gateway | N/A |
| REQ-admin-lesson-editor | BlockNote content saves via UpsertGraph | manual (browser) | n/a — requires live api-gateway | N/A |

### Wave 0 Gaps

No automated test framework exists for Next.js apps in this monorepo. All Phase 4 acceptance criteria require a running api-gateway + PostgreSQL + browser interaction — they are integration/E2E tests, not unit tests. The existing e2e package (`apps/e2e`) has its `package.json` deleted (git status shows `D apps/e2e/package.json`).

- Manual verification checklist should be used as the phase gate
- Wave 0: No test files need to be created (all acceptance criteria are browser-observable)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Static Bearer token via `AdminGuard` in api-gateway |
| V3 Session Management | partial | `localStorage` token (not HttpOnly cookie — risk: XSS can read token; acceptable for this single-user admin tool per PROJECT.md) |
| V4 Access Control | yes | `AdminGuard` requires `Authorization: Bearer <ADMIN_TOKEN>` on all mutation endpoints |
| V5 Input Validation | yes | NestJS DTOs with class-validator + TypeScript strict; slug regex on client |
| V6 Cryptography | no | No crypto — static token comparison |

### Known Threat Patterns for Admin CMS Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Token stored in localStorage | Information Disclosure | Acceptable for single-user admin (per PROJECT.md); no user PII involved |
| UpsertGraph replaces all nodes | Tampering | Authenticated endpoint behind AdminGuard; not a public API |
| XSS via BlockNote content | Tampering | BlockNote renders its own content safely; do not render raw HTML from BlockNote JSON |
| CSRF | Spoofing | Not mitigated (no CSRF token); acceptable since auth is Bearer token (not cookie-based) |

---

## Sources

### Primary (HIGH confidence)

- `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts` — all REST endpoint definitions verified
- `apps/api-gateway/src/roadmap/roadmap.dto.ts` — NodeInput, EdgeInput, CreateRoadmapInput schemas
- `apps/svc-roadmap/src/roadmap/roadmap.service.ts` — UpsertGraph delete-then-insert behavior, content JSON.parse/stringify
- `packages/proto/roadmap.proto` — confirmed no UpdateNode RPC
- `packages/graph/src/RoadmapGraph.tsx` — confirmed current props interface
- `packages/graph/src/types.ts` — NodeItem, EdgeItem interfaces
- `packages/db/prisma/schema.prisma` — confirmed positionX/Y are non-nullable Float
- `apps/web/next.config.js` — confirmed 6 transpilePackages
- `apps/web/tailwind.config.ts` — design token config
- `apps/web/src/app/globals.css` — CSS variable values
- `apps/web/src/app/layout.tsx` — header pattern, font loading, FOUC script
- `apps/web/src/components/ThemeToggle.tsx` — ThemeToggle implementation
- `apps/web/src/components/LessonContent.tsx` — BlockNote pattern with dark mode
- `apps/web/src/app/roadmap/[slug]/page.tsx` — async params pattern
- `.planning/phases/04-admin-cms/04-CONTEXT.md` — all locked decisions
- `.planning/phases/04-admin-cms/04-UI-SPEC.md` — full UI design contract
- `pnpm-workspace.yaml` — `apps/*` glob covers new apps/admin automatically

### Secondary (MEDIUM confidence)

- `apps/web/package.json` — package versions (next@^16.2.9, @blocknote/* @^0.51.4)

### Tertiary (LOW confidence / ASSUMED)

- `screenToFlowPosition` API in @xyflow/react v12 (standard pattern, not re-verified in this session)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already in the monorepo; versions verified from package.json files
- API contracts: HIGH — verified directly from controller and DTO source files
- Architecture: HIGH — verified from existing implementations in apps/web and packages/
- Prisma schema gap: HIGH — positionX/Y non-nullable confirmed from schema.prisma
- Missing endpoint: HIGH — absence of PUT /api/nodes/:id confirmed from controller + proto
- Pitfalls: HIGH — all pitfalls are directly derived from reading the actual source files
- Drag-to-canvas pattern: MEDIUM — standard @xyflow/react pattern, assumed from v12 docs

**Research date:** 2026-06-19
**Valid until:** 2026-07-19 (stable — no fast-moving dependencies beyond BlockNote)
