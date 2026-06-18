---
phase: 02-core-services
plan: 02
plan_id: 02-02
subsystem: api-gateway
tags: [nestjs, graphql, rest, swagger, grpc-client, apollo, adminGuard]
completed_date: "2026-06-18T00:00:00Z"
duration_minutes: 20
task_count: 3
file_count: 10

dependency_graph:
  requires:
    - apps/svc-roadmap (gRPC server on 0.0.0.0:5001 — plan 02-01)
    - packages/proto (generated/roadmap.ts — message types and RoadmapService contract)
  provides:
    - apps/api-gateway (HTTP server on :3000 with GraphQL, REST, Swagger)
  affects:
    - apps/web (plan 03-01 — will call GET /api/roadmaps, GET /api/roadmaps/:slug, GET /api/nodes/:id)
    - apps/admin (plan 04-01 — will call GraphQL mutations with Bearer token)

tech_stack:
  added:
    - "@nestjs/graphql@^12.1.0 — code-first GraphQL schema via @ObjectType/@Field decorators"
    - "@nestjs/apollo@^12.1.0 — Apollo Server 4 driver adapter for NestJS"
    - "@apollo/server@^4.10.0 — Apollo Server 4 HTTP handler"
    - "@nestjs/swagger@^7.3.0 — Swagger/OpenAPI docs via @ApiProperty decorators"
    - "ts-morph@^24.0.0 — required peer dep of @nestjs/graphql@12 for autoSchemaFile:true"
    - "@nestjs/microservices@^10.3.0 — @Client decorator for gRPC client"
    - "graphql@^16.8.0 — GraphQL runtime peer dep"
  patterns:
    - "GraphQLModule.forRoot ApolloDriver autoSchemaFile:true — code-first in-memory schema generation"
    - "AdminGuard dual HTTP/GraphQL context (Pattern 5): context.getType() === 'http' branch vs GqlExecutionContext"
    - "@Client Transport.GRPC with onModuleInit getService — wraps Observable via firstValueFrom"
    - "SwaggerModule.setup api-docs with addBearerAuth — auto-generated from @ApiProperty decorators"
    - "@UseGuards(AdminGuard) on all write resolvers and REST routes"

key_files:
  created:
    - apps/api-gateway/package.json
    - apps/api-gateway/tsconfig.json
    - apps/api-gateway/.env.example
    - apps/api-gateway/src/auth/admin.guard.ts
    - apps/api-gateway/src/roadmap/roadmap.grpc-client.ts
    - apps/api-gateway/src/roadmap/roadmap.dto.ts
    - apps/api-gateway/src/roadmap/roadmap.resolver.spec.ts
    - apps/api-gateway/src/roadmap/roadmap.resolver.ts
    - apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
    - apps/api-gateway/src/roadmap/roadmap.module.ts
    - apps/api-gateway/src/app.module.ts
    - apps/api-gateway/src/main.ts
  modified: []

decisions:
  - "Added ts-morph ^24.0.0 to devDependencies — required peer of @nestjs/graphql@12 for autoSchemaFile:true; omitting it causes startup crash Cannot find module 'ts-morph' (RESEARCH.md Pitfall 1)"
  - "Kept @nestjs/* at ^10.3.0 (not latest NestJS 11) — @nestjs/graphql@12 and @nestjs/swagger@7 are incompatible with NestJS 11 (RESEARCH.md Pitfall 2)"
  - "Used @Client decorator (soft-deprecated but functional in NestJS 10) — simpler than ClientsModule.register for this use case (RESEARCH.md Open Question 2)"
  - "autoSchemaFile: true (in-memory) rather than path-based — simpler, requires ts-morph peer dep"
---

# Phase 02 Plan 02: api-gateway GraphQL + REST + Swagger Summary

**One-liner:** NestJS 10 HTTP gateway on :3000 with Apollo Server 4 GraphQL (autoSchemaFile), REST endpoints, Swagger UI, and AdminGuard enforcing Bearer token on all write operations via dual HTTP/GraphQL context handling.

## What Was Built

`apps/api-gateway` — the single public HTTP boundary for VizTeckStack. It:

- Listens on `:3000` (configurable via `PORT`)
- Exposes `POST /graphql` — Apollo Server 4 playground + endpoint, code-first schema from @ObjectType/@Field decorators (autoSchemaFile: true)
- Exposes `GET|POST|PUT|DELETE /api/*` — REST endpoints with Swagger documentation
- Exposes `GET /api-docs` — Swagger UI with Bearer auth configured via `addBearerAuth()`
- Enforces admin auth via `AdminGuard` (DEC-005): reads `Authorization: Bearer` header in BOTH HTTP context and GraphQL execution context (dual-context Pattern 5)
- Forwards ALL data operations to svc-roadmap (plan 02-01) over gRPC via `RoadmapGrpcClient`; wraps gRPC Observables with `firstValueFrom` — NO direct DB access (DEC-004 compliant)
- Has `ts-morph ^24.0.0` in devDependencies to prevent startup crash with `autoSchemaFile: true` (RESEARCH.md Pitfall 1)

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Scaffold (package.json + ts-morph, tsconfig, env, AdminGuard) | 3607a5d | package.json, tsconfig.json, .env.example, src/auth/admin.guard.ts |
| 2 (RED) | Failing resolver spec | 759a5d7 | src/roadmap/roadmap.resolver.spec.ts |
| 2 (GREEN) | gRPC client, DTOs, resolver, REST controller | 9383f11 | roadmap.grpc-client.ts, roadmap.dto.ts, roadmap.resolver.ts, roadmap.rest.controller.ts |
| 3 | Wire modules + main.ts — build clean | 1d52b22 | roadmap.module.ts, app.module.ts, main.ts |

## Verification Results

1. `pnpm test` (from apps/api-gateway) — **2 tests pass**
   - `roadmaps() returns array`
   - `roadmap(slug) returns detail`
2. `pnpm build` (nest build) — **zero TypeScript errors**, `dist/main.js` produced
3. `package.json devDependencies` includes `"ts-morph": "^24.0.0"` — confirms no startup crash for `autoSchemaFile: true`
4. `@vizteck/db` NOT imported anywhere in api-gateway — DEC-004 compliant (verified via grep)
5. `AdminGuard` handles both `context.getType() === 'http'` and `GqlExecutionContext` branches — T-02-06 mitigated
6. All 4 admin mutations decorated with `@UseGuards(AdminGuard)` — T-02-04 mitigated
7. `AdminGuard` reads only `Authorization` header, never query param — T-02-05 mitigated

## TDD Gate Compliance

- RED gate: commit `759a5d7` — `test(02-02): add failing resolver spec`
- GREEN gate: commit `9383f11` — `feat(02-02): implement gRPC client, DTOs, resolver, and REST controller (GREEN)`
- REFACTOR: not required (code was clean from implementation plan)

## Deviations from Plan

None — plan executed exactly as written. The critical addition (ts-morph devDep) was already called out as a required fix in the PLAN.md interfaces section and RESEARCH.md Pitfall 1; it was incorporated from the start, not a deviation.

## Known Stubs

None. All gRPC client methods are wired to real svc-roadmap calls. All REST and GraphQL endpoints are fully implemented. No placeholder data, no hardcoded values flowing to consumers.

## Threat Flags

No new security surface beyond what the plan's threat model covers. The threat register mitigations were all applied:

- T-02-04 (Elevation of Privilege): `@UseGuards(AdminGuard)` on all 4 mutations and all 4 admin REST routes
- T-02-05 (Information Disclosure): AdminGuard reads only `Authorization` header; no query param path exists
- T-02-06 (Spoofing): Guard branches on `context.getType()`: `'http'` → `switchToHttp`, else `GqlExecutionContext.create(context).getContext().req`
- T-02-07 (DoS — accept): `process.env.ROADMAP_SERVICE_URL ?? 'localhost:5001'` fallback documented in `.env.example`
- T-02-SC (Tampering — mitigate): all deps are official NestJS/Apollo ecosystem; ts-morph is the published @nestjs/graphql peer (RESEARCH.md Package Legitimacy Audit: Approved)

## Self-Check: PASSED

All files created and exist on disk. All 4 commits found in git history (3607a5d, 759a5d7, 9383f11, 1d52b22). `pnpm test` passes 2/2. `pnpm build` produces `dist/main.js`. No `@vizteck/db` imports in api-gateway.
