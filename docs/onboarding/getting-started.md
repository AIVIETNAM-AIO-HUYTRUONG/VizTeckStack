# Bắt đầu với VizTeckStack

Sau khi hoàn thành hướng dẫn này, bạn sẽ có tất cả bốn service chạy trên máy local và có thể xem roadmap trên trình duyệt cũng như quản lý chúng trong admin panel.

**Thời gian:** ~15 phút

---

## Yêu cầu trước khi bắt đầu

| Công cụ | Phiên bản | Cài đặt |
|---------|-----------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | 10+ | `npm install -g pnpm` |
| Docker Desktop | mới nhất | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Git | bất kỳ | [git-scm.com](https://git-scm.com) |

Kiểm tra phiên bản:

```bash
node -v      # phải in v20.x.x trở lên
pnpm -v      # phải in 10.x.x trở lên
docker -v    # phải in Docker version ...
```

---

## Bước 1: Clone và cài đặt dependencies

```bash
git clone git@github.com:AIVIETNAM-AIO-HUYTRUONG/VizTeckStack.git
cd VizTeckStack
pnpm install
```

pnpm sẽ cài packages cho tất cả workspace. Lần đầu mất khoảng 1 phút.

---

## Bước 2: Khởi động database

VizTeckStack dùng PostgreSQL chạy trong Docker:

```bash
docker compose up -d postgres
```

Kiểm tra đang chạy:

```bash
docker compose ps
```

Kết quả mong đợi:
```
NAME       STATUS    PORTS
postgres   running   0.0.0.0:5432->5432/tcp
```

---

## Bước 3: Thiết lập file môi trường

Mỗi app cần file `.env` riêng. Copy từ file mẫu:

```bash
cp apps/api-gateway/.env.example apps/api-gateway/.env
cp apps/svc-roadmap/.env.example apps/svc-roadmap/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Các giá trị mặc định hoạt động được ngay — không cần chỉnh sửa cho môi trường local.

---

## Bước 4: Khởi tạo database

Đẩy schema và seed dữ liệu demo:

```bash
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:push
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:seed
```

Kết quả mong đợi từ seed: `Seeded X roadmaps, Y nodes`.

---

## Bước 5: Generate gRPC types

Các service giao tiếp qua gRPC (Protocol Buffers). Generate TypeScript types từ file `.proto`:

```bash
cd packages/proto && node generate.js && cd ../..
```

Kết quả mong đợi: `Generated roadmap.ts`.

---

## Bước 6: Chạy tất cả service

```bash
pnpm dev
```

Turborepo khởi động cả bốn service theo thứ tự dependency. Chờ đến khi thấy output từ tất cả:

```
api-gateway  | [NestJS] Application is running on: http://[::1]:3000
svc-roadmap  | [NestJS] Microservice is listening
web          | ▲ Next.js 15 ready on http://localhost:3001
admin        | ▲ Next.js 15 ready on http://localhost:3002
```

---

## Bước 7: Mở các ứng dụng

| App | URL | Chức năng |
|-----|-----|-----------|
| Public viewer | http://localhost:3001 | Xem roadmap (chỉ đọc) |
| Admin CMS | http://localhost:3002 | Tạo và chỉnh sửa roadmap |
| API docs | http://localhost:3000/api-docs | Swagger UI cho REST |
| GraphQL | http://localhost:3000/graphql | Apollo Sandbox |

Để đăng nhập admin panel:
1. Mở http://localhost:3002
2. Bạn sẽ được chuyển đến `/login`
3. Nhập token: `supersecret` (được set trong `ADMIN_TOKEN` tại `apps/api-gateway/.env`)

---

## Kết quả

Bạn đã có một instance VizTeckStack hoàn chỉnh trên máy local với:
- PostgreSQL với dữ liệu roadmap được seed sẵn
- gRPC service (`svc-roadmap`) đọc/ghi database
- NestJS API gateway cung cấp REST + GraphQL cho frontend
- Hai Next.js frontend: public viewer và admin CMS

**Tiếp theo:**
- Đọc [Tổng quan kiến trúc](./architecture.md) để hiểu các thành phần kết nối với nhau
- Đọc [Quy trình làm việc hàng ngày](./daily-workflow.md) để biết cách làm việc với Git
- Xem [Cheat Sheet](./cheatsheet.md) để có tất cả lệnh trong một trang

---

## Xử lý lỗi

**`docker compose up -d postgres` thất bại**
Đảm bảo Docker Desktop đang chạy. Trên Windows, cần khởi động từ system tray.

**`pnpm install` lỗi peer dependency**
Chạy `pnpm install --no-strict-peer-dependencies`.

**Port đã được dùng**
Tắt process đang chiếm port:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill
```

**`db:push` lỗi "connection refused"**
Database chưa chạy. Chạy `docker compose up -d postgres`, đợi 5 giây rồi thử lại.

**Turbopack cache cũ (admin page trả về 404)**
```bash
rm -rf apps/admin/.next
# khởi động lại pnpm dev
```
