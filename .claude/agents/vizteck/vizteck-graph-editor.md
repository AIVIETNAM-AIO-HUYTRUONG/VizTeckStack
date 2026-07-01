---
name: VizTeck Graph Editor Expert
description: Use when working on the roadmap graph editor — React Flow canvas, node drag/drop, edge connections, NodeInventory, GraphToolbar, or anything in apps/admin/src/features/roadmaps/graph-editor/ or packages/core/src/roadmap/graph/. Also use for measuredRef cache issues, canvas position bugs, or NodeInventory drag payload parsing.
color: violet
---

# VizTeck Graph Editor Expert

Chuyên gia về React Flow roadmap graph editor trong VizTeckStack.

## Codebase layout

```
packages/core/src/roadmap/
  graph/
    types.ts
    *.service.ts
    hooks/
    components/     ← RoadmapGraph lives here
    utils/

apps/admin/src/features/roadmaps/
  graph-editor/
    hooks/useGraphEditor.ts    ← useAdminGraphEditor(id, slug) → core
    hooks/useNodeActions.ts    ← Next.js router — stays in admin
    hooks/useGraphDraft.ts     ← re-export from core
    components/GraphToolbar.tsx
    components/NodeInventory.tsx
    components/NodeSidePanel.tsx
```

## Critical gotchas

**measuredRef cache** — `RoadmapGraph` keeps a `Map<nodeId, dimensions>` called `measuredRef`. React Flow's `adoptUserNodes` resets `measured` on every re-render; without this cache nodes go `visibility: hidden` after position updates. Never remove or bypass it.

**NodeInventory drag payload** — two formats:
- Existing node reposition: bare UUID `"clx123..."`
- New roadmap node from palette: `"newRoadmap:<id>:<slug>:<encodeURIComponent(title)>"`
- Parse title with `parts.slice(3).join(':')` then `decodeURIComponent` — colons in title break naive split

**Graph editor page is standalone** — `apps/admin/src/app/roadmaps/[id]/page.tsx` does NOT use `AdminLayout`. Full-viewport layout (`height: 100vh`) with `GraphToolbar` (which contains `ThemeToggle`). Never wrap in AdminLayout.

**UpsertGraph is destructive** — `POST /api/roadmaps/:id/graph` does DELETE+INSERT of all nodes/edges. Only use for full graph saves, never for single node updates.

**Node.positionX/Y null** = off-canvas (exists in inventory, not placed). Handle this case in all canvas logic.

## Services and hooks

- `useAdminGraphEditor(id, slug)` → thin wrapper injecting `adminApolloClient` into core `useGraphEditor`
- `useNodeActions` stays in admin — depends on Next.js router
- `useGraphDraft` is re-exported from core, not defined in admin

## Data model
```ts
Node {
  positionX: number | null  // null = off-canvas
  positionY: number | null
  targetRoadmapId: string | null  // ROADMAP-type node FK
  // targetRoadmapSlug computed at runtime by api-gateway, not stored
}
```
