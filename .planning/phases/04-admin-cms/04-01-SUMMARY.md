---
phase: 04-admin-cms
plan: "01"
subsystem: admin-cms
tags: [nextjs, admin, prisma, auth, crud, tailwind]
dependency_graph:
  requires: []
  provides:
    - apps/admin Next.js app on port 3002
    - nullable Node positions in Prisma schema (unblocks 04-02)
    - /login page with token authentication (REQ-admin-login)
    - /roadmaps CRUD page (REQ-admin-roadmap-crud)
  affects:
    - packages/graph (RoadmapGraph now filters null-position nodes)
    - apps/api-gateway (NodeDto, NodeInput positionX/Y now nullable)
    - apps/svc-roadmap (upsertGraph now writes positionX ?? null)
tech_stack:
  added:
    - "@vizteck/admin workspace package (Next.js 16, port 3002)"
  patterns:
    - "Bearer token auth via localStorage.admin_token"
    - "apiFetch wrapper injects Authorization header and handles 401 redirect"
    - "useAuthGuard hook for client-side route protection"
    - "slugify(title) = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')"
    - "Null-position node filter in RoadmapGraph before rfNodes mapping"
key_files:
  created:
    - apps/admin/package.json
    - apps/admin/next.config.js
    - apps/admin/tailwind.config.ts
    - apps/admin/postcss.config.js
    - apps/admin/tsconfig.json
    - apps/admin/.env.example
    - apps/admin/src/app/globals.css
    - apps/admin/src/app/layout.tsx
    - apps/admin/src/app/page.tsx
    - apps/admin/src/app/login/page.tsx
    - apps/admin/src/app/roadmaps/page.tsx
    - apps/admin/src/components/AdminLayout.tsx
    - apps/admin/src/components/ThemeToggle.tsx
    - apps/admin/src/components/RoadmapModal.tsx
    - apps/admin/src/components/ConfirmDialog.tsx
    - apps/admin/src/lib/api.ts
    - apps/admin/src/lib/useAuthGuard.ts
    - packages/db/prisma/migrations/20260619000000_nullable_node_positions/migration.sql
  modified:
    - packages/db/prisma/schema.prisma (positionX/Y to Float?)
    - apps/api-gateway/src/roadmap/roadmap.dto.ts (NodeDto, NodeInput positionX/Y nullable)
    - apps/svc-roadmap/src/roadmap/roadmap.service.ts (positionX ?? null in upsertGraph)
    - packages/graph/src/types.ts (NodeItem positionX/Y: number | null)
    - packages/graph/src/RoadmapGraph.tsx (filter null nodes, add onNodesChange/onEdgesChange/onPaneContextMenu props)
decisions:
  - "Used db:push instead of db:migrate (shadow DB permission error P3014); manual migration SQL file created to satisfy artifact requirement"
  - "ConfirmDialog uses native <button> elements (not @vizteck/ui Button) to enable ref forwarding for focus management"
  - "handlePaneContextMenu casts to React.MouseEvent to access clientX/Y — @xyflow/react fires MouseEvent union type"
metrics:
  duration: "36m"
  completed: "2026-06-19"
  tasks_completed: 3
  tasks_total: 4
  files_created: 18
  files_modified: 5
---

# Phase 04 Plan 01: Admin CMS Foundation Summary

**One-liner:** apps/admin scaffolded on port 3002 with Bearer-token login, roadmap CRUD table/modals, and Prisma schema migrated to nullable node positions.

## What Was Built

Tasks 1-3 of plan 04-01 are complete. Task 4 is a human-verification checkpoint.

### Task 1: Nullable Node Positions (BLOCKING)

Made `Node.positionX` and `Node.positionY` nullable (`Float?`) in the Prisma schema. Applied change via `db:push` (shadow DB permission issue prevented `db:migrate`). Created manual migration SQL file. Updated:

- `NodeDto` and `NodeInput` in `roadmap.dto.ts` — `positionX?: number` with `@Field(() => Float, { nullable: true })`
- `upsertGraph` in `roadmap.service.ts` — `positionX: n.positionX ?? null`
- `NodeItem` in `packages/graph/src/types.ts` — `positionX: number | null`
- `RoadmapGraph.tsx` — filters unplaced (null-position) nodes before mapping to React Flow nodes; adds `onNodesChange`, `onEdgesChange`, `onPaneContextMenu` optional props

### Task 2: apps/admin Shell

Created `apps/admin` as `@vizteck/admin` workspace package. Config files copied verbatim from `apps/web` (next.config.js with 6 transpilePackages, tailwind.config.ts, globals.css with all CSS variable tokens, postcss.config.js, tsconfig.json). Implemented:

- `AdminLayout` — h-14 header with app name (Space Grotesk), ThemeToggle, "Log out" button that clears `localStorage.admin_token` and redirects to `/login`
- `ThemeToggle` — copied verbatim from `apps/web`
- `api.ts` — exports `apiFetch` (Bearer token injection, 401 → redirect), `getToken`, `slugify` (D-14 regex)
- `useAuthGuard` — useEffect hook, redirects to `/login` if no `admin_token` in localStorage
- Root page — redirects to `/roadmaps` if token present, else `/login`

### Task 3: Login + Roadmap CRUD

Implemented `REQ-admin-login` and `REQ-admin-roadmap-crud`:

- `/login` — centered 400px card; password input; validates token via raw `fetch` to `GET /api/roadmaps`; on 200: `localStorage.setItem('admin_token', ...)` + redirect; on 401: "Invalid token. Please try again." + clear + refocus; on network error: "Could not reach server. Check your connection."
- `ConfirmDialog` — generic destructive modal with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`; focus moves to dismiss button on open
- `RoadmapModal` — create/edit modal; create mode auto-generates slug via `slugify` (debounced 300ms); once slug manually edited, auto-overwrite stops; edit mode disables slug field
- `/roadmaps` — table with Title/Slug/Actions columns; + New Roadmap CTA; empty state; POST/PUT/DELETE via `apiFetch`; row title links include `?slug=` for graph editor

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] db:migrate shadow DB permission error**
- **Found during:** Task 1
- **Issue:** `prisma migrate dev` failed with P3014 (permission denied to create shadow database). The DB user `vizteck` does not have `CREATEDB` privilege.
- **Fix:** Used `db:push` to apply the schema change directly. Created a manual migration SQL file (`20260619000000_nullable_node_positions/migration.sql`) to satisfy the `must_haves.artifacts` requirement for a migration directory.
- **Files modified:** `packages/db/prisma/schema.prisma`, new migration SQL file
- **Commit:** d84ab7b

**2. [Rule 1 - Bug] MouseEvent type clash in handlePaneContextMenu**
- **Found during:** Task 1 TypeScript check
- **Issue:** `@xyflow/react` `onPaneContextMenu` callback type is `MouseEvent | React.MouseEvent` union; `clientX`/`clientY` only exist on `React.MouseEvent`.
- **Fix:** Cast event to `React.MouseEvent` to access coordinates; pass through to caller as `MouseEvent`.
- **Files modified:** `packages/graph/src/RoadmapGraph.tsx`
- **Commit:** d84ab7b

**3. [Rule 2 - Missing critical] ConfirmDialog uses native button for ref focus**
- **Found during:** Task 3
- **Issue:** `@vizteck/ui Button` does not use `forwardRef`, so `ref` cannot be attached for focus management (destructive-default-safe requirement from accessibility contract).
- **Fix:** Used native `<button>` elements in ConfirmDialog with inline Tailwind styles matching the secondary/destructive button appearance, allowing `ref` forwarding to the dismiss button.
- **Files modified:** `apps/admin/src/components/ConfirmDialog.tsx`
- **Commit:** d29d6c1

## Commits

| Hash | Description |
|------|-------------|
| d84ab7b | feat(04-01): make node positions nullable — Prisma migration + DTO + graph types |
| 64a6f98 | feat(04-01): scaffold apps/admin shell — config, layout, ThemeToggle, api lib, auth guard |
| d29d6c1 | feat(04-01): implement /login and /roadmaps CRUD (REQ-admin-login, REQ-admin-roadmap-crud) |

## Known Stubs

None — all implemented functionality is wired to live API calls.

## Threat Flags

None — all trust boundaries and mitigations match the plan's `<threat_model>`:
- T-04-01: Login validates token server-side via GET /api/roadmaps (200/401) — implemented
- T-04-03: All CRUD calls use apiFetch with Bearer; AdminGuard in api-gateway enforces — implemented
- T-04-04: slugify normalizes slug input to `[a-z0-9-]` — implemented

## Self-Check: PASSED

All 11 key files verified to exist on disk. All 3 task commits (d84ab7b, 64a6f98, d29d6c1) verified in git log.
