# features/lessons — Feature Bài Học (Admin)

Admin wrappers và UI cho tính năng bài học. Logic nghiệp vụ nằm ở `@vizteck/core/lesson`.

## Các file tại root

| File | Vai trò |
|------|---------|
| `hooks/useLessonPageShell.ts` | `useAdminLessonPageShell(nodeId, cover, icon)` — inject `adminApolloClient` vào hook layout shell |
| `components/CoverImage.tsx` | Vùng cover có thể chỉnh sửa (hover: upload, paste URL, xóa) |
| `components/CoverUploadModal.tsx` | Modal upload file qua UploadThing |
| `components/IconPicker.tsx` | Emoji picker cho icon của node |
| `components/LessonTitleEditor.tsx` | Tiêu đề inline với blur-to-save |

## Sub-features

| Folder | Vai trò |
|--------|---------|
| `content-editor/` | Hook soạn thảo nội dung bài học |
| `page-tree/` | Hook cây trang sidebar |
| `search/` | SearchModalWrapper kết nối với admin Apollo client |

## Lưu ý

`useLessonPageShell` ở root lessons (không phải trong `content-editor/`) vì đây là **layout hook** — quản lý cover, icon, và shell state, không phải nội dung bài học.

Các components (`CoverImage`, `CoverUploadModal`, `IconPicker`, `LessonTitleEditor`) chỉ tồn tại trong admin — phiên bản read-only (`CoverDisplay`, etc.) nằm trong `@vizteck/core`.
