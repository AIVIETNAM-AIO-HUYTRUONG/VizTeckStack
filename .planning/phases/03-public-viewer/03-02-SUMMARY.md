---
phase: 03-public-viewer
plan: "02"
subsystem: packages/graph
tags: [react, xyflow, graph, components, typescript]
dependency_graph:
  requires: ["@vizteck/ui"]
  provides: ["@vizteck/graph", "RoadmapGraph", "RoadmapNode", "NodeItem", "EdgeItem", "GraphNodeType"]
  affects: ["apps/web"]
tech_stack:
  added: ["@xyflow/react@^12.11.0"]
  patterns: ["custom-xyflow-node", "module-scope-nodeTypes", "ReactFlowProvider-wrap", "barrel-export", "inline-styles-design-tokens"]
key_files:
  created:
    - packages/graph/package.json
    - packages/graph/tsconfig.json
    - packages/graph/src/types.ts
    - packages/graph/src/index.ts
    - packages/graph/src/RoadmapNode.tsx
    - packages/graph/src/RoadmapGraph.tsx
  modified:
    - pnpm-lock.yaml
decisions:
  - "NodeProps generic typed as NodeProps<Node<RoadmapNodeData>> — @xyflow/react v12 requires the full Node generic (id, position, data…), not just {data: T}"
  - "Removed explicit React import from both components — jsx: react-jsx transform handles JSX without a namespace import; React.MouseEvent replaced by MouseEvent from 'react'"
  - "nodeTypes declared at module scope outside component function — prevents object identity change on every render which would cause ReactFlow to remount all nodes"
  - "ReactFlowProvider wraps ReactFlow inside the parent div — satisfies Pitfall 2 for consumers using useReactFlow hooks in parent components"
metrics:
  duration: "8m"
  completed: "2026-06-18"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
---

# Phase 03 Plan 02: @vizteck/graph Package Summary

**One-liner:** RoadmapGraph (@xyflow/react v12 read-only canvas) + custom RoadmapNode (ROADMAP/LESSON border colors) exported from @vizteck/graph workspace package.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold @vizteck/graph package + shared graph types | 8260ef0 | packages/graph/package.json, tsconfig.json, src/types.ts, src/index.ts, pnpm-lock.yaml |
| 2 | Implement RoadmapNode and RoadmapGraph (read-only view mode) | 5abb585 | packages/graph/src/RoadmapNode.tsx, packages/graph/src/RoadmapGraph.tsx |

## What Was Built

### @vizteck/graph workspace package

A shared React graph package wrapping @xyflow/react v12. No separate build step — `main: ./src/index.ts`; apps/web will transpile via `transpilePackages`.

**Package config:**
- `name: @vizteck/graph`, `main: ./src/index.ts`, `types: ./src/index.ts`
- Extends `../../tsconfig.base.json` with `jsx: react-jsx`
- dependencies: @xyflow/react ^12.11.0, @vizteck/ui workspace:*, react ^19, react-dom ^19

### Shared Types (`packages/graph/src/types.ts`)

- `GraphNodeType = 'ROADMAP' | 'LESSON'`
- `NodeItem` — mirrors NodeDto fields: id, roadmapId, type, title, positionX, positionY, targetRoadmapId?, content?
- `EdgeItem` — mirrors EdgeDto fields: id, sourceId, targetId, label?

### RoadmapNode (`packages/graph/src/RoadmapNode.tsx`)

Custom @xyflow/react node renderer:
- `'use client'` directive at top
- Typed as `NodeProps<Node<RoadmapNodeData>>` (correct v12 generic)
- Target Handle at Position.Top, Source Handle at Position.Bottom
- ROADMAP border `#4F46E5` (indigo), LESSON border `#059669` (emerald) per DEC-03-09
- Renders `<NodeBadge type={...} />` from @vizteck/ui (badge colors match card badges)
- Node title in JetBrains Mono 12px

### RoadmapGraph (`packages/graph/src/RoadmapGraph.tsx`)

Main graph canvas component:
- `'use client'` first line; `import '@xyflow/react/dist/style.css'` before component definition (per Pitfall 4)
- `nodeTypes = { roadmapNode: RoadmapNode }` at module scope (prevents remount)
- Props: `{ nodes: NodeItem[]; edges: EdgeItem[]; mode: 'view' | 'edit'; onNodeClick?: (node: NodeItem) => void }`
- Maps NodeItem[] → RF nodes with `type: 'roadmapNode'`, `position: {x: positionX, y: positionY}`, `data: {title, nodeType, targetRoadmapId}`
- Maps EdgeItem[] → RF edges with `source: sourceId`, `target: targetId`, `label`
- View mode: `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`, `edgesReconnectable={false}`
- Parent div: `width: '100%'`, `height: '100%'`, `background: '#F4F6FB'` (DEC-03-05, plain fill)
- Wrapped in `<ReactFlowProvider>` (Pitfall 2)
- No Save button — Phase 4 scope (DEC-03-10)
- `onNodeClick` wired: passes matching NodeItem to consumer callback (T-03-02: consumer navigates to internal routes only)

### Barrel (`packages/graph/src/index.ts`)

```typescript
export { RoadmapGraph } from './RoadmapGraph';
export type { RoadmapGraphProps } from './RoadmapGraph';
export { RoadmapNode } from './RoadmapNode';
export type { NodeItem, EdgeItem, GraphNodeType } from './types';
```

## Verification Results

```
pnpm --filter @vizteck/graph exec tsc --noEmit  → exit 0 (strict mode, zero errors)
grep -c "@xyflow/react/dist/style.css" packages/graph/src/RoadmapGraph.tsx  → 1
grep -c "nodesDraggable" packages/graph/src/RoadmapGraph.tsx  → 1
grep -v '^//' packages/graph/src/RoadmapNode.tsx | grep -c "@vizteck/ui"  → 1
node -e "... p.name==='@vizteck/graph' && p.dependencies['@xyflow/react']"  → OK
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] NodeProps generic incompatible with @xyflow/react v12 NodeTypes**
- **Found during:** Task 2 verification (tsc --noEmit)
- **Issue:** `NodeProps<{ data: RoadmapNodeData }>` does not satisfy the `Node<Record<string, unknown>, string | undefined>` constraint — @xyflow/react v12 `NodeProps` generic requires a full `Node` type (with id, position, etc.), not just the data shape
- **Fix:** Changed to `NodeProps<Node<RoadmapNodeData>>` and extended `RoadmapNodeData` with `Record<string, unknown>` to satisfy the index signature constraint
- **Files modified:** packages/graph/src/RoadmapNode.tsx
- **Commit:** Resolved before Task 2 commit (same commit 5abb585)

**2. [Rule 1 - Bug] Stale `nodeData` references after variable rename**
- **Found during:** IDE diagnostics after NodeProps fix
- **Issue:** After removing the `const nodeData = data as unknown as RoadmapNodeData` alias, two JSX references still used `nodeData.nodeType` and `nodeData.title`
- **Fix:** Replaced both with `data.nodeType` and `data.title` (direct destructured prop)
- **Files modified:** packages/graph/src/RoadmapNode.tsx
- **Commit:** Resolved before Task 2 commit (same commit 5abb585)

**3. [Rule 1 - Bug] Unused React import + React.MouseEvent reference**
- **Found during:** IDE diagnostics (TS6133 hint)
- **Issue:** `import React from 'react'` unused under `jsx: react-jsx` transform; `React.MouseEvent` in RoadmapGraph.tsx referenced the removed import
- **Fix:** Removed default React import from both files; changed `React.MouseEvent` to `MouseEvent` imported as named type from 'react'; changed `rfNode: { id: string }` to `rfNode: Node` (imported from @xyflow/react) for correct typing of the `onNodeClick` handler
- **Files modified:** packages/graph/src/RoadmapNode.tsx, packages/graph/src/RoadmapGraph.tsx
- **Commit:** Resolved before Task 2 commit (same commit 5abb585)

## Known Stubs

None. RoadmapGraph is fully implemented for view mode. Edit mode (`mode="edit"` with Save button wiring) is intentionally deferred to Phase 4 per DEC-03-10 and the plan's Out of Scope declaration — the `mode` prop is accepted and controls all interaction flags, but no edit-specific UI is rendered.

## Threat Flags

None. packages/graph is a pure presentational React package. The `onNodeClick` callback passes `NodeItem` to the consumer without performing navigation itself (T-03-02 mitigated at consumer boundary in 03-03).

## Self-Check: PASSED

- [x] packages/graph/package.json exists with name @vizteck/graph and @xyflow/react dependency
- [x] packages/graph/tsconfig.json exists extending ../../tsconfig.base.json
- [x] packages/graph/src/types.ts exists with NodeItem, EdgeItem, GraphNodeType
- [x] packages/graph/src/index.ts exists with all exports
- [x] packages/graph/src/RoadmapNode.tsx exists with NodeBadge from @vizteck/ui
- [x] packages/graph/src/RoadmapGraph.tsx exists with 'use client', CSS import, nodeTypes at module scope
- [x] Commits 8260ef0 and 5abb585 verified in git log
- [x] TypeScript strict typecheck exits 0
