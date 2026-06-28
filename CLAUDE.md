# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (runs all workspaces via Turborepo)
pnpm dev          # Start all apps/services in watch mode
pnpm build        # Build all packages (dependency-ordered)
pnpm test         # Run all tests (skips e2e — see below)
pnpm lint         # Lint all packages
# packages/db (run from repo root or packages/db)
pnpm --filter @vizteck/db db:push    # Push schema to DB (no migration file)
pnpm --filter @vizteck/db db:migrate # Create and run migration
pnpm --filter @vizteck/db db:seed    # Seed demo data
pnpm --filter @vizteck/db db:studio  # Open Prisma Studio

# Single package test
pnpm --filter @vizteck/admin test
pnpm --filter @vizteck/lesson test
pnpm --filter @vizteck/api-gateway test

# Test watch mode (admin and packages/lesson use Vitest)
pnpm --filter @vizteck/admin test -- --watch
pnpm --filter @vizteck/lesson test -- --watch

# E2E tests (Playwright — requires all apps running via pnpm dev)
pnpm --filter @vizteck/e2e test:e2e    # Headless
pnpm --filter @vizteck/e2e test:ui     # Interactive UI mode
pnpm --filter @vizteck/e2e test:headed # Headed browser

# PostgreSQL (Docker)
docker compose up -d postgres
docker compose down
docker compose ps
```

### Testing frameworks by package

| Package | Framework | Notes |
|---------|-----------|-------|
| `apps/admin` | Vitest + @testing-library/react | `*.spec.tsx` in `src/` |
| `packages/core` | Vitest + @testing-library/react | specs live alongside source in `src/` |
| `packages/lesson` | Vitest + @testing-library/react | shim only — no specs (all specs moved to `packages/core`) |
| `apps/api-gateway` | Jest + ts-jest | `*.spec.ts` in `src/` |
| `apps/e2e` | Playwright | Separate from `pnpm test`; needs apps running |

### First-time setup
```bash
docker compose up -d postgres
pnpm install
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:push
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:seed
```

## Git workflow

Full GitFlow. Two long-lived branches: `main` (production) and `develop` (staging). Never push directly to either.

**Branch naming:**
- `feature/<name>` — new features and regular bugfixes (branch from `develop`)
- `hotfix/<name>` — urgent production fixes (branch from `main`, merge back to both `main` and `develop`)
- `release/<version>` — release preparation (lead only, e.g. `release/1.1.0`)
- All lowercase kebab-case: `feature/lesson-crud`, not `feature/LessonCRUD`

**Commit format (Conventional Commits):**
```
feat: add lesson CRUD endpoints
fix: node drop broken on canvas
chore: update prisma schema
refactor: extract graph save logic
test: add unit tests for graph hooks
docs: update onboarding guide
ci: fix deploy workflow
```
Format: `<type>: <description>` — no capital first letter, no trailing period.

**CI pipeline** — runs `build → lint → test` on every PR and push to `main`, `develop`, or `release/*`. PRs cannot merge until CI passes. Staging deploys on push to `develop`; production deploys on `v*` tags.

## Architecture

Monorepo: public roadmap viewer + admin CMS + NestJS API gateway.

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
    → packages/db (Prisma + PostgreSQL)
```

### packages

| Package | Name | Purpose |
|---------|------|---------|
| `packages/core` | `@vizteck/core` | **Single source of truth for all feature logic.** Feature-first layout: `roadmap/`, `graph/`, `lesson/` — each with `types.ts`, `*.service.ts`, hooks, and a `ui/` subfolder for display components. Apps import from here. |
| `packages/db` | `@vizteck/db` | Exports `db` (PrismaClient singleton) and all Prisma types. |
| `packages/ui` | `@vizteck/ui` | Shared React components (Button, Card, NodeBadge). |
| `packages/graph` | `@vizteck/graph` | **Shim only** — re-exports `RoadmapGraph`, `RoadmapNode`, and all graph types from `@vizteck/core`. Do not add source files here. |
| `packages/lesson` | `@vizteck/lesson` | **Shim only** — re-exports `LessonEditor`, `LessonViewer`, `LessonPageShell`, and all lesson types from `@vizteck/core`. Do not add source files here. |

**Dependency rule:** `apps/*` may import from `packages/*`; `packages/core` imports from `packages/graphql-client`, `@xyflow/react`, `packages/ui`; `packages/graph` and `packages/lesson` import only from `packages/core`; `packages/*` must not import from `apps/*`.

### Admin frontend structure

`apps/admin/src/features/` contains only admin-specific wrappers and UI. All business logic (services, hooks) lives in `@vizteck/core`; admin hooks are thin wrappers that inject `adminApolloClient`.

```
src/features/
  roadmaps/
    hooks/useRoadmaps.ts          — useAdminRoadmaps() injects adminApolloClient → @vizteck/core useRoadmaps
    components/RoadmapModal.tsx   — create / edit modal
  graph-editor/
    hooks/useGraphEditor.ts       — useAdminGraphEditor(id, slug) → @vizteck/core useGraphEditor
    hooks/useNodeActions.ts       — canvas interaction handlers (drop, connect, delete) — stays in admin (Next.js router)
    hooks/useGraphDraft.ts        — re-export from @vizteck/core
    components/GraphToolbar.tsx
    components/NodeInventory.tsx
    components/NodeSidePanel.tsx
  lessons/
    hooks/useLessonEditor.ts      — useAdminLessonEditor(nodeId) → @vizteck/core useLessonEditor
    hooks/useLessonPageShell.ts   — useAdminLessonPageShell(nodeId, cover, icon) → @vizteck/core
    hooks/usePageTree.ts          — useAdminPageTree(nodeId) → @vizteck/core usePageTree
    components/LessonTitleEditor.tsx — inline title with blur-to-save (admin-only)
    components/CoverImage.tsx     — editable cover area (hover controls: upload, paste URL, remove)
    components/CoverUploadModal.tsx — uploadthing file upload modal
    components/IconPicker.tsx     — emoji picker for node icon
```

Feature display components (`LessonEditor`, `LessonViewer`, `LessonPageShell`, `RoadmapGraph`, etc.) are imported from `@vizteck/core`, not defined in `apps/admin`.

### Data model key points

- `Roadmap.status` — `DRAFT | PUBLIC | PRIVATE` (default `DRAFT`). Web viewer only shows `PUBLIC` roadmaps.
- `Node.positionX/Y` — React Flow canvas coordinates; `null` means the node exists but is not placed on canvas ("off canvas" in inventory).
- `Node.content` — BlockNote JSON (only meaningful when `type = LESSON`)
- `Node.coverImage` — URL string (uploadthing or external URL); `null` means no cover set
- `Node.icon` — emoji string (e.g. `"📚"`); `null` means no icon set
- `Node.targetRoadmapId` — links a `ROADMAP`-type node to its target roadmap. `targetRoadmapSlug` is **not** stored in DB — the api-gateway REST controller computes it on the fly from the full roadmap list.
- `Edge` — connection between nodes within the same roadmap

### Environment variables

| Var | Default | Where |
|-----|---------|-------|
| `DATABASE_URL` | `postgresql://vizteck:vizteck@localhost:5432/vizteckstack` | `packages/db`, `apps/api-gateway` |
| `ADMIN_TOKEN` | `supersecret` | `apps/api-gateway` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | `apps/web`, `apps/admin` |
| `PORT` | `3000` | `apps/api-gateway` |
| `UPLOADTHING_TOKEN` | _(no default)_ | `apps/admin` — required for cover image uploads |

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

**Turbopack stale route cache** — if a newly added `app/` page returns 404 in dev mode despite the file existing, a stale `.next/` directory from a previous build session may be confusing the Turbopack route matcher. Fix: `rm -rf apps/admin/.next` (or the relevant app's `.next`) and restart `pnpm dev`. This is a known Turbopack limitation when switching between `next build` and `next dev` in the same working tree.

**Lesson content save is targeted** — `PATCH /api/nodes/:id/content`, `/title`, `/cover`, and `/icon` each call a single `db.node.update`. Never save lesson content via `POST /api/roadmaps/:id/graph` (UpsertGraph) — that is a full DELETE+INSERT of all nodes and edges and will silently drop sibling node data if any node is missing from the payload.

**`LessonPageShell` slot pattern** — `<LessonPageShell>` in `@vizteck/core` accepts optional `coverSlot`, `titleSlot`, and `contentSlot` props. When a slot is provided, it renders instead of the default. Admin uses this to inject editable versions (`CoverImage`, `LessonTitleEditor`, `LessonEditor`) while `apps/web` passes no slots and gets the read-only defaults. The shell's `mode` prop (`"edit"` | `"view"`) also guards content rendering — view mode renders `<LessonViewer>` lazily; edit mode renders only the `contentSlot`.

**`useLessonPageShell` optimistic updates** — cover and icon state is updated immediately in React state, then synced to the API (`PATCH /api/nodes/:id/cover` and `/icon`). On API failure, the previous value is restored. This is the correct pattern for any cover/icon update; do not call `updateNodeCover`/`updateNodeIcon` directly from components.

**`ApolloLike` pattern** — `packages/core` services and hooks accept `ApolloLike` (`{ query, mutate }`) as first parameter instead of importing `adminApolloClient` directly. This is a structural duck-type to avoid a graphql@16/17 dual-instance collision between `@vizteck/graphql-client` and the admin app. Admin features inject `adminApolloClient` via thin `useAdmin*` wrapper hooks. Never import `adminApolloClient` directly from `packages/core`.

**Admin `features/lessons/` vs `@vizteck/core`** — `apps/admin/src/features/lessons/` contains only hooks (`useAdminLessonEditor`, `useAdminLessonPageShell`, `useAdminPageTree`) that inject the Apollo client, and admin-only UI (`LessonTitleEditor`, `CoverImage`, `CoverUploadModal`, `IconPicker`). The shared display components (`LessonEditor`, `LessonViewer`, `LessonPageShell`, `CoverDisplay`, `BreadcrumbDisplay`) live in `packages/core/src/lesson/ui/` and are importable from `@vizteck/core` (or the `@vizteck/lesson` shim). When adding lesson display to `apps/web`, import from `@vizteck/core`.

