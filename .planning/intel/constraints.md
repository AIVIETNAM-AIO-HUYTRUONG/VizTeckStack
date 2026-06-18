# Technical Constraints

Extracted from: 2 SPEC documents
Types: api-contract, schema, nfr, protocol

---

## CON-001 — gRPC Proto Contract (api-contract)

source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
source: packages/proto/roadmap.proto (committed, verified)
type: api-contract

The canonical gRPC service contract for RoadmapService. This is the authoritative interface between api-gateway and all backend services.

```
service RoadmapService {
  rpc GetRoadmaps   (Empty)               returns (RoadmapList);
  rpc GetRoadmap    (SlugRequest)          returns (RoadmapDetail);
  rpc GetNode       (IdRequest)            returns (NodeDetail);
  rpc CreateRoadmap (CreateRoadmapRequest) returns (RoadmapItem);
  rpc UpdateRoadmap (UpdateRoadmapRequest) returns (RoadmapItem);
  rpc DeleteRoadmap (IdRequest)            returns (BoolResponse);
  rpc UpsertGraph   (UpsertGraphRequest)   returns (RoadmapDetail);
}
```

Note: CreateRoadmap and UpdateRoadmap return RoadmapItem (not Roadmap). This is the committed form on disk. See DEC-010 in decisions.md.

---

## CON-002 — Prisma Database Schema (schema)

source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
source: packages/db/prisma/schema.prisma (committed, verified)
type: schema

Canonical data model. Three models: Roadmap, Node, Edge. One enum: NodeType.

Key constraints:
- Roadmap.slug is UNIQUE
- Node.roadmapId has onDelete: Cascade (delete roadmap deletes its nodes)
- Edge.sourceId and Edge.targetId both have onDelete: Cascade
- Node.content is Json? — only populated when type = LESSON
- Node.positionX, Node.positionY are Float (React Flow coordinates)
- Node.targetRoadmapId is optional FK to Roadmap — only used when type = ROADMAP

---

## CON-003 — GraphQL Schema Contract (api-contract)

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
type: api-contract

Public GraphQL API surface exposed by api-gateway:

Queries: roadmaps, roadmap(slug: String!), node(id: ID!)
Mutations (admin-gated): createRoadmap(input), updateRoadmap(id, input), deleteRoadmap(id), upsertGraph(roadmapId, nodes, edges)

Types: Roadmap, Node, Edge, RoadmapDetail, NodeType enum
Admin mutations require Authorization: Bearer <ADMIN_TOKEN>

---

## CON-004 — REST API Contract (api-contract)

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
type: api-contract

Public endpoints:
  GET  /api/roadmaps
  GET  /api/roadmaps/:slug
  GET  /api/nodes/:id

Admin endpoints (require Bearer token):
  POST   /api/roadmaps
  PUT    /api/roadmaps/:id
  DELETE /api/roadmaps/:id
  POST   /api/roadmaps/:id/graph

Swagger UI at /api-docs

---

## CON-005 — Dependency Direction Rule (nfr)

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
type: nfr

apps/* may import from packages/*
packages/* must NOT import from apps/*
services/* are fully independent — communicate only via gRPC, never via JS imports

---

## CON-006 — Environment Variables Contract (nfr)

source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
type: nfr

Required env vars:
  DATABASE_URL          — PostgreSQL connection string (packages/db, apps/svc-roadmap)
  ROADMAP_SERVICE_URL   — gRPC address, default: localhost:5001 (apps/api-gateway)
  ADMIN_TOKEN           — Static admin token, default: supersecret (apps/api-gateway)
  GRPC_PORT             — gRPC listen port, default: 5001 (apps/svc-roadmap)
  PORT                  — HTTP listen port, default: 3000 (apps/api-gateway)
  NEXT_PUBLIC_API_URL   — API base URL, default: http://localhost:3000 (apps/web, apps/admin)

---

## CON-007 — Service Port Assignments (protocol)

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
type: protocol

  svc-roadmap  gRPC  :5001
  api-gateway  HTTP  :3000  (/graphql, /api/*, /api-docs)
  apps/web     HTTP  :3001
  apps/admin   HTTP  :3002
  PostgreSQL   TCP   :5432 (Docker Compose)

---

## CON-008 — Proto Codegen Toolchain (protocol)

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
type: protocol

TypeScript generation: ts-proto with --ts_proto_opt=nestJs=true
Python generation: grpcio-tools (svc-python, future)
Rust generation: tonic-build (svc-rust, future)
Generated output: packages/proto/generated/ (gitignored, cache-enabled in Turborepo)
Script: packages/proto/generate.sh (bash, run via pnpm proto:gen)

---

## CON-009 — Turbo Task Pipeline (nfr)

source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
type: nfr

build:      dependsOn ["^build"], outputs [".next/**", "dist/**"]
dev:        persistent: true, cache: false
test:       dependsOn ["^build"]
lint:       no deps
proto:gen:  inputs ["packages/proto/**/*.proto"], outputs ["packages/proto/generated/**"], cache: true

---

## CON-010 — TypeScript Compiler Baseline (nfr)

source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md
type: nfr

tsconfig.base.json settings that all packages must inherit:
  target: ES2022
  module: commonjs
  moduleResolution: node
  strict: true
  esModuleInterop: true
  skipLibCheck: true
  forceConsistentCasingInFileNames: true
  declaration: true, declarationMap: true, sourceMap: true

NestJS apps additionally require:
  experimentalDecorators: true
  emitDecoratorMetadata: true

Next.js apps override:
  target: ES2017, module: esnext, moduleResolution: bundler, jsx: preserve
