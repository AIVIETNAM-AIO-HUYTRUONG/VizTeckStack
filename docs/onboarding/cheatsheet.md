# Cheat Sheet cho Developer

Tham chiếu nhanh cho các lệnh, port, biến môi trường và đặt tên nhánh.

---

## Lệnh thường dùng

### Phát triển hàng ngày

```bash
pnpm dev              # Khởi động tất cả apps ở chế độ watch
pnpm build            # Build tất cả packages (theo thứ tự Turborepo)
pnpm test             # Chạy tất cả tests
pnpm lint             # Lint tất cả packages
```

### Theo từng package

```bash
pnpm --filter @vizteck/admin test          # Chỉ test admin
pnpm --filter @vizteck/svc-roadmap test    # Chỉ test svc-roadmap
pnpm --filter @vizteck/api-gateway test    # Chỉ test api-gateway
```

### Database

```bash
# Đặt biến môi trường trước khi chạy
export DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack"

pnpm --filter @vizteck/db db:push      # Đẩy thay đổi schema (không tạo migration file)
pnpm --filter @vizteck/db db:migrate   # Tạo và áp dụng migration
pnpm --filter @vizteck/db db:seed      # Seed dữ liệu demo
pnpm --filter @vizteck/db db:studio    # Mở Prisma Studio trên trình duyệt
```

### gRPC types

```bash
# Regenerate TypeScript từ roadmap.proto (bỏ qua Turborepo cache)
cd packages/proto && node generate.js
```

### Docker

```bash
docker compose up -d postgres    # Khởi động database
docker compose down              # Dừng tất cả
docker compose ps                # Kiểm tra trạng thái container
```

---

## Ports

| Service | Port | URL |
|---------|------|-----|
| `apps/web` | 3001 | http://localhost:3001 |
| `apps/admin` | 3002 | http://localhost:3002 |
| `apps/api-gateway` | 3000 | http://localhost:3000 |
| `apps/api-gateway` (GraphQL) | 3000 | http://localhost:3000/graphql |
| `apps/api-gateway` (Swagger) | 3000 | http://localhost:3000/api-docs |
| `apps/svc-roadmap` (gRPC) | 5001 | nội bộ, không truy cập trực tiếp |
| PostgreSQL | 5432 | `localhost:5432` |

---

## Biến môi trường

| Biến | Giá trị mặc định | Dùng bởi |
|------|-----------------|---------|
| `DATABASE_URL` | `postgresql://vizteck:vizteck@localhost:5432/vizteckstack` | `packages/db`, `apps/svc-roadmap` |
| `ROADMAP_SERVICE_URL` | `localhost:5001` | `apps/api-gateway` |
| `ADMIN_TOKEN` | `supersecret` | `apps/api-gateway` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | `apps/web`, `apps/admin` |
| `PORT` | `3000` | `apps/api-gateway` |
| `GRPC_PORT` | `5001` | `apps/svc-roadmap` |

Copy `.env.example` → `.env` cho NestJS apps, `.env.example` → `.env.local` cho Next.js apps.

---

## Đặt tên nhánh

| Loại nhánh | Pattern | Ví dụ |
|-----------|---------|-------|
| Tính năng mới | `feature/<tên>` | `feature/lesson-crud` |
| Bugfix thông thường | `feature/<tên>` | `feature/fix-graph-drop` |
| Fix khẩn cấp production | `hotfix/<tên>` | `hotfix/fix-loi-dang-nhap` |
| Chuẩn bị release | `release/<phiên bản>` | `release/1.2.0` |

Quy tắc: luôn dùng lowercase, kebab-case, không chữ hoa, không khoảng trắng.

---

## Các loại commit

| Type | Khi nào dùng |
|------|-------------|
| `feat` | Tính năng mới cho người dùng |
| `fix` | Sửa lỗi |
| `chore` | Bảo trì (dependencies, config, tooling) |
| `refactor` | Tái cấu trúc code mà không thay đổi hành vi |
| `test` | Thêm hoặc sửa tests |
| `docs` | Chỉ thay đổi tài liệu |
| `ci` | Thay đổi cấu hình GitHub Actions / CI |

---

## Packages dùng chung

| Package | Import | Xuất ra |
|---------|--------|---------|
| `packages/proto` | `@vizteck/proto` | Kiểu gRPC, được generate từ `roadmap.proto` |
| `packages/db` | `@vizteck/db` | `db` (PrismaClient singleton), tất cả Prisma types |
| `packages/ui` | `@vizteck/ui` | Components: `Button`, `Card`, `NodeBadge` |
| `packages/graph` | `@vizteck/graph` | `<RoadmapGraph mode="view|edit">` |
| `packages/lesson` | `@vizteck/lesson` | `<LessonEditor>` (có thể chỉnh sửa), `<LessonViewer>` (chỉ đọc) |

---

## Data model tóm tắt

| Model | Các field quan trọng |
|-------|---------------------|
| `Roadmap` | `id`, `slug`, `title`, `status` (`DRAFT\|PUBLIC\|PRIVATE`) |
| `Node` | `id`, `roadmapId`, `type` (`LESSON\|ROADMAP`), `positionX/Y`, `content` (BlockNote JSON) |
| `Edge` | `id`, `roadmapId`, `sourceId`, `targetId` |

Web viewer chỉ hiển thị roadmap có `status = PUBLIC`.
`Node.positionX/Y = null` nghĩa là node tồn tại nhưng chưa được đặt lên canvas.

---

## Xác thực Admin

Admin panel dùng một Bearer token tĩnh:

```
Authorization: Bearer supersecret
```

Set qua biến `ADMIN_TOKEN` trong `apps/api-gateway/.env`. Trên frontend, nhập token tại trang `/login` — được lưu vào `localStorage('admin_token')`.

---

## CI/CD

| Trigger | Pipeline | Deploy tới |
|---------|----------|-----------|
| PR hoặc push lên bất kỳ nhánh | lint → test → build | — |
| Push vào `develop` | lint → test → build → Vercel deploy | Staging |
| Push vào `release/*` | lint → test → build → Vercel deploy | Staging preview |
| Push tag `v*` | lint → test → build → Vercel deploy + GitHub Release | Production |
