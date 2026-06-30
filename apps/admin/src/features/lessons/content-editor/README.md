# content-editor — Sub-feature Soạn Thảo Nội Dung (Admin)

Admin wrapper hook cho BlockNote editor bài học.

## Các file

| File | Vai trò |
|------|---------|
| `hooks/useLessonEditor.ts` | `useAdminLessonEditor(nodeId)` — inject `adminApolloClient` vào `useLessonEditor` từ core |

## Cách dùng

```ts
import { useAdminLessonEditor } from '@/features/lessons/content-editor/hooks/useLessonEditor';

// Trong page:
const { content, onChange, isSaving } = useAdminLessonEditor(nodeId);
```

`LessonEditor` component được import từ `@vizteck/core`, không định nghĩa lại ở đây.
