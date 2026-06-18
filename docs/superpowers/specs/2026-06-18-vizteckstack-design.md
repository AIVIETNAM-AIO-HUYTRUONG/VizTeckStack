# VizTeckStack — Design Spec

**Date:** 2026-06-18  
**Status:** Approved

---

## Overview

VizTeckStack là nền tảng visualization tech stack dạng interactive roadmap, tương tự [roadmap.sh](https://roadmap.sh/). Admin tạo và quản lý roadmap qua visual canvas editor. Public user browse và đọc nội dung không cần đăng ký.

Hệ thống được xây dựng theo kiến trúc **polyglot monorepo** — hỗ trợ nhiều ngôn ngữ backend ngay từ đầu, giao tiếp nội bộ qua **gRPC/Protobuf**. Frontend tương tác với một API Gateway duy nhất qua **GraphQL** và **REST**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  Browser                    │
│         apps/web      apps/admin            │
└──────────────┬──────────────┬───────────────┘
               │ GraphQL       │ REST + GraphQL
               └──────┬────────┘
                       ▼
┌──────────────────────────────────────────────┐
│      apps/api-gateway (NestJS + Apollo)      │
│   /graphql  ← Apollo Server                  │
│   /api/*    ← REST Controllers               │
│   /api-docs ← Swagger UI                     │
│   Resolvers + Controllers → gRPC clients     │
│   Admin auth middleware (mutations/writes)   │
└──────┬──────────────┬──────────────┬─────────┘
       │ gRPC          │ gRPC          │ gRPC
       ▼               ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────────┐
│svc-road  │    │svc-python│    │ svc-rust/... │
│map(Nest) │    │(FastAPI) │    │ (future)     │
│+Prisma   │    │AI/Search │    │              │
└──────────┘    └──────────┘    └──────────────┘
       │
       ▼
┌──────────┐
│PostgreSQL│
└──────────┘
```

**Luồng public user:**
1. `apps/web` query GraphQL hoặc REST → `api-gateway`
2. Gateway forward gRPC → `svc-roadmap`
3. `svc-roadmap` truy vấn PostgreSQL → trả về data

**Luồng admin:**
1. `apps/admin` gửi mutation/POST với admin token
2. Gateway verify token → forward gRPC → `svc-roadmap`
3. Save changes → PostgreSQL

---

## Monorepo Structure

```
VizTeckStack/
├── apps/
│   ├── web/                  ← Next.js 15 (public viewer, SSG)
│   ├── admin/                ← Next.js 15 (CMS + graph editor)
│   ├── api-gateway/          ← NestJS (GraphQL + REST + Swagger)
│   └── svc-roadmap/          ← NestJS + Prisma (core gRPC service)
├── services/                 ← non-JS backends (ngoài pnpm workspace)
│   ├── svc-python/           ← Python FastAPI (AI/search, future)
│   └── svc-rust/             ← Rust Axum (performance, future)
├── packages/
│   ├── proto/                ← .proto files + generated code (source of truth)
│   ├── ui/                   ← shared React components
│   ├── graph/                ← React Flow custom nodes/edges
│   └── db/                   ← Prisma schema + generated client
├── turbo.json
├── pnpm-workspace.yaml       ← chỉ bao gồm apps/* và packages/*
└── docker-compose.yml        ← PostgreSQL + local services
```

**Dependency rules:**
- `apps/*` có thể import từ `packages/*`
- `packages/*` không được import từ `apps/*`
- `services/*` hoàn toàn độc lập, chỉ giao tiếp qua gRPC

---

## Data Model (Prisma)

```prisma
model Roadmap {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  description     String?
  coverImage      String?
  nodes           Node[]   @relation("RoadmapNodes")
  targetedByNodes Node[]   @relation("NodeTarget")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Node {
  id              String   @id @default(cuid())
  roadmapId       String
  roadmap         Roadmap  @relation("RoadmapNodes", fields: [roadmapId], references: [id])
  type            NodeType
  title           String
  positionX       Float
  positionY       Float
  targetRoadmapId String?
  targetRoadmap   Roadmap? @relation("NodeTarget", fields: [targetRoadmapId], references: [id])
  content         Json?    // BlockNote JSON (chỉ khi type = LESSON)
  edges           Edge[]   @relation("EdgeSource")
  edgesTarget     Edge[]   @relation("EdgeTarget")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Edge {
  id       String @id @default(cuid())
  sourceId String
  targetId String
  source   Node   @relation("EdgeSource", fields: [sourceId], references: [id])
  target   Node   @relation("EdgeTarget", fields: [targetId], references: [id])
  label    String?
}

enum NodeType {
  ROADMAP
  LESSON
}
```

**Điểm quan trọng:**
- `Node.positionX/Y` — tọa độ canvas React Flow, lưu trực tiếp vào DB
- `Node.content` — BlockNote JSON format, chỉ có giá trị khi `type = LESSON`
- `Node.targetRoadmapId` — liên kết node:ROADMAP tới roadmap đích
- `Edge` — connection giữa các nodes trong cùng 1 roadmap

---

## API Design

### GraphQL Schema (api-gateway)

```graphql
type Roadmap {
  id          String
  slug        String
  title       String
  description String
  coverImage  String
  nodes       [Node!]!
  edges       [Edge!]!
}

type Node {
  id            String
  type          NodeType
  title         String
  positionX     Float
  positionY     Float
  targetRoadmap Roadmap
  content       JSON
}

type Edge {
  id     String
  source Node
  target Node
  label  String
}

enum NodeType { ROADMAP LESSON }

type Query {
  roadmaps: [Roadmap!]!
  roadmap(slug: String!): Roadmap
  node(id: String!): Node
}

type Mutation {
  createRoadmap(input: CreateRoadmapInput!): Roadmap
  updateRoadmap(id: String!, input: UpdateRoadmapInput!): Roadmap
  deleteRoadmap(id: String!): Boolean
  upsertGraph(roadmapId: String!, nodes: [NodeInput!]!, edges: [EdgeInput!]!): Roadmap
}
```

### REST Endpoints (/api/*)

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/api/roadmaps` | Danh sách roadmaps | Public |
| `GET` | `/api/roadmaps/:slug` | Chi tiết roadmap + nodes + edges | Public |
| `GET` | `/api/nodes/:id` | Chi tiết node (lesson content) | Public |
| `POST` | `/api/roadmaps` | Tạo roadmap | Admin |
| `PUT` | `/api/roadmaps/:id` | Cập nhật roadmap metadata | Admin |
| `DELETE` | `/api/roadmaps/:id` | Xóa roadmap | Admin |
| `POST` | `/api/roadmaps/:id/graph` | Lưu toàn bộ graph (upsert nodes + edges) | Admin |

Swagger UI tại `/api-docs`.

### gRPC Proto (packages/proto/roadmap.proto)

```protobuf
syntax = "proto3";
package roadmap;

service RoadmapService {
  rpc GetRoadmaps (Empty) returns (RoadmapList);
  rpc GetRoadmap (SlugRequest) returns (RoadmapDetail);
  rpc GetNode (IdRequest) returns (NodeDetail);
  rpc CreateRoadmap (CreateRoadmapRequest) returns (Roadmap);
  rpc UpdateRoadmap (UpdateRoadmapRequest) returns (Roadmap);
  rpc DeleteRoadmap (IdRequest) returns (BoolResponse);
  rpc UpsertGraph (UpsertGraphRequest) returns (RoadmapDetail);
}
```

Code được generate từ `.proto` files:
- TypeScript: `ts-proto` → dùng trong `api-gateway` và `svc-roadmap`
- Python: `grpcio-tools` → dùng trong `svc-python`
- Rust: `tonic-build` → dùng trong `svc-rust`

---

## Frontend Apps

### apps/web (Public Viewer)

```
apps/web/
├── app/
│   ├── page.tsx                    ← Home: danh sách roadmaps
│   └── roadmap/
│       └── [slug]/
│           ├── page.tsx            ← Roadmap graph viewer (SSG)
│           └── node/
│               └── [id]/
│                   └── page.tsx    ← Lesson content viewer
└── components/
    └── RoadmapViewer.tsx           ← <RoadmapGraph mode="view" />
```

- Pages được SSG tại build time → SEO tốt, load nhanh
- Click `node:ROADMAP` → navigate `/roadmap/{targetSlug}`
- Click `node:LESSON` → navigate `/roadmap/{slug}/node/{id}`

### apps/admin (CMS)

```
apps/admin/
├── app/
│   ├── login/page.tsx
│   └── roadmaps/
│       ├── page.tsx                ← Danh sách roadmaps
│       ├── new/page.tsx            ← Tạo roadmap mới
│       └── [id]/
│           ├── page.tsx            ← Graph editor (editable)
│           └── nodes/
│               └── [nodeId]/
│                   └── page.tsx    ← Lesson content editor
└── components/
    ├── RoadmapEditor.tsx           ← <RoadmapGraph mode="edit" />
    └── LessonEditor.tsx            ← BlockNote editor
```

- Admin login đơn giản bằng token/password — không cần user management
- Graph editor: kéo thả nodes, connect edges, set type → save batch via `upsertGraph`
- Lesson editor: click node:LESSON → mở BlockNote → save JSON content

### packages/graph (Shared React Flow)

```typescript
// Public viewer
<RoadmapGraph nodes={nodes} edges={edges} mode="view" onNodeClick={handleNavigate} />

// Admin editor
<RoadmapGraph nodes={nodes} edges={edges} mode="edit" onSave={handleSave} />
```

`mode="view"`: React Flow read-only, nodes không kéo thả được  
`mode="edit"`: Full React Flow interactive, toolbar thêm/xóa nodes

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 15, React 19, TypeScript |
| Graph visualization | React Flow |
| Rich text editor | BlockNote |
| API Gateway | NestJS + Apollo GraphQL + `@nestjs/swagger` |
| Internal communication | gRPC + Protobuf |
| Proto codegen | `ts-proto` (TS), `grpcio-tools` (Python), `tonic-build` (Rust) |
| Core service | NestJS + Prisma ORM |
| Database | PostgreSQL |
| Python service (future) | FastAPI + `grpcio` |
| Rust service (future) | Axum + `tonic` |

---

## Local Development Setup

```bash
# Khởi động toàn bộ
pnpm dev
```

**Thứ tự boot:**
1. PostgreSQL (Docker Compose)
2. `proto:gen` — generate TypeScript từ `.proto` files
3. `svc-roadmap` — gRPC server, port 5001
4. `api-gateway` — port 3000 (`/graphql`, `/api/*`, `/api-docs`)
5. `apps/web` — port 3001
6. `apps/admin` — port 3002

```json
// turbo.json
{
  "tasks": {
    "dev": { "persistent": true, "cache": false },
    "build": { "dependsOn": ["^build"] },
    "proto:gen": {
      "inputs": ["packages/proto/**/*.proto"],
      "outputs": ["packages/proto/generated/**"],
      "cache": true
    }
  }
}
```

---

## Out of Scope

- User authentication / progress tracking
- User-generated roadmaps
- Comments / community features
- Mobile app
- Real-time collaboration trên admin editor
