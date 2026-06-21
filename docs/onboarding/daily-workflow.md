# Quy trình làm việc hàng ngày

Hướng dẫn này giải thích những việc bạn làm mỗi ngày: nhận task, viết code và merge vào codebase.

---

## Mô hình nhánh (Branch model)

VizTeckStack dùng **Full GitFlow**. Hai nhánh tồn tại lâu dài:

| Nhánh | Tương ứng với | Bạn có push trực tiếp không? |
|-------|--------------|------------------------------|
| `main` | Production | Không — chỉ qua release |
| `develop` | Staging | Không — chỉ qua feature PR |

Bạn luôn làm việc trên các nhánh ngắn hạn (short-lived) được tách ra từ `develop`, sau đó mở pull request trở về `develop`.

---

## Bắt đầu một tính năng mới

```bash
# 1. Luôn bắt đầu từ develop đã được cập nhật
git checkout develop
git pull origin develop

# 2. Tạo nhánh feature
git checkout -b feature/ten-tinh-nang
```

Quy tắc đặt tên nhánh:
- `feature/` — tính năng mới hoặc bugfix thông thường
- `hotfix/` — fix khẩn cấp trên production (tách từ `main`, không phải `develop`)
- `release/` — chuẩn bị release (chỉ lead tạo)
- Dùng lowercase kebab-case: `feature/lesson-crud`, không phải `feature/LessonCRUD`

---

## Cách commit

Dùng định dạng Conventional Commits:

```bash
git commit -m "feat: thêm lesson CRUD endpoints"
git commit -m "fix: sửa lỗi node drop trên canvas"
git commit -m "chore: cập nhật prisma schema"
git commit -m "test: thêm unit tests cho graph hooks"
git commit -m "docs: cập nhật hướng dẫn onboarding"
```

Định dạng: `<type>: <mô tả>` — không viết hoa chữ đầu, không dấu chấm cuối.

Các type: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`

---

## Mở pull request

Push nhánh và mở PR nhắm vào `develop`:

```bash
git push origin feature/ten-tinh-nang
```

Vào GitHub → repo → "Compare & pull request". Thiết lập:
- **Base:** `develop`
- **Compare:** `feature/ten-tinh-nang`

CI sẽ chạy tự động (`lint → test → build`). PR không thể merge khi CI chưa pass.

Sau khi merge, GitHub tự động xóa nhánh feature của bạn.

---

## Fix lỗi production khẩn cấp (hotfix)

Hotfix bỏ qua `develop` và đi thẳng vào `main`:

```bash
# 1. Tách từ main
git checkout main
git pull origin main
git checkout -b hotfix/fix-loi-dang-nhap

# 2. Fix, commit, push, mở PR vào main
git push origin hotfix/fix-loi-dang-nhap
# Mở PR: hotfix/* → main

# 3. Sau khi merge vào main, merge luôn vào develop
git checkout develop
git merge --no-ff main
git push origin develop
```

Hotfix luôn tăng PATCH version (ví dụ: `v1.0.0` → `v1.0.1`).

---

## Quy trình release

Việc này không cần làm cho feature thông thường — chỉ khi một batch tính năng sẵn sàng để ship.

```bash
# 1. Tách release branch từ develop
git checkout develop
git checkout -b release/1.1.0

# 2. Chỉ được commit bugfix tại đây — không thêm tính năng mới

# 3. Merge vào main
git checkout main
git merge --no-ff release/1.1.0
git tag v1.1.0
git push origin main v1.1.0
# → CI tự deploy lên production và tạo GitHub Release

# 4. Merge trở lại develop
git checkout develop
git merge --no-ff release/1.1.0
git push origin develop

# 5. Xóa release branch
git branch -d release/1.1.0
git push origin --delete release/1.1.0
```

---

## Chạy tests trước khi push

```bash
# Chạy tất cả tests
pnpm test

# Chỉ chạy tests của admin
pnpm --filter @vizteck/admin test

# Chỉ chạy tests của svc-roadmap
pnpm --filter @vizteck/svc-roadmap test

# Chạy tests ở chế độ watch (trong khi phát triển)
pnpm --filter @vizteck/admin test -- --watch
```

CI chạy cùng lệnh `pnpm test` — nếu pass trên máy local thì sẽ pass trên CI.

---

## Cập nhật database schema

Khi bạn thay đổi `packages/db/prisma/schema.prisma`:

```bash
# Trong quá trình phát triển (không tạo migration file, nhanh hơn)
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:push

# Cho migration thực sự (tạo migration file để commit)
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" pnpm --filter @vizteck/db db:migrate
```

Luôn commit migration files trong cùng PR với code sử dụng schema mới.

---

## Thêm gRPC method mới

Contract gRPC nằm trong `packages/proto/roadmap.proto`. Khi thay đổi:

```bash
cd packages/proto && node generate.js
```

Lệnh này regenerate `packages/proto/generated/roadmap.ts`. Commit cả file `.proto` và file generated.

> Lưu ý: `pnpm proto:gen` dùng Turborepo cache và có thể replay kết quả cũ. Sau khi sửa `.proto`, luôn chạy `node generate.js` trực tiếp.
