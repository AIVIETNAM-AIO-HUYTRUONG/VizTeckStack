---
phase: 03-public-viewer
plan: "03"
subsystem: apps/web
tags: [nextjs, ssg, isr, tailwind, blocknote, xyflow, react, typescript]
dependency_graph:
  requires: ["@vizteck/ui", "@vizteck/graph", "apps/api-gateway"]
  provides: ["apps/web", "HomePage", "RoadmapPage", "LessonPage", "RoadmapGraphView", "LessonContent", "MiniGraph", "Breadcrumb", "ThemeToggle"]
  affects: []
tech_stack:
  added: ["next@16.2.9", "@blocknote/react@0.51.4", "@blocknote/core@0.51.4", "@blocknote/mantine@0.51.4"]
  patterns: ["app-router-ssg", "isr-revalidate-3600", "async-params-next16", "generateStaticParams-empty-array", "transpilePackages-workspace", "blocknote-read-only-client-component", "design-token-css-custom-properties"]
key_files:
  created:
    - apps/web/package.json
    - apps/web/next.config.js
    - apps/web/tsconfig.json
    - apps/web/tailwind.config.ts
    - apps/web/postcss.config.js
    - apps/web/.env.example
    - apps/web/.env.local
    - apps/web/src/lib/api.ts
    - apps/web/src/app/globals.css
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/page.tsx
    - apps/web/src/app/roadmap/[slug]/page.tsx
    - apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx
    - apps/web/src/components/ThemeToggle.tsx
    - apps/web/src/components/MiniGraph.tsx
    - apps/web/src/components/Breadcrumb.tsx
    - apps/web/src/components/RoadmapGraphView.tsx
    - apps/web/src/components/LessonContent.tsx
  modified:
    - pnpm-lock.yaml
decisions:
  - "async params in Next.js 16: params typed as Promise<{slug,id}> and destructured with await — Pitfall 1 from RESEARCH.md"
  - "generateStaticParams returns [] for dynamic segments: build succeeds without live api-gateway; ISR handles first-request rendering (Pitfall 6)"
  - "transpilePackages includes all six: @vizteck/ui, @vizteck/graph, @xyflow/react, @blocknote/react, @blocknote/core, @blocknote/mantine — workspace packages have no separate build step"
  - "LessonContent is 'use client' only: BlockNote useCreateBlockNote is browser-only; server passes contentJson string down to client component"
  - "RoadmapGraphView navigates only to internal /roadmap/... paths (T-03-05 open redirect mitigation)"
  - "ThemeToggle uses React useState only — no localStorage persistence per DEC-03-01"
metrics:
  duration: "12m"
  completed: "2026-06-19"
  tasks_completed: 4
  files_created: 18
  files_modified: 1
---

# Phase 03 Plan 03: apps/web Public Viewer Summary

**One-liner:** Next.js 16 App Router SSG public viewer (port 3001) — 3-route ISR app consuming @vizteck/ui Cards, @vizteck/graph RoadmapGraph view mode, and BlockNote read-only lesson renderer; builds to static HTML without a live api-gateway.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold apps/web (Next.js config, Tailwind tokens, globals, data layer) | 3620837 | apps/web/package.json, next.config.js, tsconfig.json, tailwind.config.ts, postcss.config.js, .env.example, .env.local, src/lib/api.ts, src/app/globals.css, src/app/layout.tsx |
| 1b | Add ThemeToggle component and nav header (DEC-03-01) | abe447b | apps/web/src/components/ThemeToggle.tsx, src/app/layout.tsx |
| 2 | Build client viewer components (MiniGraph, Breadcrumb, RoadmapGraphView, LessonContent) | e0b6a86 | apps/web/src/components/MiniGraph.tsx, Breadcrumb.tsx, RoadmapGraphView.tsx, LessonContent.tsx |
| 3 | Build SSG pages (home, graph, lesson) and verify static build | dffb73a | apps/web/src/app/page.tsx, roadmap/[slug]/page.tsx, roadmap/[slug]/node/[id]/page.tsx |

## What Was Built

### apps/web — Next.js 16 App Router (port 3001)

Public viewer with three SSG routes, all carrying `revalidate = 3600` (ISR). Builds to static HTML without a live api-gateway by returning `[]` from `generateStaticParams` and wrapping all fetch calls in try/catch.

### Data layer (`apps/web/src/lib/api.ts`)

Typed fetch helpers `fetchRoadmaps()`, `fetchRoadmap(slug)`, `fetchNode(id)` targeting `NEXT_PUBLIC_API_URL/api/...`. All use `cache: 'force-cache'` for ISR compatibility. Exports `RoadmapItem`, `NodeItem`, `EdgeItem`, `RoadmapDetail` interfaces mirroring roadmap.dto.ts.

### Routing

- `/` — `HomePage` (Server Component): 3-column `@vizteck/ui Card` grid, `revalidate = 3600`, graceful fetch failure (empty grid at build time)
- `/roadmap/[slug]` — `RoadmapPage` (Server Component): fetches `RoadmapDetail`, renders `<RoadmapGraphView>`. `generateStaticParams` returns `[]`, `dynamicParams = true`
- `/roadmap/[slug]/node/[id]` — `LessonPage` (Server Component): fetches `NodeItem`, renders 2-col layout — main area: `<LessonContent>` (LESSON only), right sidebar: 280px Progress card + MiniGraph + "Back to Roadmap" Button

### Client Components

- **ThemeToggle** — `'use client'`; `useState` toggles `document.documentElement.classList`; no localStorage (DEC-03-01)
- **MiniGraph** — Plain SVG on `#F1F3F9`; draws edges as `<line>`, nodes as `<circle>` (indigo=ROADMAP, emerald=LESSON); normalizes positionX/Y to viewBox
- **Breadcrumb** — Presentational; visited/active/none dot states (DEC-03-07); `<a>` wrapped dots
- **RoadmapGraphView** — `'use client'`; imports `RoadmapGraph` from `@vizteck/graph`; wires `onNodeClick` to internal-only navigation (T-03-05); Breadcrumb above 70vh canvas
- **LessonContent** — `'use client'`; `useCreateBlockNote({ initialContent })` + `BlockNoteView editable={false} theme="light"` (DEC-03-03); guards empty/invalid JSON; imports both BlockNote CSS files (Pitfall 4)

### next.config.js

`transpilePackages` includes all six workspace/ESM-only packages: `@vizteck/ui`, `@vizteck/graph`, `@xyflow/react`, `@blocknote/react`, `@blocknote/core`, `@blocknote/mantine`.

## Verification Results

```
next build (no api-gateway running)  → exit 0
Route / — revalidate 1h (3600s)
Route /roadmap/[slug] — SSG generateStaticParams
Route /roadmap/[slug]/node/[id] — SSG generateStaticParams
grep -rc "revalidate = 3600" apps/web/src/app  → 3 matches
grep -rc "await params" apps/web/src/app/roadmap  → 2 matches
grep -rc "return \[\]" apps/web/src/app/roadmap  → 2 matches
grep -c "editable={false}" apps/web/src/components/LessonContent.tsx  → 1
```

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met on first build.

## Known Stubs

- **MiniGraph on home page and lesson sidebar** — `apps/web/src/app/page.tsx` and `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` pass `nodes={[]}` to `<MiniGraph>` because the list endpoint (`/api/roadmaps`) does not return node position data and the lesson endpoint returns a single node, not the full roadmap graph. The SVG renders an empty canvas. The component itself is fully functional — it just has no nodes to draw. Resolves when: (a) the home page is enhanced to fetch per-roadmap node summaries, or (b) a Phase 4 admin feature wires roadmap node data to the public viewer sidebar.

## Threat Flags

None beyond those in the plan's threat model. All T-03-04 through T-03-07 mitigations applied as designed.

## Self-Check: PASSED

- [x] apps/web/src/app/page.tsx exists — `revalidate = 3600`, 3-column Card grid
- [x] apps/web/src/app/roadmap/[slug]/page.tsx exists — `generateStaticParams`, `await params`
- [x] apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx exists — `generateStaticParams`, `await params`, 2-col sidebar
- [x] apps/web/src/components/LessonContent.tsx exists — `editable={false}`, `useCreateBlockNote`
- [x] apps/web/src/components/RoadmapGraphView.tsx exists — imports `@vizteck/graph`
- [x] apps/web/next.config.js transpilePackages includes all 6 packages
- [x] Commits 3620837, abe447b, e0b6a86, dffb73a verified in git log
- [x] `next build` exits 0 without live api-gateway
