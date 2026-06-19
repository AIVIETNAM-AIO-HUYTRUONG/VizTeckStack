---
phase: 03-public-viewer
fixed_at: 2026-06-19T00:00:00Z
review_path: .planning/phases/03-public-viewer/03-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-06-19T00:00:00Z
**Source review:** .planning/phases/03-public-viewer/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Breadcrumb.tsx uses React.CSSProperties without importing React

**Files modified:** `apps/web/src/components/Breadcrumb.tsx`
**Commit:** 96976ff
**Applied fix:** Added `import type React from 'react'` at the top of the file so `React.CSSProperties` resolves at compile time.

---

### CR-02: RoadmapGraphView navigates to UUID instead of slug for ROADMAP nodes

**Files modified:** `packages/graph/src/types.ts`, `apps/web/src/lib/api.ts`, `apps/web/src/components/RoadmapGraphView.tsx`
**Commit:** 58d9ac7
**Applied fix:** Added optional `targetRoadmapSlug?: string` field to `NodeItem` in both `packages/graph/src/types.ts` and `apps/web/src/lib/api.ts`. Updated `RoadmapGraphView.tsx` to navigate via `targetRoadmapSlug` when available, falling back to `targetRoadmapId` until the API populates the slug field.

---

### WR-01: MiniGraph coordinate map keyed by value — duplicate coordinates collapse nodes

**Files modified:** `apps/web/src/components/MiniGraph.tsx`
**Commit:** dda2459
**Applied fix:** Replaced the `normalize()` function (which keyed by coordinate value, silently losing duplicate positions) with a new `normalizePositions()` function that keys the result map by node ID. Each node now gets its own correctly-computed canvas position regardless of shared x/y coordinates. Also renamed `inner_w`/`inner_h` to `innerW`/`innerH` (camelCase) as part of the rewrite.

---

### WR-02: MiniGraph always passed nodes=[] on home page — preview always blank

**Files modified:** `apps/web/src/app/page.tsx`
**Commit:** 46725f0
**Applied fix:** Removed the `miniGraph` prop (and the `MiniGraph` import) from the home page Card entirely. A comment notes it should be restored once the list endpoint returns node positions.

---

### WR-03: LessonContent hardcodes theme="light" — dark mode users see white editor

**Files modified:** `apps/web/src/components/LessonContent.tsx`
**Commit:** a0c98e3
**Applied fix:** Added `useEffect`/`useState` to observe `MutationObserver` on `document.documentElement` for class changes. Theme state toggles between `'light'` and `'dark'` and is passed directly to `<BlockNoteView theme={theme} />`.

---

### WR-04: ThemeToggle initial state always false — dark mode users start in light mode

**Files modified:** `apps/web/src/components/ThemeToggle.tsx`
**Commit:** 2562378
**Applied fix:** Changed `useState(false)` to a lazy initializer that reads `localStorage.getItem('theme')` first, then falls back to `window.matchMedia('(prefers-color-scheme: dark)').matches`. Added a `useEffect` to apply the `dark` class on mount when initial state is dark. Added `localStorage.setItem('theme', ...)` in `toggle` to persist the user choice across page loads.

---

### WR-05: Progress bar in lesson page hardcoded at 30% — misleading static decoration

**Files modified:** `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx`
**Commit:** 671b06e
**Applied fix:** Removed the progress bar `<div>` elements entirely. Replaced with a single `<p>` reading "Progress tracking coming soon." to set honest expectations without showing a fake percentage.

---

## Skipped Issues

None — all findings were fixed.

---

_Fixed: 2026-06-19T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
