---
phase: 03-public-viewer
reviewed: 2026-06-19T00:00:00Z
depth: standard
files_reviewed: 29
files_reviewed_list:
  - packages/ui/package.json
  - packages/ui/tsconfig.json
  - packages/ui/src/index.ts
  - packages/ui/src/NodeBadge.tsx
  - packages/ui/src/Button.tsx
  - packages/ui/src/Card.tsx
  - packages/graph/package.json
  - packages/graph/tsconfig.json
  - packages/graph/src/types.ts
  - packages/graph/src/index.ts
  - packages/graph/src/RoadmapNode.tsx
  - packages/graph/src/RoadmapGraph.tsx
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
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-06-19T00:00:00Z
**Depth:** standard
**Files Reviewed:** 29
**Status:** issues_found

## Summary

Review covers three areas: the shared UI package (`@vizteck/ui`), the graph package (`@vizteck/graph`), and the public web viewer (`apps/web`). The UI and graph packages are clean. The web app has two blockers: a missing React import that causes a compile-time crash and a navigation bug that routes to the wrong identifier type. Five additional warnings address broken placeholder UI, dark-mode blindness in the content renderer, and a coordinate-collision bug in MiniGraph.

---

## Critical Issues

### CR-01: `Breadcrumb.tsx` uses `React.CSSProperties` without importing React — compile-time crash

**File:** `apps/web/src/components/Breadcrumb.tsx:13`

**Issue:** `DOT_STYLES` is typed as `Record<BreadcrumbState, React.CSSProperties>` but the file has zero import statements. In strict-mode TypeScript with `jsx: "preserve"`, `React` is not a global. This is a compile-time error: `Cannot find name 'React'`. The component will not build, and any page that includes `<Breadcrumb>` (i.e., `RoadmapGraphView`, the roadmap page) fails to render.

**Fix:**
```tsx
// Add at the top of Breadcrumb.tsx
import type React from 'react';
```
Or replace the type with the equivalent without the React namespace:
```tsx
const DOT_STYLES: Record<BreadcrumbState, { background: string; border: string; color: string }> = { ... };
```

---

### CR-02: `RoadmapGraphView` navigates to `/roadmap/${node.targetRoadmapId}` — UUID used as slug, always 404

**File:** `apps/web/src/components/RoadmapGraphView.tsx:27`

**Issue:** When a `ROADMAP`-type node is clicked, the handler pushes `/roadmap/${node.targetRoadmapId}`. `targetRoadmapId` is the database UUID of the linked roadmap (e.g., `cuid2abc123`), but the route `/roadmap/[slug]` expects a human-readable slug (e.g., `backend-basics`). The `fetchRoadmap(slug)` call in the page will always fail for these deep links, returning a "Roadmap not found" error page instead of the linked roadmap.

The data model (`NodeItem`) does not carry the target roadmap's slug, so the fix requires either (a) including `targetRoadmapSlug` in `NodeItem` / the API response, or (b) performing a lookup by ID in the API and redirecting.

**Fix (approach A — preferred):** Extend `NodeItem` in `src/lib/api.ts` and populate it via the API:
```ts
export interface NodeItem {
  // ... existing fields
  targetRoadmapSlug?: string;   // add this
}
```
Then in `RoadmapGraphView.tsx`:
```ts
} else if (node.type === 'ROADMAP' && node.targetRoadmapSlug) {
  router.push(`/roadmap/${node.targetRoadmapSlug}`);
}
```

---

## Warnings

### WR-01: `MiniGraph` coordinate map keyed by value — nodes with duplicate x or y collapse to wrong position

**File:** `apps/web/src/components/MiniGraph.tsx:20-33`

**Issue:** `normalize()` builds a `Map<number, number>` keyed by the raw coordinate value, not the node ID. When two nodes share the same x-coordinate (which is common for vertically-stacked layouts), the second write to the Map silently overwrites the first, and `posById.set(n.id, { cx: xMap.get(n.x) ?? padding, ... })` for the first node will still resolve to a valid (but now incorrect) position. The result is that multiple nodes appear stacked at the same canvas position in the mini graph, producing a misleading visual.

**Fix:** Normalize directly into `posById` indexed by node ID:
```ts
function normalizePositions(
  nodes: MiniGraphNode[],
  padding: number,
  innerW: number,
  innerH: number,
): Map<string, { cx: number; cy: number }> {
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const result = new Map<string, { cx: number; cy: number }>();
  for (const n of nodes) {
    result.set(n.id, {
      cx: padding + ((n.x - xMin) / xRange) * innerW,
      cy: padding + ((n.y - yMin) / yRange) * innerH,
    });
  }
  return result;
}
```

---

### WR-02: `MiniGraph` always rendered with `nodes={[]}` on the home page — preview is always blank

**File:** `apps/web/src/app/page.tsx:72`

**Issue:** Every `Card` on the home page passes an empty `nodes` and `edges` array to `MiniGraph`. The component renders a plain `#F1F3F9` rectangle with no dots or lines. The API already returns enough data to drive the mini-graph (the roadmap listing does not include node positions, but a dedicated call or a `nodes` field on the list endpoint would fix this). As-is, the feature is non-functional and misleads users into expecting a preview that never loads.

**Fix (short term):** Remove the `miniGraph` prop from the Card on the home page until node data is available, so users see a clean card without a broken placeholder:
```tsx
<Card
  type="ROADMAP"
  title={r.title}
  description={r.description}
  // miniGraph omitted until /api/roadmaps returns node positions
/>
```

---

### WR-03: `LessonContent` hardcodes `theme="light"` — dark mode users see a white editor box

**File:** `apps/web/src/components/LessonContent.tsx:47`

**Issue:** `<BlockNoteView ... theme="light" />` always applies the light theme regardless of the `.dark` class the `ThemeToggle` adds to `<html>`. When a user switches to dark mode, the lesson content area renders as a bright white rectangle inside an otherwise dark page.

**Fix:**
```tsx
'use client';
import { useEffect, useState } from 'react';
// ...
export function LessonContent({ contentJson }: LessonContentProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  // ...
  return <BlockNoteView editor={editor} editable={false} theme={theme} />;
}
```

---

### WR-04: `ThemeToggle` does not read initial OS preference — dark mode users start in light mode

**File:** `apps/web/src/components/ThemeToggle.tsx:6`

**Issue:** `useState(false)` always initialises in light mode. Users who have set `prefers-color-scheme: dark` at the OS level, or who previously toggled dark mode and revisited the page, will see a light page until they click the toggle. This is a UX regression that can affect screen readability.

**Fix:**
```tsx
const [isDark, setIsDark] = useState(() => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
});

// In useEffect on mount, apply the class once:
useEffect(() => {
  if (isDark) document.documentElement.classList.add('dark');
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```
Also persist the choice: `localStorage.setItem('theme', next ? 'dark' : 'light')` inside `toggle`.

---

### WR-05: Progress bar in lesson page is a hardcoded static decoration — always shows 30%

**File:** `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx:129-135`

**Issue:** The progress bar inner `<div>` is styled with `width: '30%'` unconditionally and the label reads "Keep learning!" There is no progress tracking logic anywhere in this codebase. Displaying a static arbitrary percentage as though it is real progress data is misleading to users.

**Fix (short term):** Replace with a neutral placeholder that communicates the feature is coming:
```tsx
<p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
  Progress tracking coming soon.
</p>
```
Remove the bar div entirely until real progress state is wired up.

---

## Info

### IN-01: `next` version in `package.json` is `^16.2.9` but CLAUDE.md describes Next.js 15 architecture

**File:** `apps/web/package.json:11`

**Issue:** The declared dependency is `"next": "^16.2.9"`. The CLAUDE.md architecture overview consistently refers to "Next.js 15". If this was an intentional upgrade the documentation should be updated; if it was unintentional, pinning the version back to `^15.x` prevents accidental breaking changes. The code itself uses async `params` which is a feature introduced in Next.js 15, so either version is technically compatible, but the discrepancy creates confusion.

**Fix:** Align documentation and code. If Next.js 16 is intentional, update CLAUDE.md. If not, pin: `"next": "^15.3.0"`.

---

### IN-02: `MiniGraph.tsx` uses `inner_w` / `inner_h` (snake_case) — violates JS/TS naming conventions

**File:** `apps/web/src/components/MiniGraph.tsx:42-43`

**Issue:** JavaScript/TypeScript convention is camelCase for local variables. `inner_w` and `inner_h` are inconsistent with the rest of the codebase.

**Fix:**
```ts
const innerW = width - padding * 2;
const innerH = height - padding * 2;
```

---

### IN-03: `RoadmapGraph` re-maps nodes/edges on every render without memoization

**File:** `packages/graph/src/RoadmapGraph.tsx:19-31`

**Issue:** `rfNodes` and `rfEdges` are computed inline on every render. When `RoadmapGraph` is inside a client component that re-renders on state changes (e.g., `RoadmapGraphView` when the router updates), ReactFlow receives new array references each time, potentially forcing internal reconciliation even when data has not changed. This is a quality concern, not a current crash, but it can cause subtle flickering on hover/interaction in view mode.

**Fix:**
```tsx
import { useMemo } from 'react';
const rfNodes = useMemo(() => nodes.map((n) => ({ ... })), [nodes]);
const rfEdges = useMemo(() => edges.map((e) => ({ ... })), [edges]);
```

---

_Reviewed: 2026-06-19T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
