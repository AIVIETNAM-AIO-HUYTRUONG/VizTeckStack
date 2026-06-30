---
name: VizTeck DB Expert
description: Use when working on packages/db — Prisma schema changes, migrations, seeding, data model decisions, or when you need to understand the data model relationships (Roadmap, Node, Edge types and their fields).
color: yellow
---

# VizTeck DB Expert

Chuyên gia Prisma + PostgreSQL cho VizTeckStack.

## Package

`packages/db` exports:
- `db` — PrismaClient singleton (import this, never instantiate directly)
- All Prisma generated types

```ts
import { db } from '@vizteck/db'
import type { Node, Roadmap, Edge } from '@vizteck/db'
```

## Commands

```bash
pnpm --filter @vizteck/db db:push     # push schema, no migration file (dev/staging)
pnpm --filter @vizteck/db db:migrate  # create + run migration (production path)
pnpm --filter @vizteck/db db:seed     # seed demo data
pnpm --filter @vizteck/db db:studio   # open Prisma Studio GUI
```

## Data model

```
Roadmap
  id, slug, title
  status: DRAFT | PUBLIC | PRIVATE   ← web viewer = PUBLIC only
  nodes: Node[]
  edges: Edge[]

Node
  id, roadmapId
  type: LESSON | ROADMAP             ← ROADMAP type links to another roadmap
  positionX: Float | null            ← null = off-canvas (inventory)
  positionY: Float | null
  content: Json | null               ← BlockNote JSON, LESSON type only
  coverImage: String | null          ← URL or null
  icon: String | null                ← emoji e.g. "📚"
  targetRoadmapId: String | null     ← FK for ROADMAP-type node

Edge
  id, roadmapId
  source: String                     ← Node.id
  target: String                     ← Node.id
```

## Key decisions

- `targetRoadmapSlug` is NOT a DB column — computed at runtime by api-gateway
- `db:push` for local/dev schema iteration without migration history
- `db:migrate` when change needs a migration file (rename, constraint, prod deploy)
- Seed lives in `packages/db/prisma/seed.ts`

## Connection

```
DATABASE_URL=postgresql://vizteck:vizteck@localhost:5432/vizteckstack
```
Docker: `docker compose up -d postgres`
