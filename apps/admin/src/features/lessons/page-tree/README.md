# page-tree — Sub-feature Cây Trang (Admin)

Admin wrapper hook cho sidebar cây trang bài học.

## Các file

| File | Vai trò |
|------|---------|
| `hooks/usePageTree.ts` | `useAdminPageTree(nodeId)` — inject `adminApolloClient` vào `usePageTree` từ core |

## Cách dùng

```ts
import { useAdminPageTree } from '@/features/lessons/page-tree/hooks/usePageTree';

const { pageTree, activeNodeId } = useAdminPageTree(nodeId);
```

`PageTreeSidebar` component được import từ `@vizteck/core`, không định nghĩa lại ở đây.
