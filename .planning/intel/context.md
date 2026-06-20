# Background Context

Extracted from: 2 SPEC documents (design spec + implementation plan)

---

## Topic: Project Purpose

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md

VizTeckStack is an interactive roadmap visualization platform similar to roadmap.sh. Admins create and manage roadmaps via a visual canvas editor. Public users browse and read content without registering.

The system is built as a polyglot monorepo — supporting multiple backend languages from the start, with internal communication via gRPC/Protobuf. Frontends interact with a single API Gateway via GraphQL and REST.

---

## Topic: Current Implementation State

source: git history (commits as of 2026-06-18)

Commits completed:
- chore: initialize monorepo with Turborepo and pnpm workspaces
- feat: add proto package with RoadmapService gRPC contract
- feat: add db package with Prisma schema and seed data

Committed artifacts verified against spec:
- packages/proto/roadmap.proto — matches implementation plan exactly
- packages/db/prisma/schema.prisma — matches implementation plan exactly (includes onDelete: Cascade not in design spec abstract)

Remaining work (not yet committed): Tasks 4-9 of the implementation plan (svc-roadmap, api-gateway, packages/ui, packages/graph, apps/web, apps/admin).

---

## Topic: Architecture Philosophy

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md

Polyglot from day one: The architecture deliberately allows swapping or adding backend services in any language (Node.js, Python, Rust) without touching frontends or the gateway. gRPC contracts enforce a stable boundary.

Single gateway: One NestJS process handles all external traffic. It translates between GraphQL/REST and gRPC internally. This keeps frontends simple and keeps backend services free of HTTP concerns.

---

## Topic: User Flows

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md

Public user flow:
  apps/web queries GraphQL or REST
  → api-gateway forwards via gRPC
  → svc-roadmap queries PostgreSQL
  → returns data up the chain

Admin user flow:
  apps/admin sends mutation/POST with admin Bearer token
  → api-gateway verifies token via AdminGuard
  → forwards gRPC to svc-roadmap
  → writes to PostgreSQL

---

## Topic: Future Services (Out of Current Scope)

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md

svc-python (services/svc-python): Python FastAPI + grpcio. Intended for AI/search features. Not part of current implementation. README placeholder only.

svc-rust (services/svc-rust): Rust Axum + tonic. Intended for performance-critical operations. Not part of current implementation. README placeholder only.

---

## Topic: Out of Scope for This Build

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md

The following are explicitly excluded from VizTeckStack v1:
- User authentication or progress tracking
- User-generated roadmaps
- Comments or community features
- Mobile app
- Real-time collaboration on the admin editor

---

## Topic: Local Development Workflow

source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md
source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md

Boot order:
1. PostgreSQL via Docker Compose (docker compose up -d postgres)
2. proto:gen — generate TypeScript from .proto files
3. svc-roadmap — gRPC server :5001
4. api-gateway — :3000
5. apps/web — :3001
6. apps/admin — :3002

Top-level command: pnpm dev (runs all via Turborepo)

Seed data includes: frontend, backend, and fullstack roadmaps with sample nodes.

---

## Topic: Shared Package Contracts

source: docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md

@vizteck/proto  — exports RoadmapServiceClient, RoadmapServiceController, all message types
@vizteck/db     — exports db (PrismaClient singleton), Roadmap, Node, Edge, NodeType types
@vizteck/ui     — exports Button, Card, NodeBadge (React components)
@vizteck/graph  — exports RoadmapGraph component, GraphNode, GraphEdge, RoadmapGraphProps types
