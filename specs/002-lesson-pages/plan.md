# Implementation Plan: Lesson Editor Enhancements

**Branch**: `feature/lesson-editor-enhancements` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-lesson-pages/spec.md`

---

## Summary

Thêm 2 tính năng vào lesson editor của VizTeckStack:

1. **Block drag-and-drop (P1)**: Bật BlockNote's built-in SideMenu trong `LessonEditor`. Không cần API mới — block order được lưu trong BlockNote JSON qua GraphQL mutation đã có (`UpdateNodeContentDocument`).

2. **Icon, Cover, TOC (P2)**: Icon và cover đã implement đầy đủ. Chỉ cần tạo custom BlockNote block type `toc` trong `packages/core` — đọc `editor.document`, filter heading blocks, render danh sách anchor links reactive.

**P3 (Sharing)**: Defer sang `003-user-management` — dependency chưa tồn tại.

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 15

**Primary Dependencies**:
- `@blocknote/core@0.51.4`, `@blocknote/react@0.51.4`, `@blocknote/mantine@0.51.4`
- NestJS (api-gateway), Prisma (DB), Apollo Client (GraphQL)

**Storage**: PostgreSQL — `Node.content` (BlockNote JSON), `Node.icon`, `Node.coverImage` — **không thay đổi schema**

**Testing**: Vitest + @testing-library/react (`packages/core`, `apps/admin`)

**Target Platform**: Web — admin CMS (port 3002), public viewer (port 3001)

**Performance Goals**: Drag-drop persist < 500ms phản hồi UI; TOC update < 1s sau heading change

**Constraints**: Core-First pattern; ApolloLike first param; semantic Tailwind tokens; no nested setState

**Scale/Scope**: EdTech CMS — nội dung lesson, số lượng blocks/trang nhỏ (< 200 blocks)

---

## Constitution Check

| # | Principle | Gate Question | Status |
|---|-----------|---------------|--------|
| I | Core-First | `LessonEditor` (SideMenu config) và `TocBlock` định nghĩa trong `packages/core`. Admin chỉ dùng thin wrapper. | ✅ |
| II | Package Boundary | Không import mới. `useLessonEditor` nhận `ApolloLike` — không thay đổi. | ✅ |
| III | Targeted Mutations | Block order save qua `UpdateNodeContentDocument` (content field). Icon/Cover qua mutations đã có. Không dùng UpsertGraph. | ✅ |
| IV | GitFlow | Branch: `feature/lesson-editor-enhancements` từ `develop`. | ✅ |
| V | Simplicity | Dùng BlockNote built-in SideMenu — không thêm DnD library. TOC là custom block tối giản, không có props. | ✅ |

---

## Project Structure

### Documentation (this feature)

```
specs/002-lesson-pages/
├── plan.md         ← file này
├── research.md     ← Phase 0 output
├── data-model.md   ← Phase 1 output
├── quickstart.md   ← Phase 1 output
├── contracts/
│   ├── toc-block.md
│   └── drag-drop.md
└── tasks.md        ← Phase 2 output (từ /speckit-tasks)
```

### Source Code Changes

```
packages/core/src/lesson/
  content-editor/
    blocks/
      TocBlock.tsx              ← NEW: custom BlockNote block definition
    components/
      LessonEditor.tsx          ← MODIFY: enable SideMenu, register TocBlock
      LessonViewer.tsx          ← MODIFY: register TocBlock (render only)
    types.ts                    ← MODIFY: export TocBlockConfig type

apps/admin/src/features/lessons/
  (không thay đổi — icon/cover đã done, thin wrappers không cần update)
```

**Không thay đổi:**
- `packages/db/prisma/schema.prisma` — không cần field mới
- `apps/api-gateway/` — không cần endpoint mới
- `apps/web/` — LessonViewer tự động nhận TocBlock khi packages/core được update

---

## Complexity Tracking

> Không có Constitution violations — không cần ghi vào đây.

---

## Implementation Notes

### P1: Block Drag-and-Drop

**File**: `packages/core/src/lesson/content-editor/components/LessonEditor.tsx`

Thay đổi duy nhất: enable SideMenu trong BlockNote config.

```tsx
// Trước (hiện tại):
const editor = useCreateBlockNote(
  blocks ? { initialContent: blocks as any } : {}
)

// Sau:
const editor = useCreateBlockNote(
  blocks ? { initialContent: blocks as any } : {}
)
// Trong BlockNoteView:
<BlockNoteView editor={editor} sideMenu={true} theme={theme} />
```

Hoặc nếu cần custom SideMenu:
```tsx
import { SideMenuController, BlockNoteView } from "@blocknote/react"
// ...
<BlockNoteView editor={editor} sideMenu={false}>
  <SideMenuController sideMenu={CustomSideMenu} />
</BlockNoteView>
```

Persistence: `onSave` debounce đã có → không thay đổi.

---

### P2a: TOC Block

**File mới**: `packages/core/src/lesson/content-editor/blocks/TocBlock.tsx`

```tsx
// Sketch (không phải final code — tasks.md sẽ có detail):
import { createReactBlockSpec } from "@blocknote/react"

export const TocBlock = createReactBlockSpec(
  { type: "toc", propSchema: {}, content: "none" },
  {
    render: ({ editor }) => {
      // đọc editor.document, filter headings, render list
    }
  }
)
```

**Đăng ký**: Pass vào `customBlocks` của `useCreateBlockNote` trong `LessonEditor` và `LessonViewer`.

**Slash command**: BlockNote tự pick up từ block definition — add `"toc"` với label "Table of Contents" vào slash menu.

---

### P2b: Icon & Cover

**Không cần thay đổi code** — đã implement đầy đủ theo research findings.

Verify: `CoverImage.tsx`, `IconPicker.tsx`, `useLessonPageShell` đang hoạt động.

---

## Deferred

- **P3 (Sharing + Permissions)**: Cần `003-user-management` trước. Không implement trong branch này.
