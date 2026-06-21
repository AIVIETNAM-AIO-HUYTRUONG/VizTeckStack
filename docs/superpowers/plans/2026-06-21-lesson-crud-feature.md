# Lesson CRUD Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CRUD for lessons a first-class feature — targeted save endpoints that bypass the full-graph upsert, inline title editing, and a clean `features/lessons/` boundary in the admin app.

**Architecture:** Add two new gRPC RPCs (`UpdateNodeContent`, `UpdateNodeTitle`) that do a single `db.node.update` instead of the current full DELETE+INSERT upsert. The admin lesson editor page delegates all state to a `useLessonEditor` hook from the new `features/lessons/` feature. No DB migration needed — `Node.content` and `Node.title` already exist.

**Tech Stack:** Proto3 / ts-proto, NestJS gRPC microservice, NestJS REST gateway, Next.js 15 App Router, BlockNote, Vitest (admin), Jest (svc-roadmap)

## Global Constraints

- Run `cd packages/proto && node generate.js` after ANY `.proto` change — Turborepo caches the output
- Admin tests: `pnpm --filter @vizteck/admin test` (Vitest, jsdom, alias `@` → `src/`)
- svc-roadmap tests: `pnpm --filter @vizteck/svc-roadmap test` (Jest)
- Tailwind semantic tokens only: `bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo` — no hardcoded hex
- `darkMode: 'class'` — dark mode via `.dark` class on `<html>`
- `AdminGuard` on all write endpoints — `Authorization: Bearer <token>`
- No new DB tables — content lives in `Node.content: Json?`, title in `Node.title: String`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `packages/proto/roadmap.proto` | Add 2 messages + 2 RPCs |
| Modify | `packages/proto/generated/roadmap.ts` | Auto-generated — do NOT hand-edit; regenerate via `node generate.js` |
| Modify | `apps/svc-roadmap/src/roadmap/roadmap.service.ts` | Add `updateNodeContent`, `updateNodeTitle` methods |
| Modify | `apps/svc-roadmap/src/roadmap/roadmap.controller.ts` | Wire 2 new `@GrpcMethod` handlers |
| Modify | `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts` | Add tests for the 2 new methods |
| Modify | `apps/api-gateway/src/roadmap/roadmap.dto.ts` | Add `UpdateNodeContentInput`, `UpdateNodeTitleInput` DTOs |
| Modify | `apps/api-gateway/src/roadmap/roadmap.grpc-client.ts` | Add `updateNodeContent`, `updateNodeTitle` client methods |
| Modify | `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts` | Add `PATCH /api/nodes/:id/content` and `PATCH /api/nodes/:id/title` |
| Create | `apps/admin/src/features/lessons/services/lesson.service.ts` | `fetchLesson`, `updateLessonContent`, `updateLessonTitle` |
| Create | `apps/admin/src/features/lessons/services/lesson.service.test.ts` | Vitest unit tests |
| Create | `apps/admin/src/features/lessons/hooks/useLessonEditor.ts` | Fetch + save state hook |
| Create | `apps/admin/src/features/lessons/components/LessonTitleEditor.tsx` | Inline editable title (blur-to-save) |
| Move | `apps/admin/src/features/nodes/components/LessonEditor.tsx` → `apps/admin/src/features/lessons/components/LessonEditor.tsx` | BlockNote wrapper — path changes only |
| Modify | `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx` | Simplify: delegate all state to `useLessonEditor`, add `LessonTitleEditor` |
| Delete | `apps/admin/src/features/nodes/components/LessonEditor.tsx` | Replaced by the moved file above |

---

## Task 1: Proto — Add UpdateNodeContent + UpdateNodeTitle

**Files:**
- Modify: `packages/proto/roadmap.proto`
- Regenerate: `packages/proto/generated/roadmap.ts` (auto, via `node generate.js`)

**Interfaces:**
- Produces: `UpdateNodeContentRequest { id, content }`, `UpdateNodeTitleRequest { id, title }`, `NodeItem` return type (already exists) — consumed by Tasks 2 and 3

- [ ] **Step 1.1: Add messages and RPCs to roadmap.proto**

In `packages/proto/roadmap.proto`, add after the `UpsertGraphRequest` message (before the `service` block):

```proto
message UpdateNodeContentRequest {
  string id = 1;
  string content = 2;
}

message UpdateNodeTitleRequest {
  string id = 1;
  string title = 2;
}
```

Then inside `service RoadmapService { ... }`, add two lines after `UpsertGraph`:

```proto
  rpc UpdateNodeContent (UpdateNodeContentRequest) returns (NodeItem);
  rpc UpdateNodeTitle (UpdateNodeTitleRequest) returns (NodeItem);
```

Full service block after edit:
```proto
service RoadmapService {
  rpc GetRoadmaps (Empty) returns (RoadmapList);
  rpc GetRoadmap (SlugRequest) returns (RoadmapDetail);
  rpc GetNode (IdRequest) returns (NodeDetail);
  rpc CreateRoadmap (CreateRoadmapRequest) returns (RoadmapItem);
  rpc UpdateRoadmap (UpdateRoadmapRequest) returns (RoadmapItem);
  rpc DeleteRoadmap (IdRequest) returns (BoolResponse);
  rpc UpsertGraph (UpsertGraphRequest) returns (RoadmapDetail);
  rpc UpdateNodeContent (UpdateNodeContentRequest) returns (NodeItem);
  rpc UpdateNodeTitle (UpdateNodeTitleRequest) returns (NodeItem);
}
```

- [ ] **Step 1.2: Regenerate TypeScript types**

```bash
cd packages/proto && node generate.js
```

Expected: no errors, `packages/proto/generated/roadmap.ts` is updated with new interfaces and service method stubs.

- [ ] **Step 1.3: Verify generated output**

Open `packages/proto/generated/roadmap.ts` and confirm these interfaces now exist:
```typescript
export interface UpdateNodeContentRequest {
  id: string;
  content: string;
}
export interface UpdateNodeTitleRequest {
  id: string;
  title: string;
}
```

- [ ] **Step 1.4: Commit**

```bash
git add packages/proto/roadmap.proto packages/proto/generated/roadmap.ts
git commit -m "feat(proto): add UpdateNodeContent and UpdateNodeTitle RPCs"
```

---

## Task 2: svc-roadmap — Implement service methods + tests

**Files:**
- Modify: `apps/svc-roadmap/src/roadmap/roadmap.service.ts`
- Modify: `apps/svc-roadmap/src/roadmap/roadmap.controller.ts`
- Modify: `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts`

**Interfaces:**
- Consumes: `UpdateNodeContentRequest`, `UpdateNodeTitleRequest`, `NodeItem` from `@vizteck/proto` (Task 1)
- Produces: `updateNodeContent(req)`, `updateNodeTitle(req)` — consumed by Task 3

- [ ] **Step 2.1: Write failing tests in roadmap.service.spec.ts**

The existing mock at the top of `roadmap.service.spec.ts` mocks `db.node.findUnique`. Add `db.node.update` to the mock object:

In `roadmap.service.spec.ts`, update the `jest.mock('@vizteck/db', ...)` block so the `node` entry includes `update`:

```typescript
jest.mock('@vizteck/db', () => ({
  db: {
    roadmap: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    node: {
      findUnique: jest.fn(),
      update: jest.fn(),          // ← add this
    },
    edge: {},
    $transaction: jest.fn(),
  },
}));
```

Then add these test suites at the bottom of the file (after the existing `describe` blocks):

```typescript
describe('updateNodeContent', () => {
  it('updates content and returns NodeItem', async () => {
    const stored = {
      id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro',
      positionX: 0, positionY: 0, targetRoadmapId: null,
      content: [{ type: 'paragraph', content: [] }],
    };
    (db.node.update as jest.Mock).mockResolvedValue(stored);

    const result = await service.updateNodeContent({
      id: 'n1',
      content: JSON.stringify([{ type: 'paragraph', content: [] }]),
    });

    expect(db.node.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { content: [{ type: 'paragraph', content: [] }] },
    });
    expect(result.id).toBe('n1');
    expect(result.content).toBe(JSON.stringify([{ type: 'paragraph', content: [] }]));
  });

  it('throws RpcException NOT_FOUND when node missing', async () => {
    const { Prisma } = jest.requireActual('@vizteck/db') as typeof import('@vizteck/db');
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
    });
    (db.node.update as jest.Mock).mockRejectedValue(err);

    await expect(service.updateNodeContent({ id: 'missing', content: '[]' }))
      .rejects.toMatchObject({ error: { code: 5 } });
  });
});

describe('updateNodeTitle', () => {
  it('updates title and returns NodeItem', async () => {
    const stored = {
      id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'New Title',
      positionX: 0, positionY: 0, targetRoadmapId: null, content: null,
    };
    (db.node.update as jest.Mock).mockResolvedValue(stored);

    const result = await service.updateNodeTitle({ id: 'n1', title: 'New Title' });

    expect(db.node.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { title: 'New Title' },
    });
    expect(result.title).toBe('New Title');
  });

  it('throws RpcException NOT_FOUND when node missing', async () => {
    const { Prisma } = jest.requireActual('@vizteck/db') as typeof import('@vizteck/db');
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025', clientVersion: '5.0.0', meta: undefined, batchRequestIdx: undefined,
    });
    (db.node.update as jest.Mock).mockRejectedValue(err);

    await expect(service.updateNodeTitle({ id: 'missing', title: 'x' }))
      .rejects.toMatchObject({ error: { code: 5 } });
  });
});
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```bash
pnpm --filter @vizteck/svc-roadmap test
```

Expected: 4 new tests fail with "service.updateNodeContent is not a function" and "service.updateNodeTitle is not a function".

- [ ] **Step 2.3: Implement service methods in roadmap.service.ts**

Add the two imports to the existing import line at the top of `roadmap.service.ts`:

```typescript
import {
  Empty, RoadmapList, SlugRequest, RoadmapDetail, IdRequest,
  NodeDetail, CreateRoadmapRequest, RoadmapItem, UpdateRoadmapRequest,
  BoolResponse, UpsertGraphRequest, UpdateNodeContentRequest, UpdateNodeTitleRequest,
  NodeItem,
} from '@vizteck/proto';
```

Add these two methods inside the `RoadmapService` class, after `upsertGraph`:

```typescript
async updateNodeContent({ id, content }: UpdateNodeContentRequest): Promise<NodeItem> {
  try {
    const node = await db.node.update({
      where: { id },
      data: { content: content ? JSON.parse(content) : null },
    });
    return toNodeItem(node);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new RpcException({ code: 5, message: `Node '${id}' not found` });
    }
    throw e;
  }
}

async updateNodeTitle({ id, title }: UpdateNodeTitleRequest): Promise<NodeItem> {
  try {
    const node = await db.node.update({
      where: { id },
      data: { title },
    });
    return toNodeItem(node);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new RpcException({ code: 5, message: `Node '${id}' not found` });
    }
    throw e;
  }
}
```

- [ ] **Step 2.4: Wire handlers in roadmap.controller.ts**

Add to the import line at the top:
```typescript
import {
  Empty, SlugRequest, IdRequest, CreateRoadmapRequest, UpdateRoadmapRequest,
  UpsertGraphRequest, UpdateNodeContentRequest, UpdateNodeTitleRequest,
} from '@vizteck/proto';
```

Add two handler methods inside `RoadmapController`, after the `upsertGraph` handler:

```typescript
@GrpcMethod('RoadmapService', 'UpdateNodeContent')
updateNodeContent(data: UpdateNodeContentRequest) { return this.svc.updateNodeContent(data); }

@GrpcMethod('RoadmapService', 'UpdateNodeTitle')
updateNodeTitle(data: UpdateNodeTitleRequest) { return this.svc.updateNodeTitle(data); }
```

- [ ] **Step 2.5: Run tests to confirm they pass**

```bash
pnpm --filter @vizteck/svc-roadmap test
```

Expected: all tests pass including the 4 new ones.

- [ ] **Step 2.6: Commit**

```bash
git add apps/svc-roadmap/src/roadmap/roadmap.service.ts \
        apps/svc-roadmap/src/roadmap/roadmap.controller.ts \
        apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts
git commit -m "feat(svc-roadmap): add updateNodeContent and updateNodeTitle methods"
```

---

## Task 3: api-gateway — DTOs + gRPC client + PATCH endpoints

**Files:**
- Modify: `apps/api-gateway/src/roadmap/roadmap.dto.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.grpc-client.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`

**Interfaces:**
- Consumes: `updateNodeContent(id, content)`, `updateNodeTitle(id, title)` gRPC methods (Task 2)
- Produces: `PATCH /api/nodes/:id/content`, `PATCH /api/nodes/:id/title` REST endpoints — consumed by Task 4

- [ ] **Step 3.1: Add DTOs in roadmap.dto.ts**

Add these two `@InputType` classes at the end of `roadmap.dto.ts`:

```typescript
@InputType()
export class UpdateNodeContentInput {
  @Field()
  @ApiProperty({ example: '[{"type":"paragraph","content":[]}]', description: 'BlockNote JSON string' })
  content!: string;
}

@InputType()
export class UpdateNodeTitleInput {
  @Field()
  @ApiProperty({ example: 'HTML & CSS Basics' })
  title!: string;
}
```

- [ ] **Step 3.2: Add gRPC client methods in roadmap.grpc-client.ts**

Add `updateNodeContent` and `updateNodeTitle` to the `GrpcRoadmapService` interface:

```typescript
interface GrpcRoadmapService {
  getRoadmaps(data: object): Observable<any>;
  getRoadmap(data: { slug: string }): Observable<any>;
  getNode(data: { id: string }): Observable<any>;
  createRoadmap(data: object): Observable<any>;
  updateRoadmap(data: object): Observable<any>;
  deleteRoadmap(data: { id: string }): Observable<any>;
  upsertGraph(data: object): Observable<any>;
  updateNodeContent(data: { id: string; content: string }): Observable<any>;   // ← add
  updateNodeTitle(data: { id: string; title: string }): Observable<any>;       // ← add
}
```

Then add the two public methods to `RoadmapGrpcClient` class (after `upsertGraph`):

```typescript
updateNodeContent(id: string, content: string) {
  return firstValueFrom(this.svc.updateNodeContent({ id, content }));
}
updateNodeTitle(id: string, title: string) {
  return firstValueFrom(this.svc.updateNodeTitle({ id, title }));
}
```

- [ ] **Step 3.3: Add PATCH endpoints in roadmap.rest.controller.ts**

Add `Patch` to the NestJS import at the top:
```typescript
import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
```

Add the two DTOs to the import from `./roadmap.dto`:
```typescript
import {
  CreateRoadmapInput, UpdateRoadmapInput, NodeInput, EdgeInput,
  UpdateNodeContentInput, UpdateNodeTitleInput,
} from './roadmap.dto';
```

Add two methods inside `RoadmapRestController`, after `upsertGraph`:

```typescript
@UseGuards(AdminGuard)
@Patch('nodes/:id/content')
@ApiOperation({ summary: 'Update lesson content (targeted — no graph upsert)' })
@ApiBearerAuth()
@ApiParam({ name: 'id', type: String })
updateNodeContent(@Param('id') id: string, @Body() body: UpdateNodeContentInput) {
  return this.grpc.updateNodeContent(id, body.content);
}

@UseGuards(AdminGuard)
@Patch('nodes/:id/title')
@ApiOperation({ summary: 'Update node title' })
@ApiBearerAuth()
@ApiParam({ name: 'id', type: String })
updateNodeTitle(@Param('id') id: string, @Body() body: UpdateNodeTitleInput) {
  return this.grpc.updateNodeTitle(id, body.title);
}
```

- [ ] **Step 3.4: Build api-gateway to verify no TypeScript errors**

```bash
pnpm --filter @vizteck/api-gateway build
```

Expected: build succeeds with no type errors.

- [ ] **Step 3.5: Commit**

```bash
git add apps/api-gateway/src/roadmap/roadmap.dto.ts \
        apps/api-gateway/src/roadmap/roadmap.grpc-client.ts \
        apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
git commit -m "feat(api-gateway): add PATCH nodes/:id/content and nodes/:id/title endpoints"
```

---

## Task 4: Admin — Create features/lessons/ feature

**Files:**
- Create: `apps/admin/src/features/lessons/services/lesson.service.ts`
- Create: `apps/admin/src/features/lessons/services/lesson.service.test.ts`
- Create: `apps/admin/src/features/lessons/hooks/useLessonEditor.ts`
- Create: `apps/admin/src/features/lessons/components/LessonTitleEditor.tsx`
- Create: `apps/admin/src/features/lessons/components/LessonEditor.tsx` (moved from `features/nodes/`)

**Interfaces:**
- Consumes: `PATCH /api/nodes/:id/content`, `PATCH /api/nodes/:id/title`, `GET /api/nodes/:id` (Task 3)
- Produces: `useLessonEditor(nodeId)` hook, `<LessonTitleEditor>`, `<LessonEditor>` — consumed by Task 5

- [ ] **Step 4.1: Write failing tests for lesson.service.ts**

Create `apps/admin/src/features/lessons/services/lesson.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLesson, updateLessonContent, updateLessonTitle } from './lesson.service';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
import { apiFetch } from '@/lib/api';
const mockFetch = vi.mocked(apiFetch);

const mockNode = {
  id: 'n1', roadmapId: 'r1', type: 'LESSON', title: 'Intro', content: '[]',
};

describe('fetchLesson', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the node on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ node: mockNode }),
    } as Response);

    const result = await fetchLesson('n1');
    expect(result.id).toBe('n1');
    expect(mockFetch).toHaveBeenCalledWith('/api/nodes/n1');
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(fetchLesson('n1')).rejects.toThrow('Failed to fetch lesson');
  });

  it('throws when node is missing from response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    await expect(fetchLesson('n1')).rejects.toThrow('Lesson not found');
  });
});

describe('updateLessonContent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls PATCH /api/nodes/:id/content', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    await updateLessonContent('n1', '[]');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/nodes/n1/content',
      expect.objectContaining({ method: 'PATCH' }),
    );
    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as { body: string }).body,
    ) as { content: string };
    expect(body.content).toBe('[]');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 500, text: async () => 'Internal error',
    } as Response);
    await expect(updateLessonContent('n1', '[]')).rejects.toThrow('Save failed');
  });
});

describe('updateLessonTitle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls PATCH /api/nodes/:id/title', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    await updateLessonTitle('n1', 'New Title');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/nodes/n1/title',
      expect.objectContaining({ method: 'PATCH' }),
    );
    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as { body: string }).body,
    ) as { title: string };
    expect(body.title).toBe('New Title');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 500, text: async () => 'error',
    } as Response);
    await expect(updateLessonTitle('n1', 'x')).rejects.toThrow('Update title failed');
  });
});
```

- [ ] **Step 4.2: Run tests to confirm they fail**

```bash
pnpm --filter @vizteck/admin test
```

Expected: 7 new tests fail with "Cannot find module './lesson.service'".

- [ ] **Step 4.3: Create lesson.service.ts**

Create `apps/admin/src/features/lessons/services/lesson.service.ts`:

```typescript
import { apiFetch } from '@/lib/api';

export interface LessonNode {
  id: string;
  roadmapId: string;
  type: string;
  title: string;
  content?: string;
}

export async function fetchLesson(nodeId: string): Promise<LessonNode> {
  const res = await apiFetch(`/api/nodes/${nodeId}`);
  if (!res.ok) throw new Error(`Failed to fetch lesson: ${res.status}`);
  const data = (await res.json()) as { node?: LessonNode };
  if (!data.node) throw new Error('Lesson not found');
  return data.node;
}

export async function updateLessonContent(nodeId: string, content: string): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/content`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Save failed (${res.status}): ${text}`);
  }
}

export async function updateLessonTitle(nodeId: string, title: string): Promise<void> {
  const res = await apiFetch(`/api/nodes/${nodeId}/title`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update title failed (${res.status}): ${text}`);
  }
}
```

- [ ] **Step 4.4: Run tests to confirm they pass**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all 7 new tests pass.

- [ ] **Step 4.5: Create useLessonEditor.ts**

Create `apps/admin/src/features/lessons/hooks/useLessonEditor.ts`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  fetchLesson,
  updateLessonContent,
  updateLessonTitle,
  type LessonNode,
} from '../services/lesson.service';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseLessonEditorResult {
  loading: boolean;
  notFound: boolean;
  lesson: LessonNode | null;
  titleSaveStatus: SaveStatus;
  handleSaveContent: (contentJson: string) => Promise<void>;
  handleSaveTitle: (title: string) => Promise<void>;
}

export function useLessonEditor(nodeId: string): UseLessonEditorResult {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lesson, setLesson] = useState<LessonNode | null>(null);
  const [titleSaveStatus, setTitleSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    fetchLesson(nodeId)
      .then((l) => { if (!cancelled) setLesson(l); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [nodeId]);

  async function handleSaveContent(contentJson: string): Promise<void> {
    await updateLessonContent(nodeId, contentJson);
    setLesson((prev) => (prev ? { ...prev, content: contentJson } : prev));
  }

  async function handleSaveTitle(title: string): Promise<void> {
    if (titleSaveStatus === 'saving') return;
    setTitleSaveStatus('saving');
    try {
      await updateLessonTitle(nodeId, title);
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

- [ ] **Step 4.6: Create LessonTitleEditor.tsx**

Create `apps/admin/src/features/lessons/components/LessonTitleEditor.tsx`:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import type { SaveStatus } from '../hooks/useLessonEditor';

interface LessonTitleEditorProps {
  title: string;
  saveStatus: SaveStatus;
  onSave: (title: string) => Promise<void>;
}

export function LessonTitleEditor({ title, saveStatus, onSave }: LessonTitleEditorProps) {
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(title); }, [title]);

  async function handleBlur() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) return;
    await onSave(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') inputRef.current?.blur();
    if (e.key === 'Escape') {
      setDraft(title);
      inputRef.current?.blur();
    }
  }

  const statusLabel =
    saveStatus === 'saving' ? 'Saving…' :
    saveStatus === 'saved' ? 'Saved' :
    saveStatus === 'error' ? 'Error saving title' :
    null;

  return (
    <div className="mb-6">
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-2xl font-bold text-text-1 bg-transparent border-none outline-none focus:ring-0 placeholder:text-text-3"
        placeholder="Untitled"
      />
      {statusLabel && (
        <span
          className={`block text-xs mt-1 ${saveStatus === 'error' ? 'text-red-500' : 'text-text-3'}`}
        >
          {statusLabel}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 4.7: Move LessonEditor into features/lessons/**

Copy the content of `apps/admin/src/features/nodes/components/LessonEditor.tsx` into a new file `apps/admin/src/features/lessons/components/LessonEditor.tsx`. The file content is identical — only the path changes.

Full content of `apps/admin/src/features/lessons/components/LessonEditor.tsx`:

```tsx
'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useEffect, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { Button } from '@vizteck/ui';

function tryParseBlocks(json: string): unknown[] | undefined {
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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface LessonEditorProps {
  initialContentJson: string;
  onSave: (contentJson: string) => Promise<void>;
}

export function LessonEditor({ initialContentJson, onSave }: LessonEditorProps) {
  const blocks = tryParseBlocks(initialContentJson);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote(blocks ? { initialContent: blocks as any } : {});

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveTimerRef] = useState<{ id: ReturnType<typeof setTimeout> | null }>({ id: null });

  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.id !== null) clearTimeout(saveTimerRef.id);
    };
  }, [saveTimerRef]);

  async function handleSave() {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await onSave(JSON.stringify(editor.document));
      setSaveStatus('saved');
      if (saveTimerRef.id !== null) clearTimeout(saveTimerRef.id);
      saveTimerRef.id = setTimeout(() => {
        setSaveStatus('idle');
        saveTimerRef.id = null;
      }, 2000);
    } catch {
      setSaveStatus('error');
    }
  }

  const buttonLabel =
    saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save Lesson';
  const buttonDisabled = saveStatus === 'saving';

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={buttonDisabled}
          style={buttonDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
        >
          {buttonLabel}
        </Button>
      </div>

      {saveStatus === 'error' && (
        <div className="mb-2 px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm">
          Failed to save. Please try again.
        </div>
      )}

      <div
        className="bg-bg-1 border border-border rounded-md px-6 py-4"
        style={{ minHeight: 400 }}
      >
        <BlockNoteView editor={editor} editable={true} theme={theme} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4.8: Delete the old file**

```bash
git rm apps/admin/src/features/nodes/components/LessonEditor.tsx
```

If `features/nodes/components/` is now empty, remove the directory too:
```bash
rmdir apps/admin/src/features/nodes/components 2>/dev/null || true
```

- [ ] **Step 4.9: Run tests to confirm all pass**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all tests pass (no import from the deleted file exists yet — the page update is Task 5).

- [ ] **Step 4.10: Commit**

```bash
git add apps/admin/src/features/lessons/
git commit -m "feat(admin): add features/lessons with service, hook, and components"
```

---

## Task 5: Admin page — Refactor lesson editor page

**Files:**
- Modify: `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`

**Interfaces:**
- Consumes: `useLessonEditor(nodeId)` → `{ loading, notFound, lesson, titleSaveStatus, handleSaveContent, handleSaveTitle }` (Task 4)
- Consumes: `<LessonTitleEditor title saveStatus onSave />` (Task 4)
- Consumes: `<LessonEditor initialContentJson onSave />` (Task 4, moved path)

- [ ] **Step 5.1: Replace the page with the simplified version**

Replace the entire content of `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx` with:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useLessonEditor } from '@/features/lessons/hooks/useLessonEditor';
import { LessonTitleEditor } from '@/features/lessons/components/LessonTitleEditor';

const LessonEditor = dynamic(
  () => import('@/features/lessons/components/LessonEditor').then((m) => m.LessonEditor),
  { ssr: false, loading: () => <div className="text-sm text-text-2 py-4">Loading editor…</div> },
);

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  useAuthGuard();
  const { id, nodeId } = use(params);
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';

  const {
    loading,
    notFound,
    lesson,
    titleSaveStatus,
    handleSaveContent,
    handleSaveTitle,
  } = useLessonEditor(nodeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-2 text-sm">
        Loading lesson…
      </div>
    );
  }

  if (notFound || !lesson) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <p className="text-sm text-text-2">Node not found. It may have been deleted.</p>
        <Link href="/roadmaps" className="text-sm text-indigo hover:underline mt-2 inline-block">
          ← Back to Roadmaps
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <nav className="flex items-center gap-1 text-sm text-text-3 mb-4">
        <Link href="/roadmaps" className="hover:text-indigo transition-colors">
          ← Roadmaps
        </Link>
        <span>/</span>
        <Link
          href={`/roadmaps/${id}?slug=${slug}`}
          className="hover:text-indigo transition-colors"
        >
          Graph Editor
        </Link>
        <span>/</span>
        <span className="text-text-1">{lesson.title}</span>
      </nav>

      <LessonTitleEditor
        title={lesson.title}
        saveStatus={titleSaveStatus}
        onSave={handleSaveTitle}
      />

      <LessonEditor
        initialContentJson={lesson.content ?? ''}
        onSave={handleSaveContent}
      />
    </div>
  );
}
```

- [ ] **Step 5.2: Build admin to verify no TypeScript errors**

```bash
pnpm --filter @vizteck/admin build
```

Expected: build succeeds. If a stale `.next/` causes issues run `rm -rf apps/admin/.next` first (known Turbopack issue).

- [ ] **Step 5.3: Run all admin tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: all tests pass.

- [ ] **Step 5.4: Manual smoke test**

Start the full stack:
```bash
docker compose up -d postgres
pnpm dev
```

1. Navigate to `http://localhost:3002` (admin), log in
2. Open any roadmap → graph editor
3. Click a LESSON node → "Edit Lesson" link → verify lesson editor page opens
4. Edit the title inline (click on it, change text, press Enter or click away) → verify "Saved" appears briefly
5. Edit content in BlockNote → click "Save Lesson" → verify it saves without error
6. Reload the page → verify both title and content persisted
7. Navigate back to graph editor → verify the node title updated there too

- [ ] **Step 5.5: Commit**

```bash
git add apps/admin/src/app/roadmaps/
git commit -m "feat(admin): refactor lesson editor page to use useLessonEditor hook"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Targeted content save (no full graph upsert) — Task 1–3
- [x] Targeted title save — Task 1–3
- [x] `features/lessons/` feature boundary — Task 4
- [x] Inline title editor on lesson page — Task 4 (`LessonTitleEditor`)
- [x] Old `features/nodes/LessonEditor.tsx` deleted — Task 4.8
- [x] Page simplified via hook — Task 5
- [x] Tests at every layer (svc-roadmap + admin service) — Tasks 2, 4
- [x] No DB migration needed — `Node.content` and `Node.title` already exist

**Type consistency:**
- `useLessonEditor` returns `handleSaveContent: (contentJson: string) => Promise<void>` — matches `LessonEditor`'s `onSave` prop ✓
- `useLessonEditor` returns `handleSaveTitle: (title: string) => Promise<void>` — matches `LessonTitleEditor`'s `onSave` prop ✓
- `LessonTitleEditor` accepts `saveStatus: SaveStatus` from the same type exported by `useLessonEditor.ts` ✓
- `UpdateNodeContentRequest.content` is a string on the wire (JSON-serialized BlockNote), parsed to `Json` in Prisma — same pattern as existing `UpsertGraph` ✓
