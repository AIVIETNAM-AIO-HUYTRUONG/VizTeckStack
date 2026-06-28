# VizTeckStack

Polyglot monorepo — public roadmap viewer + admin CMS + NestJS API gateway + NestJS gRPC service.

## Architecture

```
Browser
  apps/web   (Next.js 15, port 3001)  — public SSG roadmap viewer
  apps/admin (Next.js 15, port 3002)  — CMS + graph editor

      ↓ GraphQL / REST

  apps/api-gateway (NestJS, port 3000)
    /graphql    — Apollo Server
    /api/*      — REST controllers
    /api-docs   — Swagger UI
    AdminGuard  — Bearer token via ADMIN_TOKEN env var

      ↓ gRPC

  apps/svc-roadmap (NestJS microservice, port 5001)
    → packages/db (Prisma + PostgreSQL)

services/svc-python  — future FastAPI gRPC service (port 5002)
services/svc-rust    — future Axum gRPC service (port 5003)
```

---

## Folder Architecture

### packages/

| Package | Name | Role |
|---------|------|------|
| `packages/core` | `@vizteck/core` | **Single source of truth for all feature logic** — services, hooks, and UI components organized by feature. Apps import from here. |
| `packages/db` | `@vizteck/db` | Prisma client singleton + all generated types |
| `packages/proto` | `@vizteck/proto` | gRPC contract definitions (`.proto` → TypeScript) |
| `packages/graphql-client` | `@vizteck/graphql-client` | Generated Apollo operations from the GraphQL schema |
| `packages/ui` | `@vizteck/ui` | Generic UI primitives: `Button`, `Card`, `NodeBadge` |
| `packages/graph` | `@vizteck/graph` | **Shim** — re-exports everything from `@vizteck/core` |
| `packages/lesson` | `@vizteck/lesson` | **Shim** — re-exports everything from `@vizteck/core` |

### packages/core — feature-first structure

All application feature logic lives here, grouped by domain with a `/ui` subfolder for display components:

```
packages/core/src/
  roadmap/
    types.ts            — Roadmap, CreateRoadmapInput, UpdateRoadmapInput, ModalState, ApolloLike
    constants.ts        — STATUS_CYCLE, STATUS_LABEL, STATUS_CLASS
    roadmap.service.ts  — getRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap, cycleStatus
    useRoadmaps.ts      — list state + CRUD handlers (accepts ApolloLike client)

  graph/
    types.ts            — NodeItem, EdgeItem, GraphNodeType, EditorNode, EditorEdge, GraphData,
                          RoadmapEntry, SidePanelState
    graph.service.ts    — loadGraph, saveGraph, normalizeNodeType, makeSnapshot
    useGraphEditor.ts   — graph load/save state, dirty tracking, status update
    useGraphDraft.ts    — sessionStorage draft persistence side-effect
    ui/
      RoadmapGraph.tsx  — <RoadmapGraph> built on @xyflow/react (mode="view" | "edit")
      RoadmapNode.tsx   — custom node renderer

  lesson/
    types.ts            — LessonNode, SaveStatus, BreadcrumbItem, LessonShellNode,
                          PageTreeNode, PageTree, UseLessonEditorResult
    lesson.service.ts   — fetchLesson, updateLessonContent, updateLessonTitle,
                          updateNodeCover, updateNodeIcon, fetchBreadcrumb, fetchRoadmapTree
    useLessonEditor.ts  — fetch + save state, titleSaveStatus
    useLessonPageShell.ts — optimistic cover/icon state with API sync + rollback
    usePageTree.ts      — fetch roadmap page tree for sidebar
    ui/
      LessonEditor.tsx     — BlockNote editable editor
      LessonViewer.tsx     — BlockNote read-only renderer
      LessonPageShell.tsx  — Notion-style page layout (slots: coverSlot, titleSlot, contentSlot)
      LessonPageLayout.tsx — outer layout with sidebar
      CoverDisplay.tsx     — cover image display
      BreadcrumbDisplay.tsx
      PageTreeSidebar.tsx
      PageTreeItem.tsx
      SearchModal.tsx
      useSearch.ts
      useSearchModal.ts

  index.ts              — barrel export for everything above
```

**Key design principle (Dependency Inversion):** All service functions and hooks in `packages/core` accept `ApolloLike` as their first parameter — they never import a singleton client. Apps inject their own client via thin wrapper hooks.

### apps/admin — layout + admin-only UI

```
apps/admin/src/
  app/                          — Next.js App Router pages
  components/                   — AdminLayout, ThemeToggle, ConfirmDialog
  features/
    roadmaps/
      hooks/useRoadmaps.ts      — thin wrapper: useAdminRoadmaps() injects adminApolloClient
      components/RoadmapModal.tsx
    graph-editor/
      hooks/useGraphEditor.ts   — thin wrapper: useAdminGraphEditor(id, slug)
      hooks/useGraphDraft.ts    — re-export from @vizteck/core
      hooks/useNodeActions.ts   — stays in admin (uses Next.js useRouter with admin URL patterns)
      components/GraphToolbar, NodeInventory, NodeSidePanel
    lessons/
      hooks/useLessonEditor.ts  — thin wrapper: useAdminLessonEditor(nodeId)
      hooks/useLessonPageShell.ts — thin wrapper: useAdminLessonPageShell(nodeId, cover, icon)
      hooks/usePageTree.ts      — thin wrapper: useAdminPageTree(nodeId)
      components/CoverImage, CoverUploadModal, IconPicker, LessonTitleEditor
  lib/
    apolloClient.ts             — adminApolloClient singleton (injected into useAdmin* wrappers)
    api.ts                      — apiFetch (attaches Bearer token, redirects on 401)
```

Pages import `useAdmin*` wrappers from their feature hooks; admin-only UI components (upload, emoji picker) stay in `apps/admin/src/features/`.

### apps/web — public viewer

```
apps/web/src/
  app/                                   — Next.js App Router pages
  features/
    roadmap/components/RoadmapGraphView  — imports RoadmapGraph from @vizteck/core
    lesson/components/LessonLayout       — imports LessonPageShell, LessonPageLayout from @vizteck/core
```

All data in `apps/web` is fetched server-side via GraphQL (Apollo) using `{ cache: 'no-store' }` so the viewer always reflects current admin state.

---

## Dependency rule

```
apps/*          → may import from packages/*
packages/core   → imports from packages/graphql-client, @xyflow/react, @blocknote, packages/ui
packages/graph  → shim, imports only from packages/core
packages/lesson → shim, imports only from packages/core
packages/*      → must NOT import from apps/*
services/*      → isolated, communicates only via gRPC
```

---

## Quick start

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Install dependencies
pnpm install

# 3. Generate gRPC types
pnpm proto:gen

# 4. Push schema + seed demo data
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:push
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:seed

# 5. Run all apps
pnpm dev
```

Open `http://localhost:3001` (viewer) or `http://localhost:3002` (admin).  
Default admin token: `supersecret` — set in `apps/api-gateway/.env` as `ADMIN_TOKEN`.

## Common commands

```bash
pnpm dev          # Start all apps in watch mode
pnpm build        # Build all packages (dependency-ordered via Turborepo)
pnpm test         # Run all tests (skips e2e)
pnpm lint         # Lint all packages

# Single package
pnpm --filter @vizteck/admin test
pnpm --filter @vizteck/lesson test
pnpm --filter @vizteck/core build

# DB operations
pnpm --filter @vizteck/db db:push     # Push schema (no migration file)
pnpm --filter @vizteck/db db:migrate  # Create + run migration
pnpm --filter @vizteck/db db:seed     # Seed demo data
pnpm --filter @vizteck/db db:studio   # Open Prisma Studio

# Force proto regeneration (bypasses Turborepo cache)
cd packages/proto && node generate.js
```

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://vizteck:vizteck@localhost:5432/vizteckstack` | `packages/db`, `apps/svc-roadmap` |
| `ROADMAP_SERVICE_URL` | `localhost:5001` | `apps/api-gateway` |
| `ADMIN_TOKEN` | `supersecret` | `apps/api-gateway` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | `apps/web`, `apps/admin` |
| `UPLOADTHING_TOKEN` | _(required)_ | `apps/admin` — cover image uploads |

Copy the `.env.example` in each app to `.env` (or `.env.local` for Next.js) before running.

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
- **Database**: PostgreSQL via Prisma ORM
- **API contracts**: Protocol Buffers (gRPC)
- **GraphQL**: Apollo Server + Apollo Client
- **Testing**: Vitest + @testing-library/react (admin/lesson), Jest (NestJS services)
