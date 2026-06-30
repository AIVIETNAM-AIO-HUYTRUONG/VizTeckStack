# packages/ — Shared Libraries

Các package dùng chung trong monorepo VizTeckStack.

## Danh sách

| Package | Tên npm | Vai trò |
|---------|---------|---------|
| `core` | `@vizteck/core` | **Nguồn sự thật duy nhất** — toàn bộ logic nghiệp vụ, hooks, UI components |
| `db` | `@vizteck/db` | Prisma client singleton + tất cả generated types |
| `proto` | `@vizteck/proto` | Định nghĩa gRPC contract (`.proto` → TypeScript) |
| `graphql-client` | `@vizteck/graphql-client` | Apollo operations được generate từ GraphQL schema |
| `ui` | `@vizteck/ui` | UI primitives dùng chung: `Button`, `Card`, `NodeBadge` |
| `graph` | `@vizteck/graph` | **Shim** — chỉ re-export từ `@vizteck/core` |
| `lesson` | `@vizteck/lesson` | **Shim** — chỉ re-export từ `@vizteck/core` |

## Quy tắc dependency

```
packages/core   → có thể import packages/graphql-client, @xyflow/react, packages/ui
packages/graph  → chỉ import từ packages/core (shim)
packages/lesson → chỉ import từ packages/core (shim)
packages/*      → KHÔNG được import từ apps/*
```

## Về shim packages

`packages/graph` và `packages/lesson` tồn tại để backward-compatibility với import paths cũ. **Đừng thêm source file mới vào đây** — mọi logic phải nằm trong `packages/core`.

## Thao tác DB

```bash
pnpm --filter @vizteck/db db:push     # Push schema lên DB (không tạo migration file)
pnpm --filter @vizteck/db db:migrate  # Tạo và chạy migration
pnpm --filter @vizteck/db db:seed     # Seed dữ liệu mẫu
pnpm --filter @vizteck/db db:studio   # Mở Prisma Studio
```
