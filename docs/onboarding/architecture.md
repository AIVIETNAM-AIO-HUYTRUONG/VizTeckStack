# Tổng quan kiến trúc

Tài liệu này giải thích tại sao VizTeckStack được thiết kế theo cách hiện tại — các quyết định và sự đánh đổi đằng sau các lựa chọn công nghệ.

---

## Bức tranh tổng thể

```
Trình duyệt
  apps/web   (Next.js 15, :3001)   — public roadmap viewer
  apps/admin (Next.js 15, :3002)   — admin CMS + graph editor

        ↓ HTTP — GraphQL / REST

  apps/api-gateway (NestJS, :3000)
    /graphql      Apollo Server
    /api/*        REST controllers
    /api-docs     Swagger UI

        ↓ gRPC (Protocol Buffers)

  apps/svc-roadmap (NestJS, :5001)
        ↓
  packages/db (Prisma → PostgreSQL :5432)

packages/
  proto   — hợp đồng gRPC (nguồn sự thật duy nhất)
  db      — Prisma client singleton
  ui      — React components dùng chung
  graph   — RoadmapGraph (React Flow)
  lesson  — LessonEditor / LessonViewer (BlockNote)
```

---

## Tại sao dùng monorepo?

Tất cả apps và packages nằm trong một Git repository, được quản lý bởi **pnpm workspaces** và **Turborepo**.

Các phương án khác:
- **Repo riêng cho mỗi service** — phức tạp khi thay đổi shared type, phải cập nhật 3 repo, 3 PR và phối hợp release.
- **Một app duy nhất** — ổn cho project nhỏ, nhưng không phù hợp khi mix Next.js và NestJS.

Monorepo cho phép một PR thay đổi shared package và tất cả apps dùng nó cùng lúc. Turborepo cache build output để không build lại các package chưa thay đổi.

---

## Tại sao có hai frontend?

`apps/web` và `apps/admin` là hai Next.js app riêng biệt với yêu cầu khác nhau:

| | `apps/web` | `apps/admin` |
|--|-----------|-------------|
| Đối tượng | Mọi người dùng internet | Admin đã xác thực |
| Rendering | Static (SSG) — nhanh, SEO tốt | Client-side — cần real-time updates |
| Xác thực | Không cần | Bearer token |

Gộp chúng thành một app đòi hỏi phải auth-gate phức tạp cho từng page và mix hai chiến lược render hoàn toàn khác nhau.

---

## Tại sao dùng gRPC giữa api-gateway và svc-roadmap?

API gateway giao tiếp với roadmap service qua **gRPC** (không phải REST hay kết nối database trực tiếp).

Lý do:
1. **Type safety xuyên suốt.** Protocol Buffers generate TypeScript types từ `packages/proto/roadmap.proto`. Nếu bạn thay đổi một field trong message, TypeScript compiler sẽ phát hiện ngay ở cả client lẫn server.
2. **Hợp đồng không phụ thuộc ngôn ngữ.** Cùng một file `.proto` hoạt động cho các service Python và Rust trong tương lai (`services/svc-python`, `services/svc-rust`). Chúng dùng cùng protocol mà không cần chia sẻ TypeScript code.
3. **Hiệu năng.** gRPC dùng HTTP/2 và serialization nhị phân, nhanh hơn JSON REST cho các lời gọi service-to-service.

Sự đánh đổi: gRPC phức tạp hơn REST để thiết lập. Package `packages/proto` trừu tượng hóa điều này — bạn chỉnh `roadmap.proto`, chạy `node generate.js`, và types được cập nhật khắp nơi.

---

## Tại sao cấu trúc feature-first trong admin?

App admin tổ chức code theo tính năng, không theo tầng kỹ thuật:

```
src/features/
  roadmaps/
    services/   ← gọi API
    hooks/      ← React state
    components/ ← UI
  graph-editor/
    services/
    hooks/
    components/
  lessons/
    services/
    hooks/
    components/
```

Phương án khác là layer-first:
```
src/
  services/    ← tất cả API calls
  hooks/       ← tất cả React state
  components/  ← tất cả UI
```

Feature-first tốt hơn cho app cỡ vừa vì:
- Mọi thứ liên quan đến "lessons" nằm trong một thư mục. Không cần tìm khắp 3 nơi.
- Tính năng có thể xóa gọn — chỉ cần xóa thư mục.
- Developer mới có thể hiểu một tính năng mà không cần đọc toàn bộ app.

**Quy tắc:** `apps/*` được phép import từ `packages/*`. `packages/*` không được import từ `apps/*`.

---

## Tại sao dùng GitFlow?

VizTeckStack dùng **Full GitFlow** thay vì các phương án đơn giản hơn như GitHub Flow.

GitHub Flow (chỉ `main` + feature branches) phù hợp với team deploy liên tục. VizTeckStack cần các release có phiên bản với môi trường staging để test trước production — GitFlow cung cấp điều này qua pipeline `develop` → `release` → `main`.

Nhánh `develop` luôn phản ánh staging. `main` luôn phản ánh production. Tính năng mới không bao giờ lên production mà chưa qua staging. Điều này quan trọng để admin và public viewer luôn nhất quán.

Xem [Quy trình làm việc hàng ngày](./daily-workflow.md) để biết cách hoạt động thực tế.

---

## Tại sao dùng BlockNote cho lesson editor?

`packages/lesson` bọc **BlockNote** — một rich-text editor lưu nội dung dưới dạng JSON (không phải HTML hay markdown).

Lưu JSON có nghĩa là:
- Nội dung có thể query và transform mà không cần parse HTML.
- Cùng một JSON nội dung có thể render khác nhau trên `apps/web` (chỉ đọc) và `apps/admin` (có thể chỉnh sửa) thông qua `<LessonViewer>` và `<LessonEditor>`.
- Dark mode được component tự xử lý (MutationObserver trên `document.documentElement`) — không cần thêm code trong app.

---

## Luồng dữ liệu: xem roadmap

```
Người dùng truy cập /roadmap/frontend (apps/web)
  → web gọi GET /api/roadmaps/frontend (api-gateway, cache: no-store)
  → api-gateway gọi GetRoadmapBySlug qua gRPC (svc-roadmap)
  → svc-roadmap truy vấn Prisma (PostgreSQL)
  → trả về RoadmapItem + NodeItems + EdgeItems
  → api-gateway serialize thành JSON REST response
  → web render <RoadmapGraph mode="view"> (packages/graph)
```

`cache: 'no-store'` trên web fetches là cố ý — public viewer phản ánh ngay các thay đổi từ admin mà không cần rebuild.

---

## Luồng dữ liệu: lưu nội dung lesson

```
Admin chỉnh sửa lesson trong LessonEditor (apps/admin)
  → hook useLessonEditor gọi PATCH /api/nodes/:id/content
  → api-gateway gọi UpdateNodeContent qua gRPC (svc-roadmap)
  → svc-roadmap chạy prisma.node.update({ where: { id }, data: { content } })
```

Nội dung lesson được lưu qua **cập nhật từng dòng có mục tiêu** — không phải full graph upsert (`POST /api/roadmaps/:id/graph`). Graph upsert xóa và chèn lại toàn bộ nodes, dẫn đến mất dữ liệu từ các node không có trong payload.
