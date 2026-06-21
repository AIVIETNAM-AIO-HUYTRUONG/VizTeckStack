# Admin UI Feature-First Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `apps/admin/src/` so business logic, API calls, React state, and UI are in separate layers under a `features/` folder, with unit tests covering all service functions and key hooks.

**Architecture:** Feature-first — each domain (roadmaps, graph-editor, nodes) owns its `services/`, `hooks/`, and `components/`. Services handle all `apiFetch` calls and data transforms; hooks wire services to React state; components are pure props-in/JSX-out; pages import hooks + render components only.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Vitest + jsdom, @testing-library/react, Tailwind semantic tokens.

## Global Constraints

- Never hardcode hex colors — always use Tailwind semantic tokens (`bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo`).
- `'use client'` directive required on all hooks and components that use React APIs.
- Services must NOT import React or call hooks/setState.
- Hooks must NOT call `apiFetch` directly — always go through a service function.
- `apps/admin/src/lib/api.ts`, `useAuthGuard.ts`, `useRouteGuard.ts` — do NOT modify.
- `packages/*`, `apps/api-gateway`, `apps/svc-roadmap` — out of scope, do NOT touch.
- Run tests with: `pnpm --filter @vizteck/admin test`
- TypeScript path alias `@/` maps to `apps/admin/src/`.

---

### Task 1: Create branch + add Vitest test runner

**Files:**
- Create: `apps/admin/vitest.config.ts`
- Create: `apps/admin/vitest.setup.ts`
- Modify: `apps/admin/package.json`

**Interfaces:**
- Produces: `pnpm --filter @vizteck/admin test` runs and exits 0 (no test files yet — that's fine)

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b refactor/admin-ui-feature-first
```

- [ ] **Step 2: Add test dependencies to `apps/admin/package.json`**

Open `apps/admin/package.json`. Add to `"devDependencies"`:

```json
"vitest": "^2.1.0",
"jsdom": "^25.0.0",
"@testing-library/react": "^16.0.0",
"@testing-library/jest-dom": "^6.6.0",
"@vitejs/plugin-react": "^4.3.0"
```

Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Full updated `package.json`:

```json
{
  "name": "@vizteck/admin",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start --port 3002",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^16.2.9",
    "react": "^19",
    "react-dom": "^19",
    "@vizteck/ui": "workspace:*",
    "@vizteck/graph": "workspace:*",
    "@blocknote/react": "^0.51.4",
    "@blocknote/core": "^0.51.4",
    "@blocknote/mantine": "^0.51.4"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/node": "^20",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

- [ ] **Step 3: Create `apps/admin/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: Create `apps/admin/vitest.setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Install dependencies**

```bash
pnpm install
```

Expected: packages installed, no errors.

- [ ] **Step 6: Verify test runner works**

```bash
pnpm --filter @vizteck/admin test
```

Expected output: `No test files found` or `0 tests passed` — exit 0. If it errors on config, check the `vitest.config.ts` path alias matches `apps/admin/src/`.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/package.json apps/admin/vitest.config.ts apps/admin/vitest.setup.ts pnpm-lock.yaml
git commit -m "chore(admin): add Vitest + testing-library test runner"
```

---

### Task 2: `roadmap.service.ts` — TDD

**Files:**
- Create: `apps/admin/src/features/roadmaps/services/roadmap.service.ts`
- Create: `apps/admin/src/features/roadmaps/services/roadmap.service.test.ts`

**Interfaces:**
- Produces:
  - `getRoadmaps(): Promise<Roadmap[]>`
  - `createRoadmap(data: CreateRoadmapInput): Promise<void>`
  - `updateRoadmap(id: string, data: UpdateRoadmapInput): Promise<void>`
  - `deleteRoadmap(id: string): Promise<void>`
  - `cycleStatus(roadmap: Roadmap): Promise<string>`
  - `STATUS_CYCLE`, `STATUS_LABEL`, `STATUS_CLASS` constants
  - `Roadmap`, `CreateRoadmapInput`, `UpdateRoadmapInput` types

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p apps/admin/src/features/roadmaps/services
mkdir -p apps/admin/src/features/roadmaps/hooks
mkdir -p apps/admin/src/features/roadmaps/components
```

- [ ] **Step 2: Write the failing tests**

Create `apps/admin/src/features/roadmaps/services/roadmap.service.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap, cycleStatus } from './roadmap.service';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api';
const mockApiFetch = vi.mocked(apiFetch);

describe('roadmap.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getRoadmaps', () => {
    it('returns roadmaps array from response', async () => {
      mockApiFetch.mockResolvedValue({
        json: async () => ({ roadmaps: [{ id: '1', slug: 'test', title: 'Test' }] }),
      } as Response);
      const result = await getRoadmaps();
      expect(result).toEqual([{ id: '1', slug: 'test', title: 'Test' }]);
      expect(mockApiFetch).toHaveBeenCalledWith('/api/roadmaps');
    });

    it('returns empty array when roadmaps key is absent', async () => {
      mockApiFetch.mockResolvedValue({ json: async () => ({}) } as Response);
      const result = await getRoadmaps();
      expect(result).toEqual([]);
    });
  });

  describe('createRoadmap', () => {
    it('calls POST /api/roadmaps with serialized data', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      await createRoadmap({ title: 'My Road', slug: 'my-road', description: 'desc' });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/roadmaps',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'My Road', slug: 'my-road', description: 'desc' }),
        }),
      );
    });
  });

  describe('updateRoadmap', () => {
    it('calls PUT /api/roadmaps/:id with partial data', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      await updateRoadmap('abc', { title: 'New Title' });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/roadmaps/abc',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ title: 'New Title' }) }),
      );
    });
  });

  describe('deleteRoadmap', () => {
    it('calls DELETE /api/roadmaps/:id', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      await deleteRoadmap('abc');
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/roadmaps/abc',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('cycleStatus', () => {
    it('cycles DRAFT → PUBLIC and calls PUT', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X', status: 'DRAFT' });
      expect(next).toBe('PUBLIC');
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/roadmaps/abc',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ status: 'PUBLIC' }) }),
      );
    });

    it('cycles PUBLIC → PRIVATE', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X', status: 'PUBLIC' });
      expect(next).toBe('PRIVATE');
    });

    it('cycles PRIVATE → DRAFT', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X', status: 'PRIVATE' });
      expect(next).toBe('DRAFT');
    });

    it('treats undefined status as DRAFT and cycles to PUBLIC', async () => {
      mockApiFetch.mockResolvedValue({ ok: true } as Response);
      const next = await cycleStatus({ id: 'abc', slug: 'x', title: 'X' });
      expect(next).toBe('PUBLIC');
    });
  });
});
```

- [ ] **Step 3: Run tests — expect them to fail**

```bash
pnpm --filter @vizteck/admin test
```

Expected: errors like `Cannot find module './roadmap.service'`.

- [ ] **Step 4: Implement `roadmap.service.ts`**

Create `apps/admin/src/features/roadmaps/services/roadmap.service.ts`:

```ts
import { apiFetch } from '@/lib/api';

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

export async function getRoadmaps(): Promise<Roadmap[]> {
  const res = await apiFetch('/api/roadmaps');
  const data = (await res.json()) as { roadmaps?: Roadmap[] };
  return data.roadmaps ?? [];
}

export async function createRoadmap(data: CreateRoadmapInput): Promise<void> {
  await apiFetch('/api/roadmaps', {
    method: 'POST',
    body: JSON.stringify({ title: data.title, slug: data.slug, description: data.description }),
  });
}

export async function updateRoadmap(id: string, data: UpdateRoadmapInput): Promise<void> {
  await apiFetch(`/api/roadmaps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRoadmap(id: string): Promise<void> {
  await apiFetch(`/api/roadmaps/${id}`, { method: 'DELETE' });
}

export async function cycleStatus(roadmap: Roadmap): Promise<string> {
  const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
  await apiFetch(`/api/roadmaps/${roadmap.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: next }),
  });
  return next;
}
```

- [ ] **Step 5: Run tests — expect them to pass**

```bash
pnpm --filter @vizteck/admin test
```

Expected: `10 tests passed`.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/features/roadmaps/
git commit -m "feat(admin): roadmap.service with full CRUD + cycleStatus (TDD)"
```

---

### Task 3: `useRoadmaps` hook

**Files:**
- Create: `apps/admin/src/features/roadmaps/hooks/useRoadmaps.ts`

**Interfaces:**
- Consumes: `getRoadmaps`, `createRoadmap`, `updateRoadmap`, `deleteRoadmap`, `cycleStatus`, `STATUS_CYCLE` from `../services/roadmap.service`
- Produces:
  ```ts
  useRoadmaps(): {
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

- [ ] **Step 1: Create `apps/admin/src/features/roadmaps/hooks/useRoadmaps.ts`**

```ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  cycleStatus,
  STATUS_CYCLE,
  type Roadmap,
  type CreateRoadmapInput,
  type UpdateRoadmapInput,
} from '../services/roadmap.service';

export type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; roadmap: Roadmap }
  | { type: 'delete'; roadmap: Roadmap };

export function useRoadmaps() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const fetchRoadmaps = useCallback(async () => {
    try {
      const data = await getRoadmaps();
      setRoadmaps(data);
    } catch {
      // apiFetch handles 401 redirect; other errors silently ignored
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  async function handleCreate(data: CreateRoadmapInput) {
    await createRoadmap(data);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleEdit(roadmap: Roadmap, data: UpdateRoadmapInput) {
    await updateRoadmap(roadmap.id, data);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleDelete(roadmap: Roadmap) {
    await deleteRoadmap(roadmap.id);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleStatusChange(roadmap: Roadmap) {
    // Optimistic update using STATUS_CYCLE constant from service
    const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
    setRoadmaps((prev) =>
      prev.map((r) => (r.id === roadmap.id ? { ...r, status: next } : r)),
    );
    try {
      await cycleStatus(roadmap);
    } catch {
      await fetchRoadmaps(); // revert on error
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm --filter @vizteck/admin build 2>&1 | head -30
```

Expected: no TypeScript errors in the new file (build may fail on other things — that's fine at this stage).

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/features/roadmaps/hooks/useRoadmaps.ts
git commit -m "feat(admin): useRoadmaps hook — extract list state from roadmaps page"
```

---

### Task 4: Move `RoadmapModal` + refactor roadmaps list page

**Files:**
- Create: `apps/admin/src/features/roadmaps/components/RoadmapModal.tsx` (move from `components/`)
- Modify: `apps/admin/src/app/roadmaps/page.tsx`
- Delete: `apps/admin/src/components/RoadmapModal.tsx` (after verifying no other imports)

**Interfaces:**
- Consumes: `useRoadmaps` hook, `STATUS_CLASS`, `STATUS_LABEL` from `roadmap.service`
- Produces: `roadmaps/page.tsx` reduced to ~55 lines, no business logic inline

- [ ] **Step 1: Copy `RoadmapModal.tsx` to features folder**

Copy the file contents of `apps/admin/src/components/RoadmapModal.tsx` to `apps/admin/src/features/roadmaps/components/RoadmapModal.tsx` — content is identical, no changes needed.

- [ ] **Step 2: Replace `apps/admin/src/app/roadmaps/page.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { Button } from '@vizteck/ui';
import { AdminLayout } from '@/components/AdminLayout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RoadmapModal } from '@/features/roadmaps/components/RoadmapModal';
import { useRoadmaps } from '@/features/roadmaps/hooks/useRoadmaps';
import { STATUS_CLASS, STATUS_LABEL } from '@/features/roadmaps/services/roadmap.service';
import { useAuthGuard } from '@/lib/useAuthGuard';

export default function RoadmapsPage() {
  useAuthGuard();

  const {
    roadmaps,
    loading,
    modal,
    setModal,
    handleCreate,
    handleEdit,
    handleDelete,
    handleStatusChange,
  } = useRoadmaps();

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <h1 className="text-[20px] font-semibold text-text-1 mb-4">Roadmaps</h1>

        <div className="flex justify-end mb-4">
          <Button variant="primary" onClick={() => setModal({ type: 'create' })}>
            + New Roadmap
          </Button>
        </div>

        {!loading && roadmaps.length === 0 ? (
          <div className="text-center py-16 bg-bg-1 border border-border rounded-md">
            <h2 className="text-[20px] font-semibold text-text-1 mb-2">No roadmaps yet</h2>
            <p className="text-sm text-text-2 mb-4">Create your first roadmap to get started.</p>
            <Button variant="primary" onClick={() => setModal({ type: 'create' })}>
              + New Roadmap
            </Button>
          </div>
        ) : (
          <div className="bg-bg-1 border border-border rounded-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-2 border-b border-border">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-text-2">Title</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-text-2">Slug</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-text-2">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-text-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map((roadmap, idx) => (
                  <tr
                    key={roadmap.id}
                    className={`min-h-[44px] hover:bg-bg-2 ${idx < roadmaps.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-text-1">
                      <Link
                        href={`/roadmaps/${roadmap.id}?slug=${roadmap.slug}`}
                        className="text-text-1 hover:text-indigo hover:underline"
                      >
                        {roadmap.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-3">{roadmap.slug}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleStatusChange(roadmap)}
                        title="Click to cycle status"
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full cursor-pointer focus:outline-none transition-colors ${STATUS_CLASS[roadmap.status ?? 'DRAFT'] ?? STATUS_CLASS.DRAFT}`}
                      >
                        {STATUS_LABEL[roadmap.status ?? 'DRAFT'] ?? 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal({ type: 'edit', roadmap })}
                          className="text-sm text-text-2 hover:text-text-1 px-2 py-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setModal({ type: 'delete', roadmap })}
                          className="text-sm text-red-500 hover:text-red-600 px-2 py-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.type === 'create' && (
        <RoadmapModal
          mode="create"
          onSubmit={handleCreate}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
      {modal.type === 'edit' && (
        <RoadmapModal
          mode="edit"
          initial={modal.roadmap}
          onSubmit={(data) => handleEdit(modal.roadmap, data)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
      {modal.type === 'delete' && (
        <ConfirmDialog
          heading="Delete roadmap?"
          body={`This will permanently delete "${modal.roadmap.title}" and all its nodes and edges. This cannot be undone.`}
          confirmLabel="Delete Roadmap"
          dismissLabel="Keep Roadmap"
          onConfirm={() => handleDelete(modal.roadmap)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </AdminLayout>
  );
}
```

- [ ] **Step 3: Verify no other file imports the old `RoadmapModal` path**

Search in the codebase:
```bash
grep -r "from '@/components/RoadmapModal'" apps/admin/src/
```

Expected: no results. If results found, update those imports to `@/features/roadmaps/components/RoadmapModal`.

- [ ] **Step 4: Delete old `RoadmapModal.tsx`**

```bash
rm apps/admin/src/components/RoadmapModal.tsx
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: 10 tests still pass.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/
git commit -m "refactor(admin): roadmaps page — delegate to useRoadmaps hook, move RoadmapModal to feature"
```

---

### Task 5: `graph.service.ts` — TDD for pure functions

**Files:**
- Create: `apps/admin/src/features/graph-editor/services/graph.service.ts`
- Create: `apps/admin/src/features/graph-editor/services/graph.service.test.ts`

**Interfaces:**
- Produces:
  - `normalizeNodeType(type: unknown): 'ROADMAP' | 'LESSON'`
  - `makeSnapshot(nodes: EditorNode[], edges: EditorEdge[]): string`
  - `loadGraph(slug: string, roadmapId: string): Promise<GraphData>`
  - `saveGraph(roadmapId: string, nodes: EditorNode[], edges: EditorEdge[]): Promise<void>`
  - `EditorNode`, `EditorEdge`, `RoadmapEntry`, `GraphData` types

- [ ] **Step 1: Create directories**

```bash
mkdir -p apps/admin/src/features/graph-editor/services
mkdir -p apps/admin/src/features/graph-editor/hooks
mkdir -p apps/admin/src/features/graph-editor/components
mkdir -p apps/admin/src/features/nodes/components
```

- [ ] **Step 2: Write failing tests**

Create `apps/admin/src/features/graph-editor/services/graph.service.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeNodeType, makeSnapshot, loadGraph, saveGraph } from './graph.service';
import type { EditorNode, EditorEdge } from './graph.service';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api';
const mockApiFetch = vi.mocked(apiFetch);

const nodeA: EditorNode = {
  id: 'n1',
  roadmapId: 'r1',
  type: 'LESSON',
  title: 'Intro',
  positionX: 10,
  positionY: 20,
};

const edgeA: EditorEdge = {
  id: 'e1',
  sourceId: 'n1',
  targetId: 'n2',
};

describe('normalizeNodeType', () => {
  it('maps numeric 0 to ROADMAP', () => {
    expect(normalizeNodeType(0)).toBe('ROADMAP');
  });

  it('maps string "ROADMAP" to ROADMAP', () => {
    expect(normalizeNodeType('ROADMAP')).toBe('ROADMAP');
  });

  it('maps numeric 1 to LESSON', () => {
    expect(normalizeNodeType(1)).toBe('LESSON');
  });

  it('maps string "LESSON" to LESSON', () => {
    expect(normalizeNodeType('LESSON')).toBe('LESSON');
  });

  it('maps unknown value to LESSON as fallback', () => {
    expect(normalizeNodeType(null)).toBe('LESSON');
    expect(normalizeNodeType(undefined)).toBe('LESSON');
  });
});

describe('makeSnapshot', () => {
  it('produces stable JSON across identical inputs', () => {
    const snap1 = makeSnapshot([nodeA], [edgeA]);
    const snap2 = makeSnapshot([nodeA], [edgeA]);
    expect(snap1).toBe(snap2);
  });

  it('produces different output when node position changes', () => {
    const snap1 = makeSnapshot([nodeA], []);
    const movedNode = { ...nodeA, positionX: 999 };
    const snap2 = makeSnapshot([movedNode], []);
    expect(snap1).not.toBe(snap2);
  });

  it('omits undefined content as null', () => {
    const snap = makeSnapshot([nodeA], []);
    const parsed = JSON.parse(snap) as { nodes: { content: unknown }[] };
    expect(parsed.nodes[0].content).toBeNull();
  });
});

describe('loadGraph', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns parsed roadmap data', async () => {
    mockApiFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          roadmap: { title: 'My Roadmap', status: 'PUBLIC' },
          nodes: [{ id: 'n1', roadmapId: 'r1', type: 0, title: 'Node 1', positionX: 0, positionY: 0 }],
          edges: [],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ roadmaps: [{ id: 'r2', slug: 'other', title: 'Other' }] }),
      } as Response);

    const data = await loadGraph('my-roadmap', 'r1');
    expect(data.roadmapTitle).toBe('My Roadmap');
    expect(data.roadmapStatus).toBe('PUBLIC');
    expect(data.nodes[0].type).toBe('ROADMAP'); // numeric 0 normalized
    expect(data.allRoadmaps).toHaveLength(1);
  });

  it('throws when graph fetch fails', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ roadmaps: [] }) } as Response);

    await expect(loadGraph('missing', 'r1')).rejects.toThrow('Failed to load graph');
  });
});

describe('saveGraph', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls POST /api/roadmaps/:id/graph with nodes and edges', async () => {
    mockApiFetch.mockResolvedValue({ ok: true } as Response);
    await saveGraph('r1', [nodeA], [edgeA]);
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/roadmaps/r1/graph',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse((mockApiFetch.mock.calls[0][1] as { body: string }).body) as {
      nodes: unknown[];
      edges: unknown[];
    };
    expect(body.nodes).toHaveLength(1);
    expect(body.edges).toHaveLength(1);
  });

  it('throws on non-ok response', async () => {
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal error',
    } as Response);
    await expect(saveGraph('r1', [], [])).rejects.toThrow('Save failed');
  });
});
```

- [ ] **Step 3: Run tests — expect to fail**

```bash
pnpm --filter @vizteck/admin test
```

Expected: errors like `Cannot find module './graph.service'`.

- [ ] **Step 4: Implement `graph.service.ts`**

Create `apps/admin/src/features/graph-editor/services/graph.service.ts`:

```ts
import { apiFetch } from '@/lib/api';
import type { NodeItem, EdgeItem } from '@vizteck/graph';

export interface EditorNode extends NodeItem {
  selected?: boolean;
}

export interface EditorEdge extends EdgeItem {}

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

export async function loadGraph(slug: string, roadmapId: string): Promise<GraphData> {
  const [graphRes, roadmapsRes] = await Promise.all([
    apiFetch(`/api/roadmaps/${slug}`),
    apiFetch('/api/roadmaps'),
  ]);

  if (!graphRes.ok) throw new Error(`Failed to load graph: ${graphRes.status}`);

  const data = (await graphRes.json()) as {
    roadmap: { title: string; status?: string };
    nodes?: NodeItem[];
    edges?: EdgeItem[];
  };

  const roadmapsData = roadmapsRes.ok
    ? ((await roadmapsRes.json()) as { roadmaps?: RoadmapEntry[] })
    : { roadmaps: [] };

  const nodes: EditorNode[] = (data.nodes ?? []).map((n) => ({
    ...n,
    type: normalizeNodeType(n.type),
  }));
  const edges: EditorEdge[] = (data.edges ?? []).map((e) => ({ ...e }));
  const savedSnapshot = makeSnapshot(nodes, edges);

  // Restore sessionStorage draft if present and different from API state
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
    roadmapTitle: data.roadmap?.title ?? '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roadmapStatus: (data.roadmap as any)?.status ?? 'DRAFT',
    nodes: restoredNodes,
    edges: restoredEdges,
    allRoadmaps: roadmapsData.roadmaps ?? [],
    savedSnapshot,
  };
}

export async function saveGraph(
  roadmapId: string,
  nodes: EditorNode[],
  edges: EditorEdge[],
): Promise<void> {
  const res = await apiFetch(`/api/roadmaps/${roadmapId}/graph`, {
    method: 'POST',
    body: JSON.stringify({
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
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
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Save failed: ${text || res.status}`);
  }
}
```

- [ ] **Step 5: Run tests — expect all to pass**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all tests pass (roadmap.service + graph.service combined).

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/features/graph-editor/
git commit -m "feat(admin): graph.service with normalizeNodeType, makeSnapshot, loadGraph, saveGraph (TDD)"
```

---

### Task 6: `useGraphEditor` hook + tests

**Files:**
- Create: `apps/admin/src/features/graph-editor/hooks/useGraphEditor.ts`
- Create: `apps/admin/src/features/graph-editor/hooks/useGraphEditor.test.ts`

**Interfaces:**
- Consumes: `loadGraph`, `saveGraph`, `makeSnapshot` from `../services/graph.service`; `updateRoadmap` from `@/features/roadmaps/services/roadmap.service`
- Produces:
  ```ts
  useGraphEditor(id: string, slug: string | null): {
    loading: boolean; saving: boolean; saveError: string; dirty: boolean;
    roadmapTitle: string; roadmapStatus: string;
    editorNodes: EditorNode[]; editorEdges: EditorEdge[]; allRoadmaps: RoadmapEntry[];
    setEditorNodes: Dispatch<SetStateAction<EditorNode[]>>;
    setEditorEdges: Dispatch<SetStateAction<EditorEdge[]>>;
    handleSave: () => Promise<void>;
    handleChangeStatus: (next: string) => Promise<void>;
  }
  ```

- [ ] **Step 1: Write tests first**

Create `apps/admin/src/features/graph-editor/hooks/useGraphEditor.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGraphEditor } from './useGraphEditor';

vi.mock('../services/graph.service', () => ({
  loadGraph: vi.fn(),
  saveGraph: vi.fn(),
  makeSnapshot: vi.fn((nodes: unknown[], edges: unknown[]) =>
    JSON.stringify({ nodes, edges }),
  ),
}));

vi.mock('@/features/roadmaps/services/roadmap.service', () => ({
  updateRoadmap: vi.fn(),
}));

import { loadGraph, saveGraph } from '../services/graph.service';
const mockLoadGraph = vi.mocked(loadGraph);
const mockSaveGraph = vi.mocked(saveGraph);

const mockGraphData = {
  roadmapTitle: 'Test Roadmap',
  roadmapStatus: 'DRAFT',
  nodes: [],
  edges: [],
  allRoadmaps: [],
  savedSnapshot: '{"nodes":[],"edges":[]}',
};

describe('useGraphEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadGraph.mockResolvedValue(mockGraphData);
    mockSaveGraph.mockResolvedValue(undefined);
  });

  it('starts with loading=true', () => {
    const { result } = renderHook(() => useGraphEditor('id-1', 'test-slug'));
    expect(result.current.loading).toBe(true);
  });

  it('sets loading=false and populates title after load', async () => {
    const { result } = renderHook(() => useGraphEditor('id-1', 'test-slug'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.roadmapTitle).toBe('Test Roadmap');
    expect(result.current.roadmapStatus).toBe('DRAFT');
  });

  it('does not load when slug is null', async () => {
    renderHook(() => useGraphEditor('id-1', null));
    await act(async () => {});
    expect(mockLoadGraph).not.toHaveBeenCalled();
  });

  it('sets saveError when saveGraph throws', async () => {
    mockSaveGraph.mockRejectedValue(new Error('Save failed: 500'));
    const { result } = renderHook(() => useGraphEditor('id-1', 'test-slug'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });
    expect(result.current.saveError).toContain('Save failed');
  });

  it('clears saveError on successful save', async () => {
    mockSaveGraph.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGraphEditor('id-1', 'test-slug'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });
    expect(result.current.saveError).toBe('');
  });
});
```

- [ ] **Step 2: Run tests — expect to fail**

```bash
pnpm --filter @vizteck/admin test
```

Expected: `Cannot find module './useGraphEditor'`.

- [ ] **Step 3: Implement `useGraphEditor.ts`**

Create `apps/admin/src/features/graph-editor/hooks/useGraphEditor.ts`:

```ts
'use client';

import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  loadGraph,
  saveGraph,
  makeSnapshot,
  type EditorNode,
  type EditorEdge,
  type RoadmapEntry,
} from '../services/graph.service';
import { updateRoadmap } from '@/features/roadmaps/services/roadmap.service';

export function useGraphEditor(id: string, slug: string | null) {
  const [loading, setLoading] = useState(true);
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [roadmapStatus, setRoadmapStatus] = useState('DRAFT');
  const [editorNodes, setEditorNodes] = useState<EditorNode[]>([]);
  const [editorEdges, setEditorEdges] = useState<EditorEdge[]>([]);
  const [allRoadmaps, setAllRoadmaps] = useState<RoadmapEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savedSnapshotRef = useRef<string>('');

  const currentSnapshot = makeSnapshot(editorNodes, editorEdges);
  const dirty = loading ? false : currentSnapshot !== savedSnapshotRef.current;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    loadGraph(slug, id)
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
  }, [slug, id]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveGraph(id, editorNodes, editorEdges);
      savedSnapshotRef.current = makeSnapshot(editorNodes, editorEdges);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`graph-draft-${id}`);
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Save failed. Check your connection and try again.',
      );
      console.error('[useGraphEditor] save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeStatus(next: string) {
    setRoadmapStatus(next);
    try {
      await updateRoadmap(id, { status: next });
    } catch {
      // revert optimistic update
      setRoadmapStatus((prev) => prev);
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

- [ ] **Step 4: Run all tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/features/graph-editor/hooks/
git commit -m "feat(admin): useGraphEditor hook + tests"
```

---

### Task 7: `useNodeActions` hook

**Files:**
- Create: `apps/admin/src/features/graph-editor/hooks/useNodeActions.ts`

**Interfaces:**
- Consumes: `applyEdgeChanges` from `@vizteck/graph`; `EditorNode`, `EditorEdge` from `../services/graph.service`
- Produces:
  ```ts
  useNodeActions(params: UseNodeActionsParams): {
    handleNodesChange, handleEdgesChange, handleConnect,
    handleNodesDelete, handleDropNode, handleNodeClick,
    handleEdgeClick, handlePaneContextMenu, handleBack,
  }
  ```

- [ ] **Step 1: Create `apps/admin/src/features/graph-editor/hooks/useNodeActions.ts`**

```ts
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeItem,
} from '@vizteck/graph';
import type { Dispatch, SetStateAction } from 'react';
import type { EditorNode, EditorEdge } from '../services/graph.service';

interface SidePanelState {
  open: boolean;
  mode: 'create' | 'edit';
  nodeId?: string;
  flowPosition?: { x: number; y: number };
}

export interface UseNodeActionsParams {
  id: string;
  slug: string | null;
  setEditorNodes: Dispatch<SetStateAction<EditorNode[]>>;
  setEditorEdges: Dispatch<SetStateAction<EditorEdge[]>>;
  setPanel: Dispatch<SetStateAction<SidePanelState>>;
  confirmNavigation: () => boolean;
  setPendingNavUrl: Dispatch<SetStateAction<string>>;
}

function applyFlowChangesToEditorNodes(
  rfChanges: NodeChange[],
  editorNodes: EditorNode[],
): EditorNode[] {
  return editorNodes.map((n) => {
    let updated = n;
    for (const change of rfChanges) {
      if (!('id' in change) || (change as { id: string }).id !== n.id) continue;
      if (change.type === 'position' && 'position' in change && change.position != null) {
        const pos = change.position as { x: number; y: number };
        updated = { ...updated, positionX: pos.x, positionY: pos.y };
      } else if (change.type === 'select' && 'selected' in change) {
        updated = { ...updated, selected: (change as { selected: boolean }).selected };
      }
    }
    return updated;
  });
}

export function useNodeActions({
  id,
  slug,
  setEditorNodes,
  setEditorEdges,
  setPanel,
  confirmNavigation,
  setPendingNavUrl,
}: UseNodeActionsParams) {
  const router = useRouter();

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const relevant = changes.filter(
        (c) =>
          (c.type === 'position' &&
            'position' in c &&
            (c as { position?: unknown }).position != null) ||
          c.type === 'select',
      );
      if (relevant.length === 0) return;
      setEditorNodes((prev) => applyFlowChangesToEditorNodes(relevant, prev));
    },
    [setEditorNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEditorEdges((prev) => {
        const rfEdges = prev.map((e) => ({
          id: e.id,
          source: e.sourceId,
          target: e.targetId,
          label: e.label,
        }));
        const updated = applyEdgeChanges(changes, rfEdges);
        const remainingIds = new Set(updated.map((e) => e.id));
        return prev.filter((e) => remainingIds.has(e.id));
      });
    },
    [setEditorEdges],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const newEdge: EditorEdge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sourceId: connection.source,
        targetId: connection.target,
      };
      setEditorEdges((prev) => [...prev, newEdge]);
    },
    [setEditorEdges],
  );

  // Canvas delete = UNPLACE (D-06): null position keeps node in inventory
  const handleNodesDelete = useCallback(
    (deleted: { id: string }[]) => {
      const deletedIds = new Set<string>(deleted.map((n) => n.id));
      setEditorNodes((prev) =>
        prev.map((n) =>
          deletedIds.has(n.id) ? { ...n, positionX: null, positionY: null } : n,
        ),
      );
    },
    [setEditorNodes],
  );

  const handlePaneContextMenu = useCallback(
    (_event: React.MouseEvent | globalThis.MouseEvent, flowPos: { x: number; y: number }) => {
      setPanel({ open: true, mode: 'create', flowPosition: flowPos });
    },
    [setPanel],
  );

  const handleEdgeClick = useCallback(
    (edgeId: string) => {
      setEditorEdges((prev) => prev.filter((e) => e.id !== edgeId));
    },
    [setEditorEdges],
  );

  const handleDropNode = useCallback(
    (nodeId: string, flowPos: { x: number; y: number }) => {
      if (nodeId.startsWith('newRoadmap:')) {
        // Parse title from drag payload — title is URL-encoded and may contain colons
        const parts = nodeId.split(':');
        const targetRoadmapId = parts[1];
        const targetRoadmapSlug = parts[2];
        const title = decodeURIComponent(parts.slice(3).join(':'));
        setEditorNodes((prev) => {
          if (prev.some((n) => n.type === 'ROADMAP' && n.targetRoadmapId === targetRoadmapId))
            return prev;
          const newNode: EditorNode = {
            id: crypto.randomUUID(),
            roadmapId: id,
            type: 'ROADMAP',
            title,
            positionX: flowPos.x,
            positionY: flowPos.y,
            targetRoadmapId,
            targetRoadmapSlug,
          };
          return [...prev, newNode];
        });
      } else {
        setEditorNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId ? { ...n, positionX: flowPos.x, positionY: flowPos.y } : n,
          ),
        );
      }
    },
    [id, setEditorNodes],
  );

  const handleNodeClick = useCallback(
    (node: NodeItem) => {
      if (node.type === 'LESSON') {
        router.push(`/roadmaps/${id}/nodes/${node.id}?slug=${slug ?? ''}`);
      } else if (node.type === 'ROADMAP' && node.targetRoadmapId && node.targetRoadmapSlug) {
        router.push(`/roadmaps/${node.targetRoadmapId}?slug=${node.targetRoadmapSlug}`);
      } else {
        setPanel({ open: true, mode: 'edit', nodeId: node.id });
      }
    },
    [id, slug, router, setPanel],
  );

  const handleBack = useCallback(() => {
    const url = '/roadmaps';
    const allowed = confirmNavigation();
    if (allowed) router.push(url);
    else setPendingNavUrl(url);
  }, [confirmNavigation, router, setPendingNavUrl]);

  return {
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    handleNodesDelete,
    handlePaneContextMenu,
    handleEdgeClick,
    handleDropNode,
    handleNodeClick,
    handleBack,
  };
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all tests pass (no new test file for this hook — pure canvas handlers are better tested via integration).

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/features/graph-editor/hooks/useNodeActions.ts
git commit -m "feat(admin): useNodeActions hook — extract canvas interaction handlers"
```

---

### Task 8: `useGraphDraft` hook

**Files:**
- Create: `apps/admin/src/features/graph-editor/hooks/useGraphDraft.ts`

**Interfaces:**
- Consumes: `EditorNode`, `EditorEdge` from `../services/graph.service`
- Produces: side-effect only hook (no return value); writes/removes `graph-draft-{id}` in sessionStorage

- [ ] **Step 1: Create `apps/admin/src/features/graph-editor/hooks/useGraphDraft.ts`**

```ts
'use client';

import { useEffect } from 'react';
import type { EditorNode, EditorEdge } from '../services/graph.service';

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

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/features/graph-editor/hooks/useGraphDraft.ts
git commit -m "feat(admin): useGraphDraft hook — isolate sessionStorage draft side-effect"
```

---

### Task 9: Fix `NodeSidePanel` — remove direct `apiFetch`, accept `allRoadmaps` prop

**Files:**
- Create: `apps/admin/src/features/graph-editor/components/NodeSidePanel.tsx` (modified copy)

**Interfaces:**
- Consumes: `allRoadmaps: RoadmapEntry[]` as prop (was previously self-fetching)
- Produces: `NodeSidePanel` with no internal API calls

- [ ] **Step 1: Create `apps/admin/src/features/graph-editor/components/NodeSidePanel.tsx`**

The key change: remove the `useEffect` that calls `apiFetch('/api/roadmaps')`, replace the `roadmaps` state with the `allRoadmaps` prop.

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button, NodeBadge } from '@vizteck/ui';
import type { NodeType } from '@vizteck/ui';
import type { RoadmapEntry } from '../services/graph.service';

interface NodeSidePanelProps {
  mode: 'create' | 'edit';
  initial?: { title: string; type: NodeType; targetRoadmapId?: string };
  allRoadmaps: RoadmapEntry[];
  onSubmit: (data: {
    title: string;
    type: NodeType;
    targetRoadmapId?: string;
    targetRoadmapSlug?: string;
  }) => void;
  onClose: () => void;
}

export function NodeSidePanel({ mode, initial, allRoadmaps, onSubmit, onClose }: NodeSidePanelProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<NodeType>(initial?.type ?? 'ROADMAP');
  const [targetRoadmapId, setTargetRoadmapId] = useState(initial?.targetRoadmapId ?? '');

  // Sync when initial changes (switching from create to edit)
  useEffect(() => {
    setTitle(initial?.title ?? '');
    setType(initial?.type ?? 'ROADMAP');
    setTargetRoadmapId(initial?.targetRoadmapId ?? '');
  }, [initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const selectedRoadmap = allRoadmaps.find((r) => r.id === targetRoadmapId);
    onSubmit({
      title: title.trim(),
      type,
      targetRoadmapId: type === 'ROADMAP' ? targetRoadmapId || undefined : undefined,
      targetRoadmapSlug: type === 'ROADMAP' ? selectedRoadmap?.slug : undefined,
    });
  }

  const headingText = mode === 'create' ? 'Create Node' : 'Edit Node';
  const submitLabel = mode === 'create' ? 'Create Node' : 'Save Changes';

  return (
    <>
      <div className="absolute inset-0 z-10" onClick={onClose} aria-hidden="true" />
      <div
        className="absolute top-0 right-0 bottom-0 z-20 bg-bg-1 border-l border-border flex flex-col"
        style={{ width: 320, transform: 'translateX(0)', transition: 'transform 200ms ease-out' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span className="text-sm font-semibold text-text-1">{headingText}</span>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-text-3 hover:text-text-1 text-lg leading-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1 rounded"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="node-title" className="text-sm font-semibold text-text-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="node-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Node title"
                className="w-full px-3 py-2 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="node-type" className="text-sm font-semibold text-text-1">
                Type
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="node-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as NodeType)}
                  className="flex-1 px-3 py-2 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo"
                >
                  <option value="ROADMAP">ROADMAP</option>
                  <option value="LESSON">LESSON</option>
                </select>
                <NodeBadge type={type} />
              </div>
            </div>

            {type === 'ROADMAP' && (
              <div className="flex flex-col gap-1">
                <label htmlFor="node-target-roadmap" className="text-sm font-semibold text-text-1">
                  Links to roadmap
                </label>
                <select
                  id="node-target-roadmap"
                  value={targetRoadmapId}
                  onChange={(e) => setTargetRoadmapId(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo"
                >
                  <option value="">— none —</option>
                  {allRoadmaps.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-3">
                  Clicking this node on the canvas will navigate to the selected roadmap.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border flex-shrink-0">
            <Button variant="ghost" type="button" onClick={onClose}>
              Discard
            </Button>
            <Button variant="primary" type="submit">
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/features/graph-editor/components/NodeSidePanel.tsx
git commit -m "feat(admin): NodeSidePanel moved to features — remove self-fetch, accept allRoadmaps prop"
```

---

### Task 10: Move remaining graph-editor components + `LessonEditor`

**Files:**
- Create: `apps/admin/src/features/graph-editor/components/GraphToolbar.tsx` (move)
- Create: `apps/admin/src/features/graph-editor/components/NodeInventory.tsx` (move)
- Create: `apps/admin/src/features/nodes/components/LessonEditor.tsx` (move)

**Interfaces:**
- No API or logic changes — file moves only, same props as current components

- [ ] **Step 1: Copy `GraphToolbar.tsx`**

Copy `apps/admin/src/components/GraphToolbar.tsx` → `apps/admin/src/features/graph-editor/components/GraphToolbar.tsx`.

Update the import inside the file: change `from './ThemeToggle'` to `from '@/components/ThemeToggle'`.

- [ ] **Step 2: Copy `NodeInventory.tsx`**

Copy `apps/admin/src/components/NodeInventory.tsx` → `apps/admin/src/features/graph-editor/components/NodeInventory.tsx`.

The `RoadmapEntry` type is now defined in `graph.service.ts`. Update the import:

Remove:
```ts
export interface RoadmapEntry {
  id: string;
  title: string;
  slug: string;
}
```

Add at the top:
```ts
import type { RoadmapEntry } from '../services/graph.service';
```

Keep the `export type { RoadmapEntry }` re-export so any existing consumer still works:
```ts
export type { RoadmapEntry };
```

- [ ] **Step 3: Copy `LessonEditor.tsx`**

Copy `apps/admin/src/components/LessonEditor.tsx` → `apps/admin/src/features/nodes/components/LessonEditor.tsx`. No changes needed inside.

- [ ] **Step 4: Verify no remaining imports of old paths**

```bash
grep -r "from '@/components/GraphToolbar'" apps/admin/src/
grep -r "from '@/components/NodeInventory'" apps/admin/src/
grep -r "from '@/components/NodeSidePanel'" apps/admin/src/
grep -r "from '@/components/LessonEditor'" apps/admin/src/
```

Expected: each grep finds exactly one result — the old file in `components/`. The pages referencing these will be updated in the next task.

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/features/
git commit -m "refactor(admin): move GraphToolbar, NodeInventory, LessonEditor to features"
```

---

### Task 11: Refactor `roadmaps/[id]/page.tsx` (Graph Editor page)

**Files:**
- Modify: `apps/admin/src/app/roadmaps/[id]/page.tsx`
- Delete (after this task): old component files from `apps/admin/src/components/` that are now fully replaced

**Interfaces:**
- Consumes: all hooks from `@/features/graph-editor/hooks/*`, components from `@/features/graph-editor/components/*`
- Produces: page with no inline business logic, ~90 lines

- [ ] **Step 1: Replace `apps/admin/src/app/roadmaps/[id]/page.tsx`**

```tsx
'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { RoadmapGraph } from '@vizteck/graph';
import type { NodeType } from '@vizteck/ui';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useUnsavedGuard } from '@/lib/useRouteGuard';
import { useGraphEditor } from '@/features/graph-editor/hooks/useGraphEditor';
import { useNodeActions } from '@/features/graph-editor/hooks/useNodeActions';
import { useGraphDraft } from '@/features/graph-editor/hooks/useGraphDraft';
import { GraphToolbar } from '@/features/graph-editor/components/GraphToolbar';
import { NodeInventory } from '@/features/graph-editor/components/NodeInventory';
import { NodeSidePanel } from '@/features/graph-editor/components/NodeSidePanel';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { EditorNode } from '@/features/graph-editor/services/graph.service';

interface SidePanelState {
  open: boolean;
  mode: 'create' | 'edit';
  nodeId?: string;
  flowPosition?: { x: number; y: number };
}

interface DeleteConfirm {
  open: boolean;
  nodeId: string;
  nodeTitle: string;
}

export default function GraphEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  useAuthGuard();

  const { id } = use(params);
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const router = useRouter();

  const {
    loading, saving, saveError, dirty,
    roadmapTitle, roadmapStatus,
    editorNodes, editorEdges, allRoadmaps,
    setEditorNodes, setEditorEdges,
    handleSave, handleChangeStatus,
  } = useGraphEditor(id, slug);

  const [panel, setPanel] = useState<SidePanelState>({ open: false, mode: 'create' });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>({ open: false, nodeId: '', nodeTitle: '' });
  const [pendingNavUrl, setPendingNavUrl] = useState('');

  const { showConfirm: showNavConfirm, confirmNavigation, cancelNavigation, proceedNavigation } =
    useUnsavedGuard(dirty);

  const {
    handleNodesChange, handleEdgesChange, handleConnect,
    handleNodesDelete, handlePaneContextMenu, handleEdgeClick,
    handleDropNode, handleNodeClick, handleBack,
  } = useNodeActions({ id, slug, setEditorNodes, setEditorEdges, setPanel, confirmNavigation, setPendingNavUrl });

  useGraphDraft(id, editorNodes, editorEdges, dirty, loading);

  function handleAddNode() {
    setPanel({ open: true, mode: 'create', flowPosition: undefined });
  }

  function handleEditNode(nodeId: string) {
    setPanel({ open: true, mode: 'edit', nodeId });
  }

  function handleDeleteNodeRequest(nodeId: string) {
    const node = editorNodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDeleteConfirm({ open: true, nodeId, nodeTitle: node.title });
  }

  function handleDeleteNodeConfirm() {
    const { nodeId } = deleteConfirm;
    setDeleteConfirm({ open: false, nodeId: '', nodeTitle: '' });
    setEditorNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEditorEdges((prev) => prev.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId));
  }

  function handlePanelSubmit(data: { title: string; type: NodeType; targetRoadmapId?: string; targetRoadmapSlug?: string }) {
    if (panel.mode === 'create') {
      const newNode: EditorNode = {
        id: crypto.randomUUID(),
        roadmapId: id,
        type: data.type,
        title: data.title,
        positionX: panel.flowPosition?.x ?? null,
        positionY: panel.flowPosition?.y ?? null,
        targetRoadmapId: data.targetRoadmapId,
        targetRoadmapSlug: data.targetRoadmapSlug,
      };
      setEditorNodes((prev) => [...prev, newNode]);
    } else if (panel.mode === 'edit' && panel.nodeId) {
      const nodeId = panel.nodeId;
      setEditorNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, title: data.title, type: data.type, targetRoadmapId: data.targetRoadmapId, targetRoadmapSlug: data.targetRoadmapSlug }
            : n,
        ),
      );
    }
    setPanel({ open: false, mode: 'create' });
  }

  function handleAddRoadmapLink(roadmap: { id: string; title: string; slug: string }) {
    const newNode: EditorNode = {
      id: crypto.randomUUID(),
      roadmapId: id,
      type: 'ROADMAP',
      title: roadmap.title,
      positionX: null,
      positionY: null,
      targetRoadmapId: roadmap.id,
      targetRoadmapSlug: roadmap.slug,
    };
    setEditorNodes((prev) => [...prev, newNode]);
  }

  const panelInitial =
    panel.mode === 'edit' && panel.nodeId
      ? (() => {
          const n = editorNodes.find((x) => x.id === panel.nodeId);
          return n ? { title: n.title, type: n.type as NodeType, targetRoadmapId: n.targetRoadmapId } : undefined;
        })()
      : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-2 text-sm">
        Loading graph…
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>
      <GraphToolbar
        roadmapTitle={roadmapTitle}
        dirty={dirty}
        saving={saving}
        roadmapStatus={roadmapStatus}
        onAddNode={handleAddNode}
        onSave={handleSave}
        onBack={handleBack}
        onChangeStatus={handleChangeStatus}
      />

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 flex-shrink-0">
          {saveError}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <NodeInventory
          nodes={editorNodes}
          allRoadmaps={allRoadmaps}
          onEditNode={handleEditNode}
          onDeleteNode={handleDeleteNodeRequest}
          onAddRoadmapLink={handleAddRoadmapLink}
        />

        <div className="flex-1 relative overflow-hidden">
          <RoadmapGraph
            nodes={editorNodes}
            edges={editorEdges}
            mode="edit"
            onNodeClick={handleNodeClick}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodesDelete={handleNodesDelete}
            onEdgeClick={handleEdgeClick}
            onPaneContextMenu={handlePaneContextMenu}
            onDropNode={handleDropNode}
          />

          {panel.open && (
            <NodeSidePanel
              mode={panel.mode}
              initial={panelInitial}
              allRoadmaps={allRoadmaps}
              onSubmit={handlePanelSubmit}
              onClose={() => setPanel({ open: false, mode: 'create' })}
            />
          )}
        </div>
      </div>

      {deleteConfirm.open && (
        <ConfirmDialog
          heading="Delete node?"
          body={`This will permanently delete "${deleteConfirm.nodeTitle}" and all connected edges. This cannot be undone.`}
          confirmLabel="Delete Node"
          dismissLabel="Keep Node"
          onConfirm={handleDeleteNodeConfirm}
          onClose={() => setDeleteConfirm({ open: false, nodeId: '', nodeTitle: '' })}
        />
      )}

      {showNavConfirm && (
        <ConfirmDialog
          heading="Leave without saving?"
          body="Your graph changes haven't been saved. Leaving now will discard them."
          confirmLabel="Leave anyway"
          dismissLabel="Keep Editing"
          onConfirm={() => {
            proceedNavigation();
            router.push(pendingNavUrl || '/roadmaps');
            setPendingNavUrl('');
          }}
          onClose={cancelNavigation}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Delete old component files now fully superseded**

First verify nothing still imports them:

```bash
grep -r "from '@/components/NodeSidePanel'" apps/admin/src/app/
grep -r "from '@/components/GraphToolbar'" apps/admin/src/app/
grep -r "from '@/components/NodeInventory'" apps/admin/src/app/
```

Expected: no results. Then delete:

```bash
rm apps/admin/src/components/NodeSidePanel.tsx
rm apps/admin/src/components/GraphToolbar.tsx
rm apps/admin/src/components/NodeInventory.tsx
rm apps/admin/src/components/RoadmapModal.tsx
```

- [ ] **Step 3: Run all tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/
git commit -m "refactor(admin): graph editor page — delegate to useGraphEditor, useNodeActions, useGraphDraft"
```

---

### Task 12: Move `LessonEditor` + update lesson page import

**Files:**
- Modify: `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`
- Delete: `apps/admin/src/components/LessonEditor.tsx`

**Interfaces:**
- No behavior change — import path update only

- [ ] **Step 1: Update dynamic import in `nodes/[nodeId]/page.tsx`**

Find this line (around line 61):
```ts
  () => import('@/components/LessonEditor').then((m) => m.LessonEditor),
```

Replace with:
```ts
  () => import('@/features/nodes/components/LessonEditor').then((m) => m.LessonEditor),
```

- [ ] **Step 2: Verify no other imports of old LessonEditor path**

```bash
grep -r "from '@/components/LessonEditor'" apps/admin/src/
grep -r "import('@/components/LessonEditor')" apps/admin/src/
```

Expected: no results.

- [ ] **Step 3: Delete old file**

```bash
rm apps/admin/src/components/LessonEditor.tsx
```

- [ ] **Step 4: Run all tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all pass.

- [ ] **Step 5: Final build check**

```bash
pnpm --filter @vizteck/admin build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Final commit**

```bash
git add apps/admin/src/
git commit -m "refactor(admin): move LessonEditor to features/nodes — complete feature-first refactor"
```
