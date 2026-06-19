---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 03-03-PLAN.md — apps/web Next.js 16 SSG public viewer (home, graph, lesson)
last_updated: "2026-06-19T01:00:00.000Z"
last_activity: 2026-06-19 -- Phase 03 complete
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 6
  completed_plans: 6
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-18)

**Core value:** Public users can browse and read any roadmap — any page must work without an admin session, and the admin canvas must always faithfully reflect what's in the database.
**Current focus:** Phase 03 — public-viewer

## Current Position

Phase: 03 (public-viewer) — COMPLETE
Plan: 3 of 3 — all complete
Status: Phase 03 complete; Phase 04 (Admin CMS) is next
Last activity: 2026-06-19 -- Phase 03 all 3 plans complete

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

### Blockers/Concerns

None yet.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Feature | svc-python (FastAPI AI/search) | Out of scope v1 | Phase 1 |
| Feature | svc-rust (Axum perf-critical ops) | Out of scope v1 | Phase 1 |

## Session Continuity

Last session: 2026-06-19T01:00:00.000Z
Stopped at: Completed 03-03-PLAN.md — apps/web Next.js 16 SSG public viewer (home, graph, lesson)
Resume file: None
