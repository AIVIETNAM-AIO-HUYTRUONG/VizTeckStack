# Quy trình làm việc hàng ngày

Hướng dẫn này giải thích những việc bạn làm mỗi ngày: nhận task, viết code và merge vào codebase.

---

## Mô hình nhánh (Branch model)

VizTeckStack dùng **Full GitFlow**. Hai nhánh tồn tại lâu dài:

| Nhánh | Tương ứng với | Bạn có push trực tiếp không? |
|-------|--------------|------------------------------|
| `main` | Production | Không — chỉ qua release |
| `develop` | Staging | Không — chỉ qua feature PR |

```
main      ──────────────────────────────────→  (production)
develop   ──────────────────────────────────→  (staging)
```

---

## Lifecycle của một tính năng thông thường

### Bước 1 — Tạo nhánh mới từ `develop`

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ten-tinh-nang
```

### Bước 2 — Code và commit

Dùng định dạng Conventional Commits:

```bash
git commit -m "feat: thêm lesson CRUD endpoints"
git commit -m "test: thêm unit tests cho lesson"
```

Định dạng: `<type>: <mô tả>` — không viết hoa chữ đầu, không dấu chấm cuối.

Các type: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`

### Bước 3 — Mở Pull Request vào `develop`

```bash
git push origin feature/ten-tinh-nang
```

Vào GitHub → repo → "Compare & pull request". Thiết lập:
- **Base:** `develop`
- **Compare:** `feature/ten-tinh-nang`

CI chạy tự động (`lint → test → build`). **PR không thể merge khi CI chưa pass.**

### Bước 4 — Merge vào `develop`

Sau khi merge, CI/CD tự động **deploy lên staging** (Vercel). Team test trên staging.

### Bước 5 — Chuẩn bị release _(lead làm)_

Khi một batch tính năng sẵn sàng để ship:

```bash
git checkout develop
git checkout -b release/1.1.0

# Chỉ được commit bugfix tại đây — không thêm tính năng mới
git commit -m "chore: bump version to 1.1.0"
```

Mở hai PR:
- `release/1.1.0` → `main`
- `release/1.1.0` → `develop`

### Bước 6 — Merge vào `main` và tag

```bash
git checkout main
git merge --no-ff release/1.1.0
git tag v1.1.0
git push origin main v1.1.0
```

Tag `v*` kích hoạt deploy lên **production** và tự động tạo GitHub Release.

Sau đó merge trở lại `develop` để đồng bộ:

```bash
git checkout develop
git merge --no-ff release/1.1.0
git push origin develop

# Xóa release branch
git branch -d release/1.1.0
git push origin --delete release/1.1.0
```

---

## Lifecycle của hotfix (lỗi khẩn cấp trên production)

Hotfix bỏ qua `develop` và đi **thẳng từ `main`**:

```bash
# Bước 1 — Tách từ main, KHÔNG phải develop
git checkout main
git pull origin main
git checkout -b hotfix/fix-loi-dang-nhap

# Bước 2 — Fix, commit, push, mở PR vào main
git commit -m "fix: prevent crash on login page"
git push origin hotfix/fix-loi-dang-nhap
# Mở PR: hotfix/* → main

# Bước 3 — Sau khi merge vào main, merge luôn vào develop để đồng bộ
git checkout develop
git merge --no-ff main
git push origin develop
```

Hotfix luôn tăng PATCH version (ví dụ: `v1.0.0` → `v1.0.1`).

---

## Sơ đồ tổng quan

```
main      ←──────────────────── release/1.1.0 ←── develop
            ↑                                          ↑
         hotfix/fix-x                         feature/them-bai-hoc
            ↓                                 feature/sua-giao-dien
develop   ←──────────────────────────────────────────┘
```

---

## Quy tắc đặt tên nhánh

| Loại nhánh | Pattern | Branch từ | Merge vào |
|-----------|---------|-----------|-----------|
| Tính năng mới / bugfix thường | `feature/<tên>` | `develop` | `develop` |
| Fix khẩn cấp production | `hotfix/<tên>` | `main` | `main` + `develop` |
| Chuẩn bị release | `release/<version>` | `develop` | `main` + `develop` |

Quy tắc: luôn dùng lowercase kebab-case — `feature/lesson-crud`, không phải `feature/LessonCRUD`.

---

## Chạy tests trước khi push

```bash
# Chạy tất cả tests
pnpm test

# Chỉ chạy tests của một package
pnpm --filter @vizteck/admin test
pnpm --filter @vizteck/svc-roadmap test
pnpm --filter @vizteck/api-gateway test

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

---

## Liên quan

- [Tổng quan kiến trúc](./architecture.md) — tại sao dùng GitFlow
- [CI/CD Pipeline](./cicd.md) — mỗi hành động Git kích hoạt pipeline nào
