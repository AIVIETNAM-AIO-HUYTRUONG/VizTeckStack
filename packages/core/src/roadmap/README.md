# roadmap — Feature Quản Lý Roadmap

Logic nghiệp vụ cho việc tạo, sửa, xóa và hiển thị roadmap.

## Các file

| File | Vai trò |
|------|---------|
| `types.ts` | `Roadmap`, `ApolloLike`, `CreateRoadmapInput`, `UpdateRoadmapInput` |
| `roadmap.service.ts` | `getRoadmaps`, `createRoadmap`, `updateRoadmap`, `deleteRoadmap`, `cycleStatus` |
| `hooks/useRoadmaps.ts` | Trạng thái danh sách roadmap + CRUD handlers |
| `utils/constants.ts` | `STATUS_CYCLE`, `STATUS_LABEL`, `STATUS_CLASS` |

## Sub-feature

| Folder | Vai trò |
|--------|---------|
| `graph/` | Canvas kéo thả node/edge cho roadmap |

## Trạng thái Roadmap

`Roadmap.status` có 3 giá trị: `DRAFT → PUBLIC → PRIVATE` (vòng tròn qua `cycleStatus`).  
Viewer công khai (`apps/web`) chỉ hiển thị roadmap `PUBLIC`.

## Cách dùng

```ts
import { useRoadmaps } from '@vizteck/core';

// Trong admin wrapper hook:
export function useAdminRoadmaps() {
  return useRoadmaps(adminApolloClient);
}
```
