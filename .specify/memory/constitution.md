<!--
SYNC IMPACT REPORT
==================
Version change: NEW → 1.0.0
Added sections:
  - Core Principles (I–V)
  - Technology Stack
  - Development Workflow & Quality Gates
  - Governance
Templates updated:
  - ✅ .specify/templates/plan-template.md — Constitution Check gates added
  - ✅ .specify/templates/tasks-template.md — Path conventions updated for monorepo
  - ✅ .specify/templates/spec-template.md — No changes required (generic enough)
Deferred TODOs: none
-->

# VizTeckStack Constitution

## Core Principles

### I. Core-First (Single Source of Truth)

All business logic, services, hooks, and display components MUST live in `packages/core`.
Apps (`apps/admin`, `apps/web`) MUST contain only thin wrappers that inject dependencies,
Apollo client injection hooks, and app-specific UI components (editable variants, modals).

- `packages/core` is the single source of truth for all feature logic
- Feature layout in core: `<feature>/types.ts`, `<feature>/*.service.ts`, `<feature>/hooks/`, `<feature>/components/`, `<feature>/utils/`
- Sub-features follow the same structure nested inside: `<feature>/<sub-feature>/`
- Display components (`LessonEditor`, `RoadmapGraph`, etc.) MUST be defined in `packages/core`, never in apps
- Admin-only UI (editable variants, upload modals, emoji pickers) MUST be defined in `apps/admin/src/features/`

**Rationale**: Prevents business logic duplication, enables `apps/web` to consume the same components as `apps/admin` without re-implementing.

### II. Package Boundary Integrity

Dependency direction is strictly unidirectional and MUST NOT be violated.

- `apps/*` MAY import from `packages/*`
- `packages/core` MAY import from `packages/graphql-client`, `@xyflow/react`, `packages/ui`
- `packages/graph` and `packages/lesson` MUST import only from `packages/core` (shim re-exports only)
- `packages/*` MUST NOT import from `apps/*`
- `packages/core` MUST accept `ApolloLike ({ query, mutate })` as first parameter in all services and hooks — never import `adminApolloClient` directly
- Shim packages (`packages/graph`, `packages/lesson`) MUST NOT contain source files — re-exports only

**Rationale**: The `ApolloLike` pattern prevents a graphql@16/17 dual-instance collision between `@vizteck/graphql-client` and the admin app. Direct `adminApolloClient` imports in core would couple the shared package to the admin runtime.

### III. Targeted Mutations (Data Safety)

Every data write MUST target the smallest possible scope. Full DELETE+INSERT operations are reserved exclusively for full graph saves.

- Lesson field saves MUST use dedicated PATCH endpoints: `/api/nodes/:id/content`, `/title`, `/cover`, `/icon`
- Each `db.node.update` call MUST target exactly one field
- `POST /api/roadmaps/:id/graph` (UpsertGraph) MUST ONLY be called for complete graph save — it performs DELETE+INSERT of all nodes and edges and WILL silently drop any node missing from the payload
- Optimistic updates: update local React state immediately → fire PATCH → revert on failure
- `Node.targetRoadmapSlug` MUST NOT be stored in the database — compute at runtime from full roadmap list

**Rationale**: Routing lesson content saves through UpsertGraph caused data loss incidents where sibling nodes were silently deleted.

### IV. GitFlow + Conventional Commits

All commits and branches MUST follow the project's branching strategy and commit format.

- Commit format: `<type>: <lowercase description>` — no capital first letter, no trailing period
- Valid types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`
- Direct pushes to `main` or `develop` are PROHIBITED
- Branch naming (lowercase kebab-case only):
  - `feature/<name>` — new features and regular bugfixes (branch from `develop`)
  - `hotfix/<name>` — urgent production fixes (branch from `main`, merge to both `main` and `develop`)
  - `release/<version>` — lead only (e.g. `release/1.1.0`)
- PRs targeting `feature/*` MUST target `develop`, not `main`
- CI MUST pass (`build → lint → test`) before any PR can merge

**Rationale**: Ensures a clean, reviewable history and predictable staging/production deployment behavior.

### V. Simplicity (YAGNI)

The simplest working implementation is the correct implementation. Complexity requires justification.

- No speculative abstractions: no interface with one implementation, no factory for one product, no config for a value that never changes
- Tailwind classes MUST use semantic CSS variable tokens: `bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo` — hardcoded hex colors are PROHIBITED
- Nested `setState` calls are PROHIBITED (causes React Strict Mode double-invoke — derive data before entering updaters)
- `measuredRef` cache in `RoadmapGraph` MUST NOT be removed or bypassed (React Flow `adoptUserNodes` resets `measured` on every re-render)
- Any complexity violation MUST be documented in plan.md's Complexity Tracking table with justification

**Rationale**: Hardcoded colors break dark mode. Nested setState caused silent data duplication bugs in Strict Mode. The measuredRef cache prevents node visibility regression.

## Technology Stack

**Monorepo**: Turborepo + pnpm workspaces

| Layer | Technology |
|-------|-----------|
| Public viewer | Next.js 15 (SSG), port 3001 (`apps/web`) |
| Admin CMS | Next.js 15, port 3002 (`apps/admin`) |
| API | NestJS, port 3000 (`apps/api-gateway`) |
| GraphQL | Apollo Server at `/graphql` |
| REST | NestJS controllers at `/api/*`, Swagger at `/api-docs` |
| ORM | Prisma |
| Database | PostgreSQL (Docker) |
| Shared logic | `packages/core` |
| Graph editor | `@xyflow/react` (React Flow) |
| Content editor | BlockNote (JSON storage in `Node.content`) |
| UI components | shadcn/ui (`packages/ui`) — always use before writing custom HTML |
| File uploads | uploadthing |
| Auth | Single static Bearer token (`ADMIN_TOKEN` env var, `AdminGuard`) |

**Testing**:

| Package | Framework |
|---------|----------|
| `apps/admin`, `packages/core` | Vitest + @testing-library/react |
| `apps/api-gateway` | Jest + ts-jest |
| `apps/e2e` | Playwright (requires all apps running) |

Spec files MUST live alongside source files — no separate `__tests__/` directory.

## Development Workflow & Quality Gates

**CI pipeline**: `build → lint → test` runs on every PR and every push to `main`, `develop`, or `release/*`. PRs CANNOT merge until CI passes.

**Deployment**:
- Staging: auto-deploys on push to `develop`
- Production: auto-deploys on `v*` tags

**Database change protocol**:
- `db:push` — local/dev iteration without migration history (safe for nullable additions)
- `db:migrate` — required for renames, removals, or any production-bound schema change

**Pre-PR gates** (enforced by `vizteck:pr-prep` skill):
1. No `adminApolloClient` imports in `packages/core`
2. No `apps/*` imports in `packages/*`
3. No lesson saves via UpsertGraph
4. `pnpm lint` passes
5. `pnpm build` passes
6. `pnpm test` passes
7. All commits follow Conventional Commits format

**Turbopack stale cache**: If a new `app/` page returns 404 despite the file existing, delete `.next/` and restart `pnpm dev`.

## Governance

This constitution supersedes all other practices, preferences, and prior conventions.

- **Amendments** require: updating this file, propagating changes to `.specify/templates/`, and updating `CLAUDE.md` if referenced guidance changes
- **All complexity violations** MUST be documented in the feature's `plan.md` Complexity Tracking table before implementation begins
- **`CLAUDE.md`** is the runtime development guidance file — it must stay consistent with this constitution
- **Compliance review**: All PRs must verify the pre-PR gates above; the `vizteck:pr-prep` skill automates this
- **Constitution versioning**:
  - MAJOR: Principle removal or redefinition incompatible with prior work
  - MINOR: New principle or materially expanded guidance added
  - PATCH: Clarifications, wording, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: 2026-06-30 | **Last Amended**: 2026-06-30
