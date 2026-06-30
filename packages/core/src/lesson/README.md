# lesson — Feature Bài Học (Layout Root)

Logic layout và shared types cho toàn bộ tính năng bài học. Root lesson chỉ chứa layout — nội dung, cây trang, tìm kiếm đều là sub-feature riêng.

## Các file tại root

| File/Folder | Vai trò |
|-------------|---------|
| `types.ts` | `LessonNode`, `LessonShellNode`, `PageTree`, `BreadcrumbItem` |
| `lesson.service.ts` | `fetchLesson`, `updateLessonContent`, `updateNodeCover`, `updateNodeIcon`, `fetchRoadmapTree` |
| `components/LessonPageShell.tsx` | Layout Notion-style với slot pattern (coverSlot, titleSlot, contentSlot) |
| `components/LessonPageLayout.tsx` | Khung 2 cột: sidebar (page-tree) + content |
| `components/BreadcrumbDisplay.tsx` | Hiển thị breadcrumb điều hướng |
| `components/CoverDisplay.tsx` | Hiển thị ảnh cover (read-only) |
| `hooks/useLessonPageShell.ts` | Optimistic update cho cover/icon + sync API + rollback khi lỗi |
| `utils/utils.ts` | `parseBlocks` (BlockNote JSON) |

## Sub-features

| Folder | Vai trò |
|--------|---------|
| `content-editor/` | BlockNote editor để soạn thảo nội dung bài học |
| `page-tree/` | Cây trang sidebar để điều hướng giữa các node |
| `search/` | Modal tìm kiếm toàn bộ bài học |

## Slot Pattern (LessonPageShell)

`<LessonPageShell>` nhận optional slots để cho phép admin inject UI có thể chỉnh sửa:

```tsx
// apps/web: không truyền slot → hiển thị read-only mặc định
<LessonPageShell node={node} mode="view" />

// apps/admin: truyền slot để inject UI edit
<LessonPageShell
  node={node}
  mode="edit"
  coverSlot={<CoverImage ... />}
  titleSlot={<LessonTitleEditor ... />}
  contentSlot={<LessonEditor ... />}
/>
```

## Lưu ý quan trọng

Luôn dùng PATCH endpoints riêng lẻ khi lưu bài học:
- `PATCH /api/nodes/:id/content` — nội dung
- `PATCH /api/nodes/:id/title` — tiêu đề  
- `PATCH /api/nodes/:id/cover` — ảnh cover
- `PATCH /api/nodes/:id/icon` — emoji icon

**Không bao giờ** lưu qua `POST /api/roadmaps/:id/graph` — endpoint đó DELETE+INSERT toàn bộ nodes/edges và sẽ mất dữ liệu.
