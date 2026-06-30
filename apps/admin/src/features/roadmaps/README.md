# features/roadmaps — Feature Quản Lý Roadmap (Admin)

Admin wrappers và UI cho tính năng roadmap. Logic nghiệp vụ nằm ở `@vizteck/core/roadmap`.

## Các file

| File | Vai trò |
|------|---------|
| `hooks/useRoadmaps.ts` | `useAdminRoadmaps()` — inject `adminApolloClient` vào `useRoadmaps` từ core |
| `components/RoadmapModal.tsx` | Modal tạo mới / chỉnh sửa roadmap |

## Sub-feature

| Folder | Vai trò |
|--------|---------|
| `graph-editor/` | Toàn bộ UI và hooks cho canvas kéo thả |

## Pattern

```ts
// hooks/useRoadmaps.ts
import { useRoadmaps } from '@vizteck/core';
import { adminApolloClient } from '@/lib/apolloClient';

export function useAdminRoadmaps() {
  return useRoadmaps(adminApolloClient);
}
```

Page import `useAdminRoadmaps` — không bao giờ import thẳng từ `@vizteck/core` trong pages.
