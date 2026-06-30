# VizTeckStack

Monorepo đa ngôn ngữ — viewer roadmap công khai + CMS quản trị + NestJS API gateway + NestJS gRPC service.

## Kiến trúc tổng quan

```
Browser
  apps/web   (Next.js 15, port 3001)  — Viewer roadmap công khai (SSG)
  apps/admin (Next.js 15, port 3002)  — CMS + graph editor

      ↓ GraphQL / REST

  apps/api-gateway (NestJS, port 3000)
    /graphql    — Apollo Server
    /api/*      — REST controllers
    /api-docs   — Swagger UI
    AdminGuard  — Bearer token qua biến môi trường ADMIN_TOKEN

      ↓ gRPC

  apps/svc-roadmap (NestJS microservice, port 5001)
    → packages/db (Prisma + PostgreSQL)

services/svc-python  — FastAPI gRPC service (port 5002, tương lai)
services/svc-rust    — Axum gRPC service (port 5003, tương lai)
```

---

## Kiến trúc thư mục

### packages/

| Package | Tên npm | Vai trò |
|---------|---------|---------|
| `packages/core` | `@vizteck/core` | **Nguồn sự thật duy nhất** — toàn bộ logic nghiệp vụ, services, hooks, UI components |
| `packages/db` | `@vizteck/db` | Prisma client singleton + tất cả generated types |
| `packages/proto` | `@vizteck/proto` | Định nghĩa gRPC contract (`.proto` → TypeScript) |
| `packages/graphql-client` | `@vizteck/graphql-client` | Apollo operations được generate từ GraphQL schema |
| `packages/ui` | `@vizteck/ui` | UI primitives dùng chung: `Button`, `Card`, `NodeBadge` |
| `packages/graph` | `@vizteck/graph` | **Shim** — chỉ re-export từ `@vizteck/core` |
| `packages/lesson` | `@vizteck/lesson` | **Shim** — chỉ re-export từ `@vizteck/core` |

### packages/core — cấu trúc feature-first

Toàn bộ logic nghiệp vụ nằm ở đây. Pattern: mỗi feature có `types.ts`, `*.service.ts`, `components/`, `hooks/`, `utils/`. Sub-feature là folder lồng nhau theo cùng pattern.

```
packages/core/src/
  roadmap/
    types.ts              — Roadmap, ApolloLike, CreateRoadmapInput, UpdateRoadmapInput
    roadmap.service.ts    — getRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap, cycleStatus
    hooks/
      useRoadmaps.ts      — trạng thái danh sách + CRUD handlers
    utils/
      constants.ts        — STATUS_CYCLE, STATUS_LABEL, STATUS_CLASS
    graph/                            ← sub_feature
      types.ts            — NodeItem, EdgeItem, EditorNode, EditorEdge, GraphData, RoadmapEntry
      graph.service.ts    — loadGraph, saveGraph, normalizeNodeType, makeSnapshot
      components/
        RoadmapGraph.tsx  — <RoadmapGraph> dùng @xyflow/react (mode="view"|"edit")
        RoadmapNode.tsx   — custom node renderer
      hooks/
        useGraphEditor.ts — load/save state, dirty tracking, cập nhật status
        useGraphDraft.ts  — draft persistence qua sessionStorage

  lesson/
    types.ts              — LessonNode, LessonShellNode, PageTree, BreadcrumbItem
    lesson.service.ts     — fetchLesson, updateLessonContent, updateNodeCover, fetchRoadmapTree…
    components/           ← chỉ layout
      LessonPageShell.tsx — layout Notion-style (slots: coverSlot, titleSlot, contentSlot)
      LessonPageLayout.tsx
      BreadcrumbDisplay.tsx
      CoverDisplay.tsx
    hooks/
      useLessonPageShell.ts — cập nhật cover/icon optimistic với sync API + rollback
    utils/utils.ts
    content-editor/                   ← sub_feature
      components/LessonEditor.tsx, LessonViewer.tsx
      hooks/useLessonEditor.ts
    page-tree/                        ← sub_feature
      components/PageTreeSidebar.tsx, PageTreeItem.tsx
      hooks/usePageTree.ts
    search/                           ← sub_feature
      components/SearchModal.tsx, SearchPreview.tsx, SearchResultItem.tsx
      hooks/useSearch.ts, useSearchModal.ts

  index.ts              — barrel export (public API — symbols không thay đổi)
```

**Nguyên tắc thiết kế (Dependency Inversion):** Tất cả service và hook nhận `ApolloLike` làm tham số đầu tiên — không bao giờ import singleton client. Apps inject client qua thin wrapper hooks.

### apps/admin — layout + admin-only UI

```
apps/admin/src/
  app/                                — Next.js App Router pages
  components/                         — AdminLayout, ThemeToggle, ConfirmDialog, ApolloProvider
  hooks/                              — useAuthGuard, useRouteGuard (dùng chung toàn app)
  features/
    roadmaps/
      hooks/useRoadmaps.ts            — thin wrapper: useAdminRoadmaps() inject adminApolloClient
      components/RoadmapModal.tsx
      graph-editor/                   ← sub_feature
        hooks/useGraphEditor.ts       — thin wrapper: useAdminGraphEditor(id, slug)
        hooks/useGraphDraft.ts        — re-export từ @vizteck/core
        hooks/useNodeActions.ts       — giữ ở admin (dùng Next.js useRouter + URL patterns)
        components/GraphToolbar, NodeInventory, NodeSidePanel
    lessons/
      hooks/useLessonPageShell.ts     — thin wrapper: useAdminLessonPageShell(nodeId, cover, icon)
      components/CoverImage, CoverUploadModal, IconPicker, LessonTitleEditor
      content-editor/                 ← sub_feature
        hooks/useLessonEditor.ts      — thin wrapper: useAdminLessonEditor(nodeId)
      page-tree/                      ← sub_feature
        hooks/usePageTree.ts          — thin wrapper: useAdminPageTree(nodeId)
      search/                         ← sub_feature
        SearchModalWrapper.tsx        — kết nối @vizteck/core SearchModal với admin Apollo client
  lib/
    apolloClient.ts                   — adminApolloClient singleton (inject vào useAdmin* hooks)
    api.ts                            — apiFetch (đính kèm Bearer token, redirect khi 401)
```

Pages import `useAdmin*` wrappers từ feature hooks; admin-only UI (upload, emoji picker) ở trong `apps/admin/src/features/`.

### apps/web — viewer công khai

```
apps/web/src/
  app/                                   — Next.js App Router pages
  features/
    roadmap/components/RoadmapGraphView  — import RoadmapGraph từ @vizteck/core
    lesson/components/LessonLayout       — import LessonPageShell, LessonPageLayout từ @vizteck/core
    search/                              — SearchContext + SearchModalWrapper
```

Tất cả dữ liệu trong `apps/web` được fetch phía server qua GraphQL dùng `{ cache: 'no-store' }` để viewer luôn phản ánh trạng thái admin hiện tại.

---

## Quy tắc dependency

```
apps/*          → có thể import từ packages/*
packages/core   → import từ packages/graphql-client, @xyflow/react, @blocknote, packages/ui
packages/graph  → shim, chỉ import từ packages/core
packages/lesson → shim, chỉ import từ packages/core
packages/*      → KHÔNG được import từ apps/*
services/*      → độc lập, chỉ giao tiếp qua gRPC
```

---

## Khởi động nhanh

```bash
# 1. Khởi động PostgreSQL
docker compose up -d postgres

# 2. Cài đặt dependencies
pnpm install

# 3. Generate gRPC types
pnpm proto:gen

# 4. Push schema + seed dữ liệu mẫu
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:push
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:seed

# 5. Chạy tất cả apps
pnpm dev
```

Mở `http://localhost:3001` (viewer) hoặc `http://localhost:3002` (admin).  
Admin token mặc định: `supersecret` — đặt trong `apps/api-gateway/.env` là `ADMIN_TOKEN`.

## Lệnh thường dùng

```bash
pnpm dev          # Chạy tất cả apps ở watch mode
pnpm build        # Build tất cả packages (theo thứ tự dependency qua Turborepo)
pnpm test         # Chạy tất cả tests (bỏ qua e2e)
pnpm lint         # Lint tất cả packages

# Single package
pnpm --filter @vizteck/admin test
pnpm --filter @vizteck/lesson test
pnpm --filter @vizteck/core build

# Thao tác DB
pnpm --filter @vizteck/db db:push     # Push schema (không tạo migration file)
pnpm --filter @vizteck/db db:migrate  # Tạo + chạy migration
pnpm --filter @vizteck/db db:seed     # Seed dữ liệu mẫu
pnpm --filter @vizteck/db db:studio   # Mở Prisma Studio

# Buộc regenerate proto (bypass Turborepo cache)
cd packages/proto && node generate.js
```

## Biến môi trường

| Biến | Mặc định | Dùng bởi |
|------|---------|---------|
| `DATABASE_URL` | `postgresql://vizteck:vizteck@localhost:5432/vizteckstack` | `packages/db`, `apps/svc-roadmap` |
| `ROADMAP_SERVICE_URL` | `localhost:5001` | `apps/api-gateway` |
| `ADMIN_TOKEN` | `supersecret` | `apps/api-gateway` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | `apps/web`, `apps/admin` |
| `UPLOADTHING_TOKEN` | _(bắt buộc)_ | `apps/admin` — upload ảnh cover |

Copy `.env.example` trong mỗi app sang `.env` (hoặc `.env.local` với Next.js) trước khi chạy.

## Tài liệu cho developer mới

| Tài liệu | Nội dung |
|----------|---------|
| [Bắt đầu](docs/onboarding/getting-started.md) | Cài đặt và chạy toàn bộ project trên máy local (~15 phút) |
| [Kiến trúc](docs/onboarding/architecture.md) | Tại sao monorepo, gRPC, feature-first, data model, data flows |
| [Quy trình làm việc](docs/onboarding/daily-workflow.md) | GitFlow hàng ngày: feature branch, PR, commit format, release, hotfix |
| [Kiểm thử](docs/onboarding/testing.md) | Vitest (admin), Jest (NestJS), Playwright E2E — cách viết và chạy tests |
| [CI/CD Pipeline](docs/onboarding/cicd.md) | 3 pipeline GitHub Actions: CI, staging deploy, production release |
| [Git Hooks](docs/onboarding/git-hooks.md) | Husky: commit-msg (Conventional Commits), pre-commit (lint+test), pre-push |
| [Cheat Sheet](docs/onboarding/cheatsheet.md) | Lệnh, port, env vars, branch naming, data model — tham chiếu nhanh |

## Tech stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 15, React 19, Tailwind CSS, `@xyflow/react`, BlockNote
- **Backend**: NestJS (API gateway + gRPC service)
- **Database**: PostgreSQL qua Prisma ORM
- **API contracts**: Protocol Buffers (gRPC)
- **GraphQL**: Apollo Server + Apollo Client
- **Kiểm thử**: Vitest + @testing-library/react (admin/core), Jest (NestJS services)
