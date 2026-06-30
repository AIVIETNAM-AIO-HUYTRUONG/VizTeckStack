# Folder Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize folder structure across `packages/core` và `apps/admin` theo pattern feature-first với `components/`, `hooks/`, `utils/` và sub_feature lồng nhau. `lesson/` có 3 sub_feature: `content-editor/`, `page-tree/`, `search/`. `roadmap/` có sub_feature `graph/`.

**Architecture:** Mỗi feature có `components/` (UI thuần), `hooks/`, `utils/` ở root. Sub_feature lồng trong feature, cũng có đầy đủ `components/`, `hooks/`, `utils/`. Public API của `packages/core/src/index.ts` giữ nguyên symbol — chỉ đổi path nội bộ → `apps/web` không cần sửa.

**Tech Stack:** TypeScript, Next.js 15, React, Vitest, pnpm monorepo, git mv

## Global Constraints

- Không đổi exported symbol nào — chỉ đổi vị trí file và import path
- `packages/core/src/index.ts` export đúng tên cũ, chỉ path thay đổi
- Chạy test sau mỗi task để phát hiện regression sớm
- Dùng `git mv` để giữ git history
- Commit format: `refactor: <mô tả>` (chữ thường, không dấu chấm cuối)
- Không thay đổi logic — chỉ move file và fix import

---

## File Map: Current → Target

### packages/core/src

```
CURRENT                                     TARGET
── roadmap/ ─────────────────────────────────────────────────────────
roadmap/constants.ts                     → roadmap/utils/constants.ts
roadmap/useRoadmaps.ts                   → roadmap/hooks/useRoadmaps.ts
roadmap/roadmap.service.ts               → roadmap/roadmap.service.ts  (fix 1 import)
roadmap/types.ts                         → roadmap/types.ts            (unchanged)

── graph/ → roadmap/graph/ (sub_feature) ────────────────────────────
graph/types.ts                           → roadmap/graph/types.ts
graph/graph.service.ts                   → roadmap/graph/graph.service.ts
graph/ui/RoadmapGraph.tsx                → roadmap/graph/components/RoadmapGraph.tsx
graph/ui/RoadmapNode.tsx                 → roadmap/graph/components/RoadmapNode.tsx
graph/useGraphDraft.ts                   → roadmap/graph/hooks/useGraphDraft.ts
graph/useGraphEditor.ts                  → roadmap/graph/hooks/useGraphEditor.ts

── lesson/ root (layout only) ───────────────────────────────────────
lesson/ui/LessonPageShell.tsx            → lesson/components/LessonPageShell.tsx  (fix 1 import)
lesson/ui/LessonPageShell.spec.tsx       → lesson/components/LessonPageShell.spec.tsx
lesson/ui/LessonPageLayout.tsx           → lesson/components/LessonPageLayout.tsx
lesson/ui/LessonPageLayout.spec.tsx      → lesson/components/LessonPageLayout.spec.tsx
lesson/ui/BreadcrumbDisplay.tsx          → lesson/components/BreadcrumbDisplay.tsx
lesson/ui/BreadcrumbDisplay.spec.tsx     → lesson/components/BreadcrumbDisplay.spec.tsx
lesson/ui/CoverDisplay.tsx               → lesson/components/CoverDisplay.tsx
lesson/ui/CoverDisplay.spec.tsx          → lesson/components/CoverDisplay.spec.tsx
lesson/ui/utils.ts                       → lesson/utils/utils.ts
lesson/useLessonPageShell.ts             → lesson/hooks/useLessonPageShell.ts
lesson/lesson.service.ts                 → lesson/lesson.service.ts    (unchanged)
lesson/types.ts                          → lesson/types.ts             (unchanged)

── lesson/content-editor/ (sub_feature 1) ───────────────────────────
lesson/ui/LessonEditor.tsx               → lesson/content-editor/components/LessonEditor.tsx  (fix 1 import)
lesson/ui/LessonViewer.tsx               → lesson/content-editor/components/LessonViewer.tsx  (fix 1 import)
lesson/useLessonEditor.ts                → lesson/content-editor/hooks/useLessonEditor.ts     (fix 3 imports)

── lesson/page-tree/ (sub_feature 2) ────────────────────────────────
lesson/ui/PageTreeSidebar.tsx            → lesson/page-tree/components/PageTreeSidebar.tsx    (fix 1 import)
lesson/ui/PageTreeSidebar.spec.tsx       → lesson/page-tree/components/PageTreeSidebar.spec.tsx (fix 1 import)
lesson/ui/PageTreeItem.tsx               → lesson/page-tree/components/PageTreeItem.tsx       (fix 1 import)
lesson/ui/PageTreeItem.spec.tsx          → lesson/page-tree/components/PageTreeItem.spec.tsx  (fix 1 import)
lesson/usePageTree.ts                    → lesson/page-tree/hooks/usePageTree.ts              (fix 3 imports)

── lesson/search/ (sub_feature 3) ───────────────────────────────────
lesson/ui/SearchModal.tsx                → lesson/search/components/SearchModal.tsx           (fix 1 import)
lesson/ui/SearchModal.spec.tsx           → lesson/search/components/SearchModal.spec.tsx
lesson/ui/SearchPreview.tsx              → lesson/search/components/SearchPreview.tsx
lesson/ui/SearchResultItem.tsx           → lesson/search/components/SearchResultItem.tsx
lesson/ui/useSearch.ts                   → lesson/search/hooks/useSearch.ts
lesson/ui/useSearchModal.ts              → lesson/search/hooks/useSearchModal.ts
lesson/ui/useSearchModal.spec.ts         → lesson/search/hooks/useSearchModal.spec.ts
```

### apps/admin/src

```
CURRENT                                     TARGET
features/graph-editor/                   → features/roadmaps/graph-editor/  (sub_feature)
features/search/SearchModalWrapper.tsx   → features/lessons/search/SearchModalWrapper.tsx
features/lessons/hooks/useLessonEditor   → features/lessons/content-editor/hooks/useLessonEditor
features/lessons/hooks/usePageTree       → features/lessons/page-tree/hooks/usePageTree
features/lessons/hooks/usePageTree.spec  → features/lessons/page-tree/hooks/usePageTree.spec
lib/useAuthGuard.ts                      → hooks/useAuthGuard.ts
lib/useRouteGuard.ts                     → hooks/useRouteGuard.ts
```

---

## Task 1: roadmap — thêm hooks/ và utils/

**Files:**
- Move: `packages/core/src/roadmap/constants.ts` → `packages/core/src/roadmap/utils/constants.ts`
- Move: `packages/core/src/roadmap/useRoadmaps.ts` → `packages/core/src/roadmap/hooks/useRoadmaps.ts`
- Modify: `packages/core/src/roadmap/roadmap.service.ts` (1 import)
- Modify: `packages/core/src/roadmap/hooks/useRoadmaps.ts` (2 imports sau khi move)

- [ ] **Step 1: Tạo thư mục và move files**

```bash
mkdir -p packages/core/src/roadmap/utils
mkdir -p packages/core/src/roadmap/hooks
git mv packages/core/src/roadmap/constants.ts packages/core/src/roadmap/utils/constants.ts
git mv packages/core/src/roadmap/useRoadmaps.ts packages/core/src/roadmap/hooks/useRoadmaps.ts
```

- [ ] **Step 2: Fix import trong roadmap.service.ts**

File: `packages/core/src/roadmap/roadmap.service.ts`

```ts
// Before
import { STATUS_CYCLE } from './constants';
// After
import { STATUS_CYCLE } from './utils/constants';
```

- [ ] **Step 3: Fix imports trong hooks/useRoadmaps.ts**

File: `packages/core/src/roadmap/hooks/useRoadmaps.ts`

```ts
// Before
import { STATUS_CYCLE } from './constants';
import type { ApolloLike, Roadmap, CreateRoadmapInput, UpdateRoadmapInput, ModalState } from './types';
// After
import { STATUS_CYCLE } from '../utils/constants';
import type { ApolloLike, Roadmap, CreateRoadmapInput, UpdateRoadmapInput, ModalState } from '../types';
```

- [ ] **Step 4: Update index.ts — roadmap paths**

File: `packages/core/src/index.ts`

```ts
// Before
export * from './roadmap/constants';
export { useRoadmaps } from './roadmap/useRoadmaps';
// After
export * from './roadmap/utils/constants';
export { useRoadmaps } from './roadmap/hooks/useRoadmaps';
```

- [ ] **Step 5: Chạy tests**

```bash
pnpm --filter @vizteck/core test
```

Expected: tất cả pass

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/roadmap/ packages/core/src/index.ts
git commit -m "refactor: move roadmap hooks and utils to subfolders in packages/core"
```

---

## Task 2: graph/ → roadmap/graph/ (sub_feature)

**Files:**
- Move: `packages/core/src/graph/` → `packages/core/src/roadmap/graph/`
- Rename: `roadmap/graph/ui/` → `roadmap/graph/components/`
- Move: hooks lên `roadmap/graph/hooks/`
- Modify: 3 files với import path fixes

- [ ] **Step 1: Move toàn bộ graph/ vào roadmap/**

```bash
git mv packages/core/src/graph packages/core/src/roadmap/graph
```

- [ ] **Step 2: Rename ui/ → components/ và tạo hooks/**

```bash
git mv packages/core/src/roadmap/graph/ui packages/core/src/roadmap/graph/components
mkdir -p packages/core/src/roadmap/graph/hooks
mkdir -p packages/core/src/roadmap/graph/utils
git mv packages/core/src/roadmap/graph/useGraphDraft.ts packages/core/src/roadmap/graph/hooks/useGraphDraft.ts
git mv packages/core/src/roadmap/graph/useGraphEditor.ts packages/core/src/roadmap/graph/hooks/useGraphEditor.ts
```

- [ ] **Step 3: Fix imports trong graph.service.ts**

File: `packages/core/src/roadmap/graph/graph.service.ts`

```ts
// Before
import type { ApolloLike } from '../roadmap/types';
// After
import type { ApolloLike } from '../types';
```

- [ ] **Step 4: Fix imports trong hooks/useGraphDraft.ts**

File: `packages/core/src/roadmap/graph/hooks/useGraphDraft.ts`

```ts
// Before
import type { EditorNode, EditorEdge } from './types';
// After
import type { EditorNode, EditorEdge } from '../types';
```

- [ ] **Step 5: Fix imports trong hooks/useGraphEditor.ts**

File: `packages/core/src/roadmap/graph/hooks/useGraphEditor.ts`

```ts
// Before
import type { ApolloLike } from '../roadmap/types';
import { loadGraph, saveGraph, makeSnapshot } from './graph.service';
import type { EditorNode, EditorEdge, RoadmapEntry } from './types';
import type { UpdateRoadmapInput } from '../roadmap/types';
// After
import type { ApolloLike } from '../../types';
import { loadGraph, saveGraph, makeSnapshot } from '../graph.service';
import type { EditorNode, EditorEdge, RoadmapEntry } from '../types';
import type { UpdateRoadmapInput } from '../../types';
```

> `ApolloLike` và `UpdateRoadmapInput` cùng import từ `'../roadmap/types'` — có thể là 1 dòng hoặc 2. Fix tất cả occurrence thành `'../../types'`.

- [ ] **Step 6: Update index.ts — graph paths**

File: `packages/core/src/index.ts`

```ts
// Before
export * from './graph/types';
export * from './graph/graph.service';
export { useGraphEditor } from './graph/useGraphEditor';
export { useGraphDraft } from './graph/useGraphDraft';
export { RoadmapGraph } from './graph/ui/RoadmapGraph';
export type { RoadmapGraphProps } from './graph/ui/RoadmapGraph';
export { RoadmapNode } from './graph/ui/RoadmapNode';
// After
export * from './roadmap/graph/types';
export * from './roadmap/graph/graph.service';
export { useGraphEditor } from './roadmap/graph/hooks/useGraphEditor';
export { useGraphDraft } from './roadmap/graph/hooks/useGraphDraft';
export { RoadmapGraph } from './roadmap/graph/components/RoadmapGraph';
export type { RoadmapGraphProps } from './roadmap/graph/components/RoadmapGraph';
export { RoadmapNode } from './roadmap/graph/components/RoadmapNode';
```

- [ ] **Step 7: Chạy tests**

```bash
pnpm --filter @vizteck/core test
```

Expected: tất cả pass

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/roadmap/graph packages/core/src/index.ts
git commit -m "refactor: move graph into roadmap/graph sub-feature in packages/core"
```

---

## Task 3: lesson — layout root + 3 sub_features

**Files:**
- Move layout UI → `lesson/components/`
- Move `utils.ts` → `lesson/utils/utils.ts`
- Move `useLessonPageShell` → `lesson/hooks/`
- Tạo `lesson/content-editor/` (LessonEditor, LessonViewer, useLessonEditor)
- Tạo `lesson/page-tree/` (PageTreeSidebar, PageTreeItem, usePageTree)
- Tạo `lesson/search/` (SearchModal, SearchPreview, SearchResultItem, useSearch, useSearchModal)

- [ ] **Step 1: Tạo toàn bộ thư mục**

```bash
mkdir -p packages/core/src/lesson/components
mkdir -p packages/core/src/lesson/hooks
mkdir -p packages/core/src/lesson/utils
mkdir -p packages/core/src/lesson/content-editor/components
mkdir -p packages/core/src/lesson/content-editor/hooks
mkdir -p packages/core/src/lesson/content-editor/utils
mkdir -p packages/core/src/lesson/page-tree/components
mkdir -p packages/core/src/lesson/page-tree/hooks
mkdir -p packages/core/src/lesson/page-tree/utils
mkdir -p packages/core/src/lesson/search/components
mkdir -p packages/core/src/lesson/search/hooks
mkdir -p packages/core/src/lesson/search/utils
```

- [ ] **Step 2: Move layout files → lesson/components/**

```bash
git mv packages/core/src/lesson/ui/LessonPageShell.tsx packages/core/src/lesson/components/LessonPageShell.tsx
git mv packages/core/src/lesson/ui/LessonPageShell.spec.tsx packages/core/src/lesson/components/LessonPageShell.spec.tsx
git mv packages/core/src/lesson/ui/LessonPageLayout.tsx packages/core/src/lesson/components/LessonPageLayout.tsx
git mv packages/core/src/lesson/ui/LessonPageLayout.spec.tsx packages/core/src/lesson/components/LessonPageLayout.spec.tsx
git mv packages/core/src/lesson/ui/BreadcrumbDisplay.tsx packages/core/src/lesson/components/BreadcrumbDisplay.tsx
git mv packages/core/src/lesson/ui/BreadcrumbDisplay.spec.tsx packages/core/src/lesson/components/BreadcrumbDisplay.spec.tsx
git mv packages/core/src/lesson/ui/CoverDisplay.tsx packages/core/src/lesson/components/CoverDisplay.tsx
git mv packages/core/src/lesson/ui/CoverDisplay.spec.tsx packages/core/src/lesson/components/CoverDisplay.spec.tsx
```

- [ ] **Step 3: Move utils và hook layout**

```bash
git mv packages/core/src/lesson/ui/utils.ts packages/core/src/lesson/utils/utils.ts
git mv packages/core/src/lesson/useLessonPageShell.ts packages/core/src/lesson/hooks/useLessonPageShell.ts
```

- [ ] **Step 4: Move content-editor files**

```bash
git mv packages/core/src/lesson/ui/LessonEditor.tsx packages/core/src/lesson/content-editor/components/LessonEditor.tsx
git mv packages/core/src/lesson/ui/LessonViewer.tsx packages/core/src/lesson/content-editor/components/LessonViewer.tsx
git mv packages/core/src/lesson/useLessonEditor.ts packages/core/src/lesson/content-editor/hooks/useLessonEditor.ts
```

- [ ] **Step 5: Move page-tree files**

```bash
git mv packages/core/src/lesson/ui/PageTreeSidebar.tsx packages/core/src/lesson/page-tree/components/PageTreeSidebar.tsx
git mv packages/core/src/lesson/ui/PageTreeSidebar.spec.tsx packages/core/src/lesson/page-tree/components/PageTreeSidebar.spec.tsx
git mv packages/core/src/lesson/ui/PageTreeItem.tsx packages/core/src/lesson/page-tree/components/PageTreeItem.tsx
git mv packages/core/src/lesson/ui/PageTreeItem.spec.tsx packages/core/src/lesson/page-tree/components/PageTreeItem.spec.tsx
git mv packages/core/src/lesson/usePageTree.ts packages/core/src/lesson/page-tree/hooks/usePageTree.ts
```

- [ ] **Step 6: Move search files**

```bash
git mv packages/core/src/lesson/ui/SearchModal.tsx packages/core/src/lesson/search/components/SearchModal.tsx
git mv packages/core/src/lesson/ui/SearchModal.spec.tsx packages/core/src/lesson/search/components/SearchModal.spec.tsx
git mv packages/core/src/lesson/ui/SearchPreview.tsx packages/core/src/lesson/search/components/SearchPreview.tsx
git mv packages/core/src/lesson/ui/SearchResultItem.tsx packages/core/src/lesson/search/components/SearchResultItem.tsx
git mv packages/core/src/lesson/ui/useSearch.ts packages/core/src/lesson/search/hooks/useSearch.ts
git mv packages/core/src/lesson/ui/useSearchModal.ts packages/core/src/lesson/search/hooks/useSearchModal.ts
git mv packages/core/src/lesson/ui/useSearchModal.spec.ts packages/core/src/lesson/search/hooks/useSearchModal.spec.ts
```

- [ ] **Step 7: Fix import trong components/LessonPageShell.tsx**

File: `packages/core/src/lesson/components/LessonPageShell.tsx`

```ts
// Before — dynamic import trỏ sai vì LessonViewer đã chuyển sang content-editor/
import("./LessonViewer").then((m) => ({ default: m.LessonViewer }))
// After
import("../content-editor/components/LessonViewer").then((m) => ({ default: m.LessonViewer }))
```

> `CoverDisplay` và `../types` import giữ nguyên (cùng thư mục / lên 1 cấp đúng).

- [ ] **Step 8: Fix import trong content-editor/components/LessonEditor.tsx**

File: `packages/core/src/lesson/content-editor/components/LessonEditor.tsx`

```ts
// Before
import { parseBlocks } from "./utils";
// After
import { parseBlocks } from "../../utils/utils";
```

- [ ] **Step 9: Fix import trong content-editor/components/LessonViewer.tsx**

File: `packages/core/src/lesson/content-editor/components/LessonViewer.tsx`

```ts
// Before
import { parseBlocks } from './utils';
// After
import { parseBlocks } from '../../utils/utils';
```

- [ ] **Step 10: Fix imports trong content-editor/hooks/useLessonEditor.ts**

File: `packages/core/src/lesson/content-editor/hooks/useLessonEditor.ts`

```ts
// Before
import type { ApolloLike } from '../roadmap/types';
import { fetchLesson, updateLessonContent, updateLessonTitle } from './lesson.service';
import type { LessonNode, SaveStatus, UseLessonEditorResult } from './types';
// After
import type { ApolloLike } from '../../../roadmap/types';
import { fetchLesson, updateLessonContent, updateLessonTitle } from '../../lesson.service';
import type { LessonNode, SaveStatus, UseLessonEditorResult } from '../../types';
```

- [ ] **Step 11: Fix imports trong hooks/useLessonPageShell.ts**

File: `packages/core/src/lesson/hooks/useLessonPageShell.ts`

```ts
// Before
import type { ApolloLike } from '../roadmap/types';
import { updateNodeCover, updateNodeIcon } from './lesson.service';
// After
import type { ApolloLike } from '../../roadmap/types';
import { updateNodeCover, updateNodeIcon } from '../lesson.service';
```

- [ ] **Step 12: Fix imports trong page-tree/components/ specs**

File: `packages/core/src/lesson/page-tree/components/PageTreeSidebar.tsx`
File: `packages/core/src/lesson/page-tree/components/PageTreeSidebar.spec.tsx`
File: `packages/core/src/lesson/page-tree/components/PageTreeItem.tsx`
File: `packages/core/src/lesson/page-tree/components/PageTreeItem.spec.tsx`

Trong cả 4 file, đổi:
```ts
// Before
import type { ... } from '../types';
// After
import type { ... } from '../../types';
```

- [ ] **Step 13: Fix imports trong page-tree/hooks/usePageTree.ts**

File: `packages/core/src/lesson/page-tree/hooks/usePageTree.ts`

```ts
// Before
import type { ApolloLike } from '../roadmap/types';
import type { PageTree } from './types';
import { fetchRoadmapTree } from './lesson.service';
// After
import type { ApolloLike } from '../../../roadmap/types';
import type { PageTree } from '../../types';
import { fetchRoadmapTree } from '../../lesson.service';
```

- [ ] **Step 14: Fix import trong search/components/SearchModal.tsx**

File: `packages/core/src/lesson/search/components/SearchModal.tsx`

```ts
// Before
import { useSearch } from './useSearch';
// After
import { useSearch } from '../hooks/useSearch';
```

> `SearchResultItem` và `SearchPreview` import vẫn `./` vì cùng components/ folder.

- [ ] **Step 15: Xóa thư mục ui/ rỗng**

```bash
# Verify thư mục rỗng trước khi xóa
ls packages/core/src/lesson/ui/
rmdir packages/core/src/lesson/ui
```

- [ ] **Step 16: Update index.ts — toàn bộ lesson paths**

File: `packages/core/src/index.ts`

```ts
// Before
export { useLessonEditor } from './lesson/useLessonEditor';
export { useLessonPageShell } from './lesson/useLessonPageShell';
export { usePageTree } from './lesson/usePageTree';
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

```ts
// After
export { useLessonEditor } from './lesson/content-editor/hooks/useLessonEditor';
export { useLessonPageShell } from './lesson/hooks/useLessonPageShell';
export { usePageTree } from './lesson/page-tree/hooks/usePageTree';
export { LessonEditor } from './lesson/content-editor/components/LessonEditor';
export type { LessonEditorProps } from './lesson/content-editor/components/LessonEditor';
export { LessonViewer } from './lesson/content-editor/components/LessonViewer';
export type { LessonViewerProps } from './lesson/content-editor/components/LessonViewer';
export { LessonPageShell } from './lesson/components/LessonPageShell';
export type { LessonPageShellProps } from './lesson/components/LessonPageShell';
export { LessonPageLayout } from './lesson/components/LessonPageLayout';
export type { LessonPageLayoutProps } from './lesson/components/LessonPageLayout';
export { CoverDisplay } from './lesson/components/CoverDisplay';
export type { CoverDisplayProps } from './lesson/components/CoverDisplay';
export { BreadcrumbDisplay } from './lesson/components/BreadcrumbDisplay';
export type { BreadcrumbDisplayProps } from './lesson/components/BreadcrumbDisplay';
export { PageTreeSidebar } from './lesson/page-tree/components/PageTreeSidebar';
export type { PageTreeSidebarProps } from './lesson/page-tree/components/PageTreeSidebar';
export { PageTreeItem } from './lesson/page-tree/components/PageTreeItem';
export type { PageTreeItemProps } from './lesson/page-tree/components/PageTreeItem';
export { SearchModal } from './lesson/search/components/SearchModal';
export type { SearchModalProps } from './lesson/search/components/SearchModal';
export { useSearchModal } from './lesson/search/hooks/useSearchModal';
export { useSearch } from './lesson/search/hooks/useSearch';
export type { TimeGroup } from './lesson/search/hooks/useSearch';
```

- [ ] **Step 17: Chạy tests**

```bash
pnpm --filter @vizteck/core test
```

Expected: tất cả pass

- [ ] **Step 18: Commit**

```bash
git add packages/core/src/lesson packages/core/src/index.ts
git commit -m "refactor: restructure lesson into layout root + content-editor, page-tree, search sub-features"
```

---

## Task 4: apps/admin — graph-editor thành sub_feature của roadmaps/

**Files:**
- Move: `features/graph-editor/` → `features/roadmaps/graph-editor/`
- Modify: `app/roadmaps/[id]/page.tsx` (7 imports)

- [ ] **Step 1: Move graph-editor vào roadmaps/**

```bash
git mv apps/admin/src/features/graph-editor apps/admin/src/features/roadmaps/graph-editor
```

- [ ] **Step 2: Fix 7 imports trong roadmaps/[id]/page.tsx**

File: `apps/admin/src/app/roadmaps/[id]/page.tsx`

```ts
// Before
import { useAdminGraphEditor } from '@/features/graph-editor/hooks/useGraphEditor';
import type { EditorNode } from '@/features/graph-editor/hooks/useGraphEditor';
import { useNodeActions } from '@/features/graph-editor/hooks/useNodeActions';
import { useGraphDraft } from '@/features/graph-editor/hooks/useGraphDraft';
import { GraphToolbar } from '@/features/graph-editor/components/GraphToolbar';
import { NodeInventory } from '@/features/graph-editor/components/NodeInventory';
import { NodeSidePanel } from '@/features/graph-editor/components/NodeSidePanel';
// After
import { useAdminGraphEditor } from '@/features/roadmaps/graph-editor/hooks/useGraphEditor';
import type { EditorNode } from '@/features/roadmaps/graph-editor/hooks/useGraphEditor';
import { useNodeActions } from '@/features/roadmaps/graph-editor/hooks/useNodeActions';
import { useGraphDraft } from '@/features/roadmaps/graph-editor/hooks/useGraphDraft';
import { GraphToolbar } from '@/features/roadmaps/graph-editor/components/GraphToolbar';
import { NodeInventory } from '@/features/roadmaps/graph-editor/components/NodeInventory';
import { NodeSidePanel } from '@/features/roadmaps/graph-editor/components/NodeSidePanel';
```

- [ ] **Step 3: Chạy tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: tất cả pass

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/features/roadmaps/graph-editor apps/admin/src/features/graph-editor apps/admin/src/app/roadmaps
git commit -m "refactor: move graph-editor to roadmaps/graph-editor sub-feature in apps/admin"
```

---

## Task 5: apps/admin — lessons restructure + search thành sub_feature

**Files:**
- Move: `features/search/SearchModalWrapper.tsx` → `features/lessons/search/SearchModalWrapper.tsx`
- Move: `features/lessons/hooks/useLessonEditor.ts` → `features/lessons/content-editor/hooks/useLessonEditor.ts`
- Move: `features/lessons/hooks/usePageTree.ts` → `features/lessons/page-tree/hooks/usePageTree.ts`
- Move: `features/lessons/hooks/usePageTree.spec.ts` → `features/lessons/page-tree/hooks/usePageTree.spec.ts`
- Modify: `app/layout.tsx` (1 import)
- Modify: `app/roadmaps/[id]/nodes/[nodeId]/page.tsx` (2 imports)

- [ ] **Step 1: Tạo thư mục sub_feature cho lessons**

```bash
mkdir -p apps/admin/src/features/lessons/content-editor/hooks
mkdir -p apps/admin/src/features/lessons/content-editor/components
mkdir -p apps/admin/src/features/lessons/content-editor/utils
mkdir -p apps/admin/src/features/lessons/page-tree/hooks
mkdir -p apps/admin/src/features/lessons/page-tree/components
mkdir -p apps/admin/src/features/lessons/page-tree/utils
mkdir -p apps/admin/src/features/lessons/search/components
mkdir -p apps/admin/src/features/lessons/search/hooks
mkdir -p apps/admin/src/features/lessons/search/utils
```

- [ ] **Step 2: Move SearchModalWrapper vào lessons/search/**

```bash
git mv apps/admin/src/features/search/SearchModalWrapper.tsx apps/admin/src/features/lessons/search/SearchModalWrapper.tsx
rmdir apps/admin/src/features/search
```

- [ ] **Step 3: Move lesson hooks vào đúng sub_feature**

```bash
git mv apps/admin/src/features/lessons/hooks/useLessonEditor.ts apps/admin/src/features/lessons/content-editor/hooks/useLessonEditor.ts
git mv apps/admin/src/features/lessons/hooks/usePageTree.ts apps/admin/src/features/lessons/page-tree/hooks/usePageTree.ts
git mv apps/admin/src/features/lessons/hooks/usePageTree.spec.ts apps/admin/src/features/lessons/page-tree/hooks/usePageTree.spec.ts
```

> `useLessonPageShell.ts` và `useLessonPageShell.spec.ts` **giữ nguyên** ở `lessons/hooks/` — đây là layout hook.

- [ ] **Step 4: Fix import trong app/layout.tsx**

File: `apps/admin/src/app/layout.tsx`

```ts
// Before
import { SearchModalWrapper } from '@/features/search/SearchModalWrapper';
// After
import { SearchModalWrapper } from '@/features/lessons/search/SearchModalWrapper';
```

- [ ] **Step 5: Fix 2 imports trong nodes/[nodeId]/page.tsx**

File: `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`

```ts
// Before
import { useAdminLessonEditor } from "@/features/lessons/hooks/useLessonEditor";
import { useAdminPageTree } from "@/features/lessons/hooks/usePageTree";
// After
import { useAdminLessonEditor } from "@/features/lessons/content-editor/hooks/useLessonEditor";
import { useAdminPageTree } from "@/features/lessons/page-tree/hooks/usePageTree";
```

> `useAdminLessonPageShell` import **không thay đổi** — vẫn ở `@/features/lessons/hooks/useLessonPageShell`.

- [ ] **Step 6: Scaffold utils/ còn lại**

```bash
mkdir -p apps/admin/src/features/roadmaps/utils
mkdir -p apps/admin/src/features/lessons/utils
touch apps/admin/src/features/roadmaps/utils/.gitkeep
touch apps/admin/src/features/lessons/utils/.gitkeep
touch apps/admin/src/features/lessons/content-editor/utils/.gitkeep
touch apps/admin/src/features/lessons/page-tree/utils/.gitkeep
touch apps/admin/src/features/lessons/search/utils/.gitkeep
touch apps/admin/src/features/roadmaps/graph-editor/utils/.gitkeep
```

- [ ] **Step 7: Chạy tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: tất cả pass

- [ ] **Step 8: Commit**

```bash
git add apps/admin/src/features/lessons apps/admin/src/features/search apps/admin/src/app
git commit -m "refactor: restructure lessons into content-editor, page-tree, search sub-features in apps/admin"
```

---

## Task 6: apps/admin — shared hooks ra khỏi lib/

**Files:**
- Move: `lib/useAuthGuard.ts` → `hooks/useAuthGuard.ts`
- Move: `lib/useRouteGuard.ts` → `hooks/useRouteGuard.ts`
- Modify: 3 pages dùng những hooks này

- [ ] **Step 1: Tạo hooks/ và move files**

```bash
mkdir -p apps/admin/src/hooks
git mv apps/admin/src/lib/useAuthGuard.ts apps/admin/src/hooks/useAuthGuard.ts
git mv apps/admin/src/lib/useRouteGuard.ts apps/admin/src/hooks/useRouteGuard.ts
```

- [ ] **Step 2: Fix trong app/roadmaps/page.tsx**

```ts
// Before
import { useAuthGuard } from '@/lib/useAuthGuard';
// After
import { useAuthGuard } from '@/hooks/useAuthGuard';
```

- [ ] **Step 3: Fix trong app/roadmaps/[id]/page.tsx**

```ts
// Before
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useUnsavedGuard } from '@/lib/useRouteGuard';
// After
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useUnsavedGuard } from '@/hooks/useRouteGuard';
```

- [ ] **Step 4: Fix trong app/roadmaps/[id]/nodes/[nodeId]/page.tsx**

```ts
// Before
import { useAuthGuard } from "@/lib/useAuthGuard";
// After
import { useAuthGuard } from "@/hooks/useAuthGuard";
```

- [ ] **Step 5: Chạy tests**

```bash
pnpm --filter @vizteck/admin test
```

Expected: tất cả pass

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/hooks apps/admin/src/lib/useAuthGuard.ts apps/admin/src/lib/useRouteGuard.ts apps/admin/src/app
git commit -m "refactor: move shared hooks from lib/ to hooks/ in apps/admin"
```

---

## Task 7: Full build verification + update CLAUDE.md

- [ ] **Step 1: Build packages/core**

```bash
pnpm --filter @vizteck/core build
```

Expected: exit 0, không có TypeScript error

- [ ] **Step 2: Build apps/admin**

```bash
pnpm --filter @vizteck/admin build
```

Expected: exit 0

- [ ] **Step 3: Build apps/web**

```bash
pnpm --filter @vizteck/web build
```

Expected: exit 0 (web chỉ import từ `@vizteck/core` public API — không thay đổi)

- [ ] **Step 4: Chạy toàn bộ tests**

```bash
pnpm test
```

Expected: tất cả pass

- [ ] **Step 5: Update CLAUDE.md**

Trong `CLAUDE.md`, cập nhật mô tả `packages/core` và `Admin frontend structure` để phản ánh:
- `packages/core`: feature-first với sub_feature lồng nhau (`roadmap/graph/`, `lesson/content-editor/`, `lesson/page-tree/`, `lesson/search/`)
- `apps/admin/features/`: `roadmaps/graph-editor/`, `lessons/content-editor/`, `lessons/page-tree/`, `lessons/search/`
- `apps/admin/hooks/`: shared hooks (was `lib/`)

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md to reflect new folder architecture"
```

---

## Self-Review

**Spec coverage:**
- ✅ `packages/core roadmap/`: hooks/ + utils/ subfolders — Task 1
- ✅ `packages/core graph/` → `roadmap/graph/` sub_feature — Task 2
- ✅ `packages/core lesson/` root: layout only (LessonPageShell, LessonPageLayout, BreadcrumbDisplay, CoverDisplay, useLessonPageShell) — Task 3
- ✅ `lesson/content-editor/`: LessonEditor, LessonViewer, useLessonEditor — Task 3
- ✅ `lesson/page-tree/`: PageTreeSidebar, PageTreeItem, usePageTree — Task 3
- ✅ `lesson/search/`: SearchModal, SearchPreview, SearchResultItem, useSearch, useSearchModal — Task 3
- ✅ `apps/admin features/roadmaps/graph-editor/` sub_feature — Task 4
- ✅ `apps/admin features/lessons/search/` sub_feature (từ features/search/) — Task 5
- ✅ `apps/admin features/lessons/content-editor/` sub_feature — Task 5
- ✅ `apps/admin features/lessons/page-tree/` sub_feature — Task 5
- ✅ `apps/admin hooks/` shared hooks — Task 6
- ✅ `apps/web` không thay đổi — public API giữ nguyên

**Placeholder scan:** Không có — tất cả import path đều cụ thể và chính xác.

**Type consistency:** Tất cả symbol export trong index.ts giữ nguyên tên, chỉ path thay đổi.
