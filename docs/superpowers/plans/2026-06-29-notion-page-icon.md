# Notion Page Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Propagate `node.icon` từ Prisma qua toàn bộ stack để hiển thị trong sidebar tree (hiện đang hardcode `📄/📁/📂`), và thêm "Random icon" button vào `IconPicker`.

**Architecture:** Full-stack chain gồm 7 files: domain interface → Prisma repository → GraphQL DTO → `.graphql` query → codegen → `PageTreeNode` type → `PageTreeItem` UI. `IconPicker` admin chỉ cần thêm 1 function + button.

**Tech Stack:** NestJS GraphQL (TypeGraphQL), `@graphql-codegen/cli`, `@vizteck/graphql-client`, React.

## Global Constraints

- Sau GraphQL schema change: start api-gateway để generate `schema.gql` → chạy `pnpm --filter @vizteck/graphql-client codegen`.
- Build verify: `pnpm --filter @vizteck/core build` sau thay đổi packages/core.
- Tailwind semantic tokens only.
- Conventional Commits.

---

## Codebase Context

- `PageTreeItem.tsx` line 39: hardcode `📄`, line 60-62: hardcode `📂/📁` — KHÔNG dùng `node.icon`.
- `PageTreeNode` interface tại `packages/core/src/lesson/types.ts:19` — không có `icon` field.
- `RoadmapTreeNode` domain interface: `apps/api-gateway/src/domain/repositories/roadmap.repository.ts` ~line 71.
- `getRoadmapTree` repository: `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts` ~line 153 — fetch icon từ DB nhưng không map vào return object.
- `RoadmapTreeNodeDto` DTO: `apps/api-gateway/src/roadmap/roadmap.dto.ts`.
- GraphQL query: `packages/graphql-client/src/queries/nodes/nodes.graphql` — `GetRoadmapTree` không có `icon` field.
- `IconPicker.tsx`: `apps/admin/src/features/lessons/components/IconPicker.tsx`.

---

## Task 1: Propagate Icon qua Backend Stack

**Files:**
- Modify: `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`
- Modify: `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.dto.ts`

**Interfaces:**
- Produces: `RoadmapTreeNode.icon: string | null`, `RoadmapTreeNodeDto.icon?: string`

- [ ] **Step 1: Đọc `roadmap.repository.ts` để tìm `RoadmapTreeNode` interface**

```bash
# Tìm dòng chứa interface RoadmapTreeNode
```

Expected: interface có các fields `id, title, type, slug, targetRoadmapId, roadmapSlug, roadmapId, children`.

- [ ] **Step 2: Thêm `icon` vào `RoadmapTreeNode`**

Mở `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`. Tìm `interface RoadmapTreeNode`. Thêm field:

```typescript
export interface RoadmapTreeNode {
  id: string;
  title: string;
  type: string;
  slug: string | null;
  targetRoadmapId: string | null;
  roadmapSlug: string | null;
  roadmapId: string | null;
  icon: string | null;           // ← thêm
  children: RoadmapTreeNode[];
}
```

- [ ] **Step 3: Map `icon` trong Prisma repository**

Mở `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`. Tìm `getRoadmapTree`. Tìm tất cả chỗ return object dạng `{ id: n.id, title: n.title, type: ... }`. Thêm `icon: n.icon ?? null` vào mỗi object. Thường có 4-6 return statements.

Ví dụ pattern cần thêm:

```typescript
// Mỗi node object return, thêm:
icon: n.icon ?? null,

// Mỗi child/subNode object, thêm:
icon: sn.icon ?? null,
```

- [ ] **Step 4: Thêm `icon` vào `RoadmapTreeNodeDto`**

Mở `apps/api-gateway/src/roadmap/roadmap.dto.ts`. Tìm `class RoadmapTreeNodeDto`. Thêm field sau `title`:

```typescript
@Field({ nullable: true })
@ApiPropertyOptional({ example: '📚' })
icon?: string;
```

- [ ] **Step 5: Build api-gateway**

```bash
pnpm --filter @vizteck/api-gateway build
```

Expected: exits 0. TypeScript sẽ báo lỗi nếu có return statement nào thiếu `icon`.

- [ ] **Step 6: Commit**

```bash
git add apps/api-gateway/src/domain/repositories/roadmap.repository.ts \
        apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts \
        apps/api-gateway/src/roadmap/roadmap.dto.ts
git commit -m "feat: add icon field to RoadmapTreeNode domain and DTO"
```

---

## Task 2: GraphQL Query + Codegen + Frontend Types

**Files:**
- Modify: `packages/graphql-client/src/queries/nodes/nodes.graphql`
- Auto-generated: `packages/graphql-client/src/generated/graphql.ts`
- Modify: `packages/core/src/lesson/types.ts`
- Modify: `packages/core/src/lesson/ui/PageTreeItem.tsx`

**Interfaces:**
- Consumes: `RoadmapTreeNodeDto.icon` từ Task 1
- Produces: `PageTreeNode.icon?: string | null` — dùng trong `PageTreeItem`

- [ ] **Step 1: Thêm `icon` vào GraphQL query**

Mở `packages/graphql-client/src/queries/nodes/nodes.graphql`. Tìm query `GetRoadmapTree`. Thêm `icon` vào cả `nodes` và `children`:

```graphql
query GetRoadmapTree($slug: String!) {
  roadmapTree(slug: $slug) {
    rootSlug
    rootTitle
    nodes {
      id
      title
      type
      slug
      icon
      targetRoadmapId
      roadmapSlug
      roadmapId
      children {
        id
        title
        type
        slug
        icon
        targetRoadmapId
        roadmapSlug
        roadmapId
      }
    }
  }
}
```

- [ ] **Step 2: Start api-gateway để generate schema.gql**

```bash
pnpm --filter @vizteck/api-gateway dev
```

Đợi thấy `Application is running on: http://[::1]:3000` → Ctrl+C.

- [ ] **Step 3: Chạy codegen**

```bash
pnpm --filter @vizteck/graphql-client codegen
```

Expected: `packages/graphql-client/src/generated/graphql.ts` updated.

- [ ] **Step 4: Verify codegen output**

```bash
grep -n "icon" packages/graphql-client/src/generated/graphql.ts | head -10
```

Expected: `icon?: string | null` xuất hiện trong `RoadmapTreeNodeDto` type.

- [ ] **Step 5: Thêm `icon` vào `PageTreeNode` type**

Mở `packages/core/src/lesson/types.ts`. Tìm `interface PageTreeNode`. Thêm:

```typescript
export interface PageTreeNode {
  id: string;
  title: string;
  type: 'LESSON' | 'ROADMAP';
  slug?: string;
  targetRoadmapId?: string;
  roadmapSlug?: string;
  roadmapId?: string;
  icon?: string | null;        // ← thêm
  children?: PageTreeNode[];
}
```

- [ ] **Step 6: Update `PageTreeItem` để dùng `node.icon`**

Mở `packages/core/src/lesson/ui/PageTreeItem.tsx`. Tìm và thay 2 chỗ hardcode:

```tsx
// Dòng ~39 (LESSON):
<span className="shrink-0 text-xs" aria-hidden="true">
  {node.icon || '📄'}
</span>

// Dòng ~60-62 (ROADMAP):
<span className="shrink-0 text-xs" aria-hidden="true">
  {node.icon || (isExpanded ? '📂' : '📁')}
</span>
```

- [ ] **Step 7: Build core**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0.

- [ ] **Step 8: Test thủ công**

```bash
pnpm dev
```

Vào admin lesson với icon được set → icon xuất hiện trong sidebar tree thay vì `📄`.

- [ ] **Step 9: Commit**

```bash
git add packages/graphql-client/src/queries/nodes/nodes.graphql \
        packages/graphql-client/src/generated/graphql.ts \
        apps/api-gateway/src/schema.gql \
        packages/core/src/lesson/types.ts \
        packages/core/src/lesson/ui/PageTreeItem.tsx
git commit -m "feat: show node icon in page tree sidebar"
```

---

## Task 3: Random Icon trong IconPicker

**Files:**
- Modify: `apps/admin/src/features/lessons/components/IconPicker.tsx`

**Interfaces:**
- Không thay đổi `IconPickerProps` — chỉ thêm "Random" button bên trong.

- [ ] **Step 1: Đọc `IconPicker.tsx` hiện tại**

```bash
# Đọc file để biết structure và props hiện có
```

Xác định: `onIconChange(value: string | null)` callback, existing emoji grid/picker.

- [ ] **Step 2: Thêm random emoji array và button**

Mở `apps/admin/src/features/lessons/components/IconPicker.tsx`. Thêm trước function component:

```tsx
const RANDOM_POOL = [
  '📚','🎯','💡','🔬','🧩','🚀','🌟','📝','🎨','🔧',
  '🧪','📊','🌱','⚡','🔑','🎭','🏆','🔐','💎','🌊',
  '🎵','🧭','🔭','🌈','🦋','🎲','🛸','🔮','🌺','⚗️',
];

function pickRandom(): string {
  return RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)]!;
}
```

Trong JSX của `IconPicker`, thêm "Random" button (đặt trước hoặc sau emoji grid):

```tsx
<button
  type="button"
  onClick={() => onIconChange(pickRandom())}
  className="w-full py-1.5 text-xs text-text-3 hover:text-text-1 border border-border rounded-lg hover:bg-bg-2 transition-colors mb-2"
>
  🎲 Random
</button>
```

- [ ] **Step 3: Build và test**

```bash
pnpm --filter @vizteck/admin build
pnpm dev
```

Vào admin lesson → click icon → thấy "🎲 Random" button → click → icon thay đổi ngẫu nhiên. Click nhiều lần → icons khác nhau.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/features/lessons/components/IconPicker.tsx
git commit -m "feat: add random icon button to lesson icon picker"
```

---

## Self-Review

**Spec coverage:**
- ✅ Icon trong sidebar tree → Tasks 1 + 2 (full-stack chain)
- ✅ Random icon picker → Task 3

**Thứ tự bắt buộc:** Task 1 (backend) → Task 2 (codegen cần backend running) → Task 3 (độc lập).

**Placeholder scan:** Không có TBD. Task 2 Step 6 có đủ exact line references.

**Type consistency:** `PageTreeNode.icon?: string | null` → `node.icon || '📄'` trong `PageTreeItem` — `||` fallback xử lý cả `null` và `undefined`.
