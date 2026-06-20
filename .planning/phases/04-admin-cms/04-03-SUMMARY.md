---
phase: 04-admin-cms
plan: "03"
subsystem: admin-cms
tags: [blocknote, lesson-editor, admin, upsertgraph, ssr-false]
dependency_graph:
  requires:
    - 04-01 (apps/admin shell, apiFetch, useAuthGuard)
    - 04-02 (graph editor, UpsertGraph save pattern)
  provides:
    - Lesson editor at /roadmaps/[id]/nodes/[nodeId] (REQ-admin-lesson-editor)
    - LessonEditor BlockNote editable wrapper with dark-mode detection
    - Full-graph save via UpsertGraph (no sibling-node data loss)
  affects:
    - apps/admin/src/app/roadmaps/[id]/page.tsx (TypeScript fix: change.id cast)
tech_stack:
  added: []
  patterns:
    - "LessonEditor 'use client' — useCreateBlockNote + BlockNoteView editable={true} with theme prop"
    - "tryParseBlocks helper: try/catch JSON.parse, returns undefined for invalid/empty JSON"
    - "MutationObserver on document.documentElement attributeFilter=['class'] for dark mode"
    - "dynamic(() => import(...), { ssr: false }) — BlockNote must not run on server"
    - "params: Promise<{id,nodeId}> + React.use() to unwrap (Next.js 16)"
    - "Full graph loaded (GET /api/roadmaps/:slug) + node detail in parallel — held in state for UpsertGraph"
    - "handleSave maps ALL allNodes, replacing only target node content (Pitfall 1 guard)"
key_files:
  created:
    - apps/admin/src/components/LessonEditor.tsx
    - apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx
  modified:
    - apps/admin/src/app/roadmaps/[id]/page.tsx (TypeScript fix: NodeChange.id cast)
decisions:
  - "LessonEditor receives onSave prop (Promise<void>) and owns all save UX — allows page to stay purely orchestration"
  - "Full graph (allNodes + allEdges) stored in page state — required because UpsertGraph is full-replace (Pitfall 1)"
  - "slug read from useSearchParams().get('slug') — consistent with graph editor page pattern"
  - "content field from GET /api/nodes/:nodeId preferred over graph endpoint (detail endpoint is more up-to-date)"
  - "Rule 1 fix applied: change.id does not exist on NodeAddChange; fixed with 'id' in change guard in page.tsx"
metrics:
  duration: "20m"
  completed: "2026-06-20"
  tasks_completed: 2
  tasks_total: 3
  files_created: 2
  files_modified: 1
---

# Phase 04 Plan 03: Lesson Editor Summary

**One-liner:** Client-side BlockNote lesson editor at /roadmaps/[id]/nodes/[nodeId] with dark-mode detection, full-graph UpsertGraph save (no sibling-node loss), and Saving/Saved/error UX.

## What Was Built

Tasks 1 and 2 complete. Task 3 is a human-verify checkpoint (browser QA).

### Task 1: LessonEditor BlockNote wrapper

Created `apps/admin/src/components/LessonEditor.tsx` as a `'use client'` component:

- `tryParseBlocks(json)` — local helper wrapping `JSON.parse` in try/catch; returns `undefined` for invalid/empty JSON so the editor starts fresh rather than crashing.
- `useCreateBlockNote(blocks ? { initialContent: blocks } : {})` — passes existing content when valid, starts empty otherwise.
- `MutationObserver` on `document.documentElement` watching `attributeFilter: ['class']` — same pattern as `LessonContent.tsx` in apps/web; sets `theme` state to `'dark'`/`'light'` for BlockNote.
- `BlockNoteView editor={editor} editable={true} theme={theme}` — the editable editor rendering.
- Save UX: `SaveStatus` type (`idle | saving | saved | error`). Button cycles `Save Lesson` → `Saving…` (disabled, opacity-60) → `Saved` (2s hold then reverts) → on failure: `error` state renders inline banner `Failed to save. Please try again.`.
- `onSave` prop receives `JSON.stringify(editor.document)` — the BlockNote blocks serialized as a string.

### Task 2: Lesson editor page

Created `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`:

- `'use client'` + `useAuthGuard()` — protected page.
- `params: Promise<{ id: string; nodeId: string }>` typed correctly; `use(params)` unwraps (Next.js 16, Pitfall 5).
- `slug` from `useSearchParams().get('slug')` — breadcrumb back links from the graph editor pass this.
- Load: `Promise.all([apiFetch('/api/roadmaps/:slug'), apiFetch('/api/nodes/:nodeId')])` — full graph + node detail in parallel.
- `allNodes` and `allEdges` held in state — required for the UpsertGraph full-replace invariant (Pitfall 1).
- Target node: found by `nodeId` within the graph nodes; content overridden by the node-detail endpoint (more up-to-date).
- `handleSave(contentJson)` — maps `allNodes` to `NodeInput[]`, replacing `content` only for the node whose `id === nodeId`. All other nodes sent unchanged. Posts to `POST /api/roadmaps/:id/graph`. On success, updates `allNodes` state so subsequent saves are consistent. On non-OK response, rejects with an error message (LessonEditor catches it and shows the error banner).
- `dynamic(() => import('@/components/LessonEditor').then(m => m.LessonEditor), { ssr: false })` — BlockNote must not be server-rendered.
- Breadcrumb: `← Roadmaps / [roadmap title] / [node title]` with `Roadmaps` linking to `/roadmaps`, roadmap title linking to `/roadmaps/<id>?slug=<slug>`.
- Not-found guard: renders a friendly message + back link instead of crashing if the node is absent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `change.id` does not exist on `NodeAddChange` in `applyFlowChangesToEditorNodes`**

- **Found during:** Task 1 TypeScript check (`cd apps/admin && pnpm exec tsc --noEmit`)
- **Issue:** `NodeChange` is a discriminated union. The `NodeAddChange` variant has no `id` property. Accessing `change.id` unconditionally caused TS2339 error, which was silently broken in Phase 04-02 commits.
- **Fix:** Changed `if (change.id !== n.id)` to `if (!('id' in change) || (change as { id: string }).id !== n.id)` — safe runtime guard.
- **Files modified:** `apps/admin/src/app/roadmaps/[id]/page.tsx`
- **Commit:** c9626fd

## Known Stubs

None — LessonEditor passes `onSave` to the page which calls a live `apiFetch` to the real UpsertGraph endpoint. No mock data.

## Threat Flags

None — no new trust boundaries beyond the plan's `<threat_model>`:
- T-04-08 (full graph UpsertGraph): mitigated — `handleSave` always sends ALL `allNodes` + `allEdges`; only the target node's `content` field is mutated. Behind `AdminGuard` via `apiFetch` Bearer token.
- T-04-09 (XSS via BlockNote content): mitigated — `BlockNoteView` renders its own structured JSON; no raw HTML rendered from content at any point.

## Self-Check: PASSED

Key files verified on disk:
- apps/admin/src/components/LessonEditor.tsx (created)
- apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx (created)
- apps/admin/src/app/roadmaps/[id]/page.tsx (TypeScript fix applied)

Commits verified: c9626fd, d28bacd present in git log.
TypeScript: `cd apps/admin && pnpm exec tsc --noEmit` exits 0.
