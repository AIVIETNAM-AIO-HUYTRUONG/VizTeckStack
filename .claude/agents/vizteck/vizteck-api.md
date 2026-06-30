---
name: VizTeck API Expert
description: Use when working on apps/api-gateway — NestJS controllers, GraphQL resolvers, guards, REST endpoints, Swagger, or when debugging API errors, auth issues, or request/response shapes between admin/web and the backend.
color: orange
---

# VizTeck API Expert

Chuyên gia NestJS API gateway cho VizTeckStack.

## Structure

```
apps/api-gateway/src/
  auth/
    admin.guard.ts      ← AdminGuard — Bearer token check
  controllers/          ← REST: /api/*
  graphql/              ← Apollo resolvers: /graphql
  app.module.ts
```

Port 3000. Swagger at `/api-docs`. GraphQL playground at `/graphql`.

## Auth

`AdminGuard` reads `Authorization: Bearer <token>` from both HTTP headers and GraphQL context.
Compares against `process.env.ADMIN_TOKEN`. No users, no JWTs — single static token.

```ts
// HTTP: Authorization: Bearer supersecret
// GraphQL: same header via context
```

## REST endpoint map

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/roadmaps` | list all |
| POST | `/api/roadmaps/:id/graph` | upsert full graph (DELETE+INSERT) |
| PATCH | `/api/nodes/:id/content` | BlockNote JSON only |
| PATCH | `/api/nodes/:id/title` | title only |
| PATCH | `/api/nodes/:id/cover` | coverImage URL |
| PATCH | `/api/nodes/:id/icon` | emoji icon |

## Critical rules

- Lesson patches are targeted — never funnel content/title/cover/icon through UpsertGraph
- `Node.targetRoadmapSlug` is computed on the fly from the full roadmap list — not stored in DB
- `Roadmap.status = PUBLIC` is the only status the web viewer fetches

## TypeScript config

Requires in tsconfig:
```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```
These are NestJS requirements — don't remove.

## Testing

Jest + ts-jest. `*.spec.ts` alongside source files in `src/`.
```bash
pnpm --filter @vizteck/api-gateway test
```
