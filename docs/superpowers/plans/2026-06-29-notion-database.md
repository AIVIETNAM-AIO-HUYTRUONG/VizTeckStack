# Notion Database (Table View) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm node type `DATABASE` để tạo simple table view trong roadmap — mỗi database có schema (columns/properties) và rows. Phase này: chỉ TEXT và SELECT property types. Chưa build Gallery/Calendar view.

**Architecture:** 2 Prisma models mới: `DatabaseProperty` (column definition) và `DatabaseRow` (row data JSON). Node type `DATABASE` là sibling của `LESSON` và `ROADMAP`. REST CRUD cho properties và rows. `DatabaseTable` React component render editable table trong admin.

**Tech Stack:** Prisma, NestJS REST, React (plain `<table>`), JSON column cho row data.

## Global Constraints

- Chỉ property types: `TEXT` và `SELECT` trong phase này (không build NUMBER, DATE, etc.).
- Row data lưu dưới dạng `Json` (key = propertyId, value = string).
- Table render dùng `<table>` HTML native, không cần thêm lib.
- Tailwind semantic tokens only.
- Conventional Commits.

---

## ⚠️ Scope Note

Database là feature phức tạp nhất. Plan này cover **Phase 1 (Table View chỉ)** — đủ để demo và get feedback. Các phases sau:
- Phase 2: Board view, Filter, Sort
- Phase 3: DATE, PERSON property types, Gallery view
- Phase 4: Relations between databases

---

## Task 1: Prisma Models

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/migrations/YYYYMMDDHHMMSS_add_database_models/`

**Interfaces:**
- Produces: `DatabaseProperty` và `DatabaseRow` models, `NODE_TYPE` enum thêm `DATABASE`

- [ ] **Step 1: Thêm `DATABASE` vào `NodeType` enum**

Mở `packages/db/prisma/schema.prisma`. Tìm `enum NodeType`. Thêm `DATABASE`:

```prisma
enum NodeType {
  LESSON
  ROADMAP
  DATABASE    // ← thêm
}
```

- [ ] **Step 2: Thêm `PropertyType` enum**

Thêm sau `NodeType`:

```prisma
enum PropertyType {
  TEXT
  SELECT
}
```

- [ ] **Step 3: Thêm `DatabaseProperty` và `DatabaseRow` models**

Thêm sau `NodeSnapshot`:

```prisma
model DatabaseProperty {
  id        String       @id @default(cuid())
  nodeId    String
  name      String
  type      PropertyType @default(TEXT)
  options   Json?        // [{label: string, color: string}] for SELECT type
  sortOrder Int          @default(0)
  createdAt DateTime     @default(now())

  node      Node         @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  @@index([nodeId])
}

model DatabaseRow {
  id        String   @id @default(cuid())
  nodeId    String
  data      Json     @default("{}") // { propertyId: value }
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  node      Node     @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  @@index([nodeId])
}
```

Thêm relations vào `Node` model:

```prisma
model Node {
  // ... existing fields ...
  databaseProperties DatabaseProperty[]
  databaseRows       DatabaseRow[]
}
```

- [ ] **Step 4: Tạo migration**

```bash
pnpm --filter @vizteck/db db:migrate
```

Khi prompt: tên = `add_database_models`. Expected: migration applied.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations/
git commit -m "feat: add DatabaseProperty and DatabaseRow models for notion database"
```

---

## Task 2: REST Endpoints

**Files:**
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`

**Interfaces:**
- `GET /api/nodes/:id/database` → `{ properties: Property[]; rows: Row[] }`
- `POST /api/nodes/:id/database/properties` body: `{ name: string; type: 'TEXT'|'SELECT'; options?: {label: string; color: string}[] }` → `Property`
- `DELETE /api/nodes/:id/database/properties/:propertyId` → `{ deleted: true }`
- `POST /api/nodes/:id/database/rows` → `Row`
- `PATCH /api/nodes/:id/database/rows/:rowId` body: `{ data: Record<string, string> }` → `Row`
- `DELETE /api/nodes/:id/database/rows/:rowId` → `{ deleted: true }`

- [ ] **Step 1: Thêm GET database endpoint**

Mở controller. Thêm:

```typescript
@Get(':id/database')
@ApiOperation({ summary: 'Get database properties and rows' })
async getDatabase(@Param('id') id: string) {
  const [properties, rows] = await Promise.all([
    this.db.databaseProperty.findMany({ where: { nodeId: id }, orderBy: { sortOrder: 'asc' } }),
    this.db.databaseRow.findMany({ where: { nodeId: id }, orderBy: { sortOrder: 'asc' } }),
  ]);
  return { properties, rows };
}
```

- [ ] **Step 2: Thêm POST property endpoint**

```typescript
@Post(':id/database/properties')
@UseGuards(AdminGuard)
@ApiOperation({ summary: 'Add a property (column) to database' })
async addProperty(
  @Param('id') id: string,
  @Body() body: { name: string; type: 'TEXT' | 'SELECT'; options?: { label: string; color: string }[] },
) {
  const count = await this.db.databaseProperty.count({ where: { nodeId: id } });
  return this.db.databaseProperty.create({
    data: { nodeId: id, name: body.name, type: body.type, options: body.options ?? null, sortOrder: count },
  });
}
```

- [ ] **Step 3: Thêm DELETE property endpoint**

```typescript
@Delete(':id/database/properties/:propertyId')
@UseGuards(AdminGuard)
async deleteProperty(@Param('propertyId') propertyId: string) {
  await this.db.databaseProperty.delete({ where: { id: propertyId } });
  return { deleted: true };
}
```

- [ ] **Step 4: Thêm POST, PATCH, DELETE row endpoints**

```typescript
@Post(':id/database/rows')
@UseGuards(AdminGuard)
async addRow(@Param('id') id: string) {
  const count = await this.db.databaseRow.count({ where: { nodeId: id } });
  return this.db.databaseRow.create({ data: { nodeId: id, data: {}, sortOrder: count } });
}

@Patch(':id/database/rows/:rowId')
@UseGuards(AdminGuard)
async updateRow(
  @Param('rowId') rowId: string,
  @Body() body: { data: Record<string, string> },
) {
  return this.db.databaseRow.update({ where: { id: rowId }, data: { data: body.data } });
}

@Delete(':id/database/rows/:rowId')
@UseGuards(AdminGuard)
async deleteRow(@Param('rowId') rowId: string) {
  await this.db.databaseRow.delete({ where: { id: rowId } });
  return { deleted: true };
}
```

- [ ] **Step 5: Build và test**

```bash
pnpm --filter @vizteck/api-gateway build
pnpm dev
# Create test node với type DATABASE trong DB, sau đó test endpoints
curl -X POST http://localhost:3000/api/nodes/<nodeId>/database/properties \
  -H "Content-Type: application/json" -H "Authorization: Bearer supersecret" \
  -d '{"name":"Name","type":"TEXT"}'
curl http://localhost:3000/api/nodes/<nodeId>/database
# Expected: {properties:[...], rows:[]}
```

- [ ] **Step 6: Commit**

```bash
git add apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
git commit -m "feat: add database CRUD REST endpoints"
```

---

## Task 3: DatabaseTable UI (Admin)

**Files:**
- Create: `apps/admin/src/features/lessons/components/DatabaseTable.tsx`
- Modify: `apps/admin/src/app/roadmaps/[id]/lessons/[nodeId]/page.tsx`

**Interfaces:**
- `DatabaseTableProps`: `{ nodeId: string }`
- Render: `<table>` với sticky header row (properties), editable inline cells (contentEditable), "+ Add property" button, "+ Add row" button.

- [ ] **Step 1: Tạo `DatabaseTable.tsx`**

Tạo `apps/admin/src/features/lessons/components/DatabaseTable.tsx`:

```tsx
'use client';
import { useCallback, useEffect, useState } from 'react';

interface Property { id: string; name: string; type: 'TEXT' | 'SELECT'; options: null | { label: string; color: string }[] }
interface Row { id: string; data: Record<string, string> }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
function getToken() { return localStorage.getItem('admin_token') ?? ''; }
function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...init?.headers },
  });
}

export function DatabaseTable({ nodeId }: { nodeId: string }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const res = await apiFetch(`/api/nodes/${nodeId}/database`);
    const data = await res.json() as { properties: Property[]; rows: Row[] };
    setProperties(data.properties);
    setRows(data.rows);
  }, [nodeId]);

  useEffect(() => { load(); }, [load]);

  async function addProperty() {
    const name = prompt('Column name?');
    if (!name) return;
    const res = await apiFetch(`/api/nodes/${nodeId}/database/properties`, {
      method: 'POST',
      body: JSON.stringify({ name, type: 'TEXT' }),
    });
    const prop = await res.json() as Property;
    setProperties(prev => [...prev, prop]);
  }

  async function addRow() {
    const res = await apiFetch(`/api/nodes/${nodeId}/database/rows`, { method: 'POST' });
    const row = await res.json() as Row;
    setRows(prev => [...prev, row]);
  }

  async function updateCell(rowId: string, propId: string, value: string) {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const data = { ...row.data, [propId]: value };
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, data } : r));
    await apiFetch(`/api/nodes/${nodeId}/database/rows/${rowId}`, {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    });
  }

  async function deleteProperty(propId: string) {
    if (!confirm('Delete this column?')) return;
    await apiFetch(`/api/nodes/${nodeId}/database/properties/${propId}`, { method: 'DELETE' });
    setProperties(prev => prev.filter(p => p.id !== propId));
  }

  async function deleteRow(rowId: string) {
    await apiFetch(`/api/nodes/${nodeId}/database/rows/${rowId}`, { method: 'DELETE' });
    setRows(prev => prev.filter(r => r.id !== rowId));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {properties.map(p => (
              <th key={p.id} className="text-left px-3 py-2 font-medium text-text-2 whitespace-nowrap">
                <span>{p.name}</span>
                <button
                  type="button"
                  onClick={() => deleteProperty(p.id)}
                  className="ml-2 text-text-3 hover:text-red-500 opacity-0 group-hover:opacity-100 text-xs"
                >✕</button>
              </th>
            ))}
            <th className="px-3 py-2">
              <button
                type="button"
                onClick={addProperty}
                className="text-text-3 hover:text-indigo text-xs"
              >
                + Add column
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-border group hover:bg-bg-1">
              {properties.map(p => (
                <td key={p.id} className="px-3 py-2">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateCell(row.id, p.id, e.currentTarget.textContent ?? '')}
                    className="outline-none min-w-[80px] text-text-1"
                  >
                    {row.data[p.id] ?? ''}
                  </div>
                </td>
              ))}
              <td className="px-3 py-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => deleteRow(row.id)}
                  className="text-text-3 hover:text-red-500 text-xs"
                >✕</button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={properties.length + 1} className="px-3 py-2">
              <button
                type="button"
                onClick={addRow}
                className="text-text-3 hover:text-indigo text-xs"
              >
                + New row
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Render `DatabaseTable` trong lesson page khi node type = DATABASE**

Mở lesson page. Thêm conditional:

```tsx
import { DatabaseTable } from '@/features/lessons/components/DatabaseTable';

// Trong JSX, sau LessonPageShell hoặc thay thế contentSlot khi type = DATABASE:
{node.type === 'DATABASE' && (
  <div className="max-w-[960px] mx-auto px-6 mt-8">
    <DatabaseTable nodeId={node.id} />
  </div>
)}
```

- [ ] **Step 3: Build và test**

```bash
pnpm --filter @vizteck/admin build
pnpm dev
```

Cần tạo Node với `type: DATABASE` trong DB trực tiếp (chưa có UI để tạo database node từ canvas). Sau đó navigate đến `/roadmaps/<id>/lessons/<nodeId>` → thấy table → "+ Add column" → "+ New row" → click vào cell → type.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/features/lessons/components/DatabaseTable.tsx \
        apps/admin/src/app/roadmaps/\[id\]/lessons/\[nodeId\]/page.tsx
git commit -m "feat: add DatabaseTable UI for notion database nodes"
```

---

## Self-Review

**Spec coverage:**
- ✅ `DatabaseProperty` + `DatabaseRow` Prisma models → Task 1
- ✅ REST CRUD → Task 2
- ✅ Table view React component → Task 3 (TEXT + SELECT types)
- ⏭ SELECT property UI (dropdown cell renderer) — skip (contentEditable text đủ để demo, upgrade to proper select cell later)
- ⏭ Filter/Sort — Phase 2
- ⏭ Board/Gallery/Calendar view — Phase 3

**Thứ tự:** Task 1 → Task 2 → Task 3. Sequential.

**contentEditable risk:** `onBlur` gọi updateCell với textContent. Nếu user blurs ra ngoài thì mất draft. Acceptable cho phase 1. Upgrade: controlled input hoặc save on Enter.

**DATABASE node creation:** Chưa có UI tạo DATABASE node type từ canvas NodeInventory. Cần add `DATABASE` vào NodePalette trong phase sau. Task 3 Step 3 workaround: tạo trực tiếp trong DB.
