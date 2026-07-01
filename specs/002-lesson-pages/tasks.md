# Tasks: Lesson Editor Enhancements

**Input**: Design documents from `specs/002-lesson-pages/`

**Branch**: `feature/lesson-editor-enhancements` (from `develop`)

**Organization**: Tasks grouped by user story — each story independently testable.

**Tests**: Not requested in spec — no test tasks generated. Use `quickstart.md` for manual validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking incomplete dependencies)
- **[Story]**: Maps to user story from spec.md

## Path Conventions (VizTeckStack monorepo)

| Location | Purpose |
|----------|---------|
| `packages/core/src/lesson/content-editor/` | Content editor business logic & components |
| `packages/core/src/lesson/content-editor/blocks/` | BlockNote custom block definitions |
| `packages/core/src/lesson/content-editor/components/` | Editor/Viewer display components |
| `apps/admin/src/features/lessons/` | Admin-only wrappers (no changes this feature) |

---

## Phase 1: Setup

**Purpose**: Create feature branch.

- [ ] T001 Create and checkout branch `feature/lesson-editor-enhancements` from `develop` *(skipped — current branch `refactor` has uncommitted changes; create branch manually after committing)*

---

## Phase 2: User Story 1 — Kéo thả block (Priority: P1) 🎯 MVP

**Goal**: Bật BlockNote SideMenu trong LessonEditor để user kéo thả block reorder trong lesson.

**Independent Test**: Mở lesson có 3+ blocks trong admin → hover block → thấy ⠿ drag handle → kéo block → thả → block ở vị trí mới → reload trang → thứ tự mới vẫn còn.

**Why no foundational phase**: Không cần schema mới, không cần endpoint mới — persistence qua `UpdateNodeContentDocument` đã wired sẵn.

### Implementation

- [x] T002 [US1] Enable SideMenu trong `packages/core/src/lesson/content-editor/components/LessonEditor.tsx` — thêm prop `sideMenu={true}` vào `<BlockNoteView>` (hoặc dùng `<SideMenuController>` nếu cần custom)

**Checkpoint US1**: Drag handle xuất hiện khi hover, block reorder được lưu sau reload. Chạy Scenario 1 và Scenario 4 trong `quickstart.md`.

---

## Phase 3: User Story 2 — TOC Block (Priority: P2)

**Goal**: Thêm custom block "Table of Contents" vào BlockNote — tự động list headings với anchor links.

**Note**: Icon và cover đã implement đầy đủ — không cần thay đổi code (xác nhận bằng Scenario 3 trong `quickstart.md`).

**Independent Test**: Mở lesson có H1/H2/H3 → gõ `/toc` → chọn "Table of Contents" → TOC hiện 3 mục → thêm H2 mới → TOC cập nhật → click mục → scroll đến heading.

### Implementation

- [x] T003 [P] [US2] Tạo `packages/core/src/lesson/content-editor/blocks/TocBlock.tsx`:
  - Dùng `createReactBlockSpec` từ `@blocknote/react`
  - Block type: `"toc"`, propSchema: `{}`, content: `"none"`
  - Render component đọc `editor.document`, filter `block.type === 'heading'`, render `<ul>` với thụt lề theo `props.level`
  - Anchor: `href="#${block.id}"` (BlockNote đã render mỗi block với `data-id`)
  - Empty state: render "Chưa có tiêu đề nào" khi không có heading
  - Slash command label: "Table of Contents", keyword: "toc"

- [x] T004 [US2] Register `TocBlock` trong `packages/core/src/lesson/content-editor/components/LessonEditor.tsx` — thêm vào `customBlocks` array của `useCreateBlockNote` config (depends on T003)

- [x] T005 [P] [US2] Register `TocBlock` trong `packages/core/src/lesson/content-editor/components/LessonViewer.tsx` — thêm vào `customBlocks` array (render-only, depends on T003, parallel với T004)

- [x] T006 [P] [US2] Export `TocBlock`, `lessonSchema`, `LessonSchema` từ `packages/core/src/index.ts` — đảm bảo consumer có thể import nếu cần (parallel với T004/T005)

**Checkpoint US2**: Chạy Scenario 2 và Scenario 5 trong `quickstart.md`.

---

## Phase 4: US3 — DEFERRED

**User Story 3 (Sharing & Permissions)**: Blocked on `003-user-management` spec.

Không implement trong branch này. Xem `specs/002-lesson-pages/spec.md` phần US3 để biết scope.

---

## Phase 5: Polish & Verification

**Purpose**: Xác nhận toàn bộ feature hoạt động end-to-end.

- [x] T007 [P] Chạy `pnpm lint` từ root — sửa mọi linting error
- [x] T008 [P] Chạy `pnpm build` từ root — sửa mọi TypeScript/build error
- [ ] T009 Chạy toàn bộ 5 scenarios trong `specs/002-lesson-pages/quickstart.md`:
  - Scenario 1: Block drag-drop basic
  - Scenario 2: TOC creation và auto-update
  - Scenario 3: Icon và cover verify (không cần code change — chỉ xác nhận)
  - Scenario 4: Toggle block với drag (edge case)
  - Scenario 5: TOC empty state (edge case)
- [ ] T010 Tạo commit `feat: add block drag-drop and TOC custom block to lesson editor`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Không dependency — bắt đầu ngay
- **Phase 2 (US1)**: Chỉ cần Phase 1 hoàn thành
- **Phase 3 (US2)**: Độc lập với Phase 2 — có thể bắt đầu song song với US1 sau Phase 1
- **Phase 5 (Polish)**: Cần Phase 2 + Phase 3 hoàn thành

### User Story Dependencies

- **US1 (T002)**: Độc lập — 1 file, 1 change
- **US2 (T003–T006)**: T003 phải xong trước T004 và T005; T004+T005+T006 có thể parallel sau T003

### Parallel Opportunities trong US2

```
Sau khi T003 (TocBlock.tsx) hoàn thành:
  → T004: Register trong LessonEditor.tsx   ┐ parallel
  → T005: Register trong LessonViewer.tsx   ┤ (khác file)
  → T006: Export từ index/types             ┘
```

---

## Parallel Example: User Story 2

```bash
# Step 1 (sequential — T003 must finish first):
Task: "Tạo packages/core/src/lesson/content-editor/blocks/TocBlock.tsx"

# Step 2 (parallel — all different files):
Task: "Register TocBlock trong LessonEditor.tsx"
Task: "Register TocBlock trong LessonViewer.tsx"
Task: "Export TocBlock từ content-editor index"
```

---

## Implementation Strategy

### MVP First (US1 only — 1 task)

1. Complete Phase 1: Setup branch
2. Complete Phase 2: T002 — bật SideMenu (1 file change)
3. **STOP và VALIDATE**: Scenario 1 + Scenario 4 trong quickstart.md
4. Commit + PR if ready

### Incremental Delivery

1. Phase 1 → Phase 2 (US1) → validate → commit
2. Phase 3 (US2) → validate → commit
3. Phase 5 (Polish) → final PR

### Parallel Team Strategy

Nếu có 2 người:
- Dev A: T002 (US1 - SideMenu)
- Dev B: T003 (TocBlock.tsx)
→ Gộp lại sau khi T003 xong → T004 + T005 + T006 song song

---

## Notes

- **Không cần schema mới**: Block order lưu trong BlockNote JSON qua `Node.content`
- **Không cần endpoint mới**: `UpdateNodeContentDocument` mutation đã xử lý content save
- **Icon/Cover**: Không cần thay đổi — xác nhận bằng Scenario 3
- **US3**: Không implement — cần `003-user-management` làm prerequisite
- Commit sau mỗi US hoàn thành: `feat: add block drag-drop`, `feat: add TOC custom block`
