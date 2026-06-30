# apps/web — Viewer Công Khai

Next.js 15, port 3001. Hiển thị roadmap và bài học cho người dùng cuối — không yêu cầu đăng nhập.

## Vai trò

- Fetch dữ liệu phía server qua GraphQL với `{ cache: 'no-store' }` để luôn phản ánh trạng thái mới nhất từ admin
- Chỉ hiển thị roadmap có `status = PUBLIC`
- Không có trạng thái phía client — mọi logic nghiệp vụ lấy từ `@vizteck/core`

## Cấu trúc

```
src/
  app/
    (main)/
      page.tsx                        — Trang chủ: danh sách roadmap
      layout.tsx                      — Layout chính (header, theme)
      roadmap/[slug]/page.tsx         — Trang roadmap: graph view
    roadmap/[slug]/node/[id]/page.tsx — Trang bài học
  components/
    ApolloProvider.tsx                — Apollo client cho SSR
    Breadcrumb.tsx                    — Breadcrumb điều hướng
    SearchButton.tsx                  — Nút mở search modal
    ThemeToggle.tsx                   — Chuyển dark/light mode
  features/
    roadmap/
      components/RoadmapGraphView.tsx — Wrapper <RoadmapGraph mode="view"> từ @vizteck/core
    lesson/
      components/LessonLayout.tsx     — Wrapper <LessonPageShell mode="view"> từ @vizteck/core
    search/
      SearchContext.tsx               — Context quản lý trạng thái search modal
      SearchModalWrapper.tsx          — Kết nối SearchModal từ @vizteck/core với web Apollo client
  lib/
    gql.ts                            — Apollo Client cho server-side fetch
```

## Quy tắc

- **Không định nghĩa logic nghiệp vụ ở đây** — luôn import từ `@vizteck/core`
- **Không dùng `adminApolloClient`** — chỉ dùng `gql.ts` phía server
- **Không wrap trong `AdminLayout`** — layout của web là riêng biệt
- **Tất cả fetch đều dùng `{ cache: 'no-store' }`** để viewer luôn cập nhật theo admin

## Biến môi trường

| Biến | Mặc định |
|------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` |

Copy `apps/web/.env.example` → `apps/web/.env.local` trước khi chạy.
