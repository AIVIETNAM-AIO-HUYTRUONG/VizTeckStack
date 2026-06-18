# Requirements: VizTeckStack

Source: docs/superpowers/specs/2026-06-18-vizteckstack-design.md + docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md

---

## Functional Requirements

### REQ-grpc-service

**Scope**: apps/svc-roadmap
**Type**: functional

svc-roadmap implements the full RoadmapService gRPC contract and is the only service that reads/writes PostgreSQL.

Acceptance criteria:

- Implements: GetRoadmaps, GetRoadmap, GetNode, CreateRoadmap, UpdateRoadmap, DeleteRoadmap, UpsertGraph
- Listens on 0.0.0.0:5001 (configurable via GRPC_PORT env var)
- UpsertGraph executes atomically in a Prisma transaction (delete then insert)
- All Prisma queries run through the singleton db client from @vizteck/db

---

### REQ-rest-api

**Scope**: apps/api-gateway
**Type**: functional

api-gateway exposes REST endpoints documented via Swagger.

Acceptance criteria:

- Public: GET /api/roadmaps, GET /api/roadmaps/:slug, GET /api/nodes/:id
- Admin (Bearer token): POST /api/roadmaps, PUT /api/roadmaps/:id, DELETE /api/roadmaps/:id, POST /api/roadmaps/:id/graph
- GET /api-docs serves Swagger UI with Bearer auth configured

---

### REQ-graphql-api

**Scope**: apps/api-gateway
**Type**: functional

api-gateway exposes a GraphQL endpoint via Apollo Server.

Acceptance criteria:

- POST /graphql serves Apollo Server with playground enabled
- Queries: roadmaps, roadmap(slug), node(id)
- Mutations: createRoadmap, updateRoadmap, deleteRoadmap, upsertGraph — all require AdminGuard
- GraphQL schema auto-generated from NestJS decorators (autoSchemaFile: true)

---

### REQ-public-roadmap-list

**Scope**: apps/web + api-gateway
**Type**: functional

Public users can browse a list of all roadmaps without authentication. Served at apps/web home page (/).

Acceptance criteria:

- GET /api/roadmaps returns JSON list of roadmaps (id, slug, title, description, coverImage)
- apps/web home page renders roadmap cards using SSG, revalidates every 3600 seconds
- No auth required

---

### REQ-public-roadmap-graph-view

**Scope**: apps/web + api-gateway + packages/graph
**Type**: functional

Public users can view a roadmap as an interactive (read-only) graph canvas.

Acceptance criteria:

- GET /api/roadmaps/:slug returns roadmap detail with nodes and edges
- apps/web /roadmap/[slug] renders `<RoadmapGraph mode="view" />`
- Nodes are not draggable in view mode
- Clicking a ROADMAP-type node navigates to the target roadmap
- Clicking a LESSON-type node navigates to /roadmap/[slug]/node/[id]

---

### REQ-public-lesson-content-view

**Scope**: apps/web + api-gateway
**Type**: functional

Public users can read lesson content for LESSON-type nodes.

Acceptance criteria:

- GET /api/nodes/:id returns node detail including BlockNote JSON content
- apps/web /roadmap/[slug]/node/[id] renders lesson content
- Content is rendered as readable text (not raw JSON)

---

### REQ-admin-login

**Scope**: apps/admin
**Type**: functional

Admin authenticates by submitting a token on the login page. Token is stored in localStorage.

Acceptance criteria:

- /login page accepts a password/token input
- Submitting validates the token by hitting GET /api/roadmaps with the token as Bearer
- 401 response shows "Invalid token" error
- Successful validation stores token in localStorage and redirects to /roadmaps

---

### REQ-admin-roadmap-crud

**Scope**: apps/admin + api-gateway + svc-roadmap
**Type**: functional

Authenticated admin can create, update, and delete roadmaps.

Acceptance criteria:

- POST /api/roadmaps (admin) creates a new roadmap with slug, title, description, coverImage
- PUT /api/roadmaps/:id (admin) updates roadmap metadata
- DELETE /api/roadmaps/:id (admin) deletes roadmap
- All write operations require Authorization: Bearer <ADMIN_TOKEN> header
- 401 Unauthorized returned for missing or invalid token

---

### REQ-admin-graph-editor

**Scope**: apps/admin + packages/graph
**Type**: functional

Authenticated admin can visually edit the node/edge graph of a roadmap via drag-and-drop canvas.

Acceptance criteria:

- apps/admin /roadmaps/[id] renders `<RoadmapGraph mode="edit" />`
- Nodes are draggable; edges can be created by connecting handles
- Save Graph button triggers POST /api/roadmaps/:id/graph with full node + edge state (upsert)
- Node positions (positionX, positionY) are persisted to DB

---

### REQ-admin-lesson-editor

**Scope**: apps/admin + BlockNote
**Type**: functional

Authenticated admin can write and edit rich-text content for LESSON-type nodes using a BlockNote editor.

Acceptance criteria:

- apps/admin /roadmaps/[id]/nodes/[nodeId] renders LessonEditor (BlockNote)
- Editor initialises with existing content if present
- Save Lesson triggers upsertGraph with updated content field serialised as JSON string
- Editor is loaded client-side only (ssr: false) to avoid SSR incompatibility

---

## Non-Functional Requirements

### REQ-nfr-typescript-strict

**Scope**: all packages and apps
**Type**: non-functional

All TypeScript packages and apps must run in strict mode.

Acceptance criteria:

- tsconfig.base.json has "strict": true
- All packages extend tsconfig.base.json
- No TypeScript strict errors at build time

---

### REQ-nfr-node-pnpm-versions

**Scope**: development environment
**Type**: non-functional

Runtime and package manager versions are pinned as minimum requirements.

Acceptance criteria:

- Node.js >= 20.0.0
- pnpm >= 9.0.0

---

### REQ-nfr-ssg-revalidation

**Scope**: apps/web
**Type**: non-functional

Public pages must be statically generated and revalidated on a schedule.

Acceptance criteria:

- All data-fetching pages use next: { revalidate: 3600 } or export const revalidate = 3600
- Pages render without a running api-gateway after build (static)

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-nfr-typescript-strict | Phase 1 | Complete |
| REQ-nfr-node-pnpm-versions | Phase 1 | Complete |
| REQ-grpc-service | Phase 2 | Pending |
| REQ-rest-api | Phase 2 | Complete |
| REQ-graphql-api | Phase 2 | Complete |
| REQ-public-roadmap-list | Phase 3 | Pending |
| REQ-public-roadmap-graph-view | Phase 3 | Pending |
| REQ-public-lesson-content-view | Phase 3 | Pending |
| REQ-admin-login | Phase 4 | Pending |
| REQ-admin-roadmap-crud | Phase 4 | Pending |
| REQ-admin-graph-editor | Phase 4 | Pending |
| REQ-admin-lesson-editor | Phase 4 | Pending |
| REQ-nfr-ssg-revalidation | Phase 3 | Pending |
