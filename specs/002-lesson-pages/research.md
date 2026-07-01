# Research: Lesson Editor Enhancements

**Feature**: 002-lesson-pages
**Date**: 2026-06-30

---

## Decision 1: Block Drag-and-Drop

**Decision**: Dùng BlockNote's built-in `SideMenu` component — bật trong config `useCreateBlockNote`.

**Rationale**: BlockNote 0.51.4 đã có drag handle tích hợp trong `SideMenu`. Hiện tại `LessonEditor.tsx` dùng config rỗng `useCreateBlockNote({})` — chỉ cần pass `sideMenu: true` hoặc dùng `BlockNoteView` với `sideMenu` prop. Không cần thêm thư viện DnD bên ngoài.

**Alternatives considered**:
- `@dnd-kit/core` — thêm dependency không cần thiết, BlockNote đã xử lý nội bộ
- Custom drag handle — phức tạp, không cần

**Impact on data model**: Không có. Block order được lưu trong mảng BlockNote JSON (`Node.content`) theo thứ tự xuất hiện. Kéo thả thay đổi thứ tự mảng → `onSave` được gọi → GraphQL mutation `UpdateNodeContentDocument` lưu toàn bộ content mới. Không cần PATCH endpoint mới, không cần schema DB mới.

---

## Decision 2: Table of Contents Block

**Decision**: Tạo custom BlockNote block type `toc` trong `packages/core`.

**Rationale**: BlockNote không có TOC block tích hợp. Cần custom block đọc `editor.document`, lọc blocks có `type === 'heading'`, render danh sách anchor links. BlockNote cung cấp API `editor.document` (mảng tất cả blocks) và `editor.onChange` để reactive update.

**Alternatives considered**:
- TOC nằm ngoài editor (fixed sidebar) — khác UX so với Notion, không match spec
- Server-side TOC generation — lag, không reactive

**Implementation notes**:
- Heading anchor IDs: dùng `block.id` của BlockNote (đã là UUID stable) làm anchor
- TOC updates khi editor thay đổi — subscribe via `editor.onChange` hoặc derive từ prop content
- Không lưu vào DB riêng — TOC là block trong content JSON như các block khác
- Khi render view mode: `LessonViewer` dùng cùng custom block definition

---

## Decision 3: Icon và Cover

**Decision**: Không cần thay đổi — đã implement đầy đủ.

**Findings**:
- `CoverImage.tsx` (apps/admin/src/features/lessons/components/) — upload + paste URL + remove
- `CoverDisplay.tsx` (packages/core/src/lesson/components/) — render với fallback gradient
- `IconPicker.tsx` — emoji picker 3 tabs (emoji, text, Lucide)
- `useLessonPageShell` — optimistic updates đã có
- GraphQL mutations: `UpdateNodeCoverDocument`, `UpdateNodeIconDocument` đã wired
- `Node.icon`, `Node.coverImage` đã có trong Prisma schema

**Impact**: Zero — P2 icon/cover không cần code mới.

---

## Decision 4: Scope P3 (Sharing)

**Decision**: Defer P3 hoàn toàn sang `003-user-management` spec.

**Rationale**: Sharing theo user/nhóm cần User, Group, Permission entities chưa tồn tại. Implement P1 + P2 trước, P3 là feature riêng.
