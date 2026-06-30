---
name: vizteck:schema-change
description: Use when modifying packages/db/prisma/schema.prisma — adding fields, new models, changing relations, or renaming columns. Guides the push vs migrate decision and tracks what else needs updating.
user-invocable: true
argument-hint: "[add-field|add-model|rename|remove|relation] [target]"
---

# Schema Change Workflow

## 1. Push vs Migrate?

| Situation | Command |
|-----------|---------|
| Local dev, iterating fast, no prod data | `db:push` |
| Rename / remove column (data loss risk) | `db:migrate` |
| Change going to production | `db:migrate` |
| Adding nullable field or new table | `db:push` OK in dev |

```bash
# Push (no migration file)
pnpm --filter @vizteck/db db:push

# Migrate (creates migration file)
pnpm --filter @vizteck/db db:migrate
```

## 2. Checklist theo loại thay đổi

### Thêm field vào Node
- [ ] Cập nhật `packages/db/prisma/schema.prisma`
- [ ] Chạy `db:push` hoặc `db:migrate`
- [ ] Cập nhật type trong `packages/core/src/<feature>/types.ts`
- [ ] Cập nhật PATCH endpoint nếu field này có thể edit: `apps/api-gateway/src/controllers/nodes.controller.ts`
- [ ] Cập nhật seed nếu field required: `packages/db/prisma/seed.ts`

### Thêm model mới
- [ ] Định nghĩa model trong schema
- [ ] Chạy `db:migrate` (tên migration rõ ràng: `add_<model_name>`)
- [ ] Export type từ `packages/db/src/index.ts`
- [ ] Tạo controller/resolver trong api-gateway
- [ ] Tạo service + hook trong `packages/core`

### Rename / Remove field
- [ ] **DỪNG** — kiểm tra data production trước
- [ ] Dùng `db:migrate` KHÔNG dùng `db:push`
- [ ] Grep toàn repo: `grep -r "oldFieldName" --include="*.ts"`
- [ ] Cập nhật tất cả references

## 3. Sau khi push/migrate

```bash
# Verify Prisma client được regenerate
pnpm --filter @vizteck/db db:push  # hoặc db:migrate

# Check TypeScript vẫn compile
pnpm --filter @vizteck/api-gateway build
pnpm --filter @vizteck/core build
```

## 4. Không lưu trong DB (computed at runtime)

- `Node.targetRoadmapSlug` — computed từ full roadmap list trong api-gateway
- Không cần thêm vào schema nếu có thể compute được
