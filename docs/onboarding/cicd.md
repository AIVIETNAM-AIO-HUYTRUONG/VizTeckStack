# CI/CD Pipeline

Tài liệu này giải thích toàn bộ vòng đời từ khi push code đến khi code xuất hiện trên production.

---

## Tổng quan: 3 pipeline, 3 mục đích

| File | Kích hoạt khi | Mục đích |
|------|--------------|----------|
| `.github/workflows/ci.yml` | Mọi PR + push vào `main`, `develop`, `release/*` | Bảo vệ chất lượng code |
| `.github/workflows/deploy-staging.yml` | Push vào `develop` hoặc `release/*` | Deploy lên staging |
| `.github/workflows/release.yml` | Push tag `v*` (ví dụ `v1.2.0`) | Deploy lên production + tạo GitHub Release |

---

## Sơ đồ kết nối GitFlow ↔ CI/CD

```
developer push feature/xxx
        ↓
    Mở PR → develop
        ↓
    [ci.yml] lint → test → build       ← phải pass mới merge được
        ↓
    Merge vào develop
        ↓
    [ci.yml] lint → test → build       ← chạy lần nữa trên develop
    [deploy-staging.yml] → Vercel Staging
        ↓
    (Team test trên staging)
        ↓
    Lead tạo release/1.2.0
        ↓
    [deploy-staging.yml] → Vercel Staging preview
        ↓
    Merge release/1.2.0 → main
    git tag v1.2.0 && git push --tags
        ↓
    [release.yml] → Vercel Production + GitHub Release
```

---

## Pipeline 1: CI (`ci.yml`)

**Kích hoạt:** Mọi pull request, và push vào `main` / `develop` / `release/*`

**Các bước:**

```
1. Checkout code
2. Cài pnpm 10.30.2
3. Cài Node.js 20
4. pnpm install --frozen-lockfile    ← lockfile phải khớp, không tự cập nhật
5. Cài protoc (Protocol Buffers compiler)
6. cd packages/proto && node generate.js   ← generate TypeScript từ .proto
7. pnpm lint     ← TypeScript type check
8. pnpm test     ← Vitest (admin) + Jest (api-gateway, svc-roadmap)
9. pnpm build    ← build toàn bộ monorepo qua Turborepo
```

**Ý nghĩa thực tế:**
- PR không thể merge vào `develop` nếu CI chưa pass
- Nếu bạn thay đổi `.proto` mà quên generate → bước 6 generate tự động, nhưng bước 7 sẽ fail nếu types cũ không còn khớp
- `pnpm test` bỏ qua E2E tests — E2E chạy riêng bằng Playwright và cần tất cả apps đang chạy

---

## Pipeline 2: Deploy Staging (`deploy-staging.yml`)

**Kích hoạt:** Push vào `develop` hoặc `release/*`

**Chạy song song 2 job:**

```
deploy-web-staging                    deploy-admin-staging
─────────────────                     ────────────────────
pnpm install                          pnpm install
proto:gen                             proto:gen
pnpm build                            pnpm build
vercel pull --cwd apps/web            vercel pull --cwd apps/admin
vercel build --cwd apps/web           vercel build --cwd apps/admin
vercel deploy --prebuilt              vercel deploy --prebuilt
      ↓                                     ↓
  Vercel Staging (web)              Vercel Staging (admin)
```

**Chiến lược `--prebuilt` — tại sao không dùng `vercel deploy` thông thường:**

Vercel có hai cách deploy:

```
Cách thông thường (bị lỗi với monorepo pnpm):
  CI → upload source → Vercel server → npm install → FAIL
       (Vercel server không biết về pnpm workspace:*)

Cách prebuilt (đang dùng):
  CI → pnpm build → vercel build → upload artifact → Vercel server chỉ serve → OK
       (build xảy ra trên CI runner nơi pnpm đã cài sẵn)
```

**3 bước deploy Vercel:**

| Lệnh | Làm gì |
|------|--------|
| `vercel pull --cwd apps/web` | Tải cấu hình project + env vars từ Vercel về CI runner, tạo `apps/web/.vercel/project.json` |
| `vercel build --cwd apps/web` | Build locally trên CI, tạo `apps/web/.vercel/output` theo format Vercel |
| `vercel deploy --prebuilt --cwd apps/web` | Upload thư mục `.vercel/output` lên Vercel — không build lại trên server |

**`vercel.json` trong mỗi app** kiểm soát cách `vercel build` chạy:

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

pnpm tự tìm workspace root (`pnpm-workspace.yaml`) khi chạy từ bất kỳ thư mục con nào — không cần `cd ../..`.

---

## Pipeline 3: Release / Production (`release.yml`)

**Kích hoạt:** Push tag có format `v*` (ví dụ `v1.0.0`, `v1.2.3`)

**Cách tạo release:**

```bash
git checkout main
git merge --no-ff release/1.2.0
git tag v1.2.0
git push origin main v1.2.0    ← push cả branch và tag cùng lúc
```

**Các job chạy:**

```
deploy-web-production ──┐
                        ├──→ (cả hai pass) ──→ github-release
deploy-admin-production─┘
```

`github-release` job chạy SAU KHI cả hai deploy thành công (`needs: [deploy-web-production, deploy-admin-production]`). Nó tự động tạo GitHub Release với changelog từ commit messages.

**Khác với staging:** Dùng `--prod` flag → deploy lên production domain thay vì preview URL.

---

## GitHub Secrets cần thiết

Vào **GitHub repo → Settings → Secrets and variables → Actions** để cấu hình:

| Secret | Lấy từ đâu | Dùng bởi |
|--------|-----------|----------|
| `VERCEL_TOKEN` | Vercel Dashboard → Account Settings → Tokens | Tất cả deploy jobs |
| `VERCEL_ORG_ID` | Vercel Dashboard → Team/Account Settings → General | Tất cả deploy jobs |
| `VERCEL_PROJECT_ID_WEB` | Vercel project `web` → Settings → General | Web deploy jobs |
| `VERCEL_PROJECT_ID_ADMIN` | Vercel project `admin` → Settings → General | Admin deploy jobs |

---

## Môi trường Vercel

| Môi trường | Trigger | URL |
|-----------|---------|-----|
| **Preview** | `vercel deploy` (không có `--prod`) | `https://<hash>-<team>.vercel.app` |
| **Production** | `vercel deploy --prod` | Domain chính đã cấu hình |

Staging deploy tạo **Preview URL** — mỗi deploy cho một URL mới. Production deploy cập nhật domain chính.

---

## Xử lý lỗi thường gặp

**CI fail ở bước `pnpm install --frozen-lockfile`**
Ai đó thêm dependency mà không commit `pnpm-lock.yaml`. Chạy `pnpm install` local và commit lockfile.

**CI fail ở bước `pnpm lint`**
TypeScript type error. Chạy `pnpm lint` local để xem lỗi cụ thể.

**CI fail ở bước `pnpm test`**
Test fail. Chạy `pnpm test` local hoặc `pnpm --filter @vizteck/<package> test` để debug.

**Deploy fail: `vercel build` lỗi Turbopack workspace**
Kiểm tra `apps/web/vercel.json` và `apps/admin/vercel.json` có dùng `pnpm build` trực tiếp (không có `cd ../..`).

**Deploy fail: Vercel secrets không tìm thấy**
Kiểm tra GitHub Secrets đã được set đúng tên. `VERCEL_PROJECT_ID_WEB` ≠ `VERCEL_PROJECT_ID`.

---

## Xem trạng thái CI/CD

- **GitHub Actions:** Tab `Actions` trong repo — xem tất cả workflow runs
- **Vercel deployments:** Vercel Dashboard → project → Deployments
- **Xem log chi tiết:** Click vào một run trong Actions → click từng step để expand log
