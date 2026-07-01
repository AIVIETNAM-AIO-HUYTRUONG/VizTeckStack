---
name: vizteck:new-endpoint
description: Use when adding a new REST controller, GraphQL resolver, or API route to apps/api-gateway. Covers AdminGuard wiring, Swagger docs, response shape, and the corresponding admin fetch call.
user-invocable: true
argument-hint: "[rest|graphql] [METHOD /api/path]"
---

# New Endpoint Workflow

## 1. REST vs GraphQL?

| Dùng REST khi | Dùng GraphQL khi |
|--------------|-----------------|
| CRUD đơn giản, file upload | Nested queries, flexible selection |
| Lesson patches (content, title, cover, icon) | Roadmap + nodes + edges trong một query |
| Webhooks, redirects | Admin dashboard queries |

## 2. Thêm REST endpoint

```
apps/api-gateway/src/
  controllers/
    <resource>.controller.ts   ← thêm vào đây
```

Template:
```ts
@Controller('api/<resource>')
@UseGuards(AdminGuard)           // ← bắt buộc cho write operations
export class <Resource>Controller {
  @Get(':id')
  async get(@Param('id') id: string) { ... }

  @Patch(':id/<field>')
  async update(@Param('id') id: string, @Body() dto: Update<Field>Dto) {
    return db.node.update({ where: { id }, data: { <field>: dto.<field> } })
  }
}
```

## 3. Thêm GraphQL resolver

```
apps/api-gateway/src/
  graphql/
    <resource>.resolver.ts
    <resource>.schema.ts       ← type definitions
```

Dùng `AdminGuard` trên mutations:
```ts
@Mutation()
@UseGuards(AdminGuard)
async update<Resource>(...) { }
```

## 4. Checklist

- [ ] `AdminGuard` được apply cho mọi write operation
- [ ] Swagger decorator `@ApiOperation`, `@ApiParam` nếu là REST
- [ ] DTO class với validation nếu nhận body
- [ ] Không lưu `targetRoadmapSlug` — compute từ full list
- [ ] Lesson patches: **targeted** (`PATCH /api/nodes/:id/field`) không dùng UpsertGraph
- [ ] Controller được register trong `app.module.ts`

## 5. Wiring phía admin

Sau khi có endpoint, cập nhật `apps/admin/src/lib/api.ts`:
```ts
export async function update<Field>(nodeId: string, value: string) {
  return apiFetch(`/api/nodes/${nodeId}/<field>`, {
    method: 'PATCH',
    body: JSON.stringify({ <field>: value }),
  })
}
```

`apiFetch` tự inject Bearer token và redirect /login khi 401.

## 6. Test

```bash
# Unit test controller
pnpm --filter @vizteck/api-gateway test

# Verify Swagger docs
# Mở http://localhost:3000/api-docs sau khi dev server chạy
```
