# Web Feature-First Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `apps/web` from a flat `components/` layout into a feature-first structure with a tested service layer, mirroring the pattern already applied to `apps/admin`.

**Architecture:** Extract server-side fetch functions from `lib/api.ts` into typed feature services (`features/roadmap/services/`, `features/lesson/services/`), move components into their feature folders, extract `LessonLayout` from the 167-line lesson page, then slim pages to pure data-fetch + render. Services are plain async functions (Next.js server components — no hooks). `lib/api.ts` is deleted after migration.

**Tech Stack:** Next.js 15 (server components), TypeScript strict, Vitest 2, pnpm workspace

## Global Constraints

- `apps/web` is SSR/SSG — server components fetch data at render time; no `useState`/`useEffect` in services
- All fetch calls must use `{ cache: 'no-store' }` (intentional — reflects admin changes immediately)
- Tailwind semantic tokens only: `bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo` — never hardcode hex or CSS variables
- `@/` alias maps to `apps/web/src/` (configured in tsconfig.json)
- Node.js >= 20, pnpm >= 9
- TypeScript strict mode throughout
- Do NOT import from `apps/*` within packages; do NOT import React in service files

---

## File Map

```
apps/web/
  vitest.config.ts                                          [NEW — Task 1]
  vitest.setup.ts                                           [NEW — Task 1]
  src/
    features/
      lesson/
        services/
          node.service.ts                                   [NEW — Task 2]
          node.service.test.ts                              [NEW — Task 2]
        components/
          LessonContent.tsx                                 [MOVED — Task 4, no change]
          MiniGraph.tsx                                     [MOVED — Task 4, no change]
          LessonLayout.tsx                                  [NEW — Task 4, extracted from lesson page]
      roadmap/
        services/
          roadmap.service.ts                                [NEW — Task 3]
          roadmap.service.test.ts                           [NEW — Task 3]
        components/
          RoadmapGraphView.tsx                              [MOVED — Task 4, update imports]
    app/
      roadmap/[slug]/page.tsx                               [MODIFY — Task 5, update imports]
      roadmap/[slug]/node/[id]/page.tsx                     [MODIFY — Task 5, use LessonLayout]
    lib/
      api.ts                                                [DELETE — Task 5]
    components/
      RoadmapGraphView.tsx                                  [DELETE — Task 5]
      LessonContent.tsx                                     [DELETE — Task 5]
      MiniGraph.tsx                                         [DELETE — Task 5]
      Breadcrumb.tsx                                        [KEEP — shared UI]
      ThemeToggle.tsx                                       [KEEP — shared UI]
```

---

## Task 1: Add Vitest to apps/web

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Produces: `pnpm --filter @vizteck/web test` runs test suite

- [ ] **Step 1: Install dev dependencies**

```bash
pnpm --filter @vizteck/web add -D vitest @vitest/coverage-v8 vite-tsconfig-paths
```

Expected: packages added to `apps/web/package.json` devDependencies.

- [ ] **Step 2: Create vitest.config.ts**

```ts
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 3: Create vitest.setup.ts**

```ts
// apps/web/vitest.setup.ts
import { vi } from 'vitest';

// Provide process.env defaults so services resolve the API base URL in tests
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
```

- [ ] **Step 4: Add test script to package.json**

In `apps/web/package.json`, add `"test": "vitest run"` to the `scripts` block:

```json
{
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint",
    "test": "vitest run"
  }
}
```

- [ ] **Step 5: Verify runner works (no tests yet)**

```bash
pnpm --filter @vizteck/web test
```

Expected output: `No test files found` or `0 passed` — no error.

- [ ] **Step 6: Commit**

```bash
git add apps/web/vitest.config.ts apps/web/vitest.setup.ts apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add Vitest test runner"
```

---

## Task 2: node.service.ts — TDD

**Files:**
- Create: `apps/web/src/features/lesson/services/node.service.ts`
- Create: `apps/web/src/features/lesson/services/node.service.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface NodeItem {
    id: string;
    roadmapId: string;
    type: 'ROADMAP' | 'LESSON';
    title: string;
    positionX: number;
    positionY: number;
    targetRoadmapId?: string;
    targetRoadmapSlug?: string;
    content?: string;
  }
  export function normalizeNodeType(t: unknown): 'ROADMAP' | 'LESSON'
  export async function fetchNode(id: string): Promise<NodeItem>
  ```
- Consumed by: Task 3 (`roadmap.service.ts` imports `NodeItem`, `normalizeNodeType`)

**Context:** The original `lib/api.ts` defines `normalizeNodeType` (private), `NodeItem`, and `fetchNode`. This task extracts them into a tested service. The `fetchNode` API response shape is `{ node: {...} } | {...}` — both wrappers must be handled.

- [ ] **Step 1: Write the test file**

```ts
// apps/web/src/features/lesson/services/node.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('fetch', vi.fn());
const mockFetch = vi.mocked(fetch);

import { normalizeNodeType, fetchNode } from './node.service';

const BASE = 'http://localhost:3000';

function mockOk(data: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
}

describe('normalizeNodeType', () => {
  it('maps numeric 0 to ROADMAP', () => {
    expect(normalizeNodeType(0)).toBe('ROADMAP');
  });

  it('maps numeric 1 to LESSON', () => {
    expect(normalizeNodeType(1)).toBe('LESSON');
  });

  it('passes through string ROADMAP', () => {
    expect(normalizeNodeType('ROADMAP')).toBe('ROADMAP');
  });

  it('passes through string LESSON', () => {
    expect(normalizeNodeType('LESSON')).toBe('LESSON');
  });

  it('falls back to LESSON for unknown values', () => {
    expect(normalizeNodeType(null)).toBe('LESSON');
    expect(normalizeNodeType('UNKNOWN')).toBe('LESSON');
  });
});

describe('fetchNode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the correct API endpoint', async () => {
    mockOk({ node: { id: 'n1', type: 'LESSON', title: 'T', roadmapId: 'r1', positionX: 0, positionY: 0 } });
    await fetchNode('n1');
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/nodes/n1`, { cache: 'no-store' });
  });

  it('unwraps { node: {...} } response shape', async () => {
    mockOk({ node: { id: 'n1', type: 'LESSON', title: 'Intro', roadmapId: 'r1', positionX: 0, positionY: 0 } });
    const result = await fetchNode('n1');
    expect(result.id).toBe('n1');
    expect(result.type).toBe('LESSON');
  });

  it('accepts flat response shape (no .node wrapper)', async () => {
    mockOk({ id: 'n2', type: 0, title: 'R', roadmapId: 'r1', positionX: 0, positionY: 0 });
    const result = await fetchNode('n2');
    expect(result.id).toBe('n2');
    expect(result.type).toBe('ROADMAP');
  });

  it('normalizes numeric type from wire format', async () => {
    mockOk({ node: { id: 'n3', type: 0, title: 'R', roadmapId: 'r1', positionX: 0, positionY: 0 } });
    const result = await fetchNode('n3');
    expect(result.type).toBe('ROADMAP');
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(fetchNode('missing')).rejects.toThrow('fetchNode(missing): 404');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @vizteck/web test
```

Expected: FAIL — `Cannot find module './node.service'`

- [ ] **Step 3: Create node.service.ts**

```ts
// apps/web/src/features/lesson/services/node.service.ts

export interface NodeItem {
  id: string;
  roadmapId: string;
  type: 'ROADMAP' | 'LESSON';
  title: string;
  positionX: number;
  positionY: number;
  targetRoadmapId?: string;
  targetRoadmapSlug?: string;
  content?: string;
}

const NODE_TYPE_MAP: Record<number | string, 'ROADMAP' | 'LESSON'> = {
  0: 'ROADMAP',
  1: 'LESSON',
};

export function normalizeNodeType(t: unknown): 'ROADMAP' | 'LESSON' {
  if (t === 'ROADMAP' || t === 'LESSON') return t;
  return NODE_TYPE_MAP[t as number] ?? 'LESSON';
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchNode(id: string): Promise<NodeItem> {
  const res = await fetch(`${API}/api/nodes/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchNode(${id}): ${res.status}`);
  const raw = await res.json() as { node?: Partial<NodeItem> } | Partial<NodeItem>;
  const n = (raw as { node?: Partial<NodeItem> }).node ?? (raw as Partial<NodeItem>);
  return { ...n, type: normalizeNodeType(n.type) } as NodeItem;
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
pnpm --filter @vizteck/web test
```

Expected: `10 passed (10)` — 5 normalizeNodeType + 5 fetchNode tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/lesson/services/
git commit -m "feat(web): node.service with normalizeNodeType + fetchNode (TDD)"
```

---

## Task 3: roadmap.service.ts — TDD

**Files:**
- Create: `apps/web/src/features/roadmap/services/roadmap.service.ts`
- Create: `apps/web/src/features/roadmap/services/roadmap.service.test.ts`

**Interfaces:**
- Consumes: `NodeItem`, `normalizeNodeType` from `@/features/lesson/services/node.service`
- Produces:
  ```ts
  export interface RoadmapItem {
    id: string; slug: string; title: string;
    description?: string; coverImage?: string; status?: string;
  }
  export interface EdgeItem {
    id: string; sourceId: string; targetId: string; label?: string;
  }
  export interface RoadmapDetail {
    roadmap?: RoadmapItem;
    nodes: NodeItem[];   // imported from node.service
    edges: EdgeItem[];
  }
  export async function fetchRoadmaps(): Promise<RoadmapItem[]>
  export async function fetchRoadmap(slug: string): Promise<RoadmapDetail>
  ```
- Consumed by: Task 4 (`RoadmapGraphView`), Task 5 (pages)

**Context:** `fetchRoadmaps` filters response to `status === 'PUBLIC'` only. API may return `{ roadmaps: [] }` object OR a bare array — both must be handled. `fetchRoadmap` normalizes node types using `normalizeNodeType`.

- [ ] **Step 1: Write the test file**

```ts
// apps/web/src/features/roadmap/services/roadmap.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('fetch', vi.fn());
const mockFetch = vi.mocked(fetch);

import { fetchRoadmaps, fetchRoadmap } from './roadmap.service';

const BASE = 'http://localhost:3000';

function mockOk(data: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
}

describe('fetchRoadmaps', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the correct endpoint', async () => {
    mockOk({ roadmaps: [] });
    await fetchRoadmaps();
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/roadmaps`, { cache: 'no-store' });
  });

  it('filters out non-PUBLIC roadmaps', async () => {
    mockOk({
      roadmaps: [
        { id: '1', slug: 'a', title: 'A', status: 'PUBLIC' },
        { id: '2', slug: 'b', title: 'B', status: 'DRAFT' },
        { id: '3', slug: 'c', title: 'C', status: 'PRIVATE' },
      ],
    });
    const result = await fetchRoadmaps();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('a');
  });

  it('accepts bare array response shape', async () => {
    mockOk([
      { id: '1', slug: 'a', title: 'A', status: 'PUBLIC' },
    ]);
    const result = await fetchRoadmaps();
    expect(result).toHaveLength(1);
  });

  it('returns empty array when roadmaps list is missing', async () => {
    mockOk({});
    const result = await fetchRoadmaps();
    expect(result).toEqual([]);
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(fetchRoadmaps()).rejects.toThrow('fetchRoadmaps: 500');
  });
});

describe('fetchRoadmap', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the correct endpoint for the given slug', async () => {
    mockOk({ roadmap: { id: 'r1', slug: 'my-road', title: 'T', status: 'PUBLIC' }, nodes: [], edges: [] });
    await fetchRoadmap('my-road');
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/roadmaps/my-road`, { cache: 'no-store' });
  });

  it('normalizes numeric node types from proto wire format', async () => {
    mockOk({
      roadmap: { id: 'r1', slug: 's', title: 'T', status: 'PUBLIC' },
      nodes: [
        { id: 'n1', type: 0, title: 'R', roadmapId: 'r1', positionX: 0, positionY: 0 },
        { id: 'n2', type: 1, title: 'L', roadmapId: 'r1', positionX: 10, positionY: 10 },
      ],
      edges: [],
    });
    const result = await fetchRoadmap('s');
    expect(result.nodes[0].type).toBe('ROADMAP');
    expect(result.nodes[1].type).toBe('LESSON');
  });

  it('returns empty nodes and edges when absent from response', async () => {
    mockOk({ roadmap: { id: 'r1', slug: 's', title: 'T', status: 'PUBLIC' } });
    const result = await fetchRoadmap('s');
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(fetchRoadmap('missing')).rejects.toThrow('fetchRoadmap(missing): 404');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @vizteck/web test
```

Expected: FAIL — `Cannot find module './roadmap.service'`

- [ ] **Step 3: Create roadmap.service.ts**

```ts
// apps/web/src/features/roadmap/services/roadmap.service.ts
import { normalizeNodeType } from '@/features/lesson/services/node.service';
import type { NodeItem } from '@/features/lesson/services/node.service';

export type { NodeItem };

export interface RoadmapItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  status?: string;
}

export interface EdgeItem {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface RoadmapDetail {
  roadmap?: RoadmapItem;
  nodes: NodeItem[];
  edges: EdgeItem[];
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchRoadmaps(): Promise<RoadmapItem[]> {
  const res = await fetch(`${API}/api/roadmaps`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchRoadmaps: ${res.status}`);
  const data = await res.json() as { roadmaps?: RoadmapItem[] } | RoadmapItem[];
  const all = Array.isArray(data) ? data : (data as { roadmaps?: RoadmapItem[] }).roadmaps ?? [];
  return all.filter((r) => r.status === 'PUBLIC');
}

export async function fetchRoadmap(slug: string): Promise<RoadmapDetail> {
  const res = await fetch(`${API}/api/roadmaps/${slug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchRoadmap(${slug}): ${res.status}`);
  const raw = await res.json() as Partial<RoadmapDetail>;
  return {
    roadmap: raw.roadmap,
    nodes: (raw.nodes ?? []).map((n) => ({ ...n, type: normalizeNodeType(n.type) })),
    edges: raw.edges ?? [],
  };
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
pnpm --filter @vizteck/web test
```

Expected: `19 passed (19)` — 10 node.service + 9 roadmap.service tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/roadmap/services/
git commit -m "feat(web): roadmap.service with fetchRoadmaps + fetchRoadmap (TDD)"
```

---

## Task 4: Move components into features; create LessonLayout

**Files:**
- Create: `apps/web/src/features/roadmap/components/RoadmapGraphView.tsx` (moved + import updates)
- Create: `apps/web/src/features/lesson/components/LessonContent.tsx` (verbatim move)
- Create: `apps/web/src/features/lesson/components/MiniGraph.tsx` (verbatim move)
- Create: `apps/web/src/features/lesson/components/LessonLayout.tsx` (new — extracted from lesson page)
- Keep: `apps/web/src/components/Breadcrumb.tsx` (shared UI, not moved)
- Keep: `apps/web/src/components/ThemeToggle.tsx` (shared UI, not moved)
- Do NOT delete old files yet — Task 5 does that after pages are updated.

**Interfaces:**
- Consumes: `RoadmapDetail` from `@/features/roadmap/services/roadmap.service`; `NodeItem` from `@/features/lesson/services/node.service`
- Produces:
  ```tsx
  // RoadmapGraphView
  export function RoadmapGraphView({ detail, slug }: { detail: RoadmapDetail; slug: string })
  // LessonLayout
  export function LessonLayout({ slug, node }: { slug: string; node: NodeItem })
  // LessonContent — unchanged interface
  export function LessonContent({ contentJson }: { contentJson: string })
  // MiniGraph — unchanged interface
  export function MiniGraph({ nodes, edges, width?, height? }: MiniGraphProps)
  ```

- [ ] **Step 1: Create features/roadmap/components/RoadmapGraphView.tsx**

Update only the two imports; everything else is identical to the original.

```tsx
// apps/web/src/features/roadmap/components/RoadmapGraphView.tsx
'use client';

import { useRouter } from 'next/navigation';
import { RoadmapGraph } from '@vizteck/graph';
import type { NodeItem } from '@vizteck/graph';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { RoadmapDetail } from '../services/roadmap.service';

interface RoadmapGraphViewProps {
  detail: RoadmapDetail;
  slug: string;
}

export function RoadmapGraphView({ detail, slug }: RoadmapGraphViewProps) {
  const router = useRouter();

  const breadcrumbItems = [
    { label: 'Home', href: '/', state: 'visited' as const },
    { label: detail.roadmap?.title ?? slug, href: `/roadmap/${slug}`, state: 'active' as const },
  ];

  const handleNodeClick = (node: NodeItem) => {
    if (node.type === 'LESSON') {
      router.push(`/roadmap/${slug}/node/${node.id}`);
    } else if (node.type === 'ROADMAP' && (node.targetRoadmapSlug ?? node.targetRoadmapId)) {
      router.push(`/roadmap/${node.targetRoadmapSlug ?? node.targetRoadmapId}`);
    }
  };

  return (
    <div className="px-6 pb-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="h-[70vh] w-full rounded-lg overflow-hidden">
        <RoadmapGraph
          nodes={detail.nodes}
          edges={detail.edges}
          mode="view"
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Copy LessonContent verbatim**

```tsx
// apps/web/src/features/lesson/components/LessonContent.tsx
// (exact same content as apps/web/src/components/LessonContent.tsx — no changes needed)
'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useEffect, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

interface LessonContentProps {
  contentJson: string;
}

function parseBlocks(json: string): unknown[] | undefined {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as unknown[];
    }
  } catch {
    // Invalid JSON — return undefined
  }
  return undefined;
}

export function LessonContent({ contentJson }: LessonContentProps) {
  const blocks = parseBlocks(contentJson);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote(blocks ? { initialContent: blocks as any } : {});

  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  if (!blocks) {
    return (
      <div className="text-text-3 text-sm py-6">
        No content available.
      </div>
    );
  }

  return <BlockNoteView editor={editor} editable={false} theme={theme ?? 'light'} />;
}
```

- [ ] **Step 3: Copy MiniGraph verbatim**

```tsx
// apps/web/src/features/lesson/components/MiniGraph.tsx
// (exact same content as apps/web/src/components/MiniGraph.tsx — no changes)
interface MiniGraphNode {
  id: string;
  x: number;
  y: number;
  type: 'ROADMAP' | 'LESSON';
}

interface MiniGraphEdge {
  sourceId: string;
  targetId: string;
}

interface MiniGraphProps {
  nodes: MiniGraphNode[];
  edges: MiniGraphEdge[];
  width?: number;
  height?: number;
}

function normalizePositions(
  nodes: MiniGraphNode[],
  padding: number,
  innerW: number,
  innerH: number,
): Map<string, { cx: number; cy: number }> {
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
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

export function MiniGraph({
  nodes,
  edges,
  width = 240,
  height = 120,
}: MiniGraphProps) {
  const padding = 16;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const posById =
    nodes.length > 0
      ? normalizePositions(nodes, padding, innerW, innerH)
      : new Map<string, { cx: number; cy: number }>();

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ background: '#F1F3F9', borderRadius: 8, display: 'block' }}
      aria-label="Mini graph preview"
    >
      {edges.map((e, i) => {
        const src = posById.get(e.sourceId);
        const tgt = posById.get(e.targetId);
        if (!src || !tgt) return null;
        return (
          <line
            key={i}
            x1={src.cx}
            y1={src.cy}
            x2={tgt.cx}
            y2={tgt.cy}
            stroke="#CBD5E1"
            strokeWidth={1.5}
          />
        );
      })}
      {nodes.map((n) => {
        const pos = posById.get(n.id);
        if (!pos) return null;
        const fill = n.type === 'ROADMAP' ? '#4F46E5' : '#059669';
        return (
          <circle key={n.id} cx={pos.cx} cy={pos.cy} r={6} fill={fill} />
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 4: Create LessonLayout.tsx — extract inline styles from lesson page**

The original lesson page uses raw `style={{}}` objects throughout. This component extracts that into a reusable layout using Tailwind semantic tokens.

```tsx
// apps/web/src/features/lesson/components/LessonLayout.tsx
import { NodeBadge, Button } from '@vizteck/ui';
import { LessonContent } from './LessonContent';
import { MiniGraph } from './MiniGraph';
import type { NodeItem } from '@/features/lesson/services/node.service';

interface LessonLayoutProps {
  slug: string;
  node: NodeItem;
}

export function LessonLayout({ slug, node }: LessonLayoutProps) {
  return (
    <div className="px-6 pb-12 pt-6 max-w-[1200px] mx-auto flex gap-8">
      {/* Left: lesson content */}
      <div className="flex-1 min-w-0">
        <div className="mb-3">
          <NodeBadge type={node.type} />
        </div>
        <h1 className="font-display font-bold text-[28px] text-text-1 mb-4">
          {node.title}
        </h1>
        <hr className="border-0 border-t border-border mb-6" />
        {node.type === 'LESSON' ? (
          <LessonContent contentJson={node.content ?? '[]'} />
        ) : (
          <p className="text-text-3 text-sm">
            This node does not contain lesson content.
          </p>
        )}
      </div>

      {/* Right: 280px sidebar */}
      <aside className="w-[280px] shrink-0 flex flex-col gap-4">
        {/* Progress card */}
        <div className="bg-bg-1 border border-border rounded-lg p-5">
          <h3 className="font-display font-bold text-sm text-text-1 mb-3">Progress</h3>
          <p className="text-[12px] text-text-3 mt-2">Progress tracking coming soon.</p>
        </div>

        {/* Mini graph card */}
        <div className="bg-bg-1 border border-border rounded-lg p-5">
          <h3 className="font-display font-bold text-sm text-text-1 mb-3">Roadmap Overview</h3>
          <MiniGraph nodes={[]} edges={[]} width={240} height={100} />
        </div>

        {/* Back CTA */}
        <a href={`/roadmap/${slug}`} className="no-underline">
          <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
            Back to Roadmap →
          </Button>
        </a>
      </aside>
    </div>
  );
}
```

- [ ] **Step 5: Verify tests still pass (no regressions)**

```bash
pnpm --filter @vizteck/web test
```

Expected: `19 passed (19)` — unchanged.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/
git commit -m "refactor(web): move components to features, extract LessonLayout"
```

---

## Task 5: Slim pages, delete lib/api.ts and old components

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/roadmap/[slug]/page.tsx`
- Modify: `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx`
- Delete: `apps/web/src/lib/api.ts`
- Delete: `apps/web/src/components/RoadmapGraphView.tsx`
- Delete: `apps/web/src/components/LessonContent.tsx`
- Delete: `apps/web/src/components/MiniGraph.tsx`

**Context:** After this task, all three pages import from `@/features/*/services/*` and `@/features/*/components/*`. `lib/api.ts` and the three component files in `components/` are deleted — verify no remaining imports before deleting.

- [ ] **Step 1: Update app/page.tsx**

```tsx
// apps/web/src/app/page.tsx
import { Card } from '@vizteck/ui';
import { fetchRoadmaps } from '@/features/roadmap/services/roadmap.service';

export const revalidate = 0;

export default async function HomePage() {
  let roadmaps: Awaited<ReturnType<typeof fetchRoadmaps>> = [];
  try {
    roadmaps = await fetchRoadmaps();
  } catch {
    roadmaps = [];
  }

  return (
    <div className="px-6 py-10">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-display font-bold text-[32px] text-text-1 mb-2">
          Learning Roadmaps
        </h1>
        <p className="font-body text-base text-text-2 mb-10">
          Browse our structured learning paths and start your journey.
        </p>

        {roadmaps.length === 0 ? (
          <div className="text-text-3 text-sm text-center py-16">
            No roadmaps available yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {roadmaps.map((r) => (
              <a key={r.id} href={`/roadmap/${r.slug}`} className="no-underline block">
                <Card type="ROADMAP" title={r.title} description={r.description} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update roadmap/[slug]/page.tsx**

```tsx
// apps/web/src/app/roadmap/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { RoadmapGraphView } from '@/features/roadmap/components/RoadmapGraphView';
import { fetchRoadmap } from '@/features/roadmap/services/roadmap.service';

export const revalidate = 0;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let detail: Awaited<ReturnType<typeof fetchRoadmap>>;
  try {
    detail = await fetchRoadmap(slug);
  } catch {
    notFound();
  }

  if (!detail.roadmap || detail.roadmap.status !== 'PUBLIC') {
    notFound();
  }

  return <RoadmapGraphView detail={detail} slug={slug} />;
}
```

- [ ] **Step 3: Update roadmap/[slug]/node/[id]/page.tsx**

```tsx
// apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx
import { LessonLayout } from '@/features/lesson/components/LessonLayout';
import { fetchNode } from '@/features/lesson/services/node.service';

export const revalidate = 0;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  let node: Awaited<ReturnType<typeof fetchNode>>;
  try {
    node = await fetchNode(id);
  } catch {
    return (
      <div className="text-text-3 text-sm text-center py-16">
        Lesson not found.
      </div>
    );
  }

  return <LessonLayout slug={slug} node={node} />;
}
```

- [ ] **Step 4: Verify no remaining imports from lib/api.ts or old component paths**

```bash
grep -r "from.*lib/api" apps/web/src/
grep -r "from.*components/RoadmapGraphView" apps/web/src/
grep -r "from.*components/LessonContent" apps/web/src/
grep -r "from.*components/MiniGraph" apps/web/src/
```

Expected: no output (zero matches).

- [ ] **Step 5: Delete old files**

```bash
rm apps/web/src/lib/api.ts
rm apps/web/src/components/RoadmapGraphView.tsx
rm apps/web/src/components/LessonContent.tsx
rm apps/web/src/components/MiniGraph.tsx
```

- [ ] **Step 6: Run tests to confirm all still pass**

```bash
pnpm --filter @vizteck/web test
```

Expected: `19 passed (19)`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(web): slim pages, delete lib/api.ts and old components — complete feature-first refactor"
```

---

## Self-Review

**Spec coverage:**
- ✅ Services extracted with tests: `node.service.ts` (10 tests), `roadmap.service.ts` (9 tests)
- ✅ Components moved: `RoadmapGraphView`, `LessonContent`, `MiniGraph`
- ✅ `LessonLayout` extracted from 167-line lesson page
- ✅ `lib/api.ts` deleted
- ✅ Old component files deleted
- ✅ `Breadcrumb`, `ThemeToggle` kept in shared `components/`
- ✅ All `{ cache: 'no-store' }` preserved in services
- ✅ Tailwind semantic tokens used in `LessonLayout` (replacing inline `var(--*)` styles)
- ✅ `@/` alias used throughout (configured in `tsconfig.json`)

**Placeholder scan:** No TBDs, no "similar to Task N", all steps have actual code.

**Type consistency:**
- `NodeItem` defined in `node.service.ts`, re-exported from `roadmap.service.ts` — consistent
- `RoadmapDetail` uses `NodeItem[]` — consistent
- `LessonLayout` props use `NodeItem` imported from `@/features/lesson/services/node.service` — consistent
- `RoadmapGraphView` uses `RoadmapDetail` from `../services/roadmap.service` — consistent
