---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: "Phase 04-03 Tasks 1+2 complete — awaiting human-verify checkpoint (Task 3: lesson editor round-trip)"
last_updated: "2026-06-20T05:40:00.000Z"
last_activity: 2026-06-20 -- Phase 04-03 Tasks 1+2 complete; LessonEditor + lesson editor page built; checkpoint Task 3 awaiting human verify
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 8
  completed_plans: 7
  percent: 90
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-18)

**Core value:** Public users can browse and read any roadmap — any page must work without an admin session, and the admin canvas must always faithfully reflect what's in the database.
**Current focus:** Phase 04 — admin-cms

## Current Position

Phase: 04 (admin-cms) — EXECUTING
Plan: 3 of 3 — Tasks 1+2 committed; awaiting Task 3 (human-verify checkpoint)
Status: Phase 04-03 checkpoint reached — LessonEditor + lesson editor page built; awaiting browser QA
Last activity: 2026-06-20 -- Phase 04-03 Tasks 1+2 complete; commits c9626fd d28bacd; checkpoint Task 3 human-verify pending

Progress: [████████░░] 75%

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: ~15m/plan
- Total execution time: ~30m for Phase 02

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3/3 | - | - |
| 2. Core Services | 2/2 | ~30m | ~15m |

**Recent Trend:**

- Last 5 plans: n/a (Phase 1 pre-existing commits)
- Trend: Stable

*Updated after each plan completion*
| Phase 03-public-viewer P01 | 5m | 2 tasks | 6 files |
| Phase 03-public-viewer P02 | 6m | 2 tasks | 6 files |
| Phase 03-public-viewer P03 | 12m | 4 tasks | 18 files |
| Phase 04-admin-cms P01 | 36m | 3 tasks (checkpoint) | 23 files |
| Phase 04-admin-cms P02 | 45m | 3 tasks (checkpoint pending) | 7 files |
| Phase 04-admin-cms P03 | 20m | 2 tasks (checkpoint pending) | 3 files |

## Accumulated Context

### Decisions

All 10 architectural decisions locked in PROJECT.md Key Decisions table.
Key decisions applied in Phase 02 Plan 01:

- Used explicit `any` type annotations in transaction/flatMap lambdas for strict TypeScript compliance
- Prisma generate must be run after pnpm install; .prisma/client must exist in pnpm virtualstore

Key decisions applied in Phase 02 Plan 02:

- Added ts-morph ^24.0.0 to api-gateway devDependencies — required peer of @nestjs/graphql@12 for autoSchemaFile:true (RESEARCH.md Pitfall 1)
- Kept @nestjs/* at ^10.3.0 (not latest NestJS 11) — @nestjs/graphql@12 and @nestjs/swagger@7 are incompatible with NestJS 11
- AdminGuard dual HTTP/GraphQL context: context.getType() === 'http' branch vs GqlExecutionContext (DEC-005, T-02-06)

Key decisions affecting Phase 2:

- DEC-003: gRPC/Protobuf is the only inter-service protocol; packages/proto is source of truth
- DEC-004: Only svc-roadmap may touch PostgreSQL via @vizteck/db
- DEC-005: Static ADMIN_TOKEN; all mutations require Bearer token; AdminGuard in api-gateway
- DEC-010: CreateRoadmap/UpdateRoadmap return RoadmapItem (not Roadmap) — committed proto wins
- [Phase ?]: packages/ui uses main=./src/index.ts (no build step); apps/web uses transpilePackages to compile at app build time
- [Phase 03-02]: NodeProps<Node<RoadmapNodeData>> is the correct @xyflow/react v12 generic; RoadmapNodeData must extend Record<string, unknown>
- [Phase 03-02]: nodeTypes declared at module scope prevents ReactFlow from remounting nodes on every parent render
- [Phase 03-03]: Next.js 16 params is a Promise — must type as Promise<{slug,id}> and destructure with await (Pitfall 1)
- [Phase 03-03]: generateStaticParams returns [] for dynamic segments; build succeeds without live api-gateway; ISR handles first-request rendering
- [Phase 03-03]: transpilePackages must include all 6 ESM-only/workspace packages for apps/web to compile them at build time
- [Phase 03-03]: LessonContent is 'use client' only — BlockNote is browser-only; server passes contentJson string down to client

### Pending Todos

None yet.

Key decisions applied in Phase 04-02:

- GraphCanvas inner component pattern: RoadmapGraph wraps ReactFlowProvider; GraphCanvas lives inside for screenToFlowPosition access
- dataTransfer cast as any in both RoadmapGraph and NodeInventory — lib:[ES2022] omits DOM types
- packages/graph/src/index.ts re-exports @xyflow/react types so apps/admin avoids direct dependency
- Dirty state tracked via JSON snapshot ref (not state) to avoid extra re-renders

Key decisions applied in Phase 04-01:

- Used `db:push` instead of `db:migrate` — DB user lacks CREATEDB for shadow database (P3014 error)
- ConfirmDialog uses native `<button>` refs for focus management — @vizteck/ui Button lacks forwardRef
- Login page uses raw `fetch` (not apiFetch) to avoid 401 redirect loop on the login page itself

Key decisions applied in Phase 04-02 QA:

- Prisma generator must NOT use custom `output` in pnpm workspaces — default output writes to pnpm virtual store where `@prisma/client` resolves at runtime; custom output writes to packages/db/node_modules which is never used
- React Flow v12 controlled mode: onNodesChange must filter to position+select only to prevent visibility:hidden loop (BUG-04)
- EditorNode.selected must be passed as rfNodes.selected prop for selection to work in controlled mode (BUG-05)
- proto3 double fields (positionX/positionY) default to 0.0 on wire — treat 0 as unplaced (null in DB) via truthy check

### Blockers/Concerns

None.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Feature | svc-python (FastAPI AI/search) | Out of scope v1 | Phase 1 |
| Feature | svc-rust (Axum perf-critical ops) | Out of scope v1 | Phase 1 |

## Session Continuity

Last session: 2026-06-20T05:40:00Z
Stopped at: Phase 04-03 Tasks 1+2 committed (c9626fd, d28bacd); checkpoint Task 3 awaiting human verify
Resume file: .planning/phases/04-admin-cms/04-03-PLAN.md (Task 3 checkpoint:human-verify)
