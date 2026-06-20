# VizTeckStack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build VizTeckStack — polyglot monorepo roadmap visualization platform với public viewer (Next.js), admin CMS (Next.js), API Gateway (NestJS + GraphQL + REST + Swagger), và gRPC internal service (NestJS + Prisma + PostgreSQL).

**Architecture:** Turborepo + pnpm monorepo. Frontend giao tiếp với `api-gateway` duy nhất qua GraphQL và REST. Gateway forward sang `svc-roadmap` qua gRPC. `packages/proto` là source of truth cho tất cả gRPC contracts. `packages/graph` chia sẻ React Flow component giữa viewer (read-only) và admin (editable).

**Tech Stack:** Turborepo 2, pnpm 9, Next.js 15, React 19, TypeScript 5, NestJS 10, Prisma 5, PostgreSQL 16, React Flow (@xyflow/react 12), BlockNote 0.19, Apollo Server 4, @nestjs/graphql 12, @nestjs/swagger 7, @grpc/grpc-js 1.10, ts-proto 1.175, Docker Compose

## Global Constraints

- Node.js >= 20.0.0, pnpm >= 9.0.0
- TypeScript strict mode enabled trong tất cả packages
- `apps/*` và `packages/*` thuộc pnpm workspace; `services/*` không thuộc workspace
- `packages/proto/` là single source of truth cho gRPC contracts — không định nghĩa types nơi khác
- Admin mutations/writes yêu cầu `Authorization: Bearer <token>`; token là static env var `ADMIN_TOKEN`
- `DATABASE_URL` env var cho PostgreSQL connection
- `ROADMAP_SERVICE_URL` env var cho gRPC address (default: `localhost:5001`)
- `ADMIN_TOKEN` env var cho admin authentication (default: `supersecret` ở local)

---

## Phase 1: Foundation

### Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore` (update existing)
- Create: `docker-compose.yml`

**Interfaces:**
- Produces: workspace root với `pnpm dev`, `pnpm build`, `pnpm test` wired qua Turborepo

- [ ] **Step 1: Tạo root package.json**

```json
{
  "name": "vizteckstack",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "proto:gen": "turbo run proto:gen"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: Tạo pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Tạo turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "proto:gen": {
      "inputs": ["packages/proto/**/*.proto"],
      "outputs": ["packages/proto/generated/**"],
      "cache": true
    }
  }
}
```

- [ ] **Step 4: Tạo tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: Tạo docker-compose.yml**

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: vizteck
      POSTGRES_PASSWORD: vizteck
      POSTGRES_DB: vizteckstack
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 6: Cập nhật .gitignore**

```
node_modules/
.turbo/
dist/
.next/
build/
*.local
.env
.env.*
!.env.example
packages/proto/generated/
.pnpm-store/
```

- [ ] **Step 7: Tạo thư mục cấu trúc**

```bash
mkdir -p apps packages services/svc-python services/svc-rust
```

- [ ] **Step 8: Tạo README placeholder cho future services**

```markdown
# svc-python (Future Service)

Python FastAPI gRPC service. Implements RoadmapService proto contract.

Setup: pip install -r requirements.txt
Run: uvicorn main:app --port 5002
```

Lưu vào `services/svc-python/README.md`. Copy tương tự sang `services/svc-rust/README.md` (thay FastAPI → Axum, pip → cargo).

- [ ] **Step 9: Install và verify**

```bash
pnpm install
```

Expected: `node_modules/` tạo tại root, không có error.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json docker-compose.yml services/
git commit -m "chore: initialize monorepo with Turborepo and pnpm workspaces"
```

---

### Task 2: packages/proto — gRPC Contract

**Files:**
- Create: `packages/proto/package.json`
- Create: `packages/proto/roadmap.proto`
- Create: `packages/proto/generate.sh`
- Create: `packages/proto/tsconfig.json`
- Create: `packages/proto/index.ts`

**Interfaces:**
- Produces: `RoadmapServiceClient`, `RoadmapServiceController`, tất cả message types export từ `@vizteck/proto`

- [ ] **Step 1: Tạo packages/proto/package.json**

```json
{
  "name": "@vizteck/proto",
  "version": "0.0.1",
  "private": true,
  "main": "./generated/roadmap.js",
  "types": "./generated/roadmap.d.ts",
  "scripts": {
    "proto:gen": "bash generate.sh"
  },
  "dependencies": {
    "@grpc/grpc-js": "^1.10.0",
    "@nestjs/microservices": "^10.3.0"
  },
  "devDependencies": {
    "ts-proto": "^1.175.0",
    "grpc-tools": "^1.12.4",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Tạo roadmap.proto**

```protobuf
syntax = "proto3";
package roadmap;

enum NodeType {
  ROADMAP = 0;
  LESSON = 1;
}

message Empty {}

message BoolResponse {
  bool success = 1;
}

message IdRequest {
  string id = 1;
}

message SlugRequest {
  string slug = 1;
}

message RoadmapItem {
  string id = 1;
  string slug = 2;
  string title = 3;
  string description = 4;
  string coverImage = 5;
}

message NodeItem {
  string id = 1;
  string roadmapId = 2;
  NodeType type = 3;
  string title = 4;
  double positionX = 5;
  double positionY = 6;
  string targetRoadmapId = 7;
  string content = 8;
}

message EdgeItem {
  string id = 1;
  string sourceId = 2;
  string targetId = 3;
  string label = 4;
}

message RoadmapList {
  repeated RoadmapItem roadmaps = 1;
}

message RoadmapDetail {
  RoadmapItem roadmap = 1;
  repeated NodeItem nodes = 2;
  repeated EdgeItem edges = 3;
}

message NodeDetail {
  NodeItem node = 1;
  RoadmapItem targetRoadmap = 2;
}

message CreateRoadmapRequest {
  string slug = 1;
  string title = 2;
  string description = 3;
  string coverImage = 4;
}

message UpdateRoadmapRequest {
  string id = 1;
  string title = 2;
  string description = 3;
  string coverImage = 4;
}

message NodeInput {
  string id = 1;
  NodeType type = 2;
  string title = 3;
  double positionX = 4;
  double positionY = 5;
  string targetRoadmapId = 6;
  string content = 7;
}

message EdgeInput {
  string sourceId = 1;
  string targetId = 2;
  string label = 3;
}

message UpsertGraphRequest {
  string roadmapId = 1;
  repeated NodeInput nodes = 2;
  repeated EdgeInput edges = 3;
}

service RoadmapService {
  rpc GetRoadmaps (Empty) returns (RoadmapList);
  rpc GetRoadmap (SlugRequest) returns (RoadmapDetail);
  rpc GetNode (IdRequest) returns (NodeDetail);
  rpc CreateRoadmap (CreateRoadmapRequest) returns (RoadmapItem);
  rpc UpdateRoadmap (UpdateRoadmapRequest) returns (RoadmapItem);
  rpc DeleteRoadmap (IdRequest) returns (BoolResponse);
  rpc UpsertGraph (UpsertGraphRequest) returns (RoadmapDetail);
}
```

- [ ] **Step 3: Tạo generate.sh**

```bash
#!/bin/bash
set -e

PROTO_DIR="$(dirname "$0")"
OUT_DIR="$PROTO_DIR/generated"

mkdir -p "$OUT_DIR"

npx protoc \
  --plugin=protoc-gen-ts_proto="./node_modules/.bin/protoc-gen-ts_proto" \
  --ts_proto_out="$OUT_DIR" \
  --ts_proto_opt=nestJs=true \
  --ts_proto_opt=fileSuffix='' \
  --proto_path="$PROTO_DIR" \
  "$PROTO_DIR/roadmap.proto"

echo "Proto generation complete → $OUT_DIR"
```

```bash
# Trên Windows dùng Git Bash hoặc WSL:
chmod +x packages/proto/generate.sh
```

- [ ] **Step 4: Tạo tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./"
  },
  "include": ["generated/**/*.ts", "index.ts"]
}
```

- [ ] **Step 5: Install và generate**

```bash
cd packages/proto
pnpm install
pnpm proto:gen
```

Expected: `packages/proto/generated/roadmap.ts` được tạo với NestJS-compatible types và decorators.

- [ ] **Step 6: Tạo index.ts**

```typescript
// packages/proto/index.ts
export * from './generated/roadmap';
```

- [ ] **Step 7: Commit**

```bash
git add packages/proto/
git commit -m "feat: add proto package with RoadmapService gRPC contract"
```

---

### Task 3: packages/db — Prisma Schema & Client

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/seed.ts`
- Create: `packages/db/.env.example`
- Create: `packages/db/index.ts`

**Interfaces:**
- Produces: `db` (PrismaClient singleton) và Prisma types `Roadmap`, `Node`, `Edge`, `NodeType` export từ `@vizteck/db`

- [ ] **Step 1: Tạo package.json**

```json
{
  "name": "@vizteck/db",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio",
    "generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.13.0"
  },
  "devDependencies": {
    "prisma": "^5.13.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: Tạo Prisma schema**

```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  roadmap         Roadmap  @relation("RoadmapNodes", fields: [roadmapId], references: [id], onDelete: Cascade)
  type            NodeType
  title           String
  positionX       Float
  positionY       Float
  targetRoadmapId String?
  targetRoadmap   Roadmap? @relation("NodeTarget", fields: [targetRoadmapId], references: [id])
  content         Json?
  edges           Edge[]   @relation("EdgeSource")
  edgesTarget     Edge[]   @relation("EdgeTarget")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Edge {
  id       String  @id @default(cuid())
  sourceId String
  targetId String
  source   Node    @relation("EdgeSource", fields: [sourceId], references: [id], onDelete: Cascade)
  target   Node    @relation("EdgeTarget", fields: [targetId], references: [id], onDelete: Cascade)
  label    String?
}

enum NodeType {
  ROADMAP
  LESSON
}
```

- [ ] **Step 3: Tạo .env.example và copy**

```
# packages/db/.env.example
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack"
```

```bash
cp packages/db/.env.example packages/db/.env
```

- [ ] **Step 4: Tạo seed script**

```typescript
// packages/db/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const frontend = await prisma.roadmap.upsert({
    where: { slug: 'frontend' },
    update: {},
    create: {
      slug: 'frontend',
      title: 'Frontend Developer',
      description: 'Step by step guide to becoming a frontend developer',
    },
  });

  const backend = await prisma.roadmap.upsert({
    where: { slug: 'backend' },
    update: {},
    create: {
      slug: 'backend',
      title: 'Backend Developer',
      description: 'Step by step guide to becoming a backend developer',
    },
  });

  await prisma.roadmap.upsert({
    where: { slug: 'fullstack' },
    update: {},
    create: {
      slug: 'fullstack',
      title: 'Fullstack Developer',
      description: 'Step by step guide to becoming a fullstack developer',
      nodes: {
        create: [
          {
            type: 'ROADMAP',
            title: 'Frontend',
            positionX: 100,
            positionY: 100,
            targetRoadmapId: frontend.id,
          },
          {
            type: 'ROADMAP',
            title: 'Backend',
            positionX: 400,
            positionY: 100,
            targetRoadmapId: backend.id,
          },
        ],
      },
    },
  });

  console.log('Seed complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

- [ ] **Step 5: Tạo PrismaClient singleton**

```typescript
// packages/db/index.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export * from '@prisma/client';
```

- [ ] **Step 6: Tạo tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./"
  },
  "include": ["index.ts"]
}
```

- [ ] **Step 7: Start PostgreSQL, migrate, seed**

```bash
docker compose up -d postgres

cd packages/db
pnpm install
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm db:push
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm generate
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm db:seed
```

Expected: Tables created, output `Seed complete.`

- [ ] **Step 8: Commit**

```bash
git add packages/db/
git commit -m "feat: add db package with Prisma schema and seed data"
```

---

## Phase 2: Core Services

### Task 4: apps/svc-roadmap — NestJS gRPC Service

**Files:**
- Create: `apps/svc-roadmap/package.json`
- Create: `apps/svc-roadmap/tsconfig.json`
- Create: `apps/svc-roadmap/.env.example`
- Create: `apps/svc-roadmap/src/main.ts`
- Create: `apps/svc-roadmap/src/app.module.ts`
- Create: `apps/svc-roadmap/src/roadmap/roadmap.module.ts`
- Create: `apps/svc-roadmap/src/roadmap/roadmap.service.ts`
- Create: `apps/svc-roadmap/src/roadmap/roadmap.controller.ts`
- Create: `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts`

**Interfaces:**
- Consumes: `@vizteck/proto` (message types), `@vizteck/db` (db, Prisma types)
- Produces: gRPC server tại `0.0.0.0:5001` implement `RoadmapService`

- [ ] **Step 1: Tạo package.json**

```json
{
  "name": "@vizteck/svc-roadmap",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "test": "jest --passWithNoTests",
    "start": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/microservices": "^10.3.0",
    "@grpc/grpc-js": "^1.10.0",
    "@grpc/proto-loader": "^0.7.13",
    "@vizteck/proto": "workspace:*",
    "@vizteck/db": "workspace:*",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.4.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Tạo tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Tạo .env.example và copy**

```
# apps/svc-roadmap/.env.example
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack"
GRPC_PORT=5001
```

```bash
cp apps/svc-roadmap/.env.example apps/svc-roadmap/.env
```

- [ ] **Step 4: Viết failing test**

```typescript
// apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapService } from './roadmap.service';

jest.mock('@vizteck/db', () => ({
  db: {
    roadmap: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    node: { findUnique: jest.fn() },
    edge: {},
    $transaction: jest.fn(),
  },
}));

import { db } from '@vizteck/db';

describe('RoadmapService', () => {
  let service: RoadmapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoadmapService],
    }).compile();
    service = module.get<RoadmapService>(RoadmapService);
    jest.clearAllMocks();
  });

  it('getRoadmaps returns roadmap list', async () => {
    (db.roadmap.findMany as jest.Mock).mockResolvedValue([
      { id: 'r1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null },
    ]);
    const result = await service.getRoadmaps({});
    expect(result.roadmaps).toHaveLength(1);
    expect(result.roadmaps[0].slug).toBe('frontend');
  });

  it('getRoadmap returns detail with nodes and edges', async () => {
    (db.roadmap.findUnique as jest.Mock).mockResolvedValue({
      id: 'r1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null,
      nodes: [
        { id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'HTML', positionX: 0, positionY: 0, targetRoadmapId: null, content: null, edges: [], edgesTarget: [] },
      ],
    });
    const result = await service.getRoadmap({ slug: 'frontend' });
    expect(result.roadmap?.slug).toBe('frontend');
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
  });
});
```

- [ ] **Step 5: Chạy test để xác nhận fail**

```bash
cd apps/svc-roadmap && pnpm install && pnpm test
```

Expected: FAIL — `Cannot find module './roadmap.service'`

- [ ] **Step 6: Implement RoadmapService**

```typescript
// apps/svc-roadmap/src/roadmap/roadmap.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '@vizteck/db';
import {
  Empty, RoadmapList, SlugRequest, RoadmapDetail, IdRequest,
  NodeDetail, CreateRoadmapRequest, RoadmapItem, UpdateRoadmapRequest,
  BoolResponse, UpsertGraphRequest,
} from '@vizteck/proto';

function toRoadmapItem(r: any): RoadmapItem {
  return { id: r.id, slug: r.slug, title: r.title, description: r.description ?? '', coverImage: r.coverImage ?? '' };
}

function toNodeItem(n: any) {
  return {
    id: n.id, roadmapId: n.roadmapId,
    type: n.type === 'ROADMAP' ? 0 : 1,
    title: n.title, positionX: n.positionX, positionY: n.positionY,
    targetRoadmapId: n.targetRoadmapId ?? '',
    content: n.content ? JSON.stringify(n.content) : '',
  };
}

@Injectable()
export class RoadmapService {
  async getRoadmaps(_: Empty): Promise<RoadmapList> {
    const roadmaps = await db.roadmap.findMany({ orderBy: { createdAt: 'asc' } });
    return { roadmaps: roadmaps.map(toRoadmapItem) };
  }

  async getRoadmap({ slug }: SlugRequest): Promise<RoadmapDetail> {
    const roadmap = await db.roadmap.findUnique({
      where: { slug },
      include: { nodes: { include: { edges: true } } },
    });
    if (!roadmap) return { roadmap: undefined, nodes: [], edges: [] };

    const allEdges = roadmap.nodes.flatMap(n => n.edges);
    return {
      roadmap: toRoadmapItem(roadmap),
      nodes: roadmap.nodes.map(toNodeItem),
      edges: allEdges.map(e => ({ id: e.id, sourceId: e.sourceId, targetId: e.targetId, label: e.label ?? '' })),
    };
  }

  async getNode({ id }: IdRequest): Promise<NodeDetail> {
    const node = await db.node.findUnique({
      where: { id },
      include: { targetRoadmap: true },
    });
    if (!node) return { node: undefined, targetRoadmap: undefined };
    return {
      node: toNodeItem(node),
      targetRoadmap: node.targetRoadmap ? toRoadmapItem(node.targetRoadmap) : undefined,
    };
  }

  async createRoadmap(req: CreateRoadmapRequest): Promise<RoadmapItem> {
    const r = await db.roadmap.create({
      data: { slug: req.slug, title: req.title, description: req.description || null, coverImage: req.coverImage || null },
    });
    return toRoadmapItem(r);
  }

  async updateRoadmap(req: UpdateRoadmapRequest): Promise<RoadmapItem> {
    const r = await db.roadmap.update({
      where: { id: req.id },
      data: { title: req.title || undefined, description: req.description || undefined, coverImage: req.coverImage || undefined },
    });
    return toRoadmapItem(r);
  }

  async deleteRoadmap({ id }: IdRequest): Promise<BoolResponse> {
    await db.roadmap.delete({ where: { id } });
    return { success: true };
  }

  async upsertGraph(req: UpsertGraphRequest): Promise<RoadmapDetail> {
    await db.$transaction(async (tx) => {
      // Delete edges first (FK constraint), then nodes
      const existingNodes = await tx.node.findMany({ where: { roadmapId: req.roadmapId }, select: { id: true } });
      const nodeIds = existingNodes.map(n => n.id);
      await tx.edge.deleteMany({ where: { sourceId: { in: nodeIds } } });
      await tx.node.deleteMany({ where: { roadmapId: req.roadmapId } });

      for (const n of req.nodes) {
        await tx.node.create({
          data: {
            id: n.id || undefined,
            roadmapId: req.roadmapId,
            type: n.type === 0 ? 'ROADMAP' : 'LESSON',
            title: n.title,
            positionX: n.positionX,
            positionY: n.positionY,
            targetRoadmapId: n.targetRoadmapId || null,
            content: n.content ? JSON.parse(n.content) : null,
          },
        });
      }

      for (const e of req.edges) {
        await tx.edge.create({
          data: { sourceId: e.sourceId, targetId: e.targetId, label: e.label || null },
        });
      }
    });

    const roadmap = await db.roadmap.findUnique({
      where: { id: req.roadmapId },
      select: { slug: true },
    });
    return this.getRoadmap({ slug: roadmap?.slug ?? '' });
  }
}
```

- [ ] **Step 7: Implement gRPC Controller**

```typescript
// apps/svc-roadmap/src/roadmap/roadmap.controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RoadmapService } from './roadmap.service';
import { Empty, SlugRequest, IdRequest, CreateRoadmapRequest, UpdateRoadmapRequest, UpsertGraphRequest } from '@vizteck/proto';

@Controller()
export class RoadmapController {
  constructor(private readonly svc: RoadmapService) {}

  @GrpcMethod('RoadmapService', 'GetRoadmaps')
  getRoadmaps(data: Empty) { return this.svc.getRoadmaps(data); }

  @GrpcMethod('RoadmapService', 'GetRoadmap')
  getRoadmap(data: SlugRequest) { return this.svc.getRoadmap(data); }

  @GrpcMethod('RoadmapService', 'GetNode')
  getNode(data: IdRequest) { return this.svc.getNode(data); }

  @GrpcMethod('RoadmapService', 'CreateRoadmap')
  createRoadmap(data: CreateRoadmapRequest) { return this.svc.createRoadmap(data); }

  @GrpcMethod('RoadmapService', 'UpdateRoadmap')
  updateRoadmap(data: UpdateRoadmapRequest) { return this.svc.updateRoadmap(data); }

  @GrpcMethod('RoadmapService', 'DeleteRoadmap')
  deleteRoadmap(data: IdRequest) { return this.svc.deleteRoadmap(data); }

  @GrpcMethod('RoadmapService', 'UpsertGraph')
  upsertGraph(data: UpsertGraphRequest) { return this.svc.upsertGraph(data); }
}
```

- [ ] **Step 8: Tạo RoadmapModule và AppModule**

```typescript
// apps/svc-roadmap/src/roadmap/roadmap.module.ts
import { Module } from '@nestjs/common';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';

@Module({ controllers: [RoadmapController], providers: [RoadmapService] })
export class RoadmapModule {}
```

```typescript
// apps/svc-roadmap/src/app.module.ts
import { Module } from '@nestjs/common';
import { RoadmapModule } from './roadmap/roadmap.module';

@Module({ imports: [RoadmapModule] })
export class AppModule {}
```

- [ ] **Step 9: Tạo main.ts**

```typescript
// apps/svc-roadmap/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.GRPC_PORT ?? '5001';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'roadmap',
      protoPath: join(__dirname, '../../../packages/proto/roadmap.proto'),
      url: `0.0.0.0:${port}`,
    },
  });
  await app.listen();
  console.log(`svc-roadmap gRPC listening on :${port}`);
}
bootstrap();
```

- [ ] **Step 10: Chạy test để xác nhận pass**

```bash
pnpm test
```

Expected: PASS — 2 tests pass.

- [ ] **Step 11: Commit**

```bash
git add apps/svc-roadmap/
git commit -m "feat: add svc-roadmap NestJS gRPC service"
```

---

### Task 5: apps/api-gateway — GraphQL + REST + Swagger

**Files:**
- Create: `apps/api-gateway/package.json`
- Create: `apps/api-gateway/tsconfig.json`
- Create: `apps/api-gateway/.env.example`
- Create: `apps/api-gateway/src/main.ts`
- Create: `apps/api-gateway/src/app.module.ts`
- Create: `apps/api-gateway/src/auth/admin.guard.ts`
- Create: `apps/api-gateway/src/roadmap/roadmap.grpc-client.ts`
- Create: `apps/api-gateway/src/roadmap/roadmap.dto.ts`
- Create: `apps/api-gateway/src/roadmap/roadmap.resolver.ts`
- Create: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`
- Create: `apps/api-gateway/src/roadmap/roadmap.module.ts`
- Create: `apps/api-gateway/src/roadmap/roadmap.resolver.spec.ts`

**Interfaces:**
- Consumes: `@vizteck/proto` (RoadmapServiceClient), gRPC server tại `ROADMAP_SERVICE_URL`
- Produces:
  - `POST /graphql` — Apollo GraphQL playground + endpoint
  - `GET /api/roadmaps`, `GET /api/roadmaps/:slug`, `GET /api/nodes/:id` — public REST
  - `POST /api/roadmaps`, `PUT /api/roadmaps/:id`, `DELETE /api/roadmaps/:id`, `POST /api/roadmaps/:id/graph` — admin REST
  - `GET /api-docs` — Swagger UI

- [ ] **Step 1: Tạo package.json**

```json
{
  "name": "@vizteck/api-gateway",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "test": "jest --passWithNoTests",
    "start": "node dist/main"
  },
  "dependencies": {
    "@apollo/server": "^4.10.0",
    "@nestjs/apollo": "^12.1.0",
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/graphql": "^12.1.0",
    "@nestjs/microservices": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/swagger": "^7.3.0",
    "@grpc/grpc-js": "^1.10.0",
    "@grpc/proto-loader": "^0.7.13",
    "@vizteck/proto": "workspace:*",
    "graphql": "^16.8.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.4.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Tạo tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Tạo .env.example và copy**

```
# apps/api-gateway/.env.example
ROADMAP_SERVICE_URL=localhost:5001
ADMIN_TOKEN=supersecret
PORT=3000
```

```bash
cp apps/api-gateway/.env.example apps/api-gateway/.env
```

- [ ] **Step 4: Tạo AdminGuard**

```typescript
// apps/api-gateway/src/auth/admin.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.getType() === 'http'
      ? context.switchToHttp().getRequest()
      : GqlExecutionContext.create(context).getContext().req;

    const token = (req.headers['authorization'] as string | undefined)?.replace('Bearer ', '');
    if (!token || token !== process.env.ADMIN_TOKEN) {
      throw new UnauthorizedException('Invalid admin token');
    }
    return true;
  }
}
```

- [ ] **Step 5: Tạo gRPC client**

```typescript
// apps/api-gateway/src/roadmap/roadmap.grpc-client.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom, Observable } from 'rxjs';

interface GrpcRoadmapService {
  getRoadmaps(data: object): Observable<any>;
  getRoadmap(data: { slug: string }): Observable<any>;
  getNode(data: { id: string }): Observable<any>;
  createRoadmap(data: object): Observable<any>;
  updateRoadmap(data: object): Observable<any>;
  deleteRoadmap(data: { id: string }): Observable<any>;
  upsertGraph(data: object): Observable<any>;
}

@Injectable()
export class RoadmapGrpcClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'roadmap',
      protoPath: join(__dirname, '../../../../packages/proto/roadmap.proto'),
      url: process.env.ROADMAP_SERVICE_URL ?? 'localhost:5001',
    },
  })
  private client!: ClientGrpc;

  private svc!: GrpcRoadmapService;

  onModuleInit() {
    this.svc = this.client.getService<GrpcRoadmapService>('RoadmapService');
  }

  getRoadmaps() { return firstValueFrom(this.svc.getRoadmaps({})); }
  getRoadmap(slug: string) { return firstValueFrom(this.svc.getRoadmap({ slug })); }
  getNode(id: string) { return firstValueFrom(this.svc.getNode({ id })); }
  createRoadmap(data: object) { return firstValueFrom(this.svc.createRoadmap(data)); }
  updateRoadmap(data: object) { return firstValueFrom(this.svc.updateRoadmap(data)); }
  deleteRoadmap(id: string) { return firstValueFrom(this.svc.deleteRoadmap({ id })); }
  upsertGraph(data: object) { return firstValueFrom(this.svc.upsertGraph(data)); }
}
```

- [ ] **Step 6: Tạo DTOs**

```typescript
// apps/api-gateway/src/roadmap/roadmap.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectType, Field, ID, Float, registerEnumType, InputType } from '@nestjs/graphql';

export enum NodeTypeEnum { ROADMAP = 'ROADMAP', LESSON = 'LESSON' }
registerEnumType(NodeTypeEnum, { name: 'NodeType' });

@ObjectType() export class RoadmapDto {
  @Field(() => ID) @ApiProperty() id!: string;
  @Field() @ApiProperty() slug!: string;
  @Field() @ApiProperty() title!: string;
  @Field({ nullable: true }) @ApiPropertyOptional() description?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() coverImage?: string;
}

@ObjectType() export class NodeDto {
  @Field(() => ID) @ApiProperty() id!: string;
  @Field() @ApiProperty() roadmapId!: string;
  @Field(() => NodeTypeEnum) @ApiProperty({ enum: NodeTypeEnum }) type!: NodeTypeEnum;
  @Field() @ApiProperty() title!: string;
  @Field(() => Float) @ApiProperty() positionX!: number;
  @Field(() => Float) @ApiProperty() positionY!: number;
  @Field({ nullable: true }) @ApiPropertyOptional() targetRoadmapId?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() content?: string;
}

@ObjectType() export class EdgeDto {
  @Field(() => ID) @ApiProperty() id!: string;
  @Field() @ApiProperty() sourceId!: string;
  @Field() @ApiProperty() targetId!: string;
  @Field({ nullable: true }) @ApiPropertyOptional() label?: string;
}

@ObjectType() export class RoadmapDetailDto {
  @Field(() => RoadmapDto, { nullable: true }) roadmap?: RoadmapDto;
  @Field(() => [NodeDto]) nodes!: NodeDto[];
  @Field(() => [EdgeDto]) edges!: EdgeDto[];
}

@InputType() export class CreateRoadmapInput {
  @Field() @ApiProperty() slug!: string;
  @Field() @ApiProperty() title!: string;
  @Field({ nullable: true }) @ApiPropertyOptional() description?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() coverImage?: string;
}

@InputType() export class UpdateRoadmapInput {
  @Field({ nullable: true }) @ApiPropertyOptional() title?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() description?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() coverImage?: string;
}

@InputType() export class NodeInput {
  @Field() id!: string;
  @Field(() => NodeTypeEnum) type!: NodeTypeEnum;
  @Field() title!: string;
  @Field(() => Float) positionX!: number;
  @Field(() => Float) positionY!: number;
  @Field({ nullable: true }) targetRoadmapId?: string;
  @Field({ nullable: true }) content?: string;
}

@InputType() export class EdgeInput {
  @Field() sourceId!: string;
  @Field() targetId!: string;
  @Field({ nullable: true }) label?: string;
}
```

- [ ] **Step 7: Viết failing resolver test**

```typescript
// apps/api-gateway/src/roadmap/roadmap.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapResolver } from './roadmap.resolver';
import { RoadmapGrpcClient } from './roadmap.grpc-client';

const mockClient = {
  getRoadmaps: jest.fn().mockResolvedValue({ roadmaps: [{ id: '1', slug: 'frontend', title: 'Frontend', description: '', coverImage: '' }] }),
  getRoadmap: jest.fn().mockResolvedValue({ roadmap: { id: '1', slug: 'frontend', title: 'Frontend' }, nodes: [], edges: [] }),
};

describe('RoadmapResolver', () => {
  let resolver: RoadmapResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapResolver,
        { provide: RoadmapGrpcClient, useValue: mockClient },
      ],
    }).compile();
    resolver = module.get<RoadmapResolver>(RoadmapResolver);
  });

  it('roadmaps() returns array', async () => {
    const result = await resolver.roadmaps();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('frontend');
  });

  it('roadmap(slug) returns detail', async () => {
    const result = await resolver.roadmap('frontend');
    expect(result.roadmap?.slug).toBe('frontend');
    expect(result.nodes).toHaveLength(0);
  });
});
```

- [ ] **Step 8: Chạy test để xác nhận fail**

```bash
cd apps/api-gateway && pnpm install && pnpm test
```

Expected: FAIL — `Cannot find module './roadmap.resolver'`

- [ ] **Step 9: Tạo GraphQL Resolver**

```typescript
// apps/api-gateway/src/roadmap/roadmap.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RoadmapGrpcClient } from './roadmap.grpc-client';
import { AdminGuard } from '../auth/admin.guard';
import { RoadmapDto, RoadmapDetailDto, NodeDto, CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput } from './roadmap.dto';

@Resolver()
export class RoadmapResolver {
  constructor(private readonly grpc: RoadmapGrpcClient) {}

  @Query(() => [RoadmapDto])
  async roadmaps(): Promise<RoadmapDto[]> {
    const result = await this.grpc.getRoadmaps();
    return result.roadmaps ?? [];
  }

  @Query(() => RoadmapDetailDto, { nullable: true })
  async roadmap(@Args('slug') slug: string): Promise<RoadmapDetailDto> {
    return this.grpc.getRoadmap(slug);
  }

  @Query(() => NodeDto, { nullable: true })
  async node(@Args('id', { type: () => ID }) id: string): Promise<NodeDto> {
    const result = await this.grpc.getNode(id);
    return result.node;
  }

  @UseGuards(AdminGuard)
  @Mutation(() => RoadmapDto)
  createRoadmap(@Args('input') input: CreateRoadmapInput): Promise<RoadmapDto> {
    return this.grpc.createRoadmap(input);
  }

  @UseGuards(AdminGuard)
  @Mutation(() => RoadmapDto)
  updateRoadmap(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRoadmapInput,
  ): Promise<RoadmapDto> {
    return this.grpc.updateRoadmap({ id, ...input });
  }

  @UseGuards(AdminGuard)
  @Mutation(() => Boolean)
  async deleteRoadmap(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.grpc.deleteRoadmap(id);
    return result.success;
  }

  @UseGuards(AdminGuard)
  @Mutation(() => RoadmapDetailDto)
  upsertGraph(
    @Args('roadmapId', { type: () => ID }) roadmapId: string,
    @Args('nodes', { type: () => [NodeInput] }) nodes: NodeInput[],
    @Args('edges', { type: () => [EdgeInput] }) edges: EdgeInput[],
  ): Promise<RoadmapDetailDto> {
    return this.grpc.upsertGraph({ roadmapId, nodes, edges });
  }
}
```

- [ ] **Step 10: Tạo REST Controller**

```typescript
// apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoadmapGrpcClient } from './roadmap.grpc-client';
import { AdminGuard } from '../auth/admin.guard';
import { CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput } from './roadmap.dto';

@ApiTags('roadmaps')
@Controller('api')
export class RoadmapRestController {
  constructor(private readonly grpc: RoadmapGrpcClient) {}

  @Get('roadmaps')
  @ApiOperation({ summary: 'List all roadmaps' })
  getRoadmaps() { return this.grpc.getRoadmaps(); }

  @Get('roadmaps/:slug')
  @ApiOperation({ summary: 'Get roadmap by slug with nodes and edges' })
  @ApiParam({ name: 'slug', type: String })
  getRoadmap(@Param('slug') slug: string) { return this.grpc.getRoadmap(slug); }

  @Get('nodes/:id')
  @ApiOperation({ summary: 'Get node detail (includes lesson content)' })
  @ApiParam({ name: 'id', type: String })
  getNode(@Param('id') id: string) { return this.grpc.getNode(id); }

  @UseGuards(AdminGuard)
  @Post('roadmaps')
  @ApiOperation({ summary: 'Create roadmap' })
  @ApiBearerAuth()
  createRoadmap(@Body() body: CreateRoadmapInput) { return this.grpc.createRoadmap(body); }

  @UseGuards(AdminGuard)
  @Put('roadmaps/:id')
  @ApiOperation({ summary: 'Update roadmap metadata' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  updateRoadmap(@Param('id') id: string, @Body() body: UpdateRoadmapInput) {
    return this.grpc.updateRoadmap({ id, ...body });
  }

  @UseGuards(AdminGuard)
  @Delete('roadmaps/:id')
  @ApiOperation({ summary: 'Delete roadmap' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  deleteRoadmap(@Param('id') id: string) { return this.grpc.deleteRoadmap(id); }

  @UseGuards(AdminGuard)
  @Post('roadmaps/:id/graph')
  @ApiOperation({ summary: 'Upsert full graph (nodes + edges) for a roadmap' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  upsertGraph(@Param('id') id: string, @Body() body: { nodes: NodeInput[]; edges: EdgeInput[] }) {
    return this.grpc.upsertGraph({ roadmapId: id, ...body });
  }
}
```

- [ ] **Step 11: Tạo RoadmapModule và AppModule**

```typescript
// apps/api-gateway/src/roadmap/roadmap.module.ts
import { Module } from '@nestjs/common';
import { RoadmapGrpcClient } from './roadmap.grpc-client';
import { RoadmapResolver } from './roadmap.resolver';
import { RoadmapRestController } from './roadmap.rest.controller';

@Module({
  providers: [RoadmapGrpcClient, RoadmapResolver],
  controllers: [RoadmapRestController],
})
export class RoadmapModule {}
```

```typescript
// apps/api-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RoadmapModule } from './roadmap/roadmap.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
    }),
    RoadmapModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 12: Tạo main.ts**

```typescript
// apps/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('VizTeckStack API')
    .setDescription('Roadmap visualization REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`api-gateway: http://localhost:${port}`);
  console.log(`GraphQL:     http://localhost:${port}/graphql`);
  console.log(`Swagger:     http://localhost:${port}/api-docs`);
}
bootstrap();
```

- [ ] **Step 13: Chạy test để xác nhận pass**

```bash
pnpm test
```

Expected: PASS — 2 resolver tests pass.

- [ ] **Step 14: Commit**

```bash
git add apps/api-gateway/
git commit -m "feat: add api-gateway with GraphQL, REST, and Swagger"
```

---

## Phase 3: Shared Packages

### Task 6: packages/ui — Shared React Components

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/Button.tsx`
- Create: `packages/ui/src/Card.tsx`
- Create: `packages/ui/src/NodeBadge.tsx`
- Create: `packages/ui/src/index.ts`

**Interfaces:**
- Produces: `Button`, `Card`, `NodeBadge` export từ `@vizteck/ui`

- [ ] **Step 1: Tạo package.json**

```json
{
  "name": "@vizteck/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "build": "tsc" },
  "peerDependencies": { "react": "^19.0.0" },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Tạo tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Tạo components**

```typescript
// packages/ui/src/Button.tsx
import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}
const styles: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'text-gray-600 hover:bg-gray-100',
};
export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

```typescript
// packages/ui/src/Card.tsx
import React from 'react';
interface CardProps { children: React.ReactNode; className?: string; onClick?: () => void; }
export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${onClick ? 'cursor-pointer hover:border-blue-400 hover:shadow-md transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

```typescript
// packages/ui/src/NodeBadge.tsx
import React from 'react';
type NodeType = 'ROADMAP' | 'LESSON';
const styles: Record<NodeType, string> = {
  ROADMAP: 'bg-blue-100 text-blue-800',
  LESSON: 'bg-green-100 text-green-800',
};
export function NodeBadge({ type }: { type: NodeType }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[type]}`}>{type}</span>;
}
```

- [ ] **Step 4: Tạo index.ts**

```typescript
// packages/ui/src/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { NodeBadge } from './NodeBadge';
```

- [ ] **Step 5: Commit**

```bash
git add packages/ui/
git commit -m "feat: add shared ui package with Button, Card, NodeBadge"
```

---

### Task 7: packages/graph — Shared React Flow Component

**Files:**
- Create: `packages/graph/package.json`
- Create: `packages/graph/tsconfig.json`
- Create: `packages/graph/src/types.ts`
- Create: `packages/graph/src/nodes/RoadmapNode.tsx`
- Create: `packages/graph/src/nodes/LessonNode.tsx`
- Create: `packages/graph/src/RoadmapGraph.tsx`
- Create: `packages/graph/src/index.ts`

**Interfaces:**
- Produces: `<RoadmapGraph mode="view" nodes={GraphNode[]} edges={GraphEdge[]} onNodeClick={fn} />` và `<RoadmapGraph mode="edit" nodes={} edges={} onSave={fn} />` export từ `@vizteck/graph`
- Types `GraphNode`, `GraphEdge`, `RoadmapGraphProps` export từ `@vizteck/graph`

- [ ] **Step 1: Tạo package.json**

```json
{
  "name": "@vizteck/graph",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "build": "tsc" },
  "dependencies": { "@xyflow/react": "^12.0.0" },
  "peerDependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Tạo types.ts**

```typescript
// packages/graph/src/types.ts
export type NodeType = 'ROADMAP' | 'LESSON';

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  positionX: number;
  positionY: number;
  targetRoadmapId?: string;
  content?: string;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface RoadmapGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  mode: 'view' | 'edit';
  onNodeClick?: (node: GraphNode) => void;
  onSave?: (nodes: GraphNode[], edges: GraphEdge[]) => void;
}
```

- [ ] **Step 3: Tạo custom nodes**

```typescript
// packages/graph/src/nodes/RoadmapNode.tsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';

export function RoadmapNode({ data }: { data: { title: string } }) {
  return (
    <div className="rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-2 shadow-md min-w-[140px] text-center">
      <Handle type="target" position={Position.Top} />
      <div className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-0.5">Roadmap</div>
      <div className="text-sm font-medium text-gray-900">{data.title}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

```typescript
// packages/graph/src/nodes/LessonNode.tsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';

export function LessonNode({ data }: { data: { title: string } }) {
  return (
    <div className="rounded-lg border-2 border-green-500 bg-green-50 px-4 py-2 shadow-md min-w-[140px] text-center">
      <Handle type="target" position={Position.Top} />
      <div className="text-xs font-semibold uppercase tracking-wide text-green-500 mb-0.5">Lesson</div>
      <div className="text-sm font-medium text-gray-900">{data.title}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

- [ ] **Step 4: Tạo RoadmapGraph component**

```typescript
// packages/graph/src/RoadmapGraph.tsx
'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  Connection, Node, Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RoadmapNode } from './nodes/RoadmapNode';
import { LessonNode } from './nodes/LessonNode';
import { GraphNode, GraphEdge, RoadmapGraphProps } from './types';

const nodeTypes = { ROADMAP: RoadmapNode, LESSON: LessonNode };

function toFlowNodes(graphNodes: GraphNode[]): Node[] {
  return graphNodes.map(n => ({
    id: n.id,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: { title: n.title, targetRoadmapId: n.targetRoadmapId, content: n.content },
  }));
}

function toFlowEdges(graphEdges: GraphEdge[]): Edge[] {
  return graphEdges.map(e => ({ id: e.id, source: e.sourceId, target: e.targetId, label: e.label }));
}

export function RoadmapGraph({ nodes: init, edges: initEdges, mode, onNodeClick, onSave }: RoadmapGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(init));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(initEdges));

  const onConnect = useCallback((c: Connection) => {
    if (mode === 'edit') setEdges(eds => addEdge(c, eds));
  }, [mode, setEdges]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (mode === 'view' && onNodeClick) {
      const original = init.find(n => n.id === node.id);
      if (original) onNodeClick(original);
    }
  }, [mode, onNodeClick, init]);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave(
      nodes.map(n => ({
        id: n.id,
        type: n.type as 'ROADMAP' | 'LESSON',
        title: n.data.title as string,
        positionX: n.position.x,
        positionY: n.position.y,
        targetRoadmapId: n.data.targetRoadmapId as string | undefined,
        content: n.data.content as string | undefined,
      })),
      edges.map(e => ({ id: e.id, sourceId: e.source, targetId: e.target, label: e.label as string | undefined })),
    );
  }, [nodes, edges, onSave]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={mode === 'edit' ? onNodesChange : undefined}
        onEdgesChange={mode === 'edit' ? onEdgesChange : undefined}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={mode === 'edit'}
        nodesConnectable={mode === 'edit'}
        elementsSelectable={mode === 'edit'}
        fitView
      >
        <Background />
        <Controls />
        {mode === 'edit' && <MiniMap />}
      </ReactFlow>
      {mode === 'edit' && onSave && (
        <button
          onClick={handleSave}
          style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
        >
          Save Graph
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Tạo tsconfig.json và index.ts**

```json
// packages/graph/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src/**/*"]
}
```

```typescript
// packages/graph/src/index.ts
export { RoadmapGraph } from './RoadmapGraph';
export type { GraphNode, GraphEdge, RoadmapGraphProps } from './types';
```

- [ ] **Step 6: Commit**

```bash
git add packages/graph/
git commit -m "feat: add graph package with React Flow view/edit modes"
```

---

## Phase 4: Frontend Apps

### Task 8: apps/web — Public Viewer (Next.js)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/.env.example`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/roadmap/[slug]/page.tsx`
- Create: `apps/web/app/roadmap/[slug]/node/[id]/page.tsx`
- Create: `apps/web/lib/api.ts`

**Interfaces:**
- Consumes: `@vizteck/ui` (Card), `@vizteck/graph` (RoadmapGraph, GraphNode, GraphEdge)
- Consumes: `NEXT_PUBLIC_API_URL/api/*`
- Produces: Public SSG pages tại port 3001

- [ ] **Step 1: Tạo package.json**

```json
{
  "name": "@vizteck/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001"
  },
  "dependencies": {
    "@vizteck/ui": "workspace:*",
    "@vizteck/graph": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Tạo config files**

```typescript
// apps/web/next.config.ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  transpilePackages: ['@vizteck/ui', '@vizteck/graph'],
};
export default nextConfig;
```

```typescript
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}', '../../packages/graph/src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

```javascript
// apps/web/postcss.config.js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

```json
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Tạo .env.example và copy**

```
# apps/web/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3000
```

```bash
cp apps/web/.env.example apps/web/.env.local
```

- [ ] **Step 4: Tạo API client**

```typescript
// apps/web/lib/api.ts
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function getRoadmaps() {
  const res = await fetch(`${API}/api/roadmaps`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch roadmaps');
  return res.json();
}

export async function getRoadmapBySlug(slug: string) {
  const res = await fetch(`${API}/api/roadmaps/${slug}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Roadmap not found: ${slug}`);
  return res.json();
}

export async function getNode(id: string) {
  const res = await fetch(`${API}/api/nodes/${id}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Node not found: ${id}`);
  return res.json();
}
```

- [ ] **Step 5: Tạo layout và globals.css**

```css
/* apps/web/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```typescript
// apps/web/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VizTeckStack — Tech Roadmaps',
  description: 'Interactive technology learning roadmaps',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <span className="text-xl font-bold text-gray-900">VizTeckStack</span>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Tạo home page**

```typescript
// apps/web/app/page.tsx
import Link from 'next/link';
import { Card } from '@vizteck/ui';
import { getRoadmaps } from '../lib/api';

export const revalidate = 3600;

export default async function HomePage() {
  const { roadmaps } = await getRoadmaps();
  return (
    <div>
      <h2 className="mb-6 text-3xl font-bold text-gray-900">Developer Roadmaps</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roadmaps.map((r: any) => (
          <Link key={r.id} href={`/roadmap/${r.slug}`}>
            <Card>
              <h3 className="font-semibold text-gray-900">{r.title}</h3>
              {r.description && <p className="mt-1 text-sm text-gray-500">{r.description}</p>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Tạo roadmap graph page**

```typescript
// apps/web/app/roadmap/[slug]/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RoadmapGraph, GraphNode, GraphEdge } from '@vizteck/graph';

export default function RoadmapPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [data, setData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[]; title: string } | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  useEffect(() => {
    fetch(`${apiUrl}/api/roadmaps/${params.slug}`)
      .then(r => r.json())
      .then(d => setData({
        title: d.roadmap?.title ?? params.slug,
        nodes: (d.nodes ?? []).map((n: any) => ({
          id: n.id, type: n.type, title: n.title,
          positionX: n.positionX, positionY: n.positionY,
          targetRoadmapId: n.targetRoadmapId, content: n.content,
        })),
        edges: (d.edges ?? []).map((e: any) => ({
          id: e.id, sourceId: e.sourceId, targetId: e.targetId, label: e.label,
        })),
      }));
  }, [params.slug, apiUrl]);

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === 'ROADMAP' && node.targetRoadmapId) {
      // Fetch target roadmap slug, then navigate
      fetch(`${apiUrl}/api/roadmaps/${node.targetRoadmapId}`)
        .then(r => r.json())
        .then(d => { if (d.roadmap?.slug) router.push(`/roadmap/${d.roadmap.slug}`); });
    } else if (node.type === 'LESSON') {
      router.push(`/roadmap/${params.slug}/node/${node.id}`);
    }
  };

  if (!data) return <div className="flex h-96 items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-gray-900">{data.title}</h2>
      <div className="h-[70vh] rounded-lg border border-gray-200 bg-white shadow-sm">
        <RoadmapGraph nodes={data.nodes} edges={data.edges} mode="view" onNodeClick={handleNodeClick} />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Tạo lesson page**

```typescript
// apps/web/app/roadmap/[slug]/node/[id]/page.tsx
import Link from 'next/link';
import { getNode } from '../../../../../lib/api';

export default async function LessonPage({ params }: { params: { slug: string; id: string } }) {
  const { node } = await getNode(params.id);
  const content = node?.content ? JSON.parse(node.content) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/roadmap/${params.slug}`} className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Back to roadmap
      </Link>
      <h2 className="mb-6 text-3xl font-bold text-gray-900">{node?.title}</h2>
      <div className="rounded-lg bg-white p-6 shadow-sm">
        {content ? (
          <div className="prose prose-gray max-w-none">
            {content.map((block: any, i: number) => (
              <p key={i}>{block.content?.map((c: any) => c.text).join('') ?? ''}</p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No content yet.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Install và verify**

```bash
cd apps/web && pnpm install && pnpm dev
```

Expected: Next.js tại http://localhost:3001. Home page hiện danh sách roadmaps (nếu api-gateway và svc-roadmap đang chạy).

- [ ] **Step 10: Commit**

```bash
git add apps/web/
git commit -m "feat: add web app with roadmap viewer and lesson pages"
```

---

### Task 9: apps/admin — CMS với Graph Editor và Lesson Editor

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/.env.example`
- Create: `apps/admin/tailwind.config.ts`
- Create: `apps/admin/postcss.config.js`
- Create: `apps/admin/app/globals.css`
- Create: `apps/admin/app/layout.tsx`
- Create: `apps/admin/app/login/page.tsx`
- Create: `apps/admin/app/roadmaps/page.tsx`
- Create: `apps/admin/app/roadmaps/new/page.tsx`
- Create: `apps/admin/app/roadmaps/[id]/page.tsx`
- Create: `apps/admin/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`
- Create: `apps/admin/lib/api.ts`
- Create: `apps/admin/lib/auth.ts`
- Create: `apps/admin/components/LessonEditor.tsx`

**Interfaces:**
- Consumes: `@vizteck/ui` (Button, Card), `@vizteck/graph` (RoadmapGraph, GraphNode, GraphEdge)
- Consumes: `NEXT_PUBLIC_API_URL/api/*` với `Authorization: Bearer <token>`
- Produces: Admin CMS tại port 3002

- [ ] **Step 1: Tạo package.json**

```json
{
  "name": "@vizteck/admin",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start --port 3002"
  },
  "dependencies": {
    "@vizteck/ui": "workspace:*",
    "@vizteck/graph": "workspace:*",
    "@blocknote/core": "^0.19.0",
    "@blocknote/react": "^0.19.0",
    "@blocknote/mantine": "^0.19.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Tạo config files**

```typescript
// apps/admin/next.config.ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  transpilePackages: ['@vizteck/ui', '@vizteck/graph'],
};
export default nextConfig;
```

```typescript
// apps/admin/tailwind.config.ts
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}', '../../packages/graph/src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

```javascript
// apps/admin/postcss.config.js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

```json
// apps/admin/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Tạo .env.example và copy**

```
# apps/admin/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3000
```

```bash
cp apps/admin/.env.example apps/admin/.env.local
```

- [ ] **Step 4: Tạo auth utility**

```typescript
// apps/admin/lib/auth.ts
export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

export const setToken = (token: string) => localStorage.setItem('admin_token', token);

export const clearToken = () => localStorage.removeItem('admin_token');

export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
```

- [ ] **Step 5: Tạo API client**

```typescript
// apps/admin/lib/api.ts
import { authHeaders } from './auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const getRoadmaps = () => req('/api/roadmaps');

export const getRoadmapById = (id: string) => req(`/api/roadmaps/${id}`);

export const createRoadmap = (data: { slug: string; title: string; description?: string }) =>
  req('/api/roadmaps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });

export const upsertGraph = (id: string, nodes: any[], edges: any[]) =>
  req(`/api/roadmaps/${id}/graph`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ nodes, edges }),
  });

export const getNode = (id: string) => req(`/api/nodes/${id}`);
```

- [ ] **Step 6: Tạo LessonEditor component**

```typescript
// apps/admin/components/LessonEditor.tsx
'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

interface Props {
  initialContent?: any[];
  onChange?: (content: any[]) => void;
}

export function LessonEditor({ initialContent, onChange }: Props) {
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : [{ type: 'paragraph', content: '' }],
  });

  return (
    <div className="min-h-[400px] rounded-lg border border-gray-200 bg-white">
      <BlockNoteView editor={editor} onChange={() => onChange?.(editor.document as any[])} />
    </div>
  );
}
```

- [ ] **Step 7: Tạo layout và globals.css**

```css
/* apps/admin/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```typescript
// apps/admin/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'VizTeckStack Admin' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <span className="text-xl font-bold text-gray-900">
            VizTeckStack <span className="text-blue-600">Admin</span>
          </span>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Tạo login page**

```typescript
// apps/admin/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vizteck/ui';
import { setToken } from '../../lib/auth';

export default function LoginPage() {
  const [token, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const handleLogin = async () => {
    const res = await fetch(`${apiUrl}/api/roadmaps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { setError('Invalid token'); return; }
    setToken(token);
    router.push('/roadmaps');
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-bold text-gray-900">Admin Login</h1>
        <input
          type="password"
          placeholder="Admin token"
          value={token}
          onChange={e => setTokenInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <Button onClick={handleLogin} className="w-full">Login</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Tạo roadmaps list page**

```typescript
// apps/admin/app/roadmaps/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@vizteck/ui';
import { getRoadmaps } from '../../lib/api';

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);

  useEffect(() => { getRoadmaps().then(d => setRoadmaps(d.roadmaps ?? [])); }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Roadmaps</h2>
        <Link href="/roadmaps/new"><Button>+ New Roadmap</Button></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roadmaps.map(r => (
          <Link key={r.id} href={`/roadmaps/${r.id}`}>
            <Card>
              <h3 className="font-semibold text-gray-900">{r.title}</h3>
              <p className="mt-1 text-xs text-gray-400">/{r.slug}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Tạo new roadmap page**

```typescript
// apps/admin/app/roadmaps/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vizteck/ui';
import { createRoadmap } from '../../../lib/api';

export default function NewRoadmapPage() {
  const router = useRouter();
  const [form, setForm] = useState({ slug: '', title: '', description: '' });
  const [error, setError] = useState('');

  const handle = async () => {
    try {
      const r = await createRoadmap(form);
      router.push(`/roadmaps/${r.id}`);
    } catch {
      setError('Failed — check your admin token in /login.');
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">New Roadmap</h2>
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        {(['slug', 'title', 'description'] as const).map(f => (
          <div key={f}>
            <label className="mb-1 block text-sm font-medium text-gray-700 capitalize">{f}</label>
            <input
              value={form[f]}
              onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={handle} className="w-full">Create Roadmap</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Tạo graph editor page**

```typescript
// apps/admin/app/roadmaps/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoadmapGraph, GraphNode, GraphEdge } from '@vizteck/graph';
import { getRoadmapById, upsertGraph } from '../../../lib/api';

export default function GraphEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[]; title: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getRoadmapById(params.id).then(d => setData({
      title: d.roadmap?.title ?? '',
      nodes: (d.nodes ?? []).map((n: any) => ({
        id: n.id, type: n.type, title: n.title,
        positionX: n.positionX, positionY: n.positionY,
        targetRoadmapId: n.targetRoadmapId, content: n.content,
      })),
      edges: (d.edges ?? []).map((e: any) => ({
        id: e.id, sourceId: e.sourceId, targetId: e.targetId, label: e.label,
      })),
    }));
  }, [params.id]);

  const handleSave = async (nodes: GraphNode[], edges: GraphEdge[]) => {
    setSaving(true);
    setSaved(false);
    try {
      await upsertGraph(params.id, nodes, edges);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === 'LESSON') {
      router.push(`/roadmaps/${params.id}/nodes/${node.id}`);
    }
  };

  if (!data) return <div className="flex h-96 items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">{data.title}</h2>
        {saving && <span className="text-sm text-gray-500">Saving...</span>}
        {saved && !saving && <span className="text-sm text-green-600">Saved ✓</span>}
      </div>
      <p className="mb-3 text-sm text-gray-500">Click a Lesson node to edit its content. Drag to reposition. Click "Save Graph" to persist.</p>
      <div className="relative h-[75vh] rounded-lg border border-gray-200 bg-white shadow-sm">
        <RoadmapGraph
          nodes={data.nodes}
          edges={data.edges}
          mode="edit"
          onSave={handleSave}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 12: Tạo lesson editor page**

```typescript
// apps/admin/app/roadmaps/[id]/nodes/[nodeId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@vizteck/ui';
import { getNode, getRoadmapById, upsertGraph } from '../../../../../lib/api';

const LessonEditor = dynamic(
  () => import('../../../../../components/LessonEditor').then(m => ({ default: m.LessonEditor })),
  { ssr: false },
);

export default function LessonEditorPage({ params }: { params: { id: string; nodeId: string } }) {
  const router = useRouter();
  const [node, setNode] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNode(params.nodeId).then(d => {
      setNode(d.node);
      try { setContent(d.node?.content ? JSON.parse(d.node.content) : []); }
      catch { setContent([]); }
    });
  }, [params.nodeId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { nodes, edges } = await getRoadmapById(params.id);
      const updated = nodes.map((n: any) =>
        n.id === params.nodeId ? { ...n, content: JSON.stringify(content) } : n,
      );
      await upsertGraph(params.id, updated, edges);
      router.push(`/roadmaps/${params.id}`);
    } finally {
      setSaving(false);
    }
  };

  if (!node) return <div className="flex h-96 items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => router.push(`/roadmaps/${params.id}`)} className="mb-4 text-sm text-blue-600 hover:underline">
        ← Back to graph editor
      </button>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{node.title}</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Lesson'}
        </Button>
      </div>
      <LessonEditor initialContent={content} onChange={setContent} />
    </div>
  );
}
```

- [ ] **Step 13: Install và verify**

```bash
cd apps/admin && pnpm install && pnpm dev
```

Expected: Admin CMS tại http://localhost:3002. Login page visible tại `/login`. Sau khi login với token `supersecret` → redirect sang `/roadmaps`.

- [ ] **Step 14: Commit**

```bash
git add apps/admin/
git commit -m "feat: add admin CMS with graph editor and BlockNote lesson editor"
```

---

## Verification Checklist

Sau khi hoàn thành tất cả tasks, chạy toàn bộ stack:

```bash
# Terminal 1: Start PostgreSQL
docker compose up -d postgres

# Terminal 2: Generate proto và start services
pnpm proto:gen
cd apps/svc-roadmap && pnpm dev    # :5001

# Terminal 3
cd apps/api-gateway && pnpm dev    # :3000

# Terminal 4
cd apps/web && pnpm dev            # :3001

# Terminal 5
cd apps/admin && pnpm dev          # :3002
```

| Check | URL | Expected |
|---|---|---|
| API health | http://localhost:3000/api/roadmaps | JSON list |
| GraphQL playground | http://localhost:3000/graphql | Apollo sandbox |
| Swagger UI | http://localhost:3000/api-docs | Swagger docs |
| Public viewer | http://localhost:3001 | Roadmap cards |
| Roadmap graph | http://localhost:3001/roadmap/fullstack | Graph with Frontend + Backend nodes |
| Admin login | http://localhost:3002/login | Login form |
| Admin editor | http://localhost:3002/roadmaps | Roadmap list |
