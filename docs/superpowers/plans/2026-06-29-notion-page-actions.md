# Notion Page Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm 3 page actions vào admin lesson: **Duplicate page**, **Move page to another roadmap**, và **Draft/Published status toggle** — tương đương Notion's "..." page menu.

**Architecture:** Backend: 3 REST endpoints mới trong api-gateway (duplicate, move, status). Frontend: `LessonActions` dropdown component trong `apps/admin` mount trên lesson page header. Core service layer không cần thay đổi — REST calls trực tiếp từ admin component.

**Tech Stack:** NestJS REST (api-gateway), Prisma, React `useState`, Tailwind.

## Global Constraints

- Tailwind semantic tokens only — không hardcode hex.
- `packages/core` không import từ `apps/*`.
- AdminGuard bảo vệ tất cả endpoint mới.
- Sau Prisma schema change: `pnpm --filter @vizteck/db db:migrate`.
- Build verify: `pnpm --filter @vizteck/api-gateway build` sau backend changes.
- Conventional Commits: lowercase, no period.

---

## Codebase Context

- REST controller: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`
- Domain interface: `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`
- Prisma repository: `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`
- Use-cases pattern: `apps/api-gateway/src/application/use-cases/roadmap/` — xem `delete-roadmap.use-case.ts` làm reference
- Module: `apps/api-gateway/src/roadmap/roadmap.module.ts`
- Prisma schema: `packages/db/prisma/schema.prisma` — `Node` model hiện không có `lessonStatus` field
- Admin lesson page: `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`

---

## Task 1: Duplicate Page

**Files:**
- Modify: `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`
- Modify: `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`
- Create: `apps/api-gateway/src/application/use-cases/roadmap/duplicate-node.use-case.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.module.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`

**Interfaces:**
- Produces: `POST /api/nodes/:id/duplicate` → `{ id: string; title: string }`

- [ ] **Step 1: Thêm `duplicateNode` vào domain interface**

Mở `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`. Thêm vào `IRoadmapRepository`:

```typescript
duplicateNode(nodeId: string): Promise<{ id: string; title: string }>;
```

- [ ] **Step 2: Implement trong Prisma repository**

Mở `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`. Thêm:

```typescript
async duplicateNode(nodeId: string): Promise<{ id: string; title: string }> {
  const src = await db.node.findUniqueOrThrow({ where: { id: nodeId } });
  const copy = await db.node.create({
    data: {
      roadmapId: src.roadmapId,
      type: src.type,
      title: `${src.title} (copy)`,
      content: src.content,
      coverImage: src.coverImage,
      icon: src.icon,
      positionX: src.positionX !== null ? src.positionX + 20 : null,
      positionY: src.positionY !== null ? src.positionY + 20 : null,
      targetRoadmapId: src.targetRoadmapId,
    },
    select: { id: true, title: true },
  });
  return copy;
}
```

- [ ] **Step 3: Tạo use-case**

Tạo `apps/api-gateway/src/application/use-cases/roadmap/duplicate-node.use-case.ts`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class DuplicateNodeUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(nodeId: string) { return this.repo.duplicateNode(nodeId); }
}
```

- [ ] **Step 4: Register trong module**

Mở `apps/api-gateway/src/roadmap/roadmap.module.ts`. Import `DuplicateNodeUseCase` và thêm vào `providers` array.

- [ ] **Step 5: Thêm REST endpoint**

Mở `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`. Thêm import, constructor injection, và endpoint:

```typescript
import { DuplicateNodeUseCase } from '../application/use-cases/roadmap/duplicate-node.use-case';

// Constructor:
private readonly duplicateNodeUseCase: DuplicateNodeUseCase,

// Endpoint (sau updateNodeIcon):
@Post('nodes/:id/duplicate')
@UseGuards(AdminGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Duplicate a node (creates copy in same roadmap)' })
@ApiParam({ name: 'id', type: String })
duplicateNode(@Param('id') id: string) {
  return this.duplicateNodeUseCase.execute(id);
}
```

- [ ] **Step 6: Build**

```bash
pnpm --filter @vizteck/api-gateway build
```

Expected: exits 0.

- [ ] **Step 7: Test endpoint thủ công**

```bash
pnpm dev
# Trong terminal khác:
curl -X POST http://localhost:3000/api/nodes/NODE_ID/duplicate \
  -H "Authorization: Bearer supersecret"
```

Expected: `{"id":"...","title":"Lesson Title (copy)"}`.

- [ ] **Step 8: Commit**

```bash
git add apps/api-gateway/src/domain/repositories/roadmap.repository.ts \
        apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts \
        apps/api-gateway/src/application/use-cases/roadmap/duplicate-node.use-case.ts \
        apps/api-gateway/src/roadmap/roadmap.module.ts \
        apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
git commit -m "feat: add duplicate node REST endpoint"
```

---

## Task 2: Move Page to Another Roadmap

**Files:**
- Modify: `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`
- Modify: `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`
- Create: `apps/api-gateway/src/application/use-cases/roadmap/move-node.use-case.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.module.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`

**Interfaces:**
- Produces: `PATCH /api/nodes/:id/move` body `{ roadmapId: string }` → `{ id: string; roadmapId: string }`

- [ ] **Step 1: Thêm `moveNode` vào domain interface**

```typescript
moveNode(nodeId: string, targetRoadmapId: string): Promise<{ id: string; roadmapId: string }>;
```

- [ ] **Step 2: Implement**

```typescript
async moveNode(nodeId: string, targetRoadmapId: string): Promise<{ id: string; roadmapId: string }> {
  await db.roadmap.findUniqueOrThrow({ where: { id: targetRoadmapId } }); // guard
  const updated = await db.node.update({
    where: { id: nodeId },
    data: { roadmapId: targetRoadmapId, positionX: null, positionY: null },
    select: { id: true, roadmapId: true },
  });
  return updated;
}
```

- [ ] **Step 3: Use-case, register, endpoint**

Tạo `move-node.use-case.ts`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class MoveNodeUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(nodeId: string, targetRoadmapId: string) { return this.repo.moveNode(nodeId, targetRoadmapId); }
}
```

Register trong `roadmap.module.ts`. Thêm endpoint vào controller:

```typescript
import { MoveNodeUseCase } from '../application/use-cases/roadmap/move-node.use-case';

// Constructor:
private readonly moveNodeUseCase: MoveNodeUseCase,

// Endpoint:
@Patch('nodes/:id/move')
@UseGuards(AdminGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Move node to a different roadmap (clears canvas position)' })
@ApiParam({ name: 'id', type: String })
moveNode(@Param('id') id: string, @Body('roadmapId') roadmapId: string) {
  return this.moveNodeUseCase.execute(id, roadmapId);
}
```

- [ ] **Step 4: Build và test**

```bash
pnpm --filter @vizteck/api-gateway build
```

```bash
curl -X PATCH http://localhost:3000/api/nodes/NODE_ID/move \
  -H "Authorization: Bearer supersecret" \
  -H "Content-Type: application/json" \
  -d '{"roadmapId":"TARGET_ROADMAP_ID"}'
```

Expected: `{"id":"...","roadmapId":"TARGET_ROADMAP_ID"}`.

- [ ] **Step 5: Commit**

```bash
git add apps/api-gateway/src/domain/repositories/roadmap.repository.ts \
        apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts \
        apps/api-gateway/src/application/use-cases/roadmap/move-node.use-case.ts \
        apps/api-gateway/src/roadmap/roadmap.module.ts \
        apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
git commit -m "feat: add move node to different roadmap REST endpoint"
```

---

## Task 3: Lesson Status (Draft/Published)

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: migration `add_lesson_status`
- Modify: `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`
- Modify: `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`
- Create: `apps/api-gateway/src/application/use-cases/node/update-node-status.use-case.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.module.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`

**Interfaces:**
- Produces: `PATCH /api/nodes/:id/status` body `{ status: 'DRAFT' | 'PUBLISHED' }` → `{ id: string; lessonStatus: string }`

- [ ] **Step 1: Thêm enum và field vào Prisma schema**

Mở `packages/db/prisma/schema.prisma`. Thêm enum sau `RoadmapStatus`:

```prisma
enum LessonStatus {
  DRAFT
  PUBLISHED
}
```

Thêm field vào `Node` model:

```prisma
model Node {
  // ... existing fields
  lessonStatus  LessonStatus  @default(DRAFT)
  // ...
}
```

- [ ] **Step 2: Chạy migration**

```bash
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" \
  pnpm --filter @vizteck/db db:migrate
```

Nhập tên migration: `add_lesson_status`. Expected: migration file created, DB updated.

- [ ] **Step 3: Thêm `updateNodeStatus` vào domain interface**

```typescript
updateNodeStatus(nodeId: string, status: 'DRAFT' | 'PUBLISHED'): Promise<{ id: string; lessonStatus: string }>;
```

- [ ] **Step 4: Implement**

```typescript
async updateNodeStatus(nodeId: string, status: 'DRAFT' | 'PUBLISHED'): Promise<{ id: string; lessonStatus: string }> {
  const updated = await db.node.update({
    where: { id: nodeId },
    data: { lessonStatus: status as any },
    select: { id: true, lessonStatus: true },
  });
  return { id: updated.id, lessonStatus: updated.lessonStatus };
}
```

- [ ] **Step 5: Use-case**

Tạo `apps/api-gateway/src/application/use-cases/node/update-node-status.use-case.ts`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class UpdateNodeStatusUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(nodeId: string, status: 'DRAFT' | 'PUBLISHED') { return this.repo.updateNodeStatus(nodeId, status); }
}
```

- [ ] **Step 6: Register và endpoint**

Register `UpdateNodeStatusUseCase` trong `roadmap.module.ts`. Thêm endpoint:

```typescript
import { UpdateNodeStatusUseCase } from '../application/use-cases/node/update-node-status.use-case';

// Constructor:
private readonly updateNodeStatusUseCase: UpdateNodeStatusUseCase,

// Endpoint:
@Patch('nodes/:id/status')
@UseGuards(AdminGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Update lesson status (DRAFT/PUBLISHED)' })
@ApiParam({ name: 'id', type: String })
updateNodeStatus(@Param('id') id: string, @Body('status') status: 'DRAFT' | 'PUBLISHED') {
  return this.updateNodeStatusUseCase.execute(id, status);
}
```

- [ ] **Step 7: Build**

```bash
pnpm --filter @vizteck/api-gateway build
```

- [ ] **Step 8: Commit**

```bash
git add packages/db/prisma/ \
        apps/api-gateway/src/
git commit -m "feat: add per-lesson draft/published status endpoint"
```

---

## Task 4: Admin UI — LessonActions Dropdown

**Files:**
- Create: `apps/admin/src/features/lessons/components/LessonActions.tsx`
- Modify: `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`

**Interfaces:**
- Consumes: endpoints từ Tasks 1-3
- Produces: `<LessonActions nodeId roadmapId allRoadmaps initialStatus>` component

- [ ] **Step 1: Tạo `LessonActions.tsx`**

```tsx
// apps/admin/src/features/lessons/components/LessonActions.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Roadmap { id: string; title: string; }

interface LessonActionsProps {
  nodeId: string;
  roadmapId: string;
  allRoadmaps: Roadmap[];
  initialStatus: 'DRAFT' | 'PUBLISHED';
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const token = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : '');
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

export function LessonActions({ nodeId, roadmapId, allRoadmaps, initialStatus }: LessonActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [moveTarget, setMoveTarget] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/nodes/${nodeId}/duplicate`, { method: 'POST', headers: authHeaders() });
      const copy = await res.json() as { id: string };
      router.push(`/roadmaps/${roadmapId}/nodes/${copy.id}`);
    } finally { setLoading(false); setOpen(false); }
  }

  async function handleMove() {
    if (!moveTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/nodes/${nodeId}/move`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ roadmapId: moveTarget }),
      });
      const result = await res.json() as { roadmapId: string };
      router.push(`/roadmaps/${result.roadmapId}/nodes/${nodeId}`);
    } finally { setLoading(false); setOpen(false); }
  }

  async function handleToggleStatus() {
    const next = status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/nodes/${nodeId}/status`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: next }),
      });
      if (res.ok) setStatus(next);
    } finally { setLoading(false); }
  }

  const others = allRoadmaps.filter((r) => r.id !== roadmapId);
  const isPublished = status === 'PUBLISHED';

  return (
    <div className="flex items-center gap-2">
      {/* Status badge */}
      <button
        type="button"
        onClick={handleToggleStatus}
        disabled={loading}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
          isPublished
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-bg-2 text-text-3'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-text-3'}`} />
        {isPublished ? 'Published' : 'Draft'}
      </button>

      {/* Actions dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="px-2 py-1 rounded text-xs text-text-3 hover:text-text-1 hover:bg-bg-2 transition-colors"
        >
          ⋯
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-7 z-50 w-52 bg-bg-1 border border-border rounded-xl shadow-xl overflow-hidden">
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={loading}
                className="w-full text-left px-4 py-2.5 text-sm text-text-2 hover:bg-bg-2 hover:text-text-1 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span>⎘</span> Duplicate page
              </button>

              {others.length > 0 && (
                <div className="px-4 py-2.5 border-t border-border">
                  <p className="text-xs text-text-3 mb-1.5">Move to roadmap</p>
                  <select
                    value={moveTarget}
                    onChange={(e) => setMoveTarget(e.target.value)}
                    className="w-full text-xs bg-bg-0 border border-border rounded px-2 py-1 text-text-2 outline-none mb-2"
                  >
                    <option value="">Select roadmap…</option>
                    {others.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                  <button
                    type="button"
                    disabled={!moveTarget || loading}
                    onClick={handleMove}
                    className="w-full py-1 text-xs rounded bg-indigo text-white disabled:opacity-40 transition-opacity"
                  >
                    {loading ? 'Moving…' : 'Move here'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount trong admin lesson page**

Mở `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`. Thêm import và render:

```tsx
import { LessonActions } from '@/features/lessons/components/LessonActions';

// Trong return (cần fetch allRoadmaps — dùng hook hiện có):
// Tìm chỗ render lesson page header/toolbar, thêm:
<LessonActions
  nodeId={nodeId}
  roadmapId={params.id}
  allRoadmaps={allRoadmaps} // từ useAdminRoadmaps() hoặc fetch
  initialStatus={(node.lessonStatus ?? 'DRAFT') as 'DRAFT' | 'PUBLISHED'}
/>
```

**Lưu ý:** `allRoadmaps` cần được fetch. Nếu page đang dùng `useAdminLessonEditor`, thêm `useAdminRoadmaps()` call. Nếu là Server Component, fetch từ `GET /api/roadmaps`.

- [ ] **Step 3: Build và test thủ công**

```bash
pnpm --filter @vizteck/admin build
pnpm dev
```

Vào admin lesson → thấy "Draft" badge → click → đổi thành "Published" (xanh). Click "⋯" → "Duplicate page" → tạo copy và redirect. Move to roadmap → select roadmap → "Move here" → redirect đến roadmap mới.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/features/lessons/components/LessonActions.tsx \
        apps/admin/src/app/roadmaps/
git commit -m "feat: add page actions dropdown (duplicate, move, status) to admin lesson"
```

---

## Self-Review

**Spec coverage:**
- ✅ Duplicate page → Tasks 1 + 4
- ✅ Move page → Tasks 2 + 4
- ✅ Lesson status (Draft/Published) → Tasks 3 + 4

**Prisma migration:** Cần chạy `db:migrate` cho Task 3 trước khi deploy.

**Placeholder scan:** Task 4 Step 2 note về `allRoadmaps` — cần xác nhận cách fetch trong lesson page context. Check `useAdminRoadmaps` hook đã available chưa.

**Type consistency:** `{ id: string; lessonStatus: string }` từ `updateNodeStatus` → `initialStatus as 'DRAFT' | 'PUBLISHED'` trong `LessonActions` — cast an toàn vì DB enum chỉ có 2 giá trị.
