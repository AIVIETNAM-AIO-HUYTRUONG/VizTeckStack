# Synthesis Summary

Entry point for gsd-roadmapper and downstream consumers.

---

## Document Counts

Total documents ingested: 2
By type:
  SPEC: 2 (both high confidence, manifest_override: true)
  ADR:  0
  PRD:  0
  DOC:  0

Sources:
  docs/superpowers/specs/2026-06-18-vizteckstack-design.md
  docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md

---

## Decisions

Count: 10 (DEC-001 through DEC-010)
Locked decisions: 0
Source file: .planning/intel/decisions.md

Key decisions: polyglot Turborepo monorepo, single API gateway, gRPC internal protocol, PostgreSQL+Prisma datastore, static admin token auth, React Flow positions persisted to DB, BlockNote JSON content storage, SSG for public viewer, shared RoadmapGraph with mode prop, proto return type resolved as RoadmapItem.

---

## Requirements

Count: 13
Functional: 10 (REQ-public-roadmap-list, REQ-public-roadmap-graph-view, REQ-public-lesson-content-view, REQ-admin-roadmap-crud, REQ-admin-graph-editor, REQ-admin-lesson-editor, REQ-admin-login, REQ-graphql-api, REQ-rest-api, REQ-grpc-service)
Non-functional: 3 (REQ-nfr-typescript-strict, REQ-nfr-node-pnpm-versions, REQ-nfr-ssg-revalidation)
Source file: .planning/intel/requirements.md

---

## Constraints

Count: 10 (CON-001 through CON-010)
Type breakdown:
  api-contract: 3 (gRPC proto, GraphQL schema, REST endpoints)
  schema:       1 (Prisma data model)
  nfr:          4 (dependency direction, env vars, Turbo pipeline, TypeScript baseline)
  protocol:     2 (port assignments, proto codegen toolchain)

Source file: .planning/intel/constraints.md

---

## Context Topics

Count: 7
Topics: project purpose, current implementation state, architecture philosophy, user flows, future services, out-of-scope items, local dev workflow + shared package contracts
Source file: .planning/intel/context.md

---

## Conflicts

Blockers:          0
Competing variants: 0
Auto-resolved:     2

Conflict detail: .planning/INGEST-CONFLICTS.md

---

## Implementation State (relevant for roadmapper)

Phase 1 tasks completed (committed to git):
  Task 1 — Monorepo scaffold
  Task 2 — packages/proto (gRPC contract)
  Task 3 — packages/db (Prisma schema + seed)

Phase 2-4 tasks remaining (not yet committed):
  Task 4 — apps/svc-roadmap (NestJS gRPC service)
  Task 5 — apps/api-gateway (GraphQL + REST + Swagger)
  Task 6 — packages/ui (shared React components)
  Task 7 — packages/graph (React Flow component)
  Task 8 — apps/web (public SSG viewer)
  Task 9 — apps/admin (CMS + graph editor + lesson editor)

Implementation plan with full step-by-step code: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md

---

## Per-Type Intel Files

.planning/intel/decisions.md    — 10 architectural decisions
.planning/intel/requirements.md — 13 requirements (10 functional, 3 NFR)
.planning/intel/constraints.md  — 10 constraints (api-contract, schema, nfr, protocol)
.planning/intel/context.md      — 7 context topics

---

## Status

STATUS: READY — safe to route. No blockers, no competing variants requiring user resolution.
