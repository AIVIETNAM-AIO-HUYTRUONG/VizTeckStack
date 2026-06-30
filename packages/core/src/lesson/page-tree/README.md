# page-tree — Sub-feature Cây Trang

Sidebar điều hướng giữa các node bài học trong một roadmap.

## Các file

| File | Vai trò |
|------|---------|
| `components/PageTreeSidebar.tsx` | Container sidebar — render danh sách node dạng cây |
| `components/PageTreeItem.tsx` | Một dòng trong cây: icon, title, trạng thái active |
| `hooks/usePageTree.ts` | Fetch cây trang (`fetchRoadmapTree`) và trạng thái active node |

## Cách dùng

```ts
import { PageTreeSidebar, usePageTree } from '@vizteck/core';

// Trong admin wrapper:
export function useAdminPageTree(nodeId: string) {
  return usePageTree(adminApolloClient, nodeId);
}
```
