# VizTeckStack

## What This Is

VizTeckStack is an interactive roadmap visualization platform (similar to roadmap.sh) built as a polyglot monorepo. Admins create and manage learning roadmaps via a visual drag-and-drop canvas with rich-text lesson content. Public users browse and read roadmaps without registering.

The system uses a single NestJS API Gateway (GraphQL + REST) backed by a gRPC service that owns all PostgreSQL reads and writes. Future backend services (Python, Rust) communicate exclusively via gRPC without touching frontends.

## Core Value

Public users can browse and read any roadmap — any page must work without an admin session, and the admin canvas must always faithfully reflect what's in the database.

## Requirements

### Validated

- ✓ REQ-nfr-typescript-strict — TypeScript strict mode across all packages — Phase 1
- ✓ REQ-nfr-node-pnpm-versions — Node >= 20, pnpm >= 9 pinned — Phase 1

### Active

- [ ] REQ-grpc-service — svc-roadmap implements full RoadmapService gRPC contract
- [ ] REQ-rest-api — api-gateway exposes REST endpoints with Swagger docs
- [ ] REQ-graphql-api — api-gateway exposes GraphQL endpoint via Apollo Server
- [ ] REQ-public-roadmap-list — Public users browse all roadmaps at apps/web home
- [ ] REQ-public-roadmap-graph-view — Public users view roadmap as read-only graph canvas
- [ ] REQ-public-lesson-content-view — Public users read lesson content for LESSON nodes
- [ ] REQ-admin-login — Admin authenticates via token on /login page
- [ ] REQ-admin-roadmap-crud — Admin creates, updates, deletes roadmaps
- [ ] REQ-admin-graph-editor — Admin edits node/edge graph via drag-and-drop canvas
- [ ] REQ-admin-lesson-editor — Admin writes lesson content via BlockNote editor
- [ ] REQ-nfr-ssg-revalidation — Public pages statically generated, revalidated every 3600s

### Out of Scope

- User authentication or progress tracking — v1 has no user accounts (static admin token only)
- User-generated roadmaps — content is admin-only
- Comments or community features — read-only public experience
- Mobile app — web only
- Real-time collaboration on admin editor — single-user admin assumed
- svc-python, svc-rust — future services; README placeholders only in v1

## Context

Monorepo structure: `apps/*` and `packages/*` are pnpm workspace members. `services/*` (Python, Rust) are outside pnpm workspace and communicate only via gRPC — they share no JS imports.

Boot order: PostgreSQL (Docker Compose :5432) → svc-roadmap (gRPC :5001) → api-gateway (HTTP :3000) → apps/web (HTTP :3001) → apps/admin (HTTP :3002).

Seed data includes frontend, backend, and fullstack roadmaps with sample nodes.

Implementation plan with full step-by-step code:
`docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md`

## Constraints

- **Protocol**: gRPC/Protobuf for all inter-service communication; `packages/proto` is the only source of truth — types must not be duplicated
- **Database**: PostgreSQL 16 via Prisma 5; only `svc-roadmap` may access the DB directly
- **Dependency direction**: `apps/*` may import from `packages/*`; `packages/*` must NOT import from `apps/*`; `services/*` are fully independent
- **Environment variables**: DATABASE_URL, ROADMAP_SERVICE_URL (default localhost:5001), ADMIN_TOKEN (default supersecret), GRPC_PORT (default 5001), PORT (default 3000), NEXT_PUBLIC_API_URL (default http://localhost:3000)
- **TypeScript baseline**: ES2022 target, commonjs module, strict: true, experimentalDecorators + emitDecoratorMetadata for NestJS apps; Next.js apps override module/moduleResolution/jsx
- **Turbo pipeline**: build dependsOn ^build; dev persistent no-cache; proto:gen cached with .proto inputs

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DEC-001: Turborepo + pnpm workspaces monorepo | Enables polyglot backends while sharing TS types across JS packages | — Pending |
| DEC-002: Single api-gateway for all frontend traffic | Centralises auth, protocol translation, and observability; internal services not browser-exposed | — Pending |
| DEC-003: gRPC + Protobuf for internal communication | Stable cross-language boundary; codegen for TS (ts-proto), Python (grpcio-tools), Rust (tonic-build) | — Pending |
| DEC-004: PostgreSQL + Prisma, exclusively in svc-roadmap | Single DB owner; Prisma 5 ORM; connection via DATABASE_URL | — Pending |
| DEC-005: Static ADMIN_TOKEN auth, no user management | No user DB, sessions, or OAuth; all mutations require Bearer token | — Pending |
| DEC-006: React Flow canvas coordinates stored in DB | positionX/positionY in Node table; DB is authoritative source of layout | — Pending |
| DEC-007: BlockNote JSON for lesson content | Node.content is Prisma Json? field; only populated when type = LESSON | — Pending |
| DEC-008: apps/web uses SSG with revalidate: 3600 | Maximises SEO and load performance for public readers | — Pending |
| DEC-009: Shared RoadmapGraph with mode="view"\|"edit" | One component in packages/graph serves both public viewer and admin editor | — Pending |
| DEC-010: CreateRoadmap/UpdateRoadmap return RoadmapItem | Design spec said Roadmap; committed proto + implementation plan both use RoadmapItem (auto-resolved) | ✓ Good |

---
*Last updated: 2026-06-18 after new-project initialization*
