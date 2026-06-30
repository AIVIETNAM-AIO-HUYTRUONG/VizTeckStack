# Database Rules (Prisma + PostgreSQL)

## Schema key points
- `Roadmap.status`: `DRAFT | PUBLIC | PRIVATE` — web viewer shows only `PUBLIC`
- `Node.positionX/Y`: `null` = off-canvas (exists in inventory but not placed)
- `Node.content`: BlockNote JSON — only meaningful when `type = LESSON`
- `Node.coverImage`: URL string or `null`
- `Node.icon`: emoji string or `null`
- `Node.targetRoadmapId`: FK to target roadmap — slug computed at runtime, not stored

## Commands (run from repo root)
```bash
pnpm --filter @vizteck/db db:push     # push schema, no migration file
pnpm --filter @vizteck/db db:migrate  # create + run migration
pnpm --filter @vizteck/db db:seed     # seed demo data
pnpm --filter @vizteck/db db:studio   # Prisma Studio
```

## Package
- `packages/db` exports `db` (PrismaClient singleton) and all Prisma types
- Import from `@vizteck/db` — never instantiate PrismaClient directly in apps
