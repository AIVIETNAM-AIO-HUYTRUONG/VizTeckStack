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

### Packages

| Package           | Name              | Purpose                                                                                                |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/proto`  | `@vizteck/proto`  | Single source of truth for gRPC contracts                                                              |
| `packages/db`     | `@vizteck/db`     | Prisma client singleton + all Prisma types                                                             |
| `packages/ui`     | `@vizteck/ui`     | Shared React components (Button, Card, NodeBadge)                                                      |
| `packages/graph`  | `@vizteck/graph`  | `<RoadmapGraph>` built on `@xyflow/react` — `mode="view"` or `mode="edit"`                             |
| `packages/lesson` | `@vizteck/lesson` | Shared BlockNote components — `<LessonEditor>` (editable, admin) and `<LessonViewer>` (read-only, web) |

## Admin frontend structure

The admin app uses a **feature-first** layout under `src/features/`:

```
src/features/
  roadmaps/
    services/roadmap.service.ts   — CRUD + cycleStatus + STATUS_* constants
    hooks/useRoadmaps.ts          — list state, modal state, CRUD handlers
    components/RoadmapModal.tsx   — create / edit modal
  graph-editor/
    services/graph.service.ts     — loadGraph, saveGraph, normalizeNodeType, makeSnapshot
    hooks/useGraphEditor.ts       — graph load/save state, dirty tracking
    hooks/useNodeActions.ts       — canvas interaction handlers (drop, connect, delete…)
    hooks/useGraphDraft.ts        — sessionStorage draft side-effect
    components/GraphToolbar.tsx
    components/NodeInventory.tsx
    components/NodeSidePanel.tsx
  lessons/
    services/lesson.service.ts    — fetchLesson, updateLessonContent, updateLessonTitle
    hooks/useLessonEditor.ts      — fetch + save state, titleSaveStatus
    components/LessonEditor.tsx   — BlockNote editor (wraps @vizteck/lesson)
    components/LessonTitleEditor.tsx — inline title with blur-to-save
```

Pages delegate all business logic to hooks and services; components are pure UI.

Lesson content is saved via `PATCH /api/nodes/:id/content` — a targeted single-row update. Do not use the graph upsert endpoint (`POST /api/roadmaps/:id/graph`) for lesson saves; it replaces all nodes and edges.

## Tài liệu cho developer mới

| Tài liệu                                                | Nội dung                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Bắt đầu](docs/onboarding/getting-started.md)           | Cài đặt và chạy toàn bộ project trên máy local (~15 phút)                  |
| [Kiến trúc](docs/onboarding/architecture.md)            | Tại sao monorepo, gRPC, feature-first, data model, data flows              |
| [Quy trình làm việc](docs/onboarding/daily-workflow.md) | GitFlow hàng ngày: feature branch, PR, commit format, release, hotfix      |
| [Kiểm thử](docs/onboarding/testing.md)                  | Vitest (admin), Jest (NestJS), Playwright E2E — cách viết và chạy tests    |
| [CI/CD Pipeline](docs/onboarding/cicd.md)               | 3 pipeline GitHub Actions: CI, staging deploy, production release          |
| [Git Hooks](docs/onboarding/git-hooks.md)               | Husky: commit-msg (Conventional Commits), pre-commit (lint+test), pre-push |
| [Cheat Sheet](docs/onboarding/cheatsheet.md)            | Lệnh, port, env vars, branch naming, data model — tham chiếu nhanh         |

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
pnpm test         # Run all tests
pnpm lint         # Lint all packages

# Admin unit tests
pnpm --filter @vizteck/admin test

# DB operations (run from repo root)
pnpm --filter @vizteck/db db:push     # Push schema (no migration file)
pnpm --filter @vizteck/db db:migrate  # Create + run migration
pnpm --filter @vizteck/db db:seed     # Seed demo data
pnpm --filter @vizteck/db db:studio   # Open Prisma Studio

# Force proto regeneration (bypasses Turborepo cache)
cd packages/proto && node generate.js
```

## Environment variables

| Variable              | Default                                                    | Used by                           |
| --------------------- | ---------------------------------------------------------- | --------------------------------- |
| `DATABASE_URL`        | `postgresql://vizteck:vizteck@localhost:5432/vizteckstack` | `packages/db`, `apps/svc-roadmap` |
| `ROADMAP_SERVICE_URL` | `localhost:5001`                                           | `apps/api-gateway`                |
| `ADMIN_TOKEN`         | `supersecret`                                              | `apps/api-gateway`                |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000`                                    | `apps/web`, `apps/admin`          |

Copy the `.env.example` in each app to `.env` (or `.env.local` for Next.js apps) before running.

## Tech stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 15, React, Tailwind CSS, `@xyflow/react`
- **Backend**: NestJS (API gateway + gRPC service)
- **Database**: PostgreSQL via Prisma ORM
- **API contracts**: Protocol Buffers (gRPC)
- **GraphQL**: Apollo Server
- **Testing**: Vitest + @testing-library/react (admin), Jest (NestJS services)
- **Rich text**: BlockNote (lesson editor)
