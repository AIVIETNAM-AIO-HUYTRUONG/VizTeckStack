# Notion Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp sidebar navigation thành Notion-level: **Breadcrumb có link**, **Drag-to-reorder page tree**, **Bulk actions** (checkbox select + delete/move nhiều nodes cùng lúc).

**Architecture:** Breadcrumb: thêm `roadmapHref?` prop vào `BreadcrumbDisplay`, web truyền href. Reorder: Prisma `sortOrder` field, REST `PATCH /api/roadmaps/:id/nodes/order`, HTML5 native DnD trong `PageTreeItem`. Bulk: checkbox mode trong `NodeInventory`, `BulkActionBar` component admin-only.

**Tech Stack:** HTML5 DnD API (không thêm lib), React state, Prisma, NestJS REST.

## Global Constraints

- HTML5 native drag-and-drop, KHÔNG dùng react-dnd hoặc @dnd-kit.
- Tailwind semantic tokens only.
- `sortOrder: Int @default(0)` — integer tăng dần, 0-indexed.
- Conventional Commits.

---

## Codebase Context

- `BreadcrumbDisplay.tsx` tại `packages/core/src/lesson/ui/BreadcrumbDisplay.tsx` — `BreadcrumbItem[]` props, render anchor tags.
- `LessonShellNode` và `PageTreeNode` tại `packages/core/src/lesson/types.ts`.
- `roadmap.rest.controller.ts`: `GET /api/roadmaps/:id/tree` hiện có.
- `packages/db/prisma/schema.prisma` — `Node` model chưa có `sortOrder`.
- `NodeInventory.tsx` tại `apps/admin/src/features/graph-editor/components/NodeInventory.tsx` — list unplaced nodes.

---

## Task 1: Breadcrumb với Clickable Links

**Files:**
- Modify: `packages/core/src/lesson/ui/BreadcrumbDisplay.tsx`
- Modify: `packages/core/src/lesson/types.ts`
- Modify: `apps/web/src/app/roadmaps/[slug]/lessons/[nodeId]/page.tsx` (nếu tồn tại)

**Interfaces:**
- `BreadcrumbItem` thêm `href?: string`
- `BreadcrumbDisplayProps` thêm `getLinkHref?: (item: BreadcrumbItem) => string | undefined`

- [ ] **Step 1: Đọc `BreadcrumbDisplay.tsx` để biết interface hiện tại**

Xác định: `BreadcrumbItem` type, cách render, props hiện có.

- [ ] **Step 2: Thêm `href` vào `BreadcrumbItem` type**

Mở `packages/core/src/lesson/types.ts`. Tìm `BreadcrumbItem`. Thêm field optional:

```typescript
export interface BreadcrumbItem {
  id: string;
  title: string;
  type: 'LESSON' | 'ROADMAP';
  href?: string;   // ← thêm
}
```

- [ ] **Step 3: Update `BreadcrumbDisplay` để render link**

Mở `packages/core/src/lesson/ui/BreadcrumbDisplay.tsx`. Thay mỗi breadcrumb segment từ `<span>` thành:

```tsx
{item.href ? (
  <a href={item.href} className="hover:text-text-1 transition-colors">
    {item.title}
  </a>
) : (
  <span>{item.title}</span>
)}
```

Không cần Next.js `Link` — `packages/core` không import Next.js. Plain `<a>` là đủ.

- [ ] **Step 4: Build core**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0.

- [ ] **Step 5: Wiring trong `apps/web` (nếu có lesson page)**

Mở lesson page trong `apps/web`. Khi build breadcrumb items, thêm `href`:

```tsx
const breadcrumb: BreadcrumbItem[] = [
  { id: roadmap.id, title: roadmap.title, type: 'ROADMAP', href: `/roadmaps/${roadmap.slug}` },
  { id: node.id, title: node.title, type: 'LESSON' }, // current page — no href
];
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/lesson/types.ts \
        packages/core/src/lesson/ui/BreadcrumbDisplay.tsx
git commit -m "feat: make breadcrumb segments clickable with href"
```

---

## Task 2: Drag-to-Reorder trong Page Tree

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/migrations/YYYYMMDDHHMMSS_add_node_sort_order/`
- Modify: `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`
- Modify: `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`
- Modify: `packages/core/src/lesson/ui/PageTreeItem.tsx`
- Modify: `packages/core/src/lesson/ui/PageTree.tsx` (nếu tồn tại)

**Interfaces:**
- `PATCH /api/roadmaps/:id/nodes/order` body: `{ order: { id: string; sortOrder: number }[] }`
- Response: `{ updated: number }`
- `PageTreeItem` thêm props: `onDragStart?: (id: string) => void`, `onDrop?: (draggedId: string, targetId: string) => void`

- [ ] **Step 1: Thêm `sortOrder` vào Prisma schema**

Mở `packages/db/prisma/schema.prisma`. Tìm `model Node`. Thêm:

```prisma
model Node {
  // ... existing fields ...
  sortOrder  Int     @default(0)
  // ...
}
```

- [ ] **Step 2: Tạo migration**

```bash
pnpm --filter @vizteck/db db:migrate
```

Khi prompt: tên migration = `add_node_sort_order`. Expected: migration file created.

- [ ] **Step 3: Thêm `reorderNodes` vào repository interface**

Mở `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`. Thêm method:

```typescript
reorderNodes(roadmapId: string, order: { id: string; sortOrder: number }[]): Promise<number>;
```

- [ ] **Step 4: Implement trong Prisma repository**

Mở `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`. Thêm:

```typescript
async reorderNodes(roadmapId: string, order: { id: string; sortOrder: number }[]): Promise<number> {
  const updates = order.map(({ id, sortOrder }) =>
    this.db.node.updateMany({ where: { id, roadmapId }, data: { sortOrder } })
  );
  const results = await this.db.$transaction(updates);
  return results.reduce((sum, r) => sum + r.count, 0);
}
```

- [ ] **Step 5: Thêm REST endpoint**

Mở `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`. Thêm:

```typescript
@Patch(':id/nodes/order')
@UseGuards(AdminGuard)
@ApiOperation({ summary: 'Reorder nodes within a roadmap' })
async reorderNodes(
  @Param('id') id: string,
  @Body() body: { order: { id: string; sortOrder: number }[] },
) {
  const updated = await this.roadmapRepo.reorderNodes(id, body.order);
  return { updated };
}
```

- [ ] **Step 6: Build api-gateway**

```bash
pnpm --filter @vizteck/api-gateway build
```

Expected: exits 0.

- [ ] **Step 7: Commit backend**

```bash
git add packages/db/prisma/schema.prisma \
        packages/db/prisma/migrations/ \
        apps/api-gateway/src/domain/repositories/roadmap.repository.ts \
        apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts \
        apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
git commit -m "feat: add node sortOrder field and reorder endpoint"
```

- [ ] **Step 8: Thêm DnD vào `PageTreeItem`**

Mở `packages/core/src/lesson/ui/PageTreeItem.tsx`. Thêm HTML5 drag props:

```tsx
// Props mới (optional để không break web):
interface PageTreeItemProps {
  node: PageTreeNode;
  depth?: number;
  activeNodeId?: string;
  getLinkHref: (node: PageTreeNode) => string;
  onDragStart?: (id: string) => void;
  onDrop?: (draggedId: string, targetId: string) => void;
}

// Trong JSX, thêm vào wrapping div:
<div
  draggable={!!onDragStart}
  onDragStart={onDragStart ? (e) => { e.dataTransfer.setData('text/plain', node.id); onDragStart(node.id); } : undefined}
  onDragOver={onDrop ? (e) => e.preventDefault() : undefined}
  onDrop={onDrop ? (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== node.id) onDrop(draggedId, node.id);
  } : undefined}
  // ... existing className ...
>
```

- [ ] **Step 9: Wiring trong admin lesson sidebar**

Tìm component render `PageTreeItem` trong admin. Truyền callbacks:

```tsx
const [items, setItems] = useState(treeNodes);

function handleReorder(draggedId: string, targetId: string) {
  const di = items.findIndex(n => n.id === draggedId);
  const ti = items.findIndex(n => n.id === targetId);
  if (di < 0 || ti < 0) return;
  const next = [...items];
  const [moved] = next.splice(di, 1);
  next.splice(ti, 0, moved!);
  setItems(next);
  // Persist
  const order = next.map((n, i) => ({ id: n.id, sortOrder: i }));
  fetch(`/api/roadmaps/${roadmapId}/nodes/order`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
    body: JSON.stringify({ order }),
  });
}

<PageTreeItem node={n} onDragStart={(id) => {}} onDrop={handleReorder} />
```

- [ ] **Step 10: Build và test**

```bash
pnpm --filter @vizteck/core build
pnpm dev
```

Kéo thả nodes trong sidebar admin lesson → thứ tự thay đổi → F5 → thứ tự giữ nguyên.

- [ ] **Step 11: Commit frontend**

```bash
git add packages/core/src/lesson/ui/PageTreeItem.tsx
git commit -m "feat: add drag-to-reorder to page tree sidebar"
```

---

## Task 3: Bulk Actions cho NodeInventory

**Files:**
- Modify: `apps/admin/src/features/graph-editor/components/NodeInventory.tsx`
- Create: `apps/admin/src/features/graph-editor/components/BulkActionBar.tsx`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`

**Interfaces:**
- `DELETE /api/nodes/bulk` body: `{ ids: string[] }` → `{ deleted: number }`
- `PATCH /api/nodes/bulk/move` body: `{ ids: string[]; roadmapId: string }` → `{ moved: number }`
- `BulkActionBarProps`: `{ selectedIds: string[]; roadmaps: {id: string; title: string}[]; onDelete: () => void; onMove: (roadmapId: string) => void; onClear: () => void }`

- [ ] **Step 1: Thêm bulk delete endpoint**

Mở `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`. Thêm:

```typescript
@Delete('nodes/bulk')
@UseGuards(AdminGuard)
@ApiOperation({ summary: 'Bulk delete nodes' })
async bulkDeleteNodes(@Body() body: { ids: string[] }) {
  const result = await this.db.node.deleteMany({ where: { id: { in: body.ids } } });
  return { deleted: result.count };
}

@Patch('nodes/bulk/move')
@UseGuards(AdminGuard)
@ApiOperation({ summary: 'Bulk move nodes to another roadmap' })
async bulkMoveNodes(@Body() body: { ids: string[]; roadmapId: string }) {
  const result = await this.db.node.updateMany({
    where: { id: { in: body.ids } },
    data: { roadmapId: body.roadmapId, positionX: null, positionY: null },
  });
  return { moved: result.count };
}
```

Lưu ý: Controller cần inject `db: PrismaClient` nếu chưa có. Nếu pattern hiện tại dùng use-cases, tạo use-case tương ứng. Xem pattern existing của `duplicateNode` để follow.

- [ ] **Step 2: Build api-gateway**

```bash
pnpm --filter @vizteck/api-gateway build
```

- [ ] **Step 3: Tạo `BulkActionBar.tsx`**

Tạo file `apps/admin/src/features/graph-editor/components/BulkActionBar.tsx`:

```tsx
'use client';

interface BulkActionBarProps {
  selectedIds: string[];
  roadmaps: { id: string; title: string }[];
  onDelete: () => void;
  onMove: (roadmapId: string) => void;
  onClear: () => void;
}

export function BulkActionBar({ selectedIds, roadmaps, onDelete, onMove, onClear }: BulkActionBarProps) {
  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-bg-0 border border-border rounded-xl shadow-xl px-4 py-3">
      <span className="text-sm text-text-2 font-medium">{selectedIds.length} selected</span>
      <div className="w-px h-5 bg-border" />
      <button
        type="button"
        onClick={onDelete}
        className="text-sm text-red-500 hover:text-red-400 transition-colors"
      >
        Delete
      </button>
      <select
        defaultValue=""
        onChange={(e) => { if (e.target.value) onMove(e.target.value); }}
        className="text-sm bg-bg-1 border border-border rounded-lg px-2 py-1 text-text-2"
      >
        <option value="" disabled>Move to…</option>
        {roadmaps.map((r) => (
          <option key={r.id} value={r.id}>{r.title}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={onClear}
        className="text-sm text-text-3 hover:text-text-2 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Thêm checkbox mode vào `NodeInventory`**

Mở `apps/admin/src/features/graph-editor/components/NodeInventory.tsx`. Thêm:

```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

function toggleSelect(id: string) {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
}

// Trong mỗi node row, thêm checkbox:
<input
  type="checkbox"
  checked={selectedIds.has(node.id)}
  onChange={() => toggleSelect(node.id)}
  onClick={(e) => e.stopPropagation()} // prevent drag
  className="mr-2 accent-indigo"
/>

// Sau danh sách nodes:
<BulkActionBar
  selectedIds={[...selectedIds]}
  roadmaps={allRoadmaps}
  onDelete={async () => {
    await fetch('/api/nodes/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      body: JSON.stringify({ ids: [...selectedIds] }),
    });
    setSelectedIds(new Set());
    refetch();
  }}
  onMove={async (roadmapId) => {
    await fetch('/api/nodes/bulk/move', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      body: JSON.stringify({ ids: [...selectedIds], roadmapId }),
    });
    setSelectedIds(new Set());
    refetch();
  }}
  onClear={() => setSelectedIds(new Set())}
/>
```

- [ ] **Step 5: Build và test**

```bash
pnpm --filter @vizteck/admin build
pnpm dev
```

Vào graph editor → NodeInventory → tick checkbox trên vài nodes → BulkActionBar xuất hiện → Delete → nodes biến mất khỏi list.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/features/graph-editor/components/NodeInventory.tsx \
        apps/admin/src/features/graph-editor/components/BulkActionBar.tsx \
        apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
git commit -m "feat: add bulk delete and move to node inventory"
```

---

## Self-Review

**Spec coverage:**
- ✅ Breadcrumb với link → Task 1
- ✅ Drag-to-reorder page tree → Task 2
- ✅ Bulk actions (delete, move) → Task 3

**Thứ tự:** Task 1 độc lập. Task 2 cần Prisma migration trước DnD frontend. Task 3 cần backend endpoints trước UI.

**Placeholder scan:** Task 3 Step 1 — "Xem pattern existing của duplicateNode" là instruction, không phải TBD. Controller injection note là guidance, không phải missing code.

**HTML5 DnD race condition:** `onDragStart` store `draggedId` trong `dataTransfer`, `onDrop` read lại — không cần global state. Pattern đơn giản, không cần context.
