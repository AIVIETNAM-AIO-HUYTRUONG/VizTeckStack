# search — Sub-feature Tìm Kiếm (Admin)

Kết nối `SearchModal` từ `@vizteck/core` với admin Apollo client.

## Các file

| File | Vai trò |
|------|---------|
| `SearchModalWrapper.tsx` | Render `<SearchModal>` với `adminApolloClient`, wire vào `useSearchModal` |

## Cách dùng

`SearchModalWrapper` được import trực tiếp trong `apps/admin/src/app/layout.tsx` để search hoạt động toàn app:

```tsx
// app/layout.tsx
import { SearchModalWrapper } from '@/features/lessons/search/SearchModalWrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SearchModalWrapper />
      </body>
    </html>
  );
}
```
