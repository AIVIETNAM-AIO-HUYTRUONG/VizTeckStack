# Apply GitFlow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển VizTeckStack từ simple GitHub Flow sang Full GitFlow với `develop` branch, GitHub Actions CI/CD, và branch protection rules.

**Architecture:** Tạo `develop` branch làm integration branch (deploy staging), dọn stale branches, tạo 3 GitHub Actions workflows (CI, staging deploy, production release), và document branch protection rules thủ công trên GitHub UI.

**Tech Stack:** Git, GitHub Actions, pnpm@10.30.2, Turborepo, Vercel CLI

## Global Constraints

- pnpm@10.30.2 — dùng `pnpm install --frozen-lockfile` trong CI
- Node.js 20 LTS trong CI (project local dùng v24, CI dùng LTS để stable)
- Branch naming: lowercase kebab-case (`feature/`, `release/`, `hotfix/`)
- Tất cả merge dùng `--no-ff` để giữ lịch sử rõ ràng
- Không push thẳng vào `main` hoặc `develop` — luôn qua PR

---

## Task 1: Tạo develop branch

**Files:**
- Không có file thay đổi — chỉ git operations

**Interfaces:**
- Produces: branch `develop` trên remote, là base cho tất cả feature branches

- [ ] **Step 1: Tạo develop từ main**

```bash
git checkout main
git checkout -b develop
```

- [ ] **Step 2: Push develop lên remote**

```bash
git push -u origin develop
```

Expected output:
```
Branch 'develop' set up to track remote branch 'develop' from 'origin'.
```

- [ ] **Step 3: Verify**

```bash
git branch -a | grep develop
```

Expected: `* develop` và `remotes/origin/develop`

---

## Task 2: Dọn stale branches

**Files:**
- Không có file thay đổi — chỉ git operations

**Interfaces:**
- Consumes: remote branches từ Task 1

- [ ] **Step 1: Xoá stale branches trên remote**

```bash
git push origin --delete e2e/admin || true
git push origin --delete feat/lesson-crud-feature || true
git push origin --delete feat/packages-lessons || true
git push origin --delete feat/vizteckstack-implementation || true
git push origin --delete refactor/admin-ui-feature-first || true
git push origin --delete refactor/web-feature-first || true
```

- [ ] **Step 2: Xoá local branches tương ứng**

```bash
git branch -d e2e/admin 2>/dev/null || true
git branch -d feat/lesson-crud-feature 2>/dev/null || true
git branch -d feat/packages-lessons 2>/dev/null || true
git branch -d feat/vizteckstack-implementation 2>/dev/null || true
git branch -d refactor/admin-ui-feature-first 2>/dev/null || true
git branch -d refactor/web-feature-first 2>/dev/null || true
git branch -d gsd-reviewfix/03-3022 2>/dev/null || true
```

- [ ] **Step 3: Verify chỉ còn main và develop**

```bash
git branch -a
```

Expected: `develop`, `main`, `remotes/origin/develop`, `remotes/origin/main`

---

## Task 3: CI Workflow

Chạy lint + test + build trên mọi branch khi push hoặc mở PR. Không deploy.

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: CI pipeline chạy tự động trên GitHub Actions cho tất cả branches

- [ ] **Step 1: Tạo thư mục**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Tạo file `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches:
      - '**'
  pull_request:
    branches:
      - '**'

jobs:
  ci:
    name: Lint, Test & Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.30.2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate proto types
        run: cd packages/proto && node generate.js

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add CI workflow (lint, test, build)"
```

---

## Task 4: Staging Deploy Workflow

Deploy lên Vercel Staging khi push vào `develop` hoặc `release/*`.

**Files:**
- Create: `.github/workflows/deploy-staging.yml`

**Interfaces:**
- Consumes: CI workflow (Task 3) phải pass trước
- Produces: Vercel staging deployment tự động

**Prerequisite — Vercel secrets cần cấu hình trên GitHub:**

Trước khi workflow này hoạt động, cần thêm vào **GitHub repo → Settings → Secrets and variables → Actions**:

| Secret | Cách lấy |
|--------|----------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | chạy `vercel link` trong từng app, xem `.vercel/project.json` |
| `VERCEL_PROJECT_ID_WEB` | `.vercel/project.json` trong `apps/web` |
| `VERCEL_PROJECT_ID_ADMIN` | `.vercel/project.json` trong `apps/admin` |

- [ ] **Step 1: Tạo file `.github/workflows/deploy-staging.yml`**

```yaml
name: Deploy Staging

on:
  push:
    branches:
      - develop
      - 'release/**'

jobs:
  deploy-web-staging:
    name: Deploy apps/web → Staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.30.2

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Deploy apps/web to Vercel Staging
        run: npx vercel --cwd apps/web --token ${{ secrets.VERCEL_TOKEN }} --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_WEB }}

  deploy-admin-staging:
    name: Deploy apps/admin → Staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.30.2

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Deploy apps/admin to Vercel Staging
        run: npx vercel --cwd apps/admin --token ${{ secrets.VERCEL_TOKEN }} --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_ADMIN }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy-staging.yml
git commit -m "ci: add staging deploy workflow"
```

---

## Task 5: Production Release Workflow

Khi push tag `v*` (ví dụ `v1.1.0`): build → deploy production → tạo GitHub Release tự động.

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: git tag `v*` được push lên remote
- Produces: Vercel production deployment + GitHub Release với auto-generated changelog

**Prerequisite — thêm secrets:**

| Secret | Mô tả |
|--------|-------|
| `VERCEL_PROJECT_ID_WEB` | (đã có từ Task 4) |
| `VERCEL_PROJECT_ID_ADMIN` | (đã có từ Task 4) |

- [ ] **Step 1: Tạo file `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy-web-production:
    name: Deploy apps/web → Production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.30.2

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Deploy apps/web to Vercel Production
        run: npx vercel --cwd apps/web --token ${{ secrets.VERCEL_TOKEN }} --prod --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_WEB }}

  deploy-admin-production:
    name: Deploy apps/admin → Production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.30.2

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Deploy apps/admin to Vercel Production
        run: npx vercel --cwd apps/admin --token ${{ secrets.VERCEL_TOKEN }} --prod --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_ADMIN }}

  github-release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    needs: [deploy-web-production, deploy-admin-production]
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add production release workflow"
```

---

## Task 6: Push workflows lên develop + tạo PR

Workflows sống trên `develop` trước, sau đó merge vào `main` qua PR để kích hoạt.

- [ ] **Step 1: Push develop lên remote**

```bash
git push origin develop
```

- [ ] **Step 2: Tạo PR trên GitHub**

Vào GitHub → New Pull Request: `develop → main`

Title: `chore: apply Full GitFlow structure`

Body:
```
## Changes
- Thêm branch `develop` làm integration/staging branch
- Xoá 7 stale branches đã merged
- CI workflow: lint + test + build trên mọi branch
- Staging deploy: auto-deploy khi push vào develop/release/*
- Production release: auto-deploy + GitHub Release khi push tag v*

## Setup required after merge
- Thêm Vercel secrets vào GitHub repo settings (xem deploy workflows)
- Bật branch protection rules (xem docs bên dưới)
```

- [ ] **Step 3: Merge PR vào main**

Merge trên GitHub UI (dùng "Create a merge commit" — không squash).

- [ ] **Step 4: Pull main về local**

```bash
git checkout main
git pull origin main
git checkout develop
git merge --no-ff main
git push origin develop
```

---

## Task 7: Branch Protection Rules (Manual)

Thực hiện trên **GitHub → Settings → Branches**.

- [ ] **Step 1: Bảo vệ `main`**

Add rule cho `main`:
- [x] Require a pull request before merging
- [x] Require approvals: 1 (có thể tự approve nếu solo)
- [x] Require status checks to pass: chọn `CI / Lint, Test & Build`
- [x] Do not allow bypassing the above settings

- [ ] **Step 2: Bảo vệ `develop`**

Add rule cho `develop`:
- [x] Require a pull request before merging
- [x] Require status checks to pass: chọn `CI / Lint, Test & Build`

- [ ] **Step 3: Bật auto-delete branches**

GitHub → Settings → General → cuộn xuống "Pull Requests":
- [x] Automatically delete head branches

---

## Kết quả cuối cùng

Sau khi hoàn thành:

```
main          ← production (protected, CI required)
develop       ← staging (protected, CI required)
  ↑
feature/*     ← tạo từ develop, merge về develop qua PR
release/*     ← tạo từ develop, deploy staging preview
hotfix/*      ← tạo từ main, merge vào main + develop

CI:           chạy trên tất cả branches
Staging:      auto-deploy khi push develop / release/*
Production:   auto-deploy khi push tag v*
GitHub Release: tự động tạo khi push tag v*
```
