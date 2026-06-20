# Phase 4: Admin CMS - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Build `apps/admin` — a new Next.js 16 app that lets an authenticated admin manage all roadmap content:
- **/login** — token authentication (localStorage)
- **/roadmaps** — roadmap list with CRUD (create/edit via modal, delete with confirm)
- **/roadmaps/[id]** — graph editor: canvas (top) + node inventory (bottom), drag-to-place, save positions
- **/roadmaps/[id]/nodes/[nodeId]** — BlockNote lesson editor (rich text, save to DB)

Public users are not affected — all admin routes are behind token guard.

</domain>

<decisions>
## Implementation Decisions

### Graph Editor Layout & Interaction (DEC-04-01)

- **D-01:** Layout is two-panel: React Flow canvas (top) + node inventory list (bottom) on `/roadmaps/[id]`
- **D-02:** Right-click on canvas → form panel opens on the right → creates node at that canvas position (title + type ROADMAP/LESSON)
- **D-03:** "Add" button in inventory list → same form panel → creates node, appears in inventory only (unplaced)
- **D-04:** Drag node from inventory list → drop onto canvas → node becomes placed with drop position
- **D-05:** Click node on canvas → side panel opens (right side) to edit title and type
- **D-06:** Delete from canvas = **unplace** (node stays in inventory, not permanently deleted)
- **D-07:** Delete from inventory list = **permanent delete** (with confirm warning dialog; edges are cascade-deleted)
- **D-08:** Unplaced nodes are persisted in DB → Prisma `Node.positionX` and `Node.positionY` **must be made nullable** (`Float?`); this is a schema migration

### Save Graph UX (DEC-04-02)

- **D-09:** Explicit **"Save Graph" button** on canvas toolbar (not auto-save)
- **D-10:** Button shows unsaved-changes indicator (e.g., yellow/orange tint) when local state diverges from last-saved state
- **D-11:** Navigating away with unsaved changes shows a **confirm dialog** ("Unsaved changes — leave anyway?")
- **D-12:** Save Graph sends all nodes (placed + unplaced) + all edges to `POST /api/roadmaps/:id/graph`

### Roadmap CRUD Form (DEC-04-03)

- **D-13:** Form fields: **Title** (required) + **Slug** (auto-generated from title, editable before submit)
- **D-14:** Slug auto-generation: `title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`
- **D-15:** Form is a **modal dialog** (not a separate route) — used for both Create and Edit
- **D-16:** Delete roadmap: button on roadmap list row + confirm dialog before calling `DELETE /api/roadmaps/:id`

### Auth & Layout (DEC-04-04)

- **D-17:** Token stored in `localStorage` key `admin_token`; validate on login by calling `GET /api/roadmaps` with Bearer token — 200 = valid, 401 = invalid
- **D-18:** Route guard: client-side redirect to `/login` if `localStorage.admin_token` is absent or returns 401
- **D-19:** Logout button in header → clear `localStorage.admin_token` → redirect to `/login`
- **D-20:** apps/admin uses the same design tokens (indigo/emerald/font/bg) from Phase 3 design system; same ThemeToggle pattern from apps/web

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §REQ-admin-login, §REQ-admin-roadmap-crud, §REQ-admin-graph-editor, §REQ-admin-lesson-editor — acceptance criteria for all 4 admin features
- `.planning/ROADMAP.md` §Phase 4 — success criteria SC1–SC5 and plan breakdown (04-01, 04-02, 04-03)

### Design & Phase 3 Patterns
- `.planning/phases/03-public-viewer/03-CONTEXT.md` — design tokens, ThemeToggle, BlockNote decisions (DEC-03-01 to DEC-03-10)
- `docs/design/mockup.html` — canonical visual design reference; admin should follow same token system
- `apps/web/src/app/layout.tsx` — header/font/ThemeToggle pattern to replicate in admin

### Existing Packages (reuse)
- `packages/graph/src/RoadmapGraph.tsx` — `mode="edit"` already handles draggable/connectable; extend with toolbar + save button
- `packages/graph/src/types.ts` — NodeItem, EdgeItem types (positionX/Y will become optional after schema change)
- `packages/ui/src/index.ts` — Button, Card, NodeBadge shared components

### API Contracts
- `apps/api-gateway/src/` — REST endpoints: `GET/POST/PUT/DELETE /api/roadmaps`, `POST /api/roadmaps/:id/graph`, `GET/PUT /api/nodes/:id`
- `packages/proto/roadmap.proto` — gRPC UpsertGraph contract (source of truth for graph save payload)

### Technical Constraints
- `packages/db/prisma/schema.prisma` — **Node.positionX and positionY must be changed to `Float?`** (nullable) before admin implementation; requires `pnpm --filter @vizteck/db db:migrate`
- `apps/web/next.config.js` — `transpilePackages` pattern to replicate in admin's next.config

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/graph/RoadmapGraph.tsx` — `mode="edit"` sets `nodesDraggable`, `nodesConnectable`, `elementsSelectable`; needs toolbar slot + `onNodesChange`/`onEdgesChange` callbacks wired for Save
- `packages/ui` — Button, Card, NodeBadge all usable in admin without modification
- `apps/web/src/components/ThemeToggle.tsx` — copy pattern into apps/admin; localStorage-based theme toggle already solved
- `apps/web/src/app/layout.tsx` — header layout pattern (h-14, px-6, border-b) to reuse

### Established Patterns
- Next.js 16 `params` is a Promise — `await params` in page components (learned from Phase 03-03)
- `transpilePackages` must include all 6 ESM-only workspace packages
- `'use client'` required for any BlockNote component (browser-only)
- `nodeTypes` declared at module scope in React Flow components (prevents remount)
- AdminGuard in api-gateway requires `Authorization: Bearer <token>` on all mutation endpoints

### Integration Points
- `POST /api/roadmaps/:id/graph` — UpsertGraph atomically replaces all nodes+edges for a roadmap; save payload must send complete node+edge list
- `GET /api/nodes/:id` + `PUT /api/nodes/:id` — lesson content read/write for BlockNote editor
- `ADMIN_TOKEN` env var in api-gateway vs `admin_token` localStorage in admin — these are the same value; admin POSTs the token the user typed on /login

</code_context>

<specifics>
## Specific Ideas

- **Graph editor UX pattern:** Right-click on empty canvas area (not on a node) → form panel. Click on existing node → edit side panel. These are two distinct interactions.
- **Node inventory list design:** Below the canvas — shows all nodes (placed and unplaced) with title, type badge, and action buttons (drag handle, delete). Drag handle enables drag-to-canvas.
- **Unsaved changes indicator:** Save Graph button tint changes (yellow/amber) when local graph state differs from last fetched/saved state; resets to normal after successful save.
- **Slug generation:** Auto-generate as user types title (debounced); admin can override before submitting.

</specifics>

<deferred>
## Deferred Ideas

- **Real-time collaboration** — out of scope v1 (single-user admin assumed, per PROJECT.md)
- **Image upload for coverImage** — not discussed; coverImage field deferred (only title+slug in Phase 4 CRUD)
- **Node description field** — not discussed for Phase 4; could be added in a future phase
- **Undo/Redo in graph editor** — not in scope; React Flow has `useUndoRedo` hook available for future phase
- **Bulk node operations** — deferred; Phase 4 covers single-node add/delete

</deferred>

---

*Phase: 4-Admin CMS*
*Context gathered: 2026-06-19*
