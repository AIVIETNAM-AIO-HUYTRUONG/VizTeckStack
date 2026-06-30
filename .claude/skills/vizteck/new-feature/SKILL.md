---
name: vizteck:new-feature
description: Use when adding any new feature, page, hook, component, or service to VizTeckStack. Guides correct package placement (core vs app), directory structure, and file naming before writing any code.
user-invocable: true
argument-hint: "[feature name] [area: roadmap|lesson|admin|web|api]"
---

# New Feature Workflow

Chạy checklist này TRƯỚC khi viết bất kỳ dòng code nào.

## 1. Xác định ownership

Hỏi: *Logic này có dùng ở nhiều nơi không?*

| Đây là... | Đặt ở... |
|-----------|----------|
| Business logic, service, shared hook, display component | `packages/core/src/<feature>/` |
| Admin-only UI (editable, modal, form) | `apps/admin/src/features/<feature>/` |
| Admin hook injecting Apollo client | `apps/admin/src/features/<feature>/hooks/` |
| Public viewer page | `apps/web/src/` |
| REST/GraphQL endpoint | `apps/api-gateway/src/` |
| DB schema | `packages/db/prisma/schema.prisma` |

**Rule:** Nếu nghi ngờ → đặt vào `packages/core`. Apps chỉ chứa thin wrappers.

## 2. Cấu trúc file trong core

```
packages/core/src/<feature>/
  types.ts           ← types và interfaces
  <feature>.service.ts
  hooks/
    use<Feature>.ts  ← nhận ApolloLike làm param đầu tiên
  components/
    <Feature>.tsx    ← display component (read-only default)
  utils/
```

Sub-feature thêm một level lồng bên trong, cùng pattern.

## 3. Wrapper hook trong admin

```ts
// apps/admin/src/features/<feature>/hooks/use<Feature>.ts
import { use<Feature> } from '@vizteck/core'
import { adminApolloClient } from '@/lib/apollo'

export function useAdmin<Feature>(...args) {
  return use<Feature>(adminApolloClient, ...args)
}
```

Không bao giờ import `adminApolloClient` trực tiếp trong `packages/core`.

## 4. Checklist trước khi code

- [ ] Đã xác định package đúng (core / admin / web / api)
- [ ] Đã kiểm tra xem logic này đã tồn tại chưa (`grep -r "use<Feature>" packages/core`)
- [ ] Nếu thêm vào core: hook nhận `ApolloLike` làm param
- [ ] Nếu thêm component display: export từ `packages/core`, import vào app
- [ ] Nếu thêm admin UI: chỉ đặt trong `apps/admin/src/features/`
- [ ] Types được định nghĩa trong `types.ts` của feature

## 5. Sau khi code

- [ ] Re-export từ shim nếu cần (`packages/lesson` hoặc `packages/graph`)
- [ ] Viết spec file cạnh source file (không tạo `__tests__/` folder riêng)
