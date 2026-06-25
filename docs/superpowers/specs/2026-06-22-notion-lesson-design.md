# Notion Lesson — Completion Design

**Date:** 2026-06-22
**Feature branch:** `feature/notion-lesson`
**Scope:** Complete three incomplete pieces of the lesson feature: MiniGraph data, autosave, and progress card polish.

---

## Context

The lesson feature is largely built:
- `packages/lesson` — `LessonEditor` and `LessonViewer` (BlockNote-based)
- Admin: lesson editor page at `/roadmaps/[id]/nodes/[nodeId]`
- Web: lesson viewer page at `/roadmap/[slug]/node/[id]`
- API: `GET /api/nodes/:id`, `PATCH /api/nodes/:id/content`, `PATCH /api/nodes/:id/title`
- Graph navigation: clicking a LESSON node in either admin or web graph routes to the lesson page

Three gaps remain:

| Gap | Status |
|-----|--------|
| `MiniGraph` receives empty `nodes=[]` / `edges=[]` | Broken — renders blank |
| `LessonEditor` requires manual "Save Lesson" button | UX incomplete |
| Progress card in lesson sidebar shows raw placeholder text | Polish needed |

---

## Piece 1: MiniGraph — Real Roadmap Data

### Problem
`LessonLayout` passes `nodes={[]}` and `edges={[]}` to `MiniGraph` because the lesson page only fetches `fetchNode(id)`, not the parent roadmap.

### Solution
Fetch roadmap data in the Server Component alongside the node fetch, then thread it down to `MiniGraph`.

### Changes

**`apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx`**
- Add `fetchRoadmap(slug)` in parallel with `fetchNode(id)` using `Promise.all`
- If `fetchRoadmap` throws, degrade gracefully: pass empty arrays to `LessonLayout`
- Pass `roadmapNodes` and `roadmapEdges` as new props to `LessonLayout`

**`apps/web/src/features/lesson/components/LessonLayout.tsx`**
- Add props: `roadmapNodes: NodeItem[]`, `roadmapEdges: EdgeItem[]`
- Map `NodeItem[]` → `MiniGraphNode[]`: rename `positionX/Y` → `x/y`, filter out nodes where `positionX` or `positionY` is null/undefined
- Map `EdgeItem[]` → `MiniGraphEdge[]`: pass through `sourceId` / `targetId`
- Pass `currentNodeId={node.id}` to `MiniGraph`

**`apps/web/src/features/lesson/components/MiniGraph.tsx`**
- Add prop `currentNodeId?: string` to `MiniGraphProps`
- In the circle render: if `n.id === currentNodeId`, render `r=9` with `stroke="white" strokeWidth={2}`; otherwise `r=6` with no stroke
- Fill color remains unchanged (`#4F46E5` for ROADMAP, `#059669` for LESSON)

### Behaviour
- MiniGraph shows the full roadmap graph scaled to 240×100 SVG
- The currently viewed lesson node is visually highlighted (larger, white ring)
- Non-clickable (decorative only)
- If roadmap fetch fails, MiniGraph renders its empty-state SVG (existing behaviour)

---

## Piece 2: Autosave in LessonEditor

### Problem
`LessonEditor` requires a manual "Save Lesson" button click. Notion-like UX should auto-save after the user stops typing.

### Solution
Subscribe to `editor.onChange` (BlockNote API), debounce 2 seconds, then call `onSave`. Replace the button with a small status indicator.

### Changes

**`packages/lesson/src/LessonEditor.tsx`**

**Remove:**
- `handleSave()` function
- The `<Button>` / button wrapper JSX

**Add:**
- `useEffect` that calls `editor.onChange(callback)` and returns the unsubscribe function for cleanup
- Inside callback: clear any pending timer, set new 2000ms timer; when it fires, guard against concurrent save (`saveStatus === 'saving'`), call `onSave(JSON.stringify(editor.document))`, update `saveStatus`
- Status indicator JSX (small text, top-right of editor area):

| `saveStatus` | Display | Style |
|---|---|---|
| `idle` | nothing | — |
| `saving` | "Saving…" | `text-text-3 text-xs` |
| `saved` | "Saved" | `text-text-3 text-xs` (resets to idle after 2s) |
| `error` | "Failed to save — click to retry" | `text-red-500 text-xs cursor-pointer` (onClick triggers save immediately) |

**Props unchanged:** `LessonEditorProps { initialContentJson, onSave }` — no changes required in `apps/admin`.

### Edge cases
- If `saveStatus === 'saving'` when the debounce fires, skip (avoid double-save)
- On unmount, cancel pending timer and do not call `onSave` (component is gone)
- Error state exposes a click-to-retry: sets a new immediate save attempt

---

## Piece 3: Progress Card Polish

### Problem
The progress sidebar card shows raw placeholder text "Progress tracking coming soon." — looks unfinished.

### Solution
Replace with a styled placeholder that signals intent without misleading the user.

### Changes

**`apps/web/src/features/lesson/components/LessonLayout.tsx`**

Replace the `<p>` placeholder with:
- An empty progress bar (`bg-bg-2` track, `bg-indigo` fill at `width: 0%`) with "0%" label
- A small "Coming soon" badge (`bg-bg-2 text-text-3 text-[11px] rounded-full`)

Uses only semantic Tailwind tokens — adapts to dark mode automatically. No state, no API call.

---

## Files Modified (complete list)

| File | Change |
|------|--------|
| `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` | Add `fetchRoadmap` parallel fetch, pass roadmap data to `LessonLayout` |
| `apps/web/src/features/lesson/components/LessonLayout.tsx` | Add roadmap props, map to MiniGraph types, polish progress card |
| `apps/web/src/features/lesson/components/MiniGraph.tsx` | Add `currentNodeId` prop, highlight logic |
| `packages/lesson/src/LessonEditor.tsx` | Replace button with debounce autosave + status indicator |

No new files. No API changes. No DB changes. No proto changes.

---

## Out of Scope

- Progress tracking backend (deferred to future sprint)
- MiniGraph node click navigation (decorative only by design)
- Autosave interval fallback (debounce-only per user decision)
- Admin lesson editor autosave (only `packages/lesson` `LessonEditor` is changed; admin page wiring unchanged)
