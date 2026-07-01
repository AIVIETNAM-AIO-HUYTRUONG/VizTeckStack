---
name: vizteck:pr-prep
description: Use before creating a PR or pushing a branch — runs lint, tests, build checks, verifies conventional commit format, and catches common VizTeckStack-specific mistakes (package boundary violations, wrong Apollo imports, etc.).
user-invocable: true
---

# PR Prep Workflow

Chạy theo thứ tự này. Dừng nếu bước nào fail.

## 1. Kiểm tra package boundaries

```bash
# adminApolloClient không được import trong packages/core
grep -r "adminApolloClient" packages/core/src --include="*.ts" --include="*.tsx"
# → Phải empty

# packages/* không import từ apps/*
grep -r "from '@vizteck/admin'" packages/ --include="*.ts"
grep -r "from '.*apps/" packages/ --include="*.ts"
# → Phải empty
```

## 2. Kiểm tra lesson saves không dùng UpsertGraph

```bash
grep -r "roadmaps.*graph" apps/admin/src/features/lessons --include="*.ts" --include="*.tsx"
# → Phải empty. Lesson dùng PATCH /api/nodes/:id/content|title|cover|icon
```

## 3. Lint

```bash
pnpm lint
```

## 4. Type check + build

```bash
pnpm build
# Turborepo build theo dependency order tự động
```

## 5. Tests

```bash
pnpm test
# Chạy tất cả unit tests, bỏ qua e2e
```

## 6. Kiểm tra commit messages

Tất cả commits phải theo Conventional Commits:
```
feat: add lesson CRUD endpoints
fix: node drop broken on canvas
chore: update prisma schema
refactor: extract graph save logic
test: add unit tests for graph hooks
docs: update onboarding guide
```

Format: `<type>: <lowercase> <no trailing period>`

```bash
git log main..HEAD --oneline
# Review từng commit
```

## 7. Branch naming

```
feature/<name>    ← từ develop
hotfix/<name>     ← từ main, merge vào cả main và develop
release/<version> ← lead only
```

Không dùng: `Feature/...`, `feature/MyFeature`, camelCase.

## 8. Checklist cuối

- [ ] Không có `console.log` debug sót lại
- [ ] Không có hardcoded hex colors trong Tailwind classes
- [ ] `.env` không bị commit (check `.gitignore`)
- [ ] Turbopack stale cache: nếu trang 404 dù file tồn tại → `rm -rf apps/admin/.next` trước khi test cuối
- [ ] PR target đúng branch: `feature/*` → `develop`, không phải `main`
