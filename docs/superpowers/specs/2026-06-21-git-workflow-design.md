# Git Workflow Design

**Date:** 2026-06-21
**Project:** VizTeckStack
**Author:** Solo developer
**Strategy:** Full GitFlow

---

## Context

VizTeckStack là polyglot monorepo (Next.js + NestJS + gRPC). Project phát triển solo, có kế hoạch deploy CI/CD qua GitHub Actions và Vercel với hai môi trường: staging và production. Cần versioning (semver) và release notes.

---

## Branch Structure

| Branch | Mục đích | Deploy tới |
|--------|----------|------------|
| `main` | Production-ready code, luôn stable | Production |
| `develop` | Integration branch, latest working code | Staging |
| `feature/<tên>` | Tính năng mới, tách từ `develop` | — |
| `release/<x.y.z>` | Freeze + fix nhỏ trước khi ship | Staging (preview) |
| `hotfix/<tên>` | Fix khẩn cấp trên production | Production |

### Flow

```
feature/* ──→ develop ──→ release/x.y.z ──→ main (tag vx.y.z)
                  ↑                              │
                  └──────────────────────────────┘ (merge back)

hotfix/* ──→ main (tag) + develop
```

### Branch naming convention

- Lowercase, kebab-case
- `feature/lesson-crud`, `feature/graph-editor`
- `release/1.0.0`, `release/1.1.0`
- `hotfix/fix-node-drop`
- Không dùng `Feat/`, `Refactor/`, hay PascalCase

---

## CI/CD Mapping

| Branch | Trigger | Pipeline | Deploy |
|--------|---------|----------|--------|
| `develop` | push | lint → test → build | Vercel Staging |
| `release/*` | push | lint → test → build | Vercel Staging (preview URL) |
| `main` | push | lint → test → build | Vercel Production |
| `feature/*` | push / PR open | lint → test | — |
| `hotfix/*` | push / PR open | lint → test | — |

### Tag-based release

Khi merge `release/x.y.z` vào `main`, tạo tag `vx.y.z` → GitHub Actions tự tạo GitHub Release với changelog.

```
merge release/1.0.0 → main
  └─→ git tag v1.0.0
       └─→ GitHub Release (auto-generated)
            └─→ Vercel Production deploy
```

### GitHub Actions workflow files

- `.github/workflows/ci.yml` — lint + test trên tất cả branches
- `.github/workflows/deploy-staging.yml` — deploy khi push vào `develop` hoặc `release/*`
- `.github/workflows/deploy-production.yml` — deploy + tạo release khi push tag `v*`

---

## Release Process

### Semantic Versioning: `MAJOR.MINOR.PATCH`

| Loại thay đổi | Bump | Ví dụ |
|---------------|------|-------|
| Breaking change | MAJOR | `1.0.0 → 2.0.0` |
| Tính năng mới | MINOR | `1.0.0 → 1.1.0` |
| Bug fix / hotfix | PATCH | `1.0.0 → 1.0.1` |

### Release lifecycle

```bash
# 1. Tạo release branch từ develop
git checkout develop
git checkout -b release/1.1.0

# 2. Fix nhỏ nếu cần (chỉ bugfix, không thêm feature mới)

# 3. Merge vào main + tag
git checkout main
git merge --no-ff release/1.1.0
git tag v1.1.0

# 4. Merge back vào develop
git checkout develop
git merge --no-ff release/1.1.0

# 5. Xoá release branch
git branch -d release/1.1.0
git push origin --delete release/1.1.0
```

### Hotfix lifecycle

```bash
# 1. Tách từ main (không từ develop)
git checkout main
git checkout -b hotfix/fix-node-drop

# 2. Fix

# 3. Merge vào main + tag PATCH
git checkout main
git merge --no-ff hotfix/fix-node-drop
git tag v1.0.1

# 4. Merge back vào develop
git checkout develop
git merge --no-ff hotfix/fix-node-drop

# 5. Xoá hotfix branch
git branch -d hotfix/fix-node-drop
git push origin --delete hotfix/fix-node-drop
```

---

## Commit Convention

Dùng Conventional Commits để auto-generate changelog:

```
feat: add lesson crud endpoints
fix: resolve node drop bug on canvas
chore: update prisma schema
docs: add git workflow spec
refactor: move components to features/
test: add unit tests for graph hooks
```

Format: `<type>: <mô tả ngắn>` — không viết hoa chữ đầu, không dấu chấm cuối.

---

## Branch Protection Rules (GitHub)

- `main`: require PR, no direct push
- `develop`: require PR từ `feature/*` hoặc `hotfix/*`
- Delete branch after merge: bật

---

## Dọn dẹp branches hiện tại

Các stale branches cần xoá sau khi đã merged:

- `feat/vizteckstack-implementation`
- `feat/lesson-crud-feature`
- `feat/packages-lessons`
- `refactor/admin-ui-feature-first`
- `refactor/web-feature-first`
- `e2e/admin`
- `gsd-reviewfix/03-3022`
