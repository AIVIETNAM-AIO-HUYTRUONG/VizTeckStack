# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (runs all workspaces via Turborepo)
pnpm dev          # Start all apps/services in watch mode
pnpm build        # Build all packages (dependency-ordered)
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm proto:gen    # Regenerate TypeScript from .proto files

# packages/db (run from repo root or packages/db)
pnpm --filter @vizteck/db db:push    # Push schema to DB (no migration file)
pnpm --filter @vizteck/db db:migrate # Create and run migration
pnpm --filter @vizteck/db db:seed    # Seed demo data
pnpm --filter @vizteck/db db:studio  # Open Prisma Studio

# Single package test
pnpm --filter @vizteck/svc-roadmap test
pnpm --filter @vizteck/api-gateway test

# PostgreSQL (Docker)
docker compose up -d postgres
```

### First-time setup
```bash
docker compose up -d postgres
pnpm install
pnpm proto:gen
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:push
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:seed
```

### Proto codegen gotcha
Turborepo caches `pnpm proto:gen` and may replay an old result. After editing `roadmap.proto`, force regeneration:
```bash
cd packages/proto && node generate.js
```

## Architecture

Polyglot monorepo: public roadmap viewer + admin CMS + NestJS API gateway + NestJS gRPC service.

```
Browser
  apps/web (Next.js 15, port 3001) — public SSG viewer
  apps/admin (Next.js 15, port 3002) — CMS + graph editor

    ↓ GraphQL / REST

  apps/api-gateway (NestJS, port 3000)
    /graphql      — Apollo Server playground + endpoint
    /api/*        — REST controllers
    /api-docs     — Swagger UI
    AdminGuard    — Bearer token from ADMIN_TOKEN env var

    ↓ gRPC

  apps/svc-roadmap (NestJS microservice, port 5001)
    → packages/db (Prisma + PostgreSQL)

services/svc-python  — future FastAPI gRPC service (port 5002, outside pnpm workspace)
services/svc-rust    — future Axum gRPC service (port 5003, outside pnpm workspace)
```

### packages

| Package | Name | Purpose |
|---------|------|---------|
| `packages/proto` | `@vizteck/proto` | Single source of truth for gRPC contracts. Edit `roadmap.proto`, run `node generate.js` inside the package to regenerate. |
| `packages/db` | `@vizteck/db` | Exports `db` (PrismaClient singleton) and all Prisma types. |
| `packages/ui` | `@vizteck/ui` | Shared React components (Button, Card, NodeBadge). |
| `packages/graph` | `@vizteck/graph` | `<RoadmapGraph>` built on `@xyflow/react`. Accepts `mode="view"` (read-only) or `mode="edit"` (draggable + connectable). Re-exports `@xyflow/react` types and `applyEdgeChanges` so apps don't need a direct dep. |

**Dependency rule:** `apps/*` may import from `packages/*`; `packages/*` must not import from `apps/*`; `services/*` are fully isolated and communicate only via gRPC.

### Data model key points

- `Roadmap.status` — `DRAFT | PUBLIC | PRIVATE` (default `DRAFT`). Web viewer only shows `PUBLIC` roadmaps.
- `Node.positionX/Y` — React Flow canvas coordinates; `null` means the node exists but is not placed on canvas ("off canvas" in inventory).
- `Node.content` — BlockNote JSON (only meaningful when `type = LESSON`)
- `Node.targetRoadmapId` — links a `ROADMAP`-type node to its target roadmap. `targetRoadmapSlug` is **not** stored in DB — the api-gateway REST controller computes it on the fly from the full roadmap list.
- `Edge` — connection between nodes within the same roadmap
- Proto `NodeType` enum: `ROADMAP = 0`, `LESSON = 1` (numeric on wire, string in DB — always normalize when reading from proto responses)
- Proto `status` field is a **string** (not a proto enum) on both `RoadmapItem` and `UpdateRoadmapRequest` to avoid proto3 zero-default overwriting stored values on partial updates. Empty string = no change.

### Environment variables

| Var | Default | Where |
|-----|---------|-------|
| `DATABASE_URL` | `postgresql://vizteck:vizteck@localhost:5432/vizteckstack` | `packages/db`, `apps/svc-roadmap` |
| `ROADMAP_SERVICE_URL` | `localhost:5001` | `apps/api-gateway` |
| `ADMIN_TOKEN` | `supersecret` | `apps/api-gateway` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | `apps/web`, `apps/admin` |

Each app has a `.env.example` — copy to `.env` (or `.env.local` for Next.js apps) before running.

### TypeScript

All packages extend `tsconfig.base.json` (strict mode, commonjs, ES2022). NestJS apps additionally need `experimentalDecorators: true` and `emitDecoratorMetadata: true`.

### Admin auth

`AdminGuard` in `apps/api-gateway/src/auth/admin.guard.ts` reads `Authorization: Bearer <token>` from both HTTP and GraphQL contexts, compares against `process.env.ADMIN_TOKEN`. No user management — single static token.

`apiFetch` in `apps/admin/src/lib/api.ts` automatically attaches the token from `localStorage('admin_token')` and redirects to `/login` on 401.

### Non-obvious patterns

**Graph editor page is standalone** — `apps/admin/src/app/roadmaps/[id]/page.tsx` does NOT use `AdminLayout`. It manages its own full-viewport layout (`height: 100vh`) with `GraphToolbar` (which includes `ThemeToggle`). Never wrap it in AdminLayout.

**Dark mode** — `darkMode: 'class'` in Tailwind. A blocking `<script>` in `apps/admin/src/app/layout.tsx` sets `.dark` on `<html>` before first paint to prevent FOUC. The `ThemeToggle` component writes `localStorage('theme')` and toggles the class at runtime.

**Tailwind semantic tokens** — always use `bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo`, etc. (defined as CSS variables in `globals.css`). These adapt to dark mode automatically. Never hardcode hex colors in Tailwind classes. `packages/ui` and `packages/graph` source paths are included in admin's Tailwind content scan.

**NodeInventory drag data format** — the `nodeId` drag payload has two forms:
- Existing node repositioning: bare node UUID (e.g. `"clx123..."`)
- New roadmap node from palette: `"newRoadmap:<id>:<slug>:<encodeURIComponent(title)>"` — title is URL-encoded to handle colons and special characters. The handler in `handleDropNode` must parse it with `parts.slice(3).join(':')` then `decodeURIComponent`.

**Avoid nested setState** — calling `setStateA` inside a `setStateA(prev => ...)` updater causes React Strict Mode to invoke the outer updater twice, silently duplicating work. Always derive needed data before entering a setState call.

**`packages/graph` measuredRef cache** — `RoadmapGraph` maintains a `measuredRef` (Map of node id → dimensions) to survive React Flow's `adoptUserNodes` resetting `measured` on every re-render. Without this, nodes go `visibility: hidden` after position updates. Never remove or bypass this cache.

**Web fetch cache** — all fetches in `apps/web/src/lib/api.ts` use `{ cache: 'no-store' }`. This is intentional so the public viewer reflects admin changes immediately.
