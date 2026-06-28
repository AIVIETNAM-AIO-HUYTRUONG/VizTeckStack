# Core Package Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all feature logic (services, hooks, and UI components) into `packages/core` (`@vizteck/core`) with a feature-first folder structure (`core/src/<feature>/ui/`), so apps only import, inject their Apollo client, and compose layouts.

**Architecture:** Follow Uncle Bob's Dependency Inversion Principle — all service functions accept `ApolloClient` as their first argument. UI components from `packages/lesson` and `packages/graph` are moved into `packages/core/src/<feature>/ui/`, and the old packages become thin re-export shims. `useNodeActions` stays in `apps/admin` (Next.js routing URLs are admin-specific).

**Tech Stack:** TypeScript, React 19, `@apollo/client` ^3.11, `@xyflow/react` ^12, Turborepo workspace, pnpm.

## Global Constraints

- `packages/core` must have zero imports from `apps/*`.
- Services in `packages/core` must not import any singleton Apollo client — client is always a parameter.
- `useNodeActions` stays in `apps/admin` (Next.js routing dep); it imports types from `@vizteck/core`.
- All new files follow `packages/lesson` tsconfig pattern: `extends ../../tsconfig.base.json`, with `"jsx": "react-jsx"` and `"lib": ["ES2022", "DOM"]`.
- No new runtime dependencies beyond what is already installed in the monorepo.
- Commit message format: `refactor: <description>` (conventional commits, lowercase, no period).
- Run `pnpm --filter @vizteck/core build` to verify TypeScript after each task.

---

## File Map

### Created
```
packages/core/
  package.json
  tsconfig.json
  src/
    roadmap/
      types.ts
      constants.ts
      roadmap.service.ts
      useRoadmaps.ts
    graph/
      types.ts                    ← includes NodeItem, EdgeItem, GraphNodeType (merged from packages/graph)
      graph.service.ts
      useGraphEditor.ts
      useGraphDraft.ts
      ui/
        RoadmapGraph.tsx          ← moved from packages/graph/src/
        RoadmapNode.tsx           ← moved from packages/graph/src/
    lesson/
      types.ts                    ← includes BreadcrumbItem, PageTree etc. (merged from packages/lesson)
      lesson.service.ts
      useLessonEditor.ts
      useLessonPageShell.ts
      usePageTree.ts
      ui/
        LessonEditor.tsx          ← moved from packages/lesson/src/
        LessonViewer.tsx
        LessonPageShell.tsx
        LessonPageLayout.tsx
        CoverDisplay.tsx
        BreadcrumbDisplay.tsx
        PageTreeSidebar.tsx
        PageTreeItem.tsx
        SearchModal.tsx
        SearchPreview.tsx
        SearchResultItem.tsx
        useSearch.ts
        useSearchModal.ts
        utils.ts
    index.ts
```

### Modified
```
packages/core/package.json                                              — add @xyflow/react dep
packages/graph/src/index.ts                                            — shim re-exports from @vizteck/core
packages/graph/package.json                                            — add @vizteck/core dep, remove direct deps
packages/lesson/src/index.ts                                           — shim re-exports from @vizteck/core
packages/lesson/package.json                                           — add @vizteck/core dep, remove direct deps
apps/admin/package.json                                                — add @vizteck/core dep
apps/admin/src/features/roadmaps/hooks/useRoadmaps.ts                  — thin wrapper, injects adminApolloClient
apps/admin/src/features/graph-editor/hooks/useGraphEditor.ts           — thin wrapper
apps/admin/src/features/graph-editor/hooks/useGraphDraft.ts            — re-export from @vizteck/core
apps/admin/src/features/graph-editor/hooks/useNodeActions.ts           — import types from @vizteck/core
apps/admin/src/features/lessons/hooks/useLessonEditor.ts               — thin wrapper
apps/admin/src/features/lessons/hooks/useLessonPageShell.ts            — thin wrapper
apps/admin/src/features/lessons/hooks/usePageTree.ts                   — thin wrapper
apps/web/src/features/roadmap/components/RoadmapGraphView.tsx          — imports from @vizteck/core
apps/web/src/features/lesson/components/LessonLayout.tsx               — imports from @vizteck/core
```

### Deleted
```
apps/admin/src/features/roadmaps/services/roadmap.service.ts
apps/admin/src/features/graph-editor/services/graph.service.ts
apps/admin/src/features/lessons/services/lesson.service.ts
```

---

## Task 1: Scaffold packages/core

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts` (empty barrel, filled later)

**Interfaces:**
- Produces: `@vizteck/core` workspace package importable by apps

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@vizteck/core",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@apollo/client": "^3.11.0",
    "@vizteck/graphql-client": "workspace:*",
    "@vizteck/lesson": "workspace:*",
    "@vizteck/graph": "workspace:*",
    "@xyflow/react": "^12.0.0",
    "graphql": "^16.9.0",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

Save to: `packages/core/package.json`

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src/**/*"]
}
```

Save to: `packages/core/tsconfig.json`

- [ ] **Step 3: Create empty barrel**

```typescript
// populated in later tasks
export {};
```

Save to: `packages/core/src/index.ts`

- [ ] **Step 4: Register in apps/admin**

In `apps/admin/package.json`, add to `dependencies`:
```json
"@vizteck/core": "workspace:*"
```

- [ ] **Step 5: Install workspace**

Run from repo root:
```bash
pnpm install
```

Expected: no errors, `packages/core` appears in workspace.

- [ ] **Step 6: Verify build**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0 (empty barrel compiles fine).

- [ ] **Step 7: Commit**

```bash
git add packages/core/package.json packages/core/tsconfig.json packages/core/src/index.ts apps/admin/package.json pnpm-lock.yaml
git commit -m "refactor: scaffold @vizteck/core package"
```

---

## Task 2: Migrate roadmap domain

**Files:**
- Create: `packages/core/src/roadmap/types.ts`
- Create: `packages/core/src/roadmap/constants.ts`
- Create: `packages/core/src/roadmap/roadmap.service.ts`
- Create: `packages/core/src/roadmap/useRoadmaps.ts`
- Modify: `packages/core/src/index.ts`
- Delete: `apps/admin/src/features/roadmaps/services/roadmap.service.ts`
- Modify: `apps/admin/src/features/roadmaps/hooks/useRoadmaps.ts`

**Interfaces:**
- Consumes: `@vizteck/graphql-client` GQL documents
- Produces: `Roadmap`, `CreateRoadmapInput`, `UpdateRoadmapInput`, `ModalState`, `STATUS_CYCLE`, `STATUS_LABEL`, `STATUS_CLASS`, `getRoadmaps(client)`, `createRoadmap(client, input)`, `updateRoadmap(client, id, input)`, `deleteRoadmap(client, id)`, `cycleStatus(client, roadmap)`, `useRoadmaps(client)`

- [ ] **Step 1: Create types.ts**

```typescript
// packages/core/src/roadmap/types.ts
export interface Roadmap {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status?: string;
}

export interface CreateRoadmapInput {
  title: string;
  slug: string;
  description: string;
}

export interface UpdateRoadmapInput {
  title?: string;
  description?: string;
  status?: string;
}

export type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; roadmap: Roadmap }
  | { type: 'delete'; roadmap: Roadmap };
```

- [ ] **Step 2: Create constants.ts**

```typescript
// packages/core/src/roadmap/constants.ts
export const STATUS_CYCLE: Record<string, string> = {
  DRAFT: 'PUBLIC',
  PUBLIC: 'PRIVATE',
  PRIVATE: 'DRAFT',
};

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLIC: 'Public',
  PRIVATE: 'Private',
};

export const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'bg-bg-2 text-text-3 border border-border',
  PUBLIC:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700',
  PRIVATE:
    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700',
};
```

- [ ] **Step 3: Create roadmap.service.ts**

```typescript
// packages/core/src/roadmap/roadmap.service.ts
import type { ApolloClient } from '@apollo/client';
import {
  ListRoadmapsDocument,
  CreateRoadmapDocument,
  UpdateRoadmapDocument,
  DeleteRoadmapDocument,
  type ListRoadmapsQuery,
  type CreateRoadmapMutationVariables,
  type UpdateRoadmapMutationVariables,
} from '@vizteck/graphql-client';
import { STATUS_CYCLE } from './constants';
import type { Roadmap, CreateRoadmapInput, UpdateRoadmapInput } from './types';

export async function getRoadmaps(client: ApolloClient<unknown>): Promise<Roadmap[]> {
  const { data } = await client.query<ListRoadmapsQuery>({
    query: ListRoadmapsDocument,
  });
  return (data.roadmaps ?? []) as Roadmap[];
}

export async function createRoadmap(
  client: ApolloClient<unknown>,
  input: CreateRoadmapInput,
): Promise<void> {
  await client.mutate<unknown, CreateRoadmapMutationVariables>({
    mutation: CreateRoadmapDocument,
    variables: { input },
  });
}

export async function updateRoadmap(
  client: ApolloClient<unknown>,
  id: string,
  input: UpdateRoadmapInput,
): Promise<void> {
  await client.mutate<unknown, UpdateRoadmapMutationVariables>({
    mutation: UpdateRoadmapDocument,
    variables: { id, input },
  });
}

export async function deleteRoadmap(client: ApolloClient<unknown>, id: string): Promise<void> {
  await client.mutate({
    mutation: DeleteRoadmapDocument,
    variables: { id },
  });
}

export async function cycleStatus(client: ApolloClient<unknown>, roadmap: Roadmap): Promise<string> {
  const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
  await updateRoadmap(client, roadmap.id, { status: next });
  return next;
}
```

- [ ] **Step 4: Create useRoadmaps.ts**

```typescript
// packages/core/src/roadmap/useRoadmaps.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ApolloClient } from '@apollo/client';
import {
  getRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  cycleStatus,
} from './roadmap.service';
import { STATUS_CYCLE } from './constants';
import type { Roadmap, CreateRoadmapInput, UpdateRoadmapInput, ModalState } from './types';

export function useRoadmaps(client: ApolloClient<unknown>) {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const fetchRoadmaps = useCallback(async () => {
    try {
      const data = await getRoadmaps(client);
      setRoadmaps(data);
    } catch {
      // client handles auth redirects; other errors silently ignored
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  async function handleCreate(data: CreateRoadmapInput) {
    await createRoadmap(client, data);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleEdit(roadmap: Roadmap, data: UpdateRoadmapInput) {
    await updateRoadmap(client, roadmap.id, data);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleDelete(roadmap: Roadmap) {
    await deleteRoadmap(client, roadmap.id);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleStatusChange(roadmap: Roadmap) {
    const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
    setRoadmaps((prev) =>
      prev.map((r) => (r.id === roadmap.id ? { ...r, status: next } : r)),
    );
    try {
      await cycleStatus(client, roadmap);
    } catch {
      await fetchRoadmaps();
    }
  }

  return {
    roadmaps,
    loading,
    modal,
    setModal,
    handleCreate,
    handleEdit,
    handleDelete,
    handleStatusChange,
  };
}
```

- [ ] **Step 5: Update packages/core/src/index.ts**

```typescript
// roadmap
export * from './roadmap/types';
export * from './roadmap/constants';
export * from './roadmap/roadmap.service';
export { useRoadmaps } from './roadmap/useRoadmaps';
```

- [ ] **Step 6: Build to verify**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0.

- [ ] **Step 7: Update apps/admin/src/features/roadmaps/hooks/useRoadmaps.ts**

Replace the entire file with:

```typescript
'use client';

import { useRoadmaps } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export type { ModalState } from '@vizteck/core';
export { useRoadmaps };

// ponytail: thin wrapper — injects adminApolloClient; callers import hook from here
export function useAdminRoadmaps() {
  return useRoadmaps(adminApolloClient);
}
```

- [ ] **Step 8: Delete apps/admin/src/features/roadmaps/services/roadmap.service.ts**

```bash
rm apps/admin/src/features/roadmaps/services/roadmap.service.ts
rm -f apps/admin/src/features/roadmaps/services/roadmap.service.test.ts
```

- [ ] **Step 9: Fix any remaining import references to the deleted service**

```bash
grep -r "roadmaps/services/roadmap.service" apps/admin/src --include="*.ts" --include="*.tsx" -l
```

Expected: no files found (useRoadmaps.ts was the only consumer).

- [ ] **Step 10: Build admin to verify**

```bash
pnpm --filter @vizteck/admin build
```

Expected: exits 0.

- [ ] **Step 11: Commit**

```bash
git add packages/core/src/roadmap/ packages/core/src/index.ts \
  apps/admin/src/features/roadmaps/hooks/useRoadmaps.ts
git rm apps/admin/src/features/roadmaps/services/roadmap.service.ts \
       apps/admin/src/features/roadmaps/services/roadmap.service.test.ts 2>/dev/null || true
git commit -m "refactor: migrate roadmap domain to @vizteck/core"
```

---

## Task 3: Migrate graph domain (services + hooks)

**Files:**
- Create: `packages/core/src/graph/types.ts`
- Create: `packages/core/src/graph/graph.service.ts`
- Create: `packages/core/src/graph/useGraphEditor.ts`
- Create: `packages/core/src/graph/useGraphDraft.ts`
- Modify: `packages/core/src/index.ts`
- Delete: `apps/admin/src/features/graph-editor/services/graph.service.ts`
- Modify: `apps/admin/src/features/graph-editor/hooks/useGraphEditor.ts`
- Modify: `apps/admin/src/features/graph-editor/hooks/useGraphDraft.ts`
- Modify: `apps/admin/src/features/graph-editor/hooks/useNodeActions.ts` (types only)

**Interfaces:**
- Consumes: `updateRoadmap` from Task 2; `@vizteck/graphql-client`; `@vizteck/graph` types (temporary — removed in Task 5)
- Produces: `EditorNode`, `EditorEdge`, `GraphData`, `RoadmapEntry`, `SidePanelState`, `normalizeNodeType`, `makeSnapshot`, `loadGraph(client, slug, id)`, `saveGraph(client, id, nodes, edges)`, `useGraphEditor(client, updateRoadmapFn, id, slug)`, `useGraphDraft(id, nodes, edges, dirty, loading)`

- [ ] **Step 1: Create packages/core/src/graph/types.ts**

```typescript
// packages/core/src/graph/types.ts
// Note: NodeItem and EdgeItem are temporarily imported from @vizteck/graph.
// Task 5 will inline them here and remove the @vizteck/graph dependency.
import type { NodeItem, EdgeItem } from '@vizteck/graph';

export type { NodeItem, EdgeItem };
export type { GraphNodeType } from '@vizteck/graph';

export interface EditorNode extends NodeItem {
  selected?: boolean;
}

export type EditorEdge = EdgeItem;

export interface RoadmapEntry {
  id: string;
  title: string;
  slug: string;
}

export interface GraphData {
  roadmapTitle: string;
  roadmapStatus: string;
  nodes: EditorNode[];
  edges: EditorEdge[];
  allRoadmaps: RoadmapEntry[];
  savedSnapshot: string;
}

export interface SidePanelState {
  open: boolean;
  mode: 'create' | 'edit';
  nodeId?: string;
  flowPosition?: { x: number; y: number };
}
```

- [ ] **Step 2: Create packages/core/src/graph/graph.service.ts**

```typescript
// packages/core/src/graph/graph.service.ts
import type { ApolloClient } from '@apollo/client';
import {
  ListRoadmapsDocument,
  GetRoadmapDocument,
  UpsertGraphDocument,
  NodeType,
  type ListRoadmapsQuery,
  type GetRoadmapQuery,
  type UpsertGraphMutationVariables,
} from '@vizteck/graphql-client';
import type { NodeItem, EdgeItem } from './types';
import type { EditorNode, EditorEdge, GraphData, RoadmapEntry } from './types';

export function normalizeNodeType(type: unknown): 'ROADMAP' | 'LESSON' {
  if (type === 0 || type === 'ROADMAP') return 'ROADMAP';
  return 'LESSON';
}

export function makeSnapshot(nodes: EditorNode[], edges: EditorEdge[]): string {
  return JSON.stringify({
    nodes: nodes.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      positionX: n.positionX,
      positionY: n.positionY,
      targetRoadmapId: n.targetRoadmapId ?? null,
      content: n.content ?? null,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sourceId: e.sourceId,
      targetId: e.targetId,
      label: e.label ?? null,
    })),
  });
}

export async function loadGraph(
  client: ApolloClient<unknown>,
  slug: string,
  roadmapId: string,
): Promise<GraphData> {
  const [graphResult, roadmapsResult] = await Promise.all([
    client.query<GetRoadmapQuery>({
      query: GetRoadmapDocument,
      variables: { slug },
    }),
    client.query<ListRoadmapsQuery>({
      query: ListRoadmapsDocument,
    }),
  ]);

  const detail = graphResult.data.roadmap;
  if (!detail) throw new Error(`Failed to load graph for slug: ${slug}`);

  const nodes: EditorNode[] = (detail.nodes ?? []).map((n) => ({
    ...(n as unknown as NodeItem),
    type: normalizeNodeType(n.type),
  }));
  const edges: EditorEdge[] = (detail.edges ?? []).map((e) => ({
    ...(e as unknown as EdgeItem),
  }));
  const savedSnapshot = makeSnapshot(nodes, edges);

  let restoredNodes = nodes;
  let restoredEdges = edges;
  if (typeof window !== 'undefined') {
    const draftJson = sessionStorage.getItem(`graph-draft-${roadmapId}`);
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson) as { nodes: EditorNode[]; edges: EditorEdge[] };
        if (makeSnapshot(draft.nodes, draft.edges) !== savedSnapshot) {
          restoredNodes = draft.nodes;
          restoredEdges = draft.edges;
        }
      } catch {
        sessionStorage.removeItem(`graph-draft-${roadmapId}`);
      }
    }
  }

  return {
    roadmapTitle: detail.roadmap?.title ?? '',
    roadmapStatus: detail.roadmap?.status ?? 'DRAFT',
    nodes: restoredNodes,
    edges: restoredEdges,
    allRoadmaps: (roadmapsResult.data.roadmaps ?? []) as RoadmapEntry[],
    savedSnapshot,
  };
}

export async function saveGraph(
  client: ApolloClient<unknown>,
  roadmapId: string,
  nodes: EditorNode[],
  edges: EditorEdge[],
): Promise<void> {
  const { errors } = await client.mutate<unknown, UpsertGraphMutationVariables>({
    mutation: UpsertGraphDocument,
    variables: {
      roadmapId,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type === 'ROADMAP' ? NodeType.Roadmap : NodeType.Lesson,
        title: n.title,
        positionX: n.positionX ?? undefined,
        positionY: n.positionY ?? undefined,
        targetRoadmapId: n.targetRoadmapId,
        content: n.content,
      })),
      edges: edges.map((e) => ({
        sourceId: e.sourceId,
        targetId: e.targetId,
        label: e.label,
      })),
    },
  });
  if (errors?.length) throw new Error(`Save failed: ${errors[0].message}`);
}
```

- [ ] **Step 3: Create packages/core/src/graph/useGraphEditor.ts**

```typescript
// packages/core/src/graph/useGraphEditor.ts
'use client';

import { useState, useEffect, useRef, useMemo, type Dispatch, type SetStateAction } from 'react';
import type { ApolloClient } from '@apollo/client';
import { loadGraph, saveGraph, makeSnapshot } from './graph.service';
import type { EditorNode, EditorEdge, RoadmapEntry } from './types';
import type { UpdateRoadmapInput } from '../roadmap/types';

export function useGraphEditor(
  client: ApolloClient<unknown>,
  updateRoadmapFn: (client: ApolloClient<unknown>, id: string, input: UpdateRoadmapInput) => Promise<void>,
  id: string,
  slug: string | null,
) {
  const [loading, setLoading] = useState(true);
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [roadmapStatus, setRoadmapStatus] = useState('DRAFT');
  const [editorNodes, setEditorNodes] = useState<EditorNode[]>([]);
  const [editorEdges, setEditorEdges] = useState<EditorEdge[]>([]);
  const [allRoadmaps, setAllRoadmaps] = useState<RoadmapEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savedSnapshotRef = useRef<string>('');

  const currentSnapshot = useMemo(
    () => makeSnapshot(editorNodes, editorEdges),
    [editorNodes, editorEdges],
  );
  const dirty = loading ? false : currentSnapshot !== savedSnapshotRef.current;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    loadGraph(client, slug, id)
      .then((data) => {
        if (cancelled) return;
        setRoadmapTitle(data.roadmapTitle);
        setRoadmapStatus(data.roadmapStatus);
        setEditorNodes(data.nodes);
        setEditorEdges(data.edges);
        setAllRoadmaps(data.allRoadmaps);
        savedSnapshotRef.current = data.savedSnapshot;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client, slug, id]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveGraph(client, id, editorNodes, editorEdges);
      savedSnapshotRef.current = makeSnapshot(editorNodes, editorEdges);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Save failed. Check your connection and try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeStatus(next: string) {
    const prev = roadmapStatus;
    setRoadmapStatus(next);
    try {
      await updateRoadmapFn(client, id, { status: next });
    } catch {
      setRoadmapStatus(prev);
    }
  }

  return {
    loading,
    saving,
    saveError,
    dirty,
    roadmapTitle,
    roadmapStatus,
    editorNodes,
    editorEdges,
    allRoadmaps,
    setEditorNodes: setEditorNodes as Dispatch<SetStateAction<EditorNode[]>>,
    setEditorEdges: setEditorEdges as Dispatch<SetStateAction<EditorEdge[]>>,
    handleSave,
    handleChangeStatus,
  };
}
```

- [ ] **Step 4: Create packages/core/src/graph/useGraphDraft.ts**

```typescript
// packages/core/src/graph/useGraphDraft.ts
'use client';

import { useEffect } from 'react';
import type { EditorNode, EditorEdge } from './types';

export function useGraphDraft(
  id: string,
  nodes: EditorNode[],
  edges: EditorEdge[],
  dirty: boolean,
  loading: boolean,
) {
  useEffect(() => {
    if (loading) return;
    if (dirty) {
      sessionStorage.setItem(`graph-draft-${id}`, JSON.stringify({ nodes, edges }));
    } else {
      sessionStorage.removeItem(`graph-draft-${id}`);
    }
  }, [nodes, edges, loading, dirty, id]);
}
```

- [ ] **Step 5: Update packages/core/src/index.ts**

```typescript
// roadmap
export * from './roadmap/types';
export * from './roadmap/constants';
export * from './roadmap/roadmap.service';
export { useRoadmaps } from './roadmap/useRoadmaps';

// graph (UI components added in Task 5)
export * from './graph/types';
export * from './graph/graph.service';
export { useGraphEditor } from './graph/useGraphEditor';
export { useGraphDraft } from './graph/useGraphDraft';
```

- [ ] **Step 6: Build core**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0.

- [ ] **Step 7: Update apps/admin/src/features/graph-editor/hooks/useGraphEditor.ts**

Replace entire file:

```typescript
'use client';

import { useGraphEditor, updateRoadmap } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export type { EditorNode, EditorEdge, RoadmapEntry } from '@vizteck/core';

// ponytail: thin wrapper — injects adminApolloClient and updateRoadmap
export function useAdminGraphEditor(id: string, slug: string | null) {
  return useGraphEditor(adminApolloClient, updateRoadmap, id, slug);
}
```

- [ ] **Step 8: Update apps/admin/src/features/graph-editor/hooks/useGraphDraft.ts**

Replace entire file:

```typescript
'use client';

export { useGraphDraft } from '@vizteck/core';
export type { EditorNode, EditorEdge } from '@vizteck/core';
```

- [ ] **Step 9: Update apps/admin/src/features/graph-editor/hooks/useNodeActions.ts**

Change the two import lines at the top:

```typescript
// Old:
import type { EditorNode, EditorEdge } from '../services/graph.service';

// Remove the SidePanelState interface definition from the file (it now comes from @vizteck/core).
// New (add at top of file with other imports):
import type { EditorNode, EditorEdge, SidePanelState } from '@vizteck/core';
```

Remove the local `SidePanelState` interface definition (lines 15–20 in the original file).

- [ ] **Step 10: Delete graph.service.ts**

```bash
rm apps/admin/src/features/graph-editor/services/graph.service.ts
rm -f apps/admin/src/features/graph-editor/services/graph.service.test.ts
```

- [ ] **Step 11: Fix callers of useGraphEditor in admin pages**

```bash
grep -r "useGraphEditor\|useAdminGraphEditor" apps/admin/src --include="*.ts" --include="*.tsx" -l
```

In any page file that called `useGraphEditor(id, slug)` (old signature), update the call to `useAdminGraphEditor(id, slug)` and update the import to come from `@/features/graph-editor/hooks/useGraphEditor`.

- [ ] **Step 12: Build admin**

```bash
pnpm --filter @vizteck/admin build
```

Expected: exits 0.

- [ ] **Step 13: Commit**

```bash
git add packages/core/src/graph/ packages/core/src/index.ts \
  apps/admin/src/features/graph-editor/hooks/
git rm apps/admin/src/features/graph-editor/services/graph.service.ts \
       apps/admin/src/features/graph-editor/services/graph.service.test.ts 2>/dev/null || true
git commit -m "refactor: migrate graph domain to @vizteck/core"
```

---

## Task 4: Migrate lesson domain (services + hooks)

**Files:**
- Create: `packages/core/src/lesson/types.ts`
- Create: `packages/core/src/lesson/lesson.service.ts`
- Create: `packages/core/src/lesson/useLessonEditor.ts`
- Create: `packages/core/src/lesson/useLessonPageShell.ts`
- Create: `packages/core/src/lesson/usePageTree.ts`
- Modify: `packages/core/src/index.ts`
- Delete: `apps/admin/src/features/lessons/services/lesson.service.ts`
- Modify: `apps/admin/src/features/lessons/hooks/useLessonEditor.ts`
- Modify: `apps/admin/src/features/lessons/hooks/useLessonPageShell.ts`
- Modify: `apps/admin/src/features/lessons/hooks/usePageTree.ts`

**Interfaces:**
- Consumes: `@vizteck/graphql-client` GQL documents; `BreadcrumbItem`, `PageTree` from `@vizteck/lesson` (temporary — removed in Task 6)
- Produces: `LessonNode`, `SaveStatus`, `fetchLesson(client, nodeId)`, `updateLessonContent(client, nodeId, content)`, `updateLessonTitle(client, nodeId, title)`, `updateNodeCover(client, nodeId, url)`, `updateNodeIcon(client, nodeId, icon)`, `fetchBreadcrumb(client, nodeId)`, `fetchRoadmapTree(client, nodeId)`, `useLessonEditor(client, nodeId)`, `useLessonPageShell(client, nodeId, initialCover, initialIcon)`, `usePageTree(client, nodeId)`

- [ ] **Step 1: Create packages/core/src/lesson/types.ts**

```typescript
// packages/core/src/lesson/types.ts
// Note: BreadcrumbItem, LessonShellNode, PageTreeNode, PageTree are temporarily
// imported from @vizteck/lesson. Task 6 will inline them here.
export type { BreadcrumbItem, LessonShellNode, PageTreeNode, PageTree } from '@vizteck/lesson';

export interface LessonNode {
  id: string;
  roadmapId: string;
  type: string;
  title: string;
  content?: string;
  coverImage?: string | null;
  icon?: string | null;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseLessonEditorResult {
  loading: boolean;
  notFound: boolean;
  lesson: LessonNode | null;
  titleSaveStatus: SaveStatus;
  handleSaveContent: (contentJson: string) => Promise<void>;
  handleSaveTitle: (title: string) => Promise<void>;
}
```

- [ ] **Step 2: Create packages/core/src/lesson/lesson.service.ts**

```typescript
// packages/core/src/lesson/lesson.service.ts
import type { ApolloClient } from '@apollo/client';
import {
  GetNodeDocument,
  GetNodeBreadcrumbDocument,
  GetRoadmapTreeDocument,
  UpdateNodeContentDocument,
  UpdateNodeTitleDocument,
  UpdateNodeCoverDocument,
  UpdateNodeIconDocument,
  type GetNodeQuery,
  type GetNodeBreadcrumbQuery,
  type GetRoadmapTreeQuery,
} from '@vizteck/graphql-client';
import type { BreadcrumbItem, PageTree, LessonNode } from './types';

export async function fetchLesson(client: ApolloClient<unknown>, nodeId: string): Promise<LessonNode> {
  const { data } = await client.query<GetNodeQuery>({
    query: GetNodeDocument,
    variables: { id: nodeId },
  });
  if (!data.node) throw new Error('Lesson not found');
  return data.node as LessonNode;
}

export async function updateLessonContent(
  client: ApolloClient<unknown>,
  nodeId: string,
  content: string,
): Promise<void> {
  const { errors } = await client.mutate({
    mutation: UpdateNodeContentDocument,
    variables: { id: nodeId, content },
  });
  if (errors?.length) throw new Error(`Save failed: ${errors[0].message}`);
}

export async function updateLessonTitle(
  client: ApolloClient<unknown>,
  nodeId: string,
  title: string,
): Promise<void> {
  const { errors } = await client.mutate({
    mutation: UpdateNodeTitleDocument,
    variables: { id: nodeId, title },
  });
  if (errors?.length) throw new Error(`Update title failed: ${errors[0].message}`);
}

export async function updateNodeCover(
  client: ApolloClient<unknown>,
  nodeId: string,
  coverImage: string | null,
): Promise<void> {
  const { errors } = await client.mutate({
    mutation: UpdateNodeCoverDocument,
    variables: { id: nodeId, coverImage: coverImage ?? undefined },
  });
  if (errors?.length) throw new Error(`Update cover failed: ${errors[0].message}`);
}

export async function updateNodeIcon(
  client: ApolloClient<unknown>,
  nodeId: string,
  icon: string | null,
): Promise<void> {
  const { errors } = await client.mutate({
    mutation: UpdateNodeIconDocument,
    variables: { id: nodeId, icon: icon ?? undefined },
  });
  if (errors?.length) throw new Error(`Update icon failed: ${errors[0].message}`);
}

export async function fetchBreadcrumb(
  client: ApolloClient<unknown>,
  nodeId: string,
): Promise<BreadcrumbItem[]> {
  try {
    const { data } = await client.query<GetNodeBreadcrumbQuery>({
      query: GetNodeBreadcrumbDocument,
      variables: { id: nodeId },
    });
    return (data.nodeBreadcrumb ?? []) as BreadcrumbItem[];
  } catch {
    return [];
  }
}

export async function fetchRoadmapTree(
  client: ApolloClient<unknown>,
  nodeId: string,
): Promise<PageTree | null> {
  const crumbs = await fetchBreadcrumb(client, nodeId);
  const rootSlug = crumbs[0]?.slug;
  if (!rootSlug) return null;
  try {
    const { data } = await client.query<GetRoadmapTreeQuery>({
      query: GetRoadmapTreeDocument,
      variables: { slug: rootSlug },
    });
    const tree = data.roadmapTree;
    if (!tree?.rootSlug) return null;
    return tree as unknown as PageTree;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Create packages/core/src/lesson/useLessonEditor.ts**

```typescript
// packages/core/src/lesson/useLessonEditor.ts
'use client';

import { useState, useEffect } from 'react';
import type { ApolloClient } from '@apollo/client';
import { fetchLesson, updateLessonContent, updateLessonTitle } from './lesson.service';
import type { LessonNode, SaveStatus, UseLessonEditorResult } from './types';

export function useLessonEditor(
  client: ApolloClient<unknown>,
  nodeId: string,
): UseLessonEditorResult {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lesson, setLesson] = useState<LessonNode | null>(null);
  const [titleSaveStatus, setTitleSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    fetchLesson(client, nodeId)
      .then((l) => { if (!cancelled) setLesson(l); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [client, nodeId]);

  async function handleSaveContent(contentJson: string): Promise<void> {
    await updateLessonContent(client, nodeId, contentJson);
    setLesson((prev) => (prev ? { ...prev, content: contentJson } : prev));
  }

  async function handleSaveTitle(title: string): Promise<void> {
    if (titleSaveStatus === 'saving') return;
    setTitleSaveStatus('saving');
    try {
      await updateLessonTitle(client, nodeId, title);
      setLesson((prev) => (prev ? { ...prev, title } : prev));
      setTitleSaveStatus('saved');
      setTimeout(() => setTitleSaveStatus('idle'), 2000);
    } catch {
      setTitleSaveStatus('error');
    }
  }

  return { loading, notFound, lesson, titleSaveStatus, handleSaveContent, handleSaveTitle };
}
```

- [ ] **Step 4: Create packages/core/src/lesson/useLessonPageShell.ts**

```typescript
// packages/core/src/lesson/useLessonPageShell.ts
'use client';

import { useEffect, useState } from 'react';
import type { ApolloClient } from '@apollo/client';
import { updateNodeCover, updateNodeIcon } from './lesson.service';

export function useLessonPageShell(
  client: ApolloClient<unknown>,
  nodeId: string,
  initialCover: string | null | undefined,
  initialIcon: string | null | undefined,
) {
  const [cover, setCoverState] = useState<string | null>(initialCover ?? null);
  const [icon, setIconState] = useState<string | null>(initialIcon ?? null);

  useEffect(() => {
    if (initialCover !== undefined) setCoverState(initialCover ?? null);
  }, [initialCover]);

  useEffect(() => {
    if (initialIcon !== undefined) setIconState(initialIcon ?? null);
  }, [initialIcon]);

  const setCover = async (url: string | null) => {
    const prev = cover;
    setCoverState(url);
    try {
      await updateNodeCover(client, nodeId, url);
    } catch {
      setCoverState(prev);
    }
  };

  const setIcon = async (value: string | null) => {
    const prev = icon;
    setIconState(value);
    try {
      await updateNodeIcon(client, nodeId, value);
    } catch {
      setIconState(prev);
    }
  };

  return { cover, icon, setCover, setIcon };
}
```

- [ ] **Step 5: Create packages/core/src/lesson/usePageTree.ts**

```typescript
// packages/core/src/lesson/usePageTree.ts
'use client';

import { useState, useEffect } from 'react';
import type { ApolloClient } from '@apollo/client';
import type { PageTree } from './types';
import { fetchRoadmapTree } from './lesson.service';

export function usePageTree(client: ApolloClient<unknown>, nodeId: string): PageTree | null {
  const [tree, setTree] = useState<PageTree | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRoadmapTree(client, nodeId)
      .then((t) => { if (!cancelled) setTree(t); })
      .catch(() => { if (!cancelled) setTree(null); });
    return () => { cancelled = true; };
  }, [client, nodeId]);

  return tree;
}
```

- [ ] **Step 6: Update packages/core/src/index.ts**

```typescript
// roadmap
export * from './roadmap/types';
export * from './roadmap/constants';
export * from './roadmap/roadmap.service';
export { useRoadmaps } from './roadmap/useRoadmaps';

// graph (UI components added in Task 5)
export * from './graph/types';
export * from './graph/graph.service';
export { useGraphEditor } from './graph/useGraphEditor';
export { useGraphDraft } from './graph/useGraphDraft';

// lesson (UI components added in Task 6)
export * from './lesson/types';
export * from './lesson/lesson.service';
export { useLessonEditor } from './lesson/useLessonEditor';
export { useLessonPageShell } from './lesson/useLessonPageShell';
export { usePageTree } from './lesson/usePageTree';
```

- [ ] **Step 7: Build core**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0.

- [ ] **Step 8: Update apps/admin/src/features/lessons/hooks/useLessonEditor.ts**

Replace entire file:

```typescript
'use client';

import { useLessonEditor } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export type { SaveStatus, UseLessonEditorResult, LessonNode } from '@vizteck/core';

// ponytail: thin wrapper — injects adminApolloClient
export function useAdminLessonEditor(nodeId: string) {
  return useLessonEditor(adminApolloClient, nodeId);
}
```

- [ ] **Step 9: Update apps/admin/src/features/lessons/hooks/useLessonPageShell.ts**

Replace entire file:

```typescript
'use client';

import { useLessonPageShell } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export function useAdminLessonPageShell(
  nodeId: string,
  initialCover: string | null | undefined,
  initialIcon: string | null | undefined,
) {
  return useLessonPageShell(adminApolloClient, nodeId, initialCover, initialIcon);
}
```

- [ ] **Step 10: Update apps/admin/src/features/lessons/hooks/usePageTree.ts**

Replace entire file:

```typescript
'use client';

import { usePageTree } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export function useAdminPageTree(nodeId: string) {
  return usePageTree(adminApolloClient, nodeId);
}
```

- [ ] **Step 11: Delete lesson.service.ts**

```bash
rm apps/admin/src/features/lessons/services/lesson.service.ts
rm -f apps/admin/src/features/lessons/services/lesson.service.test.ts
```

- [ ] **Step 12: Fix all callers in admin pages**

```bash
grep -r "useLessonEditor\|useLessonPageShell\|usePageTree" apps/admin/src --include="*.tsx" -l
```

For each file found, replace:
- `useLessonEditor(nodeId)` → `useAdminLessonEditor(nodeId)`
- `useLessonPageShell(nodeId, cover, icon)` → `useAdminLessonPageShell(nodeId, cover, icon)`
- `usePageTree(nodeId)` → `useAdminPageTree(nodeId)`

Update import paths to point to the feature hook files (e.g. `@/features/lessons/hooks/useLessonEditor`).

- [ ] **Step 13: Build admin**

```bash
pnpm --filter @vizteck/admin build
```

Expected: exits 0.

- [ ] **Step 14: Commit**

```bash
git add packages/core/src/lesson/ packages/core/src/index.ts \
  apps/admin/src/features/lessons/hooks/
git rm apps/admin/src/features/lessons/services/lesson.service.ts \
       apps/admin/src/features/lessons/services/lesson.service.test.ts 2>/dev/null || true
git commit -m "refactor: migrate lesson domain to @vizteck/core"
```

---

## Task 5: Migrate packages/graph UI → packages/core/src/graph/ui/

Move `RoadmapGraph.tsx` and `RoadmapNode.tsx` into `packages/core`, inline the primitive types (`NodeItem`, `EdgeItem`, `GraphNodeType`) so `@vizteck/graph` is no longer needed as a dep, then make `packages/graph` a thin shim.

**Files:**
- Create: `packages/core/src/graph/ui/RoadmapGraph.tsx` (moved from `packages/graph/src/`)
- Create: `packages/core/src/graph/ui/RoadmapNode.tsx` (moved from `packages/graph/src/`)
- Modify: `packages/core/src/graph/types.ts` (inline NodeItem, EdgeItem, GraphNodeType; remove @vizteck/graph import)
- Modify: `packages/core/src/graph/graph.service.ts` (already uses local `./types` — verify no @vizteck/graph import remains)
- Modify: `packages/core/src/index.ts` (add RoadmapGraph, RoadmapNode, @xyflow/react re-exports)
- Modify: `packages/core/package.json` (add @xyflow/react; remove @vizteck/graph dep)
- Modify: `packages/graph/src/index.ts` (become shim re-exporting from @vizteck/core)
- Modify: `packages/graph/package.json` (add @vizteck/core dep)
- Modify: `apps/web/src/features/roadmap/components/RoadmapGraphView.tsx` (update import source)

**Interfaces:**
- Consumes: `packages/core/src/graph/types.ts` (NodeItem, EdgeItem)
- Produces: `RoadmapGraph`, `RoadmapNode`, `RoadmapGraphProps`, `NodeItem`, `EdgeItem`, `GraphNodeType` all exported from `@vizteck/core`

- [ ] **Step 1: Copy RoadmapGraph.tsx into packages/core/src/graph/ui/**

```bash
mkdir -p packages/core/src/graph/ui
cp packages/graph/src/RoadmapGraph.tsx packages/core/src/graph/ui/RoadmapGraph.tsx
cp packages/graph/src/RoadmapNode.tsx packages/core/src/graph/ui/RoadmapNode.tsx
```

- [ ] **Step 2: Fix internal imports in RoadmapGraph.tsx and RoadmapNode.tsx**

In `packages/core/src/graph/ui/RoadmapGraph.tsx`, change:
```typescript
// Old:
import { RoadmapNode } from './RoadmapNode';
import type { NodeItem, EdgeItem } from './types';

// New:
import { RoadmapNode } from './RoadmapNode';
import type { NodeItem, EdgeItem } from '../types';
```

In `packages/core/src/graph/ui/RoadmapNode.tsx`, if it imports from `./types`:
```typescript
// Old:
import type { NodeItem } from './types';

// New:
import type { NodeItem } from '../types';
```

- [ ] **Step 3: Update packages/core/src/graph/types.ts to inline primitive types**

Replace the entire file:

```typescript
// packages/core/src/graph/types.ts
// NodeItem, EdgeItem, GraphNodeType were previously in packages/graph/src/types.ts
export type GraphNodeType = 'ROADMAP' | 'LESSON';

export interface NodeItem {
  id: string;
  roadmapId: string;
  type: GraphNodeType;
  title: string;
  positionX: number | null;
  positionY: number | null;
  targetRoadmapId?: string;
  targetRoadmapSlug?: string;
  content?: string;
}

export interface EdgeItem {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface EditorNode extends NodeItem {
  selected?: boolean;
}

export type EditorEdge = EdgeItem;

export interface RoadmapEntry {
  id: string;
  title: string;
  slug: string;
}

export interface GraphData {
  roadmapTitle: string;
  roadmapStatus: string;
  nodes: EditorNode[];
  edges: EditorEdge[];
  allRoadmaps: RoadmapEntry[];
  savedSnapshot: string;
}

export interface SidePanelState {
  open: boolean;
  mode: 'create' | 'edit';
  nodeId?: string;
  flowPosition?: { x: number; y: number };
}
```

- [ ] **Step 4: Update packages/core/package.json**

Add `@xyflow/react` to dependencies and remove `@vizteck/graph` (now inlined):

```json
{
  "name": "@vizteck/core",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@apollo/client": "^3.11.0",
    "@vizteck/graphql-client": "workspace:*",
    "@vizteck/lesson": "workspace:*",
    "@xyflow/react": "^12.0.0",
    "graphql": "^16.9.0",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 5: Update packages/core/src/index.ts to export graph UI**

```typescript
// roadmap
export * from './roadmap/types';
export * from './roadmap/constants';
export * from './roadmap/roadmap.service';
export { useRoadmaps } from './roadmap/useRoadmaps';

// graph — domain
export * from './graph/types';
export * from './graph/graph.service';
export { useGraphEditor } from './graph/useGraphEditor';
export { useGraphDraft } from './graph/useGraphDraft';
// graph — UI (moved from packages/graph)
export { RoadmapGraph } from './graph/ui/RoadmapGraph';
export type { RoadmapGraphProps } from './graph/ui/RoadmapGraph';
export { RoadmapNode } from './graph/ui/RoadmapNode';
// re-export @xyflow/react types previously exposed by packages/graph
export type {
  NodeChange,
  EdgeChange,
  Connection,
  Node as RFNode,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnNodesDelete,
} from '@xyflow/react';
export { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

// lesson (UI components added in Task 6)
export * from './lesson/types';
export * from './lesson/lesson.service';
export { useLessonEditor } from './lesson/useLessonEditor';
export { useLessonPageShell } from './lesson/useLessonPageShell';
export { usePageTree } from './lesson/usePageTree';
```

- [ ] **Step 6: Make packages/graph/src/index.ts a shim**

Replace entire file:

```typescript
// ponytail: shim — all exports moved to @vizteck/core
export {
  RoadmapGraph,
  RoadmapNode,
  applyNodeChanges,
  applyEdgeChanges,
} from '@vizteck/core';
export type {
  RoadmapGraphProps,
  NodeItem,
  EdgeItem,
  GraphNodeType,
  NodeChange,
  EdgeChange,
  Connection,
  RFNode,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnNodesDelete,
} from '@vizteck/core';
```

- [ ] **Step 7: Update packages/graph/package.json**

Add `@vizteck/core` dep, keep `@xyflow/react` for its own tsconfig (used by the shim transitively):

```json
{
  "name": "@vizteck/graph",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@vizteck/core": "workspace:*",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 8: Run pnpm install**

```bash
pnpm install
```

Expected: no errors.

- [ ] **Step 9: Build core**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0.

- [ ] **Step 10: Update apps/web/src/features/roadmap/components/RoadmapGraphView.tsx**

Change the import source from `@vizteck/graph` to `@vizteck/core`:

```typescript
// Old:
import { RoadmapGraph } from '@vizteck/graph';
import type { NodeItem } from '@vizteck/graph';

// New:
import { RoadmapGraph } from '@vizteck/core';
import type { NodeItem } from '@vizteck/core';
```

- [ ] **Step 11: Update apps/admin imports that reference @vizteck/graph directly**

```bash
grep -r "from '@vizteck/graph'" apps/admin/src --include="*.ts" --include="*.tsx" -l
```

For each file found, change `'@vizteck/graph'` → `'@vizteck/core'`.

- [ ] **Step 12: Build all**

```bash
pnpm --filter @vizteck/core build
pnpm --filter @vizteck/graph build
pnpm --filter @vizteck/admin build
pnpm --filter @vizteck/web build
```

Expected: all exit 0.

- [ ] **Step 13: Commit**

```bash
git add packages/core/src/graph/ui/ packages/core/src/graph/types.ts \
  packages/core/src/index.ts packages/core/package.json \
  packages/graph/src/index.ts packages/graph/package.json \
  apps/web/src/features/roadmap/components/RoadmapGraphView.tsx \
  apps/admin/src/ pnpm-lock.yaml
git commit -m "refactor: migrate graph UI to @vizteck/core, make @vizteck/graph a shim"
```

---

## Task 6: Migrate packages/lesson UI → packages/core/src/lesson/ui/

Move all lesson UI components into `packages/core/src/lesson/ui/`, inline the shared types (`BreadcrumbItem`, `LessonShellNode`, `PageTreeNode`, `PageTree`) so `@vizteck/lesson` is no longer needed as a dep, then make `packages/lesson` a thin shim.

**Files:**
- Create: `packages/core/src/lesson/ui/` (all *.tsx, *.ts files from `packages/lesson/src/` except `index.ts` and `test-setup.ts`)
- Modify: `packages/core/src/lesson/types.ts` (inline BreadcrumbItem, LessonShellNode, PageTreeNode, PageTree; remove @vizteck/lesson re-export)
- Modify: `packages/core/src/lesson/lesson.service.ts` (update import from @vizteck/lesson → ./types)
- Modify: `packages/core/src/lesson/usePageTree.ts` (update import from @vizteck/lesson → ./types)
- Modify: `packages/core/src/index.ts` (add lesson UI exports)
- Modify: `packages/core/package.json` (remove @vizteck/lesson dep)
- Modify: `packages/lesson/src/index.ts` (become shim re-exporting from @vizteck/core)
- Modify: `packages/lesson/package.json` (add @vizteck/core dep)
- Modify: `apps/web/src/features/lesson/components/LessonLayout.tsx` (update import)
- Modify: `apps/admin` files that import from `@vizteck/lesson`

**Interfaces:**
- Produces: All lesson UI exported from `@vizteck/core` — `LessonPageShell`, `LessonViewer`, `LessonEditor`, `LessonPageLayout`, `CoverDisplay`, `BreadcrumbDisplay`, `PageTreeSidebar`, `PageTreeItem`, `SearchModal`, `useSearch`, `useSearchModal`, and the merged types `BreadcrumbItem`, `LessonShellNode`, `PageTreeNode`, `PageTree`

- [ ] **Step 1: Copy all lesson UI files into packages/core/src/lesson/ui/**

```bash
mkdir -p packages/core/src/lesson/ui

# Copy all source files except index.ts and test-setup.ts
cp packages/lesson/src/BreadcrumbDisplay.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/CoverDisplay.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/LessonEditor.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/LessonPageLayout.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/LessonPageShell.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/LessonViewer.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/PageTreeItem.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/PageTreeSidebar.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/SearchModal.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/SearchPreview.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/SearchResultItem.tsx packages/core/src/lesson/ui/
cp packages/lesson/src/useSearch.ts packages/core/src/lesson/ui/
cp packages/lesson/src/useSearchModal.ts packages/core/src/lesson/ui/
cp packages/lesson/src/utils.ts packages/core/src/lesson/ui/
```

- [ ] **Step 2: Fix internal imports in all copied UI files**

Every copied file that imports from `'./types'` must change to `'../types'`. Run:

```bash
grep -rl "from './types'" packages/core/src/lesson/ui/
```

For each file found, replace `from './types'` with `from '../types'`.

Every file that imports from another sibling (e.g. `from './CoverDisplay'`) stays unchanged (still correct within `ui/`).

- [ ] **Step 3: Update packages/core/src/lesson/types.ts to inline shared types**

Replace the entire file:

```typescript
// packages/core/src/lesson/types.ts
// Types previously in packages/lesson/src/types.ts, now the single source of truth.

export interface BreadcrumbItem {
  title: string;
  slug: string | null;
  nodeId: string | null;
}

export interface LessonShellNode {
  id: string;
  title: string;
  coverImage: string | null;
  icon: string | null;
  content: string | null;
  type: 'LESSON' | 'ROADMAP';
}

export interface PageTreeNode {
  id: string;
  title: string;
  type: 'LESSON' | 'ROADMAP';
  slug?: string;
  targetRoadmapId?: string;
  roadmapSlug?: string;
  roadmapId?: string;
  children?: PageTreeNode[];
}

export interface PageTree {
  rootSlug: string;
  rootTitle: string;
  nodes: PageTreeNode[];
}

export interface LessonNode {
  id: string;
  roadmapId: string;
  type: string;
  title: string;
  content?: string;
  coverImage?: string | null;
  icon?: string | null;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseLessonEditorResult {
  loading: boolean;
  notFound: boolean;
  lesson: LessonNode | null;
  titleSaveStatus: SaveStatus;
  handleSaveContent: (contentJson: string) => Promise<void>;
  handleSaveTitle: (title: string) => Promise<void>;
}
```

- [ ] **Step 4: Update packages/core/src/lesson/lesson.service.ts import**

Change the import of `BreadcrumbItem` and `PageTree` from `@vizteck/lesson` to `./types`:

```typescript
// Old:
import type { BreadcrumbItem, PageTree } from '@vizteck/lesson';

// New:
import type { BreadcrumbItem, PageTree } from './types';
```

(The rest of the file stays unchanged.)

- [ ] **Step 5: Update packages/core/src/lesson/usePageTree.ts import**

```typescript
// Old:
import type { PageTree } from '@vizteck/lesson';

// New:
import type { PageTree } from './types';
```

- [ ] **Step 6: Update packages/core/package.json — remove @vizteck/lesson dep**

```json
{
  "name": "@vizteck/core",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@apollo/client": "^3.11.0",
    "@vizteck/graphql-client": "workspace:*",
    "@xyflow/react": "^12.0.0",
    "graphql": "^16.9.0",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 7: Update packages/core/src/index.ts — add lesson UI exports**

```typescript
// roadmap
export * from './roadmap/types';
export * from './roadmap/constants';
export * from './roadmap/roadmap.service';
export { useRoadmaps } from './roadmap/useRoadmaps';

// graph — domain
export * from './graph/types';
export * from './graph/graph.service';
export { useGraphEditor } from './graph/useGraphEditor';
export { useGraphDraft } from './graph/useGraphDraft';
// graph — UI
export { RoadmapGraph } from './graph/ui/RoadmapGraph';
export type { RoadmapGraphProps } from './graph/ui/RoadmapGraph';
export { RoadmapNode } from './graph/ui/RoadmapNode';
export type {
  NodeChange,
  EdgeChange,
  Connection,
  Node as RFNode,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnNodesDelete,
} from '@xyflow/react';
export { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

// lesson — domain
export * from './lesson/types';
export * from './lesson/lesson.service';
export { useLessonEditor } from './lesson/useLessonEditor';
export { useLessonPageShell } from './lesson/useLessonPageShell';
export { usePageTree } from './lesson/usePageTree';
// lesson — UI (moved from packages/lesson)
export { LessonEditor } from './lesson/ui/LessonEditor';
export type { LessonEditorProps } from './lesson/ui/LessonEditor';
export { LessonViewer } from './lesson/ui/LessonViewer';
export type { LessonViewerProps } from './lesson/ui/LessonViewer';
export { LessonPageShell } from './lesson/ui/LessonPageShell';
export type { LessonPageShellProps } from './lesson/ui/LessonPageShell';
export { LessonPageLayout } from './lesson/ui/LessonPageLayout';
export type { LessonPageLayoutProps } from './lesson/ui/LessonPageLayout';
export { CoverDisplay } from './lesson/ui/CoverDisplay';
export type { CoverDisplayProps } from './lesson/ui/CoverDisplay';
export { BreadcrumbDisplay } from './lesson/ui/BreadcrumbDisplay';
export type { BreadcrumbDisplayProps } from './lesson/ui/BreadcrumbDisplay';
export { PageTreeSidebar } from './lesson/ui/PageTreeSidebar';
export type { PageTreeSidebarProps } from './lesson/ui/PageTreeSidebar';
export { PageTreeItem } from './lesson/ui/PageTreeItem';
export type { PageTreeItemProps } from './lesson/ui/PageTreeItem';
export { SearchModal } from './lesson/ui/SearchModal';
export type { SearchModalProps } from './lesson/ui/SearchModal';
export { useSearchModal } from './lesson/ui/useSearchModal';
export { useSearch } from './lesson/ui/useSearch';
export type { TimeGroup } from './lesson/ui/useSearch';
```

- [ ] **Step 8: Make packages/lesson/src/index.ts a shim**

Replace entire file:

```typescript
// ponytail: shim — all exports moved to @vizteck/core
export {
  LessonEditor,
  LessonViewer,
  LessonPageShell,
  LessonPageLayout,
  CoverDisplay,
  BreadcrumbDisplay,
  PageTreeSidebar,
  PageTreeItem,
  SearchModal,
  useSearchModal,
  useSearch,
} from '@vizteck/core';
export type {
  LessonEditorProps,
  LessonViewerProps,
  LessonPageShellProps,
  LessonPageLayoutProps,
  CoverDisplayProps,
  BreadcrumbDisplayProps,
  PageTreeSidebarProps,
  PageTreeItemProps,
  SearchModalProps,
  TimeGroup,
  BreadcrumbItem,
  LessonShellNode,
  PageTreeNode,
  PageTree,
} from '@vizteck/core';
```

- [ ] **Step 9: Update packages/lesson/package.json**

```json
{
  "name": "@vizteck/lesson",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@vizteck/core": "workspace:*",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 10: Run pnpm install**

```bash
pnpm install
```

Expected: no errors.

- [ ] **Step 11: Build core**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0. If there are import errors in ui/ files, check that all `from './types'` references were updated to `from '../types'` in Step 2.

- [ ] **Step 12: Update apps/web/src/features/lesson/components/LessonLayout.tsx**

Change import source:

```typescript
// Old:
import { LessonPageShell, LessonPageLayout } from "@vizteck/lesson";
import type { LessonShellNode, BreadcrumbItem, PageTree, PageTreeNode } from "@vizteck/lesson";

// New:
import { LessonPageShell, LessonPageLayout } from "@vizteck/core";
import type { LessonShellNode, BreadcrumbItem, PageTree, PageTreeNode } from "@vizteck/core";
```

- [ ] **Step 13: Update all admin files that import from @vizteck/lesson**

```bash
grep -r "from '@vizteck/lesson'" apps/admin/src --include="*.ts" --include="*.tsx" -l
```

For each file found, change `'@vizteck/lesson'` → `'@vizteck/core'`.

- [ ] **Step 14: Build all**

```bash
pnpm --filter @vizteck/core build
pnpm --filter @vizteck/lesson build
pnpm --filter @vizteck/admin build
pnpm --filter @vizteck/web build
```

Expected: all exit 0.

- [ ] **Step 15: Commit**

```bash
git add packages/core/src/lesson/ui/ packages/core/src/lesson/types.ts \
  packages/core/src/lesson/lesson.service.ts packages/core/src/lesson/usePageTree.ts \
  packages/core/src/index.ts packages/core/package.json \
  packages/lesson/src/index.ts packages/lesson/package.json \
  apps/web/src/features/lesson/ apps/admin/src/ pnpm-lock.yaml
git commit -m "refactor: migrate lesson UI to @vizteck/core, make @vizteck/lesson a shim"
```

---

## Task 7: Full build & test verification

**Files:**
- No new files. Verify everything compiles and tests pass.

- [ ] **Step 1: Full build**

```bash
pnpm build
```

Expected: all packages build without error.

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: all existing tests pass.

- [ ] **Step 3: Fix any broken test imports**

Find test files importing deleted services:
```bash
grep -r "features/roadmaps/services\|features/graph-editor/services\|features/lessons/services" \
  apps/admin/src --include="*.spec.*" --include="*.test.*" -l
```

For each: update import to `@vizteck/core` and pass a mock Apollo client:

```typescript
// Old:
import { getRoadmaps } from '../services/roadmap.service';

// New:
import { getRoadmaps } from '@vizteck/core';
const mockClient = { query: vi.fn(), mutate: vi.fn() } as any;
getRoadmaps(mockClient);
```

- [ ] **Step 4: Run tests again**

```bash
pnpm test
```

Expected: exits 0, all tests pass.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "refactor: fix test imports after core migration"
```

---

## Self-Review

**Spec coverage:**
- ✅ `packages/core` created with feature-first structure: `roadmap/`, `graph/ui/`, `lesson/ui/`
- ✅ Services use DIP (ApolloClient as parameter, no singleton import)
- ✅ Hooks extracted to `packages/core` (accept client as param)
- ✅ `NodeItem`, `EdgeItem`, `GraphNodeType` inlined into `packages/core/src/graph/types.ts`
- ✅ `BreadcrumbItem`, `LessonShellNode`, `PageTreeNode`, `PageTree` inlined into `packages/core/src/lesson/types.ts`
- ✅ `packages/graph` and `packages/lesson` become thin shims (backward-compat)
- ✅ `useNodeActions` stays in admin (Next.js routing URLs are admin-specific)
- ✅ apps/admin features trimmed to thin wrappers (`useAdmin*`) + admin-only UI components
- ✅ No new external runtime dependencies added

**Type consistency:**
- `updateRoadmap(client, id, input)` — defined in Task 2, consumed in Task 3 (`useGraphEditor`)
- `EditorNode`, `EditorEdge`, `SidePanelState` — defined in Task 3 types.ts, updated in Task 5 (inlined)
- `BreadcrumbItem`, `PageTree` — re-exported in Task 4 types.ts, inlined in Task 6
- `LessonNode`, `SaveStatus` — defined in Task 4, merged into Task 6 types.ts

**No placeholders:** All steps contain actual code or exact bash commands.
