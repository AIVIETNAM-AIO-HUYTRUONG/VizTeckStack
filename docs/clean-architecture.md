# Clean Architecture — VizTeckStack Backend

> Tài liệu này mô tả kiến trúc target sau khi gộp `api-gateway` và `svc-roadmap` thành một service theo nguyên tắc Clean Architecture (Uncle Bob).

---

## 1. Tổng quan 4 layer

```
┌────────────────────────────────────────────────────┐
│  INTERFACES  (controllers, resolvers, guards)       │  ← Layer ngoài cùng
├────────────────────────────────────────────────────┤
│  APPLICATION  (use-cases)                          │
├────────────────────────────────────────────────────┤
│  DOMAIN  (entities, repository interfaces)         │  ← Layer trong nhất
├────────────────────────────────────────────────────┤
│  INFRASTRUCTURE  (Prisma, DB)                      │  ← Tách riêng, impl domain
└────────────────────────────────────────────────────┘
```

**Quy tắc duy nhất:** Dependency chỉ trỏ vào trong.
- `interfaces` → `application` → `domain` ✅
- `infrastructure` → `domain` ✅
- `domain` → bất kỳ thứ gì bên ngoài ❌
- `application` → `infrastructure` ❌ (phải qua interface)

---

## 2. Folder structure

```
apps/api-gateway/src/
│
├── domain/
│   ├── entities/
│   │   ├── roadmap.entity.ts         ← Roadmap, RoadmapStatus
│   │   ├── node.entity.ts            ← Node, NodeType
│   │   └── edge.entity.ts            ← Edge
│   └── repositories/
│       └── roadmap.repository.ts     ← interface IRoadmapRepository (contract)
│
├── application/
│   └── use-cases/
│       ├── roadmap/
│       │   ├── list-roadmaps.use-case.ts
│       │   ├── get-roadmap.use-case.ts
│       │   ├── create-roadmap.use-case.ts
│       │   ├── update-roadmap.use-case.ts
│       │   ├── delete-roadmap.use-case.ts
│       │   ├── upsert-graph.use-case.ts
│       │   ├── get-roadmap-tree.use-case.ts
│       │   └── search-nodes.use-case.ts
│       └── node/
│           ├── get-node.use-case.ts
│           ├── get-node-breadcrumb.use-case.ts
│           ├── update-node-content.use-case.ts
│           ├── update-node-title.use-case.ts
│           ├── update-node-cover.use-case.ts
│           └── update-node-icon.use-case.ts
│
├── infrastructure/
│   └── database/
│       ├── prisma-roadmap.repository.ts  ← implements IRoadmapRepository
│       └── database.module.ts
│
├── interfaces/
│   ├── graphql/
│   │   ├── roadmap.resolver.ts
│   │   ├── node.resolver.ts
│   │   └── dto/
│   │       └── roadmap.dto.ts
│   ├── rest/
│   │   ├── roadmap.rest.controller.ts
│   │   └── node.rest.controller.ts
│   └── auth/
│       └── admin.guard.ts
│
├── app.module.ts
└── main.ts
```

---

## 3. Luồng request thực tế — "Lấy danh sách roadmaps"

### Hiện tại (có gRPC)
```
Browser
  → GraphQL query "roadmaps"
  → roadmap.resolver.ts          gọi this.grpc.getRoadmaps()
  → roadmap.grpc-client.ts       gửi gRPC sang port 5001
  → [svc-roadmap] roadmap.controller.ts   nhận gRPC
  → [svc-roadmap] roadmap.service.ts      gọi db.roadmap.findMany()
  → PostgreSQL
```

### Sau khi refactor (Clean Architecture, không gRPC)
```
Browser
  → GraphQL query "roadmaps"
  → interfaces/graphql/roadmap.resolver.ts    gọi ListRoadmapsUseCase
  → application/use-cases/list-roadmaps.ts   gọi IRoadmapRepository.findAll()
  → infrastructure/prisma-roadmap.repository.ts   gọi db.roadmap.findMany()
  → PostgreSQL
```

---

## 4. Mỗi layer làm gì — ví dụ cụ thể

### Layer 1: DOMAIN

**Không import gì cả. Chỉ định nghĩa shape của dữ liệu và contract.**

```ts
// domain/entities/roadmap.entity.ts
export type RoadmapStatus = 'DRAFT' | 'PUBLIC' | 'PRIVATE';

export interface Roadmap {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: RoadmapStatus;
}
```

```ts
// domain/repositories/roadmap.repository.ts
import type { Roadmap, Node, Edge } from '../entities';

export interface IRoadmapRepository {
  findAll(): Promise<Roadmap[]>;
  findBySlug(slug: string): Promise<{ roadmap: Roadmap; nodes: Node[]; edges: Edge[] } | null>;
  findNodeById(id: string): Promise<Node | null>;
  create(data: CreateRoadmapData): Promise<Roadmap>;
  update(id: string, data: UpdateRoadmapData): Promise<Roadmap>;
  delete(id: string): Promise<void>;
  upsertGraph(roadmapId: string, nodes: NodeInput[], edges: EdgeInput[]): Promise<void>;
  updateNodeField(id: string, data: Partial<Pick<Node, 'content' | 'title' | 'coverImage' | 'icon'>>): Promise<Node>;
  // ... các method khác
}
```

---

### Layer 2: APPLICATION

**Không biết GraphQL, REST, hay Prisma. Chỉ biết domain.**

```ts
// application/use-cases/roadmap/list-roadmaps.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { IRoadmapRepository } from '../../domain/repositories/roadmap.repository';
import type { Roadmap } from '../../domain/entities/roadmap.entity';

@Injectable()
export class ListRoadmapsUseCase {
  constructor(
    @Inject('IRoadmapRepository')
    private readonly repo: IRoadmapRepository,
  ) {}

  execute(): Promise<Roadmap[]> {
    return this.repo.findAll();
  }
}
```

```ts
// application/use-cases/node/update-node-content.use-case.ts
@Injectable()
export class UpdateNodeContentUseCase {
  constructor(
    @Inject('IRoadmapRepository')
    private readonly repo: IRoadmapRepository,
  ) {}

  execute(id: string, content: string): Promise<Node> {
    const parsed = content ? JSON.parse(content) : null;
    return this.repo.updateNodeField(id, { content: parsed });
  }
}
```

---

### Layer 3: INTERFACES

**Nhận HTTP/GraphQL, map sang use-case calls, trả về response format. Không biết Prisma.**

```ts
// interfaces/graphql/roadmap.resolver.ts
import { Resolver, Query } from '@nestjs/graphql';
import { ListRoadmapsUseCase } from '../../application/use-cases/roadmap/list-roadmaps.use-case';
import { RoadmapDto } from './dto/roadmap.dto';

@Resolver()
export class RoadmapResolver {
  constructor(private readonly listRoadmaps: ListRoadmapsUseCase) {}

  @Query(() => [RoadmapDto])
  roadmaps(): Promise<RoadmapDto[]> {
    return this.listRoadmaps.execute();
  }
}
```

So với **hiện tại** — resolver cũ gọi `this.grpc.getRoadmaps()`, resolver mới gọi `this.listRoadmaps.execute()`. Đó là thay đổi duy nhất ở layer này.

---

### Layer 4: INFRASTRUCTURE

**Implements interface từ domain bằng Prisma thật. Layer trên không biết Prisma tồn tại.**

```ts
// infrastructure/database/prisma-roadmap.repository.ts
import { Injectable } from '@nestjs/common';
import { db, Prisma } from '@vizteck/db';
import { IRoadmapRepository } from '../../domain/repositories/roadmap.repository';
import type { Roadmap, Node } from '../../domain/entities';

@Injectable()
export class PrismaRoadmapRepository implements IRoadmapRepository {
  findAll(): Promise<Roadmap[]> {
    return db.roadmap.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findBySlug(slug: string) {
    const r = await db.roadmap.findUnique({
      where: { slug },
      include: { nodes: { include: { edges: true } } },
    });
    if (!r) return null;
    return {
      roadmap: r,
      nodes: r.nodes,
      edges: r.nodes.flatMap((n) => n.edges),
    };
  }

  updateNodeField(id: string, data: Partial<Node>): Promise<Node> {
    return db.node.update({ where: { id }, data }) as Promise<Node>;
  }

  // ... implement toàn bộ IRoadmapRepository
}
```

> Logic này lấy trực tiếp từ `svc-roadmap/roadmap.service.ts` hiện tại — chỉ đổi tên method và bỏ wrapper proto.

---

## 5. Dependency injection — cách NestJS nối các layer

```ts
// infrastructure/database/database.module.ts
import { Module } from '@nestjs/common';
import { PrismaRoadmapRepository } from './prisma-roadmap.repository';

@Module({
  providers: [
    {
      provide: 'IRoadmapRepository',      // ← token mà use-cases dùng để inject
      useClass: PrismaRoadmapRepository,  // ← implementation thật
    },
  ],
  exports: ['IRoadmapRepository'],
})
export class DatabaseModule {}
```

NestJS DI container là cầu nối: khi use-case hỏi `'IRoadmapRepository'`, nó nhận `PrismaRoadmapRepository`. Use-case không biết class đó tồn tại.

---

## 6. So sánh trước / sau

| | Hiện tại | Sau refactor |
|---|---|---|
| `roadmap.resolver.ts` | gọi `grpc.getRoadmaps()` | gọi `listRoadmapsUseCase.execute()` |
| `roadmap.grpc-client.ts` | proxy gRPC calls | **XÓA** |
| `svc-roadmap/roadmap.service.ts` | Prisma logic | → `prisma-roadmap.repository.ts` |
| `svc-roadmap/roadmap.controller.ts` | nhận gRPC | **XÓA** |
| Business logic nằm ở đâu | `roadmap.service.ts` (gộp) | `use-cases/` (tách nhỏ theo action) |
| Test | Mock gRPC client | Mock `IRoadmapRepository` |

---

## 7. Thứ tự implement

1. `domain/` — entities + IRoadmapRepository interface
2. `infrastructure/` — PrismaRoadmapRepository (copy logic từ svc-roadmap service)
3. `application/` — từng use-case một
4. `interfaces/` — resolver và controller inject use-cases thay vì gRPC client
5. Xóa `roadmap.grpc-client.ts` và `apps/svc-roadmap`
