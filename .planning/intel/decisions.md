# Architectural Decisions

Extracted from: 2 SPEC documents (high confidence)
Precedence applied: SPEC = SPEC (same tier; no ADR docs present)

---

## DEC-001 — Polyglot Monorepo via Turborepo + pnpm

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
status: Approved (non-locked)
scope: repository structure

Decision: The project uses a Turborepo + pnpm workspaces monorepo. `apps/*` and `packages/*` are pnpm workspace members. `services/*` (Python, Rust) are outside the pnpm workspace and communicate only via gRPC.

Rationale: Enables polyglot backends (NestJS, FastAPI, Axum) while sharing TypeScript types and tooling across JS packages.

---

## DEC-002 — Single API Gateway Pattern

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
status: Approved (non-locked)
scope: network topology

Decision: All frontend traffic (GraphQL and REST) routes through a single `apps/api-gateway` (NestJS + Apollo). Frontends do NOT call backend services directly.

Rationale: Centralises auth, protocol translation, and observability. Internal services are not exposed to the browser.

---

## DEC-003 — gRPC/Protobuf for Internal Service Communication

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
status: Approved (non-locked)
scope: internal service protocol

Decision: All inter-service communication uses gRPC + Protobuf. `packages/proto` is the single source of truth for all gRPC contracts. Types must not be duplicated elsewhere.

Codegen targets:
- TypeScript: ts-proto (api-gateway, svc-roadmap)
- Python: grpcio-tools (svc-python)
- Rust: tonic-build (svc-rust)

---

## DEC-004 — PostgreSQL as Primary Datastore via Prisma ORM

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
status: Approved (non-locked)
scope: primary datastore

Decision: PostgreSQL 16 is the only database. Prisma 5 is the ORM, accessed exclusively from `svc-roadmap`. Connection string provided via `DATABASE_URL` env var.

---

## DEC-005 — Static Admin Auth (Bearer Token, No User Management)

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
status: Approved (non-locked)
scope: authentication model

Decision: Admin authentication uses a single static `ADMIN_TOKEN` env var (default `supersecret` locally). All mutation/write operations require `Authorization: Bearer <token>`. No user database, sessions, or OAuth.

---

## DEC-006 — React Flow Canvas Coordinates Persisted to DB

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
status: Approved (non-locked)
scope: data model / frontend coupling

Decision: `Node.positionX` and `Node.positionY` store React Flow canvas coordinates directly in PostgreSQL. The DB is the authoritative source of node layout.

---

## DEC-007 — BlockNote JSON for Lesson Content

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
status: Approved (non-locked)
scope: content storage format

Decision: Lesson node content is stored as BlockNote JSON in `Node.content` (Prisma `Json?` field). This field is only populated when `Node.type = LESSON`.

---

## DEC-008 — apps/web Uses SSG (Static Site Generation)

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
status: Approved (non-locked)
scope: apps/web rendering strategy

Decision: `apps/web` pages are statically generated at build time (Next.js 15 SSG with `revalidate: 3600`). This maximises SEO and load performance for public readers.

---

## DEC-009 — Shared RoadmapGraph Component with mode="view"|"edit"

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
status: Approved (non-locked)
scope: packages/graph

Decision: A single `<RoadmapGraph>` component in `packages/graph` serves both the public viewer (read-only, `mode="view"`) and the admin editor (interactive, `mode="edit"`). The component is shared via `@vizteck/graph` workspace package.

---

## DEC-010 — Proto Return Type Divergence: CreateRoadmap/UpdateRoadmap

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
status: RESOLVED by implementation (see INFO in conflicts report)
scope: packages/proto — RoadmapService

Design spec declares:
  rpc CreateRoadmap returns (Roadmap)
  rpc UpdateRoadmap returns (Roadmap)

Implementation plan and committed roadmap.proto declare:
  rpc CreateRoadmap returns (RoadmapItem)
  rpc UpdateRoadmap returns (RoadmapItem)

The committed `packages/proto/roadmap.proto` file uses `RoadmapItem`. Implementation plan is consistent with committed file. Design spec used an informal `Roadmap` shorthand. Auto-resolved: implementation plan + committed file win (both SPECs; implementation is more detailed and already materialised on disk).
