---
phase: 04-admin-cms
plan: "02"
subsystem: admin-cms
tags: [reactflow, graph-editor, admin, dnd, dirty-state, nav-guard]
dependency_graph:
  requires:
    - 04-01 (apps/admin shell, ConfirmDialog, apiFetch, useAuthGuard, nullable positions)
  provides:
    - Graph editor at /roadmaps/[id] (REQ-admin-graph-editor)
    - NodeInventory drag-to-place via HTML DnD + screenToFlowPosition
    - Dirty-state Save Graph (amber indicator) + unsaved-navigation guard
    - Full-replace UpsertGraph save via POST /api/roadmaps/:id/graph
  affects:
    - packages/graph/src/RoadmapGraph.tsx (GraphCanvas inner component, new edit-mode props)
    - packages/graph/src/index.ts (re-exports @xyflow/react types for admin consumer)
tech_stack:
  added: []
  patterns:
    - "RoadmapGraph split into GraphCanvas inner component to access useReactFlow() inside ReactFlowProvider"
    - "screenToFlowPosition used for both right-click create position and drop placement"
    - "Dirty state tracked via JSON.stringify snapshot comparison; savedSnapshotRef updated after save"
    - "Canvas delete = unplace (positionX/Y → null); inventory delete = permanent + cascade edges"
    - "useUnsavedGuard: beforeunload listener + confirmNavigation() imperative helper"
    - "crypto.randomUUID() for new node ids; passed as-is to UpsertGraph so service preserves them"
    - "dataTransfer any-cast pattern for DOM lib absence in tsconfig.base.json (lib: [ES2022] only)"
key_files:
  created:
    - packages/graph/src/RoadmapGraph.tsx (GraphCanvas split, new props: onConnect, onNodesDelete, onDropNode)
    - packages/graph/src/index.ts (re-exports NodeChange, EdgeChange, Connection, applyEdgeChanges)
    - apps/admin/src/components/GraphToolbar.tsx
    - apps/admin/src/components/NodeInventory.tsx
    - apps/admin/src/components/NodeSidePanel.tsx
    - apps/admin/src/lib/useRouteGuard.ts
    - apps/admin/src/app/roadmaps/[id]/page.tsx
  modified: []
decisions:
  - "GraphCanvas inner component pattern: RoadmapGraph wraps ReactFlowProvider; GraphCanvas lives inside it and calls useReactFlow() for screenToFlowPosition — avoids moving provider up to page level"
  - "dataTransfer typed as any in RoadmapGraph and NodeInventory — tsconfig.base.json lib:[ES2022] omits DOM lib; DataTransfer not recognized without DOM types"
  - "handleNodesDelete typed as any[] to avoid DOM Node vs @xyflow/react Node clash in apps/admin (lib mismatch)"
  - "packages/graph/src/index.ts re-exports @xyflow/react types so apps/admin can import NodeChange/EdgeChange/Connection/applyEdgeChanges without a direct @xyflow/react dependency"
  - "applyNodeChanges not used — position changes extracted manually from NodeChange[] to update editorNodes (avoids creating new RF node objects)"
  - "Dirty computed at render time via JSON snapshot comparison; ref updated after successful save (not state, avoids extra re-render)"
metrics:
  duration: "45m"
  completed: "2026-06-19"
  tasks_completed: 3
  tasks_total: 4
  files_created: 7
  files_modified: 0
---

# Phase 04 Plan 02: Graph Editor Summary

**One-liner:** Graph editor at /roadmaps/[id] with three-zone layout (toolbar + canvas + inventory), drag-to-place, right-click create, dirty-state Save Graph (amber), and full-replace UpsertGraph save.

## What Was Built

Tasks 1–3 complete. Task 4 is a human-verify checkpoint (browser QA).

### Task 1: Extend RoadmapGraph for edit-mode state + drop passthrough

Refactored `packages/graph/src/RoadmapGraph.tsx` to split rendering into an inner `GraphCanvas` component that lives inside `ReactFlowProvider` and can call `useReactFlow()`. This is required so `screenToFlowPosition` is available for both the right-click create position and the inventory drop coordinate transform.

New props added to `RoadmapGraphProps`:
- `onConnect?: OnConnect` — wires edge creation
- `onNodesDelete?: OnNodesDelete` — triggers unplace on canvas delete
- `onDropNode?: (nodeId: string, flowPosition: { x: number; y: number }) => void` — receives inventory drag-drop placement

`onPaneContextMenu` now computes flow-space coordinates (not screen coordinates) via `screenToFlowPosition` before calling the prop, fixing the coordinate transform that was missing in Phase 01.

`packages/graph/src/index.ts` updated to re-export `NodeChange`, `EdgeChange`, `Connection`, `applyEdgeChanges` from `@xyflow/react`, giving `apps/admin` access to these types without a direct dependency.

### Task 2: GraphToolbar, NodeInventory, NodeSidePanel, useRouteGuard

All four components/hooks implemented per the UI-SPEC:

- **GraphToolbar**: 48px toolbar (h-12). Left: ghost "← Roadmaps" button + roadmap title. Right: "Add Node" (secondary) + "Save Graph" button. Save Graph uses amber `#F59E0B` background when `dirty && !saving`, primary indigo when clean, opacity-60 when saving. `aria-label="Save Graph (unsaved changes)"` when dirty.
- **NodeInventory**: 220px fixed height. Section header (32px, bg-bg-2, uppercase "Node Inventory" label + node count). Scrollable list; each row (44px min-height): drag handle div (`draggable`, `dataTransfer.setData('nodeId', ...)`, `aria-label="Drag to place on canvas"`, `role="button"`, `tabIndex={0}`), NodeBadge, title (click to edit), status chip (`Placed` indigo-lt / `Unplaced` bg-bg-2), Delete button (red-500).
- **NodeSidePanel**: 320px slide-in (transform translateX 0, 200ms ease-out). Create/Edit modes. × close button with `aria-label="Close panel"`. Title text input (required). Type native `<select>` (ROADMAP/LESSON) + NodeBadge preview. Footer: Discard (ghost) + Create Node / Save Changes (primary).
- **useUnsavedGuard**: `beforeunload` listener registered when `isDirty`. Returns `showConfirm`, `confirmNavigation()`, `cancelNavigation()`, `proceedNavigation()`. The page owns ConfirmDialog rendering; the hook owns detection and cleanup.

### Task 3: Graph editor page assembly

`apps/admin/src/app/roadmaps/[id]/page.tsx` — the full graph editor. Key implementation details:

- `params: Promise<{ id: string }>` — unwrapped via React's `use()` hook (not `await` — client component)
- `slug` from `useSearchParams().get('slug')` — loads via `apiFetch('/api/roadmaps/' + slug)`
- Single working state: `editorNodes: EditorNode[]` (positionX/Y nullable) + `editorEdges: EditorEdge[]`
- Dirty: `JSON.stringify(current) !== savedSnapshotRef.current` — ref updated after successful save
- `onNodesChange`: extracts `type === 'position'` changes and updates `editorNodes` positionX/Y
- `onNodesDelete` (canvas delete = D-06 unplace): sets positionX/Y to `null`, keeps node in inventory
- `onConnect`: appends new `EditorEdge` with `crypto.randomUUID()` id
- `onEdgesChange`: reconciles via `applyEdgeChanges` then filters by remaining ids
- `onPaneContextMenu(event, flowPos)`: opens panel mode=create with the flow position stored; on submit creates placed node
- `onDropNode(nodeId, flowPos)`: updates that node's positionX/Y in `editorNodes`
- Add Node toolbar button: opens panel mode=create with no position → unplaced node (inventory only)
- Canvas node click: opens panel mode=edit prefilled
- Inventory Edit: opens panel mode=edit
- Inventory Delete: ConfirmDialog → removes node AND cascades edge removal
- Save Graph: POSTs FULL `editorNodes` + `editorEdges` to `/api/roadmaps/:id/graph`; new nodes use `crypto.randomUUID()` ids; `positionX/Y: undefined` for unplaced (NodeInput accepts optional)
- Nav guard: `confirmNavigation()` called on back-link click; `showNavConfirm` drives ConfirmDialog

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `onPaneContextMenu` was passing screen coordinates, not flow coordinates**

- **Found during:** Task 1
- **Issue:** The Phase 01 implementation of `handlePaneContextMenu` in `RoadmapGraph` passed raw `clientX/Y` (screen coords) to the consumer. For the drag-to-canvas use case this causes nodes to appear at wrong positions when the canvas is panned/zoomed.
- **Fix:** Moved context menu handling into `GraphCanvas` (inside `ReactFlowProvider`) so it can call `screenToFlowPosition({ x: clientX, y: clientY })` and pass the flow-space position to the prop.
- **Files modified:** `packages/graph/src/RoadmapGraph.tsx`
- **Commit:** 9950a9e

**2. [Rule 3 - Blocking] `DataTransfer` not in DOM lib — `getData`/`dropEffect`/`setData` missing**

- **Found during:** Task 1 TypeScript check
- **Issue:** `tsconfig.base.json` declares `lib: ["ES2022"]` with no `DOM`. `DataTransfer` methods (`getData`, `setData`, `dropEffect`) are DOM types and not recognized in strict mode.
- **Fix:** Cast `event.dataTransfer` as `any` in both `RoadmapGraph.tsx` (handleDrop/handleDragOver) and `NodeInventory.tsx` (handleDragStart). Added ESLint disable comments.
- **Files modified:** `packages/graph/src/RoadmapGraph.tsx`, `apps/admin/src/components/NodeInventory.tsx`
- **Commit:** 9950a9e, f9a5c64

**3. [Rule 3 - Blocking] `@xyflow/react` types not available in `apps/admin` — `NodeChange`, `EdgeChange`, `Connection` missing**

- **Found during:** Task 3 TypeScript check
- **Issue:** `apps/admin` doesn't have `@xyflow/react` as a direct dependency; importing from it in the page file caused `Cannot find module '@xyflow/react'`.
- **Fix:** Added re-exports of the needed types and functions from `packages/graph/src/index.ts` so `apps/admin` can import them from `@vizteck/graph`.
- **Files modified:** `packages/graph/src/index.ts`
- **Commit:** c3a51d6

**4. [Rule 3 - Blocking] DOM `Node` vs `@xyflow/react` `Node` type clash in `onNodesDelete`**

- **Found during:** Task 3 TypeScript check
- **Issue:** `OnNodesDelete` is typed as `(nodes: Node[]) => void` where `Node` is `@xyflow/react`'s node type. In the `apps/admin` context (no DOM lib), TypeScript resolved `Node` to the DOM `Node` type, causing an assignment conflict.
- **Fix:** Typed the `handleNodesDelete` parameter as `any[]` with an explicit inner type annotation for `id: string` extraction.
- **Files modified:** `apps/admin/src/app/roadmaps/[id]/page.tsx`
- **Commit:** c3a51d6

## Known Stubs

None — all functionality is wired to live API calls. The graph editor page loads from GET /api/roadmaps/:slug and saves to POST /api/roadmaps/:id/graph.

## Threat Flags

None — no new trust boundaries introduced beyond what the plan's `<threat_model>` describes:
- T-04-05 (UpsertGraph full-replace): mitigated — page always sends complete `editorNodes` + `editorEdges`; no partial save path exists in the implementation
- T-04-07 (client temp node ids): mitigated — `crypto.randomUUID()` used for all new nodes; passed as `id` to UpsertGraph so service preserves the id

## Self-Check: PASSED

Key files verified on disk:
- packages/graph/src/RoadmapGraph.tsx (GraphCanvas split + new props)
- packages/graph/src/index.ts (re-exports)
- apps/admin/src/components/GraphToolbar.tsx
- apps/admin/src/components/NodeInventory.tsx
- apps/admin/src/components/NodeSidePanel.tsx
- apps/admin/src/lib/useRouteGuard.ts
- apps/admin/src/app/roadmaps/[id]/page.tsx

Commits verified: 9950a9e, f9a5c64, c3a51d6 all present in git log.
TypeScript: `pnpm --filter @vizteck/admin exec tsc --noEmit` exits 0. `pnpm --filter @vizteck/graph exec tsc --noEmit` exits 0. `pnpm --filter @vizteck/web exec tsc --noEmit` exits 0.
