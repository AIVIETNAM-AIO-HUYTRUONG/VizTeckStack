# Admin UI Refactor — Feature-First Architecture

**Date:** 2026-06-20  
**Scope:** `apps/admin/src/` — roadmaps list page + graph editor page  
**Goal:** Separate business logic, API calls, and UI into distinct layers following SOLID principles.

---

## 1. Folder Structure

```
apps/admin/src/
  features/
    roadmaps/
      services/
        roadmap.service.ts       ← getRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap, cycleStatus
        roadmap.service.test.ts
      hooks/
        useRoadmaps.ts           ← list state + CRUD handlers
      components/
        RoadmapModal.tsx         ← moved from components/

    graph-editor/
      services/
        graph.service.ts         ← loadGraph, saveGraph, normalizeNodeType, makeSnapshot
        graph.service.test.ts
      hooks/
        useGraphEditor.ts        ← editorNodes, editorEdges, loading, saving, dirty state
        useGraphEditor.test.ts
        useNodeActions.ts        ← handleDropNode, handleNodesDelete, handleConnect, handleNodeClick
        useGraphDraft.ts         ← sessionStorage draft side-effect
      components/
        GraphToolbar.tsx         ← moved from components/
        NodeInventory.tsx        ← moved from components/
        NodeSidePanel.tsx        ← moved from components/

    nodes/
      components/
        LessonEditor.tsx         ← moved from components/

  components/                    ← shared UI only
    AdminLayout.tsx
    ConfirmDialog.tsx
    ThemeToggle.tsx

  lib/                           ← unchanged
    api.ts
    useAuthGuard.ts
    useRouteGuard.ts

  app/                           ← pages: import hooks + render only
    roadmaps/page.tsx            ← ~50 lines after refactor
    roadmaps/[id]/page.tsx       ← ~80 lines after refactor
    roadmaps/[id]/nodes/[nodeId]/page.tsx
```

---

## 2. Layer Rules

| Layer | Responsibility | May call | May NOT call |
|-------|---------------|----------|--------------|
| `services/` | Async API calls, data transform, business logic | `apiFetch`, pure functions | React hooks, setState |
| `hooks/` | React state, wire services to UI | services, other hooks | `apiFetch` directly |
| `components/` | Render UI, accept props | nothing async | API, hooks with side-effects |
| `page.tsx` | Compose hooks + components | hooks, components | business logic inline |

---

## 3. Service Contracts

### `features/roadmaps/services/roadmap.service.ts`

```ts
export async function getRoadmaps(): Promise<Roadmap[]>
export async function createRoadmap(data: CreateRoadmapInput): Promise<void>
export async function updateRoadmap(id: string, data: UpdateRoadmapInput): Promise<void>
export async function deleteRoadmap(id: string): Promise<void>
export async function cycleStatus(roadmap: Roadmap): Promise<string>
// cycleStatus owns STATUS_CYCLE constant + API call
```

### `features/graph-editor/services/graph.service.ts`

```ts
export function normalizeNodeType(type: unknown): 'ROADMAP' | 'LESSON'
export function makeSnapshot(nodes: EditorNode[], edges: EditorEdge[]): string
export async function loadGraph(slug: string, roadmapId: string): Promise<GraphData>
// loadGraph: fetches roadmap + allRoadmaps in parallel, restores sessionStorage draft
export async function saveGraph(roadmapId: string, nodes: EditorNode[], edges: EditorEdge[]): Promise<void>
```

---

## 4. Hook Contracts

### `useRoadmaps()`
```ts
returns {
  roadmaps: Roadmap[];
  loading: boolean;
  modal: ModalState;
  setModal: (m: ModalState) => void;
  handleCreate: (data: CreateRoadmapInput) => Promise<void>;
  handleEdit: (roadmap: Roadmap, data: UpdateRoadmapInput) => Promise<void>;
  handleDelete: (roadmap: Roadmap) => Promise<void>;
  handleStatusChange: (roadmap: Roadmap) => Promise<void>;
}
```

### `useGraphEditor(id: string, slug: string)`
```ts
returns {
  loading: boolean;
  saving: boolean;
  saveError: string;
  dirty: boolean;
  roadmapTitle: string;
  roadmapStatus: string;
  editorNodes: EditorNode[];
  editorEdges: EditorEdge[];
  allRoadmaps: RoadmapEntry[];
  setEditorNodes: Dispatch<...>;
  setEditorEdges: Dispatch<...>;
  handleSave: () => Promise<void>;
  handleChangeStatus: (next: string) => Promise<void>;
}
```

### `useNodeActions(params)`
```ts
// Pure React handlers — no API calls
returns {
  handleNodesChange, handleEdgesChange, handleConnect,
  handleNodesDelete, handleDropNode, handleNodeClick,
  handleEdgeClick, handlePaneContextMenu,
}
```

### `useGraphDraft(id, nodes, edges, dirty)`
```ts
// Side-effect only: reads/writes sessionStorage
// No return value
```

---

## 5. Data Flow

```
roadmaps/page.tsx
  └── useRoadmaps()
        ├── roadmap.service.getRoadmaps()
        ├── roadmap.service.cycleStatus()
        └── state → RoadmapTable, RoadmapModal, ConfirmDialog

roadmaps/[id]/page.tsx
  ├── useGraphEditor(id, slug)
  │     ├── graph.service.loadGraph()
  │     └── graph.service.saveGraph()
  ├── useNodeActions(nodes, edges, setters, router)
  ├── useGraphDraft(id, nodes, edges, dirty)
  └── renders: GraphToolbar, NodeInventory, RoadmapGraph, NodeSidePanel, ConfirmDialog
```

---

## 6. Testing Strategy

### Services — unit tests with mocked `apiFetch`
```ts
// roadmap.service.test.ts
vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));

it('cycleStatus DRAFT → PUBLIC and calls PUT', async () => { ... });
it('getRoadmaps returns empty array on empty response', async () => { ... });
```

### Pure functions — no mocks needed
```ts
// graph.service.test.ts
it('normalizeNodeType(0) → ROADMAP', ...);
it('normalizeNodeType("LESSON") → LESSON', ...);
it('makeSnapshot is stable across equal inputs', ...);
```

### Hooks — React Testing Library renderHook
```ts
// useGraphEditor.test.ts
it('dirty is false on initial load', ...);
it('dirty is true after node position changes', ...);
```

**Not in scope:** UI component tests (NodeInventory, GraphToolbar, etc.)

---

## 7. Migration Notes

- `NodeSidePanel` currently calls `apiFetch('/api/roadmaps')` directly in a `useEffect`. After refactor, this call moves to `useNodeActions` or is passed as a prop from `useGraphEditor` (reuse `allRoadmaps` already fetched on load).
- `normalizeNodeType` and `makeSnapshot` are currently inline helpers in `page.tsx` — they move to `graph.service.ts` as named exports.
- `STATUS_CYCLE`, `STATUS_LABEL`, `STATUS_CLASS` constants currently in `roadmaps/page.tsx` move into `roadmap.service.ts` or a sibling `roadmap.constants.ts`.
- Import paths in `app/` pages update from `@/components/X` → `@/features/roadmaps/components/X` etc.
- No changes to `packages/*`, `apps/api-gateway`, or `apps/svc-roadmap`.
