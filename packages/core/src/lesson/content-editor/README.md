# content-editor — Sub-feature Soạn Thảo Nội Dung

BlockNote editor để soạn thảo và hiển thị nội dung bài học dạng rich text.

## Các file

| File | Vai trò |
|------|---------|
| `components/LessonEditor.tsx` | BlockNote editor (chỉ dùng trong admin) |
| `components/LessonViewer.tsx` | Renderer read-only cho BlockNote JSON (dùng trong apps/web) |
| `hooks/useLessonEditor.ts` | Load nội dung bài học, auto-save khi thay đổi |

## Lưu ý

`LessonEditor` lazy-load `LessonViewer` qua dynamic import. Sau refactor, path import phải là:

```ts
// Trong LessonPageShell.tsx (lesson/components/)
import("../content-editor/components/LessonViewer")
```

Không dùng `import("./LessonViewer")` — hai file hiện ở thư mục khác nhau.

## Cách dùng

```ts
import { LessonEditor, LessonViewer, useLessonEditor } from '@vizteck/core';
```
