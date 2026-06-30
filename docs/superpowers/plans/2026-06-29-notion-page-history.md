# Notion Page History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm page history (version snapshots) cho lesson: tự động snapshot khi save, admin có thể xem danh sách lịch sử và restore về version cũ.

**Architecture:** Prisma `NodeSnapshot` model lưu full content JSON + timestamp. Auto-snapshot triggered bởi `PATCH /api/nodes/:id/content` endpoint (sau khi save thành công). REST: GET snapshots list, POST restore. `HistoryPanel` floating sidebar trong admin. Không soft-delete — restore = overwrite current content.

**Tech Stack:** Prisma, NestJS REST, React.

## Global Constraints

- Snapshot khi save content (không phải real-time). Max 50 snapshots per node (delete oldest khi vượt quá).
- Tailwind semantic tokens only.
- No new npm packages.
- Conventional Commits.

---

## Codebase Context

- `packages/db/prisma/schema.prisma` — thêm `NodeSnapshot` model.
- `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts` — endpoint `PATCH /api/nodes/:id/content` đã có (line ~80-90), cần thêm snapshot logic sau save.
- Admin lesson page: `apps/admin/src/app/roadmaps/[id]/lessons/[nodeId]/page.tsx`.
- `LessonEditor` debounce save 2s — snapshot sẽ append vào mỗi lần `PATCH /content` gọi thành công.

---

## Task 1: Prisma NodeSnapshot Model

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/migrations/YYYYMMDDHHMMSS_add_node_snapshot/`

**Interfaces:**
- Produces: `NodeSnapshot` Prisma model

- [ ] **Step 1: Thêm `NodeSnapshot` model vào schema**

Mở `packages/db/prisma/schema.prisma`. Thêm sau `Comment` model (hoặc cuối file):

```prisma
model NodeSnapshot {
  id          String   @id @default(cuid())
  nodeId      String
  contentJson Json
  savedAt     DateTime @default(now())

  node        Node     @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@index([nodeId, savedAt])
}
```

Thêm relation vào `Node` model:

```prisma
model Node {
  // ... existing fields ...
  snapshots   NodeSnapshot[]
}
```

- [ ] **Step 2: Tạo migration**

```bash
pnpm --filter @vizteck/db db:migrate
```

Khi prompt: tên migration = `add_node_snapshot`. Expected: migration applied.

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations/
git commit -m "feat: add NodeSnapshot model for page history"
```

---

## Task 2: Auto-Snapshot Logic và REST Endpoints

**Files:**
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`

**Interfaces:**
- Produces:
  - Auto-snapshot sau `PATCH /api/nodes/:id/content` (side effect)
  - `GET /api/nodes/:id/snapshots` → `{ id, savedAt }[]` (không trả contentJson trong list)
  - `POST /api/nodes/:id/snapshots/:snapshotId/restore` → `{ restored: true }`

- [ ] **Step 1: Đọc endpoint `PATCH /api/nodes/:id/content`**

Mở `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`. Tìm `@Patch(':id/content')`. Xác định: update logic, return value.

- [ ] **Step 2: Thêm auto-snapshot sau content update**

Tìm endpoint `PATCH ':id/content'`. Sau khi `db.node.update(...)` thành công, thêm:

```typescript
// Tạo snapshot sau khi update thành công
const MAX_SNAPSHOTS = 50;
await this.db.nodeSnapshot.create({ data: { nodeId: id, contentJson: body.content } });
// Prune: giữ max 50 snapshots
const count = await this.db.nodeSnapshot.count({ where: { nodeId: id } });
if (count > MAX_SNAPSHOTS) {
  const oldest = await this.db.nodeSnapshot.findMany({
    where: { nodeId: id },
    orderBy: { savedAt: 'asc' },
    take: count - MAX_SNAPSHOTS,
    select: { id: true },
  });
  await this.db.nodeSnapshot.deleteMany({ where: { id: { in: oldest.map(s => s.id) } } });
}
```

- [ ] **Step 3: Thêm GET snapshots endpoint**

```typescript
@Get(':id/snapshots')
@UseGuards(AdminGuard)
@ApiOperation({ summary: 'List page history snapshots (newest first)' })
async getSnapshots(@Param('id') id: string) {
  return this.db.nodeSnapshot.findMany({
    where: { nodeId: id },
    orderBy: { savedAt: 'desc' },
    select: { id: true, savedAt: true }, // không trả content trong list
    take: 50,
  });
}
```

- [ ] **Step 4: Thêm POST restore endpoint**

```typescript
@Post(':id/snapshots/:snapshotId/restore')
@UseGuards(AdminGuard)
@ApiOperation({ summary: 'Restore node content from a snapshot' })
async restoreSnapshot(
  @Param('id') id: string,
  @Param('snapshotId') snapshotId: string,
) {
  const snapshot = await this.db.nodeSnapshot.findUniqueOrThrow({ where: { id: snapshotId } });
  await this.db.node.update({ where: { id }, data: { content: snapshot.contentJson } });
  return { restored: true };
}
```

- [ ] **Step 5: Build api-gateway**

```bash
pnpm --filter @vizteck/api-gateway build
```

Expected: exits 0.

- [ ] **Step 6: Test thủ công**

```bash
pnpm dev
# Edit và save một lesson vài lần (debounce 2s mỗi lần)
curl -H "Authorization: Bearer supersecret" http://localhost:3000/api/nodes/<nodeId>/snapshots
# Expected: array với timestamps, newest first
```

- [ ] **Step 7: Commit**

```bash
git add apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
git commit -m "feat: add auto-snapshot on content save and history endpoints"
```

---

## Task 3: HistoryPanel UI (Admin only)

**Files:**
- Create: `apps/admin/src/features/lessons/components/HistoryPanel.tsx`
- Modify: `apps/admin/src/app/roadmaps/[id]/lessons/[nodeId]/page.tsx`

**Interfaces:**
- `HistoryPanelProps`: `{ nodeId: string; open: boolean; onClose: () => void; onRestore: () => void }`
- `onRestore()` — callback để trigger refetch lesson content sau khi restore

- [ ] **Step 1: Tạo `HistoryPanel.tsx`**

Tạo `apps/admin/src/features/lessons/components/HistoryPanel.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';

interface Snapshot {
  id: string;
  savedAt: string;
}

interface HistoryPanelProps {
  nodeId: string;
  open: boolean;
  onClose: () => void;
  onRestore: () => void;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken() { return localStorage.getItem('admin_token') ?? ''; }

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${getToken()}`, ...init?.headers },
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function HistoryPanel({ nodeId, open, onClose, onRestore }: HistoryPanelProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    apiFetch(`/api/nodes/${nodeId}/snapshots`).then(r => r.json()).then(setSnapshots);
  }, [open, nodeId]);

  async function restore(snapshotId: string) {
    setRestoring(snapshotId);
    await apiFetch(`/api/nodes/${nodeId}/snapshots/${snapshotId}/restore`, { method: 'POST' });
    setRestoring(null);
    onRestore();
    onClose();
  }

  if (!open) return null;

  return (
    <aside className="fixed right-0 top-0 h-full w-72 bg-bg-0 border-l border-border flex flex-col z-40 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text-1">Page History</h2>
        <button type="button" onClick={onClose} className="text-text-3 hover:text-text-1 text-lg">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {snapshots.length === 0 && (
          <p className="text-text-3 text-sm text-center mt-8">No history yet. Save the page to create a snapshot.</p>
        )}
        {snapshots.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-bg-1 transition-colors">
            <div>
              <p className="text-xs text-text-1">{formatDate(s.savedAt)}</p>
              {i === 0 && <span className="text-[10px] text-indigo">Current version</span>}
            </div>
            {i > 0 && (
              <button
                type="button"
                disabled={restoring === s.id}
                onClick={() => restore(s.id)}
                className="text-xs text-indigo hover:underline disabled:opacity-50"
              >
                {restoring === s.id ? 'Restoring…' : 'Restore'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] text-text-3">Snapshots are created automatically when content is saved. Up to 50 versions are kept.</p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Thêm HistoryPanel trigger vào lesson page**

Mở `apps/admin/src/app/roadmaps/[id]/lessons/[nodeId]/page.tsx`. Thêm:

```tsx
import { HistoryPanel } from '@/features/lessons/components/HistoryPanel';

// State:
const [showHistory, setShowHistory] = useState(false);

// Trigger button (thêm vào toolbar):
<button
  type="button"
  onClick={() => setShowHistory(true)}
  className="text-sm text-text-3 hover:text-text-1 flex items-center gap-1.5 transition-colors"
  title="Page History"
>
  🕐 History
</button>

// Sidebar:
<HistoryPanel
  nodeId={nodeId}
  open={showHistory}
  onClose={() => setShowHistory(false)}
  onRestore={() => {
    // Refetch lesson content (trigger reload hoặc invalidate query)
    router.refresh();
  }}
/>
```

- [ ] **Step 3: Build và test**

```bash
pnpm --filter @vizteck/admin build
pnpm dev
```

Vào admin lesson → edit và wait 2s (auto-save) → click "🕐 History" → danh sách snapshots → click "Restore" trên version cũ → content reload về version đó.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/features/lessons/components/HistoryPanel.tsx \
        apps/admin/src/app/roadmaps/\[id\]/lessons/\[nodeId\]/page.tsx
git commit -m "feat: add page history panel to admin lesson editor"
```

---

## Self-Review

**Spec coverage:**
- ✅ `NodeSnapshot` model → Task 1
- ✅ Auto-snapshot on save → Task 2 Step 2
- ✅ List snapshots → Task 2 Step 3
- ✅ Restore → Task 2 Step 4
- ✅ HistoryPanel UI → Task 3
- ⏭ Diff view (so sánh versions) — skip, cần third-party diff lib
- ⏭ Named snapshots — skip (cuid timestamp đủ cho phase này)

**Thứ tự bắt buộc:** Task 1 (schema) → Task 2 (endpoints) → Task 3 (UI). Sequential.

**Prune logic:** Max 50 snapshots per node. Logic trong Task 2 Step 2 — sau create, count, delete oldest nếu vượt. Count + deleteMany = 2 extra queries mỗi save, chấp nhận được (save debounce 2s nên không hotpath).

**Placeholder scan:** Task 3 Step 2 `router.refresh()` — cần import `useRouter` từ `next/navigation`. Là standard Next.js pattern, không phải TBD.
