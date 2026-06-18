# Roadmap: VizTeckStack

## Overview

VizTeckStack ships in four phases. Phase 1 (monorepo foundation, gRPC contract, Prisma schema) is already committed. Phase 2 delivers the running data pipeline (gRPC service + API gateway). Phase 3 adds the shared UI/graph packages and the public viewer. Phase 4 completes the admin CMS with login, CRUD, graph editor, and lesson editor — the full platform is live at that point.

## Phases

- [x] **Phase 1: Foundation** - Monorepo scaffold, gRPC contract (packages/proto), Prisma schema + seed (packages/db)
- [x] **Phase 2: Core Services** - svc-roadmap gRPC server and api-gateway (GraphQL + REST) — data pipeline end-to-end (completed 2026-06-18)
- [ ] **Phase 3: Public Viewer** - Shared packages (UI + graph) and apps/web SSG — public roadmap browsing live
- [ ] **Phase 4: Admin CMS** - apps/admin with login, roadmap CRUD, graph editor, lesson editor — full platform

## Phase Details

### Phase 1: Foundation

**Goal**: Monorepo infrastructure, shared contracts, and seed data are committed and buildable
**Depends on**: Nothing (first phase)
**Requirements**: REQ-nfr-typescript-strict, REQ-nfr-node-pnpm-versions
**Success Criteria** (what must be TRUE):

  1. `pnpm install && pnpm build` succeeds from repo root with zero TypeScript errors
  2. packages/proto exports RoadmapServiceClient, RoadmapServiceController, and all message types
  3. packages/db Prisma schema migrates cleanly and seed script inserts sample roadmaps

**Plans**: 3 plans (complete)

Plans:

- [x] 01-01: Monorepo scaffold — Turborepo + pnpm workspaces, tsconfig.base.json, turbo.json pipeline
- [x] 01-02: packages/proto — roadmap.proto, ts-proto codegen, generated stubs
- [x] 01-03: packages/db — Prisma schema (Roadmap, Node, Edge, NodeType), seed data

### Phase 2: Core Services

**Goal**: The data pipeline runs — svc-roadmap serves gRPC and api-gateway exposes GraphQL + REST to clients
**Depends on**: Phase 1
**Requirements**: REQ-grpc-service, REQ-rest-api, REQ-graphql-api
**Success Criteria** (what must be TRUE):

  1. `curl http://localhost:3000/api/roadmaps` returns the seeded roadmap list as JSON
  2. POST /graphql with `{ roadmaps { id title } }` query returns data
  3. GET /api-docs serves Swagger UI with all endpoints documented
  4. POST /api/roadmaps with a valid Bearer token creates a roadmap; without a token returns 401
  5. svc-roadmap UpsertGraph runs atomically — partial graph saves never leave orphaned nodes

**Plans**: 2 plans

Plans:

- [x] 02-01: apps/svc-roadmap — NestJS gRPC server, RoadmapService implementation, Prisma integration
- [x] 02-02: apps/api-gateway — NestJS HTTP server, AdminGuard, REST controllers, Apollo GraphQL, gRPC client wiring

### Phase 3: Public Viewer

**Goal**: Public users can browse roadmaps and read lesson content on apps/web without any auth
**Depends on**: Phase 2
**Requirements**: REQ-public-roadmap-list, REQ-public-roadmap-graph-view, REQ-public-lesson-content-view, REQ-nfr-ssg-revalidation
**Success Criteria** (what must be TRUE):

  1. apps/web home page (/) shows a card for each seeded roadmap with no login required
  2. /roadmap/[slug] renders the roadmap graph read-only — nodes are not draggable
  3. Clicking a LESSON node navigates to /roadmap/[slug]/node/[id] and shows rendered lesson text
  4. Pages build statically (`next build` succeeds without a live api-gateway) and carry revalidate: 3600

**Plans**: 3 plans

Plans:

- [ ] 03-01-PLAN.md — packages/ui: NodeBadge, Button, Card shared components (@vizteck/ui)
- [ ] 03-02-PLAN.md — packages/graph: RoadmapGraph (mode="view"|"edit") + RoadmapNode (@vizteck/graph)
- [ ] 03-03-PLAN.md — apps/web: Next.js 16 SSG viewer (home / [slug] / node/[id]), BlockNote lesson reader

**UI hint**: yes

### Phase 4: Admin CMS

**Goal**: An authenticated admin can manage all roadmap content through apps/admin — login, CRUD, graph editor, lesson editor
**Depends on**: Phase 3
**Requirements**: REQ-admin-login, REQ-admin-roadmap-crud, REQ-admin-graph-editor, REQ-admin-lesson-editor
**Success Criteria** (what must be TRUE):

  1. Admin submits correct token on /login and is redirected to /roadmaps; wrong token shows "Invalid token"
  2. Admin creates a new roadmap from /roadmaps — it appears on the public apps/web home after revalidation
  3. Admin drags nodes on /roadmaps/[id] canvas, clicks Save Graph, and positions persist across page reloads
  4. Admin opens a LESSON node, types rich text in BlockNote editor, saves, and the content appears on the public lesson page
  5. Admin deletes a roadmap — it is removed from the DB and no longer returned by GET /api/roadmaps

**Plans**: TBD

Plans:

- [ ] 04-01: apps/admin — Next.js app shell, /login page, token localStorage flow, /roadmaps list + CRUD
- [ ] 04-02: apps/admin — /roadmaps/[id] graph editor (RoadmapGraph mode="edit"), Save Graph wiring
- [ ] 04-03: apps/admin — /roadmaps/[id]/nodes/[nodeId] lesson editor (BlockNote, client-side only)

**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-06-18 |
| 2. Core Services | 2/2 | Complete   | 2026-06-18 |
| 3. Public Viewer | 0/3 | Planned | - |
| 4. Admin CMS | 0/3 | Not started | - |
