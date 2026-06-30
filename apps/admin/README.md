# apps/admin — CMS + Graph Editor

Next.js 15, port 3002. Giao diện quản trị để tạo/sửa roadmap, chỉnh sửa graph, và soạn thảo bài học.

## Vai trò

- Quản lý roadmap: tạo, sửa, đổi trạng thái (DRAFT → PUBLIC → PRIVATE)
- Chỉnh sửa graph: kéo thả node, nối edge, lưu layout
- Soạn thảo bài học: BlockNote editor, cover image, emoji icon, page tree
- Xác thực bằng Bearer token lưu trong `localStorage('admin_token')`

## Cấu trúc

```
src/
  app/
    login/page.tsx                        — Trang đăng nhập (nhập admin token)
    roadmaps/
      page.tsx                            — Danh sách roadmap
      [id]/page.tsx                       — Graph editor (standalone, KHÔNG dùng AdminLayout)
      [id]/nodes/[nodeId]/page.tsx        — Bài học editor
  components/
    AdminLayout.tsx                       — Layout chính với sidebar
    ThemeToggle.tsx                       — Chuyển dark/light mode
    ConfirmDialog.tsx                     — Dialog xác nhận hành động nguy hiểm
    ApolloProvider.tsx                    — adminApolloClient provider
  hooks/
    useAuthGuard.ts                       — Redirect về /login nếu chưa xác thực
    useRouteGuard.ts                      — Cảnh báo rời trang khi có thay đổi chưa lưu
  features/
    roadmaps/                             — Feature: quản lý roadmap
      graph-editor/                       — Sub_feature: chỉnh sửa graph
    lessons/                              — Feature: quản lý bài học
      content-editor/                     — Sub_feature: soạn thảo nội dung
      page-tree/                          — Sub_feature: cây trang
      search/                             — Sub_feature: tìm kiếm
  lib/
    apolloClient.ts                       — adminApolloClient singleton (inject vào useAdmin* hooks)
    api.ts                                — apiFetch: đính kèm Bearer token, redirect khi 401
```

## Quy tắc quan trọng

- **Graph editor page** (`roadmaps/[id]/page.tsx`) **KHÔNG** dùng `AdminLayout` — tự quản lý layout với `height: 100vh`
- **Admin hooks** là thin wrapper: nhận tham số rồi inject `adminApolloClient` vào hook tương ứng của `@vizteck/core`
- **Logic nghiệp vụ** không được định nghĩa ở đây — luôn nằm trong `@vizteck/core`
- **Dark mode**: `darkMode: 'class'` trong Tailwind, blocking `<script>` trong `layout.tsx` để tránh FOUC
- **Tailwind tokens**: luôn dùng `bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo` — không hardcode màu hex

## Biến môi trường

| Biến | Mặc định |
|------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` |
| `UPLOADTHING_TOKEN` | _(bắt buộc cho upload cover)_ |

Copy `apps/admin/.env.example` → `apps/admin/.env.local` trước khi chạy.

## Chạy tests

```bash
pnpm --filter @vizteck/admin test
pnpm --filter @vizteck/admin test -- --watch
```
