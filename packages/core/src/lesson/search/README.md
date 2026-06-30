# search — Sub-feature Tìm Kiếm Bài Học

Modal tìm kiếm toàn văn bản trên tất cả bài học trong hệ thống.

## Các file

| File | Vai trò |
|------|---------|
| `components/SearchModal.tsx` | Modal tổng thể — gọi `useSearch` và render kết quả |
| `components/SearchPreview.tsx` | Preview nội dung kết quả khi hover |
| `components/SearchResultItem.tsx` | Một dòng kết quả tìm kiếm |
| `hooks/useSearch.ts` | Gọi API tìm kiếm, group kết quả theo thời gian (`TimeGroup`) |
| `hooks/useSearchModal.ts` | Quản lý trạng thái mở/đóng modal + keyboard shortcut |

## Cách dùng

```ts
import { SearchModal, useSearchModal, useSearch } from '@vizteck/core';
```

Apps wrap `SearchModal` với client riêng — xem `apps/admin/src/features/lessons/search/SearchModalWrapper.tsx` và `apps/web/src/features/search/SearchModalWrapper.tsx`.
