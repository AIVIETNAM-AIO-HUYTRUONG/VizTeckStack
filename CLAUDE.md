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
| `packages/proto` | `@vizteck/proto` | Single source of truth for gRPC contracts. Edit `roadmap.proto`, run `pnpm proto:gen` to regenerate. |
| `packages/db` | `@vizteck/db` | Exports `db` (PrismaClient singleton) and all Prisma types. |
| `packages/ui` | `@vizteck/ui` | Shared React components (Button, Card, NodeBadge). |
| `packages/graph` | `@vizteck/graph` | `<RoadmapGraph>` built on `@xyflow/react`. Accepts `mode="view"` (read-only) or `mode="edit"` (draggable + connectable + Save button). |

**Dependency rule:** `apps/*` may import from `packages/*`; `packages/*` must not import from `apps/*`; `services/*` are fully isolated and communicate only via gRPC.

### Data model key points

- `Node.positionX/Y` — React Flow canvas coordinates stored directly in DB
- `Node.content` — BlockNote JSON (only meaningful when `type = LESSON`)
- `Node.targetRoadmapId` — links a `ROADMAP`-type node to its target roadmap
- `Edge` — connection between nodes within the same roadmap
- Proto `NodeType` enum: `ROADMAP = 0`, `LESSON = 1` (numeric on wire, string in DB)

### Environment variables

| Var | Default | Where |
|-----|---------|-------|
| `DATABASE_URL` | `postgresql://vizteck:vizteck@localhost:5432/vizteckstack` | `packages/db`, `apps/svc-roadmap` |
| `ROADMAP_SERVICE_URL` | `localhost:5001` | `apps/api-gateway` |
| `ADMIN_TOKEN` | `supersecret` | `apps/api-gateway` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | `apps/web`, `apps/admin` |

Each app has a `.env.example` — copy to `.env` (or `.env.local` for Next.js apps) before running.

### Proto codegen

`packages/proto/generate.sh` calls `ts-proto` with `--ts_proto_opt=nestJs=true`. Generated files go to `packages/proto/generated/` (gitignored). Always run `pnpm proto:gen` after editing `roadmap.proto` before building downstream packages.

### TypeScript

All packages extend `tsconfig.base.json` (strict mode, commonjs, ES2022). NestJS apps additionally need `experimentalDecorators: true` and `emitDecoratorMetadata: true`.

### Admin auth

`AdminGuard` in `apps/api-gateway/src/auth/admin.guard.ts` reads `Authorization: Bearer <token>` from both HTTP and GraphQL contexts, compares against `process.env.ADMIN_TOKEN`. No user management — single static token.
