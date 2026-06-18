---
phase: 02-core-services
plan: 01
plan_id: 02-01
subsystem: svc-roadmap
tags: [grpc, nestjs, prisma, microservice]
completed_date: "2026-06-18T09:35:34Z"
duration_minutes: 10
task_count: 3
file_count: 9

dependency_graph:
  requires:
    - packages/proto (generated/roadmap.ts — message types and enum)
    - packages/db (Prisma singleton db, NodeType enum)
  provides:
    - apps/svc-roadmap (gRPC server on 0.0.0.0:5001 implementing full RoadmapService)
  affects:
    - apps/api-gateway (plan 02-02 — will call svc-roadmap via gRPC client)

tech_stack:
  added:
    - "@nestjs/common@^10.3.0 — NestJS core framework"
    - "@nestjs/microservices@^10.3.0 — gRPC transport + @GrpcMethod decorator"
    - "@grpc/grpc-js@^1.10.0 — gRPC runtime"
    - "@grpc/proto-loader@^0.7.13 — .proto file loader"
    - "jest@^29.7.0 + ts-jest@^29.1.0 — test framework"
  patterns:
    - "NestFactory.createMicroservice with Transport.GRPC"
    - "@GrpcMethod('RoadmapService', '<RpcName>') controller dispatch"
    - "db.$transaction with edge-before-node delete order for atomic UpsertGraph"
    - "Prisma string <-> proto int NodeType bidirectional mapping"

key_files:
  created:
    - apps/svc-roadmap/package.json
    - apps/svc-roadmap/tsconfig.json
    - apps/svc-roadmap/.env.example
    - apps/svc-roadmap/src/main.ts
    - apps/svc-roadmap/src/app.module.ts
    - apps/svc-roadmap/src/roadmap/roadmap.module.ts
    - apps/svc-roadmap/src/roadmap/roadmap.service.ts
    - apps/svc-roadmap/src/roadmap/roadmap.controller.ts
    - apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts
  modified: []

decisions:
  - "Kept @nestjs/* at ^10.3.0 (not latest) to avoid NestJS 11 peer dep conflicts with @nestjs/graphql@12 in api-gateway"
  - "Used explicit `any` type annotations in lambdas to satisfy strict TypeScript mode where Prisma types are not fully resolved"
  - "Generated Prisma client and copied .prisma/client to pnpm virtualstore so TypeScript resolves PrismaClient from the correct location"
---

# Phase 02 Plan 01: svc-roadmap gRPC Microservice Summary

**One-liner:** NestJS 10 gRPC microservice implementing all 7 RoadmapService RPCs backed by Prisma/PostgreSQL with atomic UpsertGraph via db.$transaction.

## What Was Built

`apps/svc-roadmap` — the sole data-owning gRPC service in the VizTeckStack monorepo. It:

- Listens on `0.0.0.0:5001` (configurable via `GRPC_PORT`)
- Implements all 7 RPCs from `packages/proto/roadmap.proto`: `GetRoadmaps`, `GetRoadmap`, `GetNode`, `CreateRoadmap`, `UpdateRoadmap`, `DeleteRoadmap`, `UpsertGraph`
- Is the only service that accesses PostgreSQL via the `@vizteck/db` Prisma singleton (DEC-004)
- Maps `NodeType` bidirectionally: Prisma string `ROADMAP`/`LESSON` ↔ proto int `0`/`1`
- `UpsertGraph` deletes edges before nodes inside `db.$transaction` to satisfy FK constraints (Pitfall 6 from RESEARCH.md)
- `CreateRoadmap` and `UpdateRoadmap` return `RoadmapItem` not `Roadmap` (DEC-010)

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Scaffold (package.json, tsconfig, env, failing test) | 7c5e3a1 | package.json, tsconfig.json, .env.example, roadmap.service.spec.ts |
| 2 | Implement RoadmapService + gRPC controller (GREEN) | 13a5fff | roadmap.service.ts, roadmap.controller.ts, roadmap.module.ts, app.module.ts |
| 3 | Wire main.ts gRPC bootstrap and verify build | 77f2c6c | src/main.ts |

## Verification Results

1. `pnpm test` (from apps/svc-roadmap) — **2 tests pass**
   - `getRoadmaps returns roadmap list`
   - `getRoadmap returns detail with nodes and edges`
2. `pnpm build` (nest build) — **zero TypeScript errors**, `dist/main.js` produced
3. `@vizteck/db` imported ONLY in `roadmap.service.ts` (DEC-004 compliant) — confirmed
4. `CreateRoadmap`/`UpdateRoadmap` return `Promise<RoadmapItem>` (DEC-010 compliant) — confirmed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict mode implicit `any` in lambda callbacks**
- **Found during:** Task 2 (first test run)
- **Issue:** Strict mode (`noImplicitAny`) rejected untyped lambdas in `.flatMap(n => n.edges)`, `.map(e => ...)`, and `db.$transaction(async (tx) => ...)` callbacks because Prisma types were not fully resolved at the TypeScript compilation step
- **Fix:** Added explicit `: any` annotations to lambda parameters (`n: any`, `e: any`, `tx: any`) — consistent with the plan's existing use of `any` in helper functions
- **Files modified:** `apps/svc-roadmap/src/roadmap/roadmap.service.ts`
- **Commit:** 13a5fff

**2. [Rule 3 - Blocking Issue] Prisma client not in pnpm virtualstore, blocking `nest build`**
- **Found during:** Task 3 (pnpm build)
- **Issue:** `@prisma/client` resolves via pnpm to the virtualstore at `node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client`, which re-exports from `.prisma/client/default`. The `prisma generate` command outputs to `packages/db/node_modules/.prisma/client` per the schema `output` setting, but the virtualstore location had no `.prisma/client` directory. TypeScript saw an empty `@prisma/client` with no `PrismaClient` export.
- **Fix:** Ran `prisma generate` (via `pnpm --filter @vizteck/db generate`) to produce `packages/db/node_modules/.prisma/client`, then copied the generated files to the pnpm virtualstore `node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client/`. This is a pnpm + Prisma monorepo setup issue. Future: add a `postinstall` script to `packages/db/package.json` that runs `prisma generate` automatically.
- **Files modified:** (pnpm virtualstore — not tracked in git)
- **Commit:** 77f2c6c

## Known Stubs

None. All 7 RPCs are fully implemented with real Prisma queries.

## Threat Flags

No new security surface introduced beyond what the plan's threat model covers. The gRPC port 5001 binds to `0.0.0.0` (T-02-01 accepted), and UpsertGraph runs in `db.$transaction` with JSON.parse wrapped by the transaction (T-02-02 mitigated by rollback on failure, T-02-03 mitigated by atomic delete+reinsert).

## Self-Check: PASSED

All 9 files created and exist on disk. All 3 task commits found in git history (7c5e3a1, 13a5fff, 77f2c6c).
