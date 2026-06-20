---
phase: 02-core-services
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - apps/svc-roadmap/package.json
  - apps/svc-roadmap/tsconfig.json
  - apps/svc-roadmap/.env.example
  - apps/svc-roadmap/src/main.ts
  - apps/svc-roadmap/src/app.module.ts
  - apps/svc-roadmap/src/roadmap/roadmap.module.ts
  - apps/svc-roadmap/src/roadmap/roadmap.service.ts
  - apps/svc-roadmap/src/roadmap/roadmap.controller.ts
  - apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts
  - apps/api-gateway/package.json
  - apps/api-gateway/tsconfig.json
  - apps/api-gateway/.env.example
  - apps/api-gateway/src/auth/admin.guard.ts
  - apps/api-gateway/src/roadmap/roadmap.grpc-client.ts
  - apps/api-gateway/src/roadmap/roadmap.dto.ts
  - apps/api-gateway/src/roadmap/roadmap.resolver.spec.ts
  - apps/api-gateway/src/roadmap/roadmap.resolver.ts
  - apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
  - apps/api-gateway/src/roadmap/roadmap.module.ts
  - apps/api-gateway/src/app.module.ts
  - apps/api-gateway/src/main.ts
findings:
  critical: 5
  warning: 7
  info: 4
  total: 16
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Reviewed both NestJS services (svc-roadmap gRPC microservice and api-gateway HTTP/GraphQL gateway). The overall structure is sound, but the review found five blockers: a hardcoded default token that ships to production, a missing authorization guard on the GraphQL playground, an unhandled crash path in `upsertGraph`, unsafe JSON.parse without validation, and an incomplete edge-deletion query that allows orphaned edges to pass the FK check. Seven additional warnings cover input validation gaps, unchecked nulls, CORS wildcard exposure, and missing request validation middleware.

---

## Critical Issues

### CR-01: Hardcoded Default `ADMIN_TOKEN` of `supersecret` Accepted in Production

**File:** `apps/api-gateway/src/auth/admin.guard.ts:12`

**Issue:** The guard compares the bearer token directly against `process.env.ADMIN_TOKEN`. When the environment variable is unset, `process.env.ADMIN_TOKEN` is `undefined`, so the comparison `token !== undefined` will always be false — which means every request with any non-empty bearer token **passes authentication** when the variable is omitted. Separately, the default documented in `CLAUDE.md` is `supersecret` — if a deployment forgets to set the variable the app starts with no effective secret. There is no startup assertion that the variable is present and non-trivial.

**Fix:**
```typescript
// apps/api-gateway/src/auth/admin.guard.ts
canActivate(context: ExecutionContext): boolean {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    // Fail closed — misconfigured deployments must not pass through
    throw new UnauthorizedException('Server misconfigured: ADMIN_TOKEN not set');
  }
  // ... extract req / token as before ...
  if (!token || token !== adminToken) {
    throw new UnauthorizedException('Invalid admin token');
  }
  return true;
}
```
Also add a startup check in `apps/api-gateway/src/main.ts`:
```typescript
if (!process.env.ADMIN_TOKEN) {
  throw new Error('ADMIN_TOKEN environment variable is required');
}
```

---

### CR-02: GraphQL Playground Enabled in Production — Bypasses All Auth

**File:** `apps/api-gateway/src/app.module.ts:10`

**Issue:** `playground: true` is hard-coded in `GraphQLModule.forRoot`. The Apollo Sandbox/Playground allows anyone to introspect the full schema and execute any query (including public read queries) without a token, and to discover mutation signatures before even attempting to authenticate. In environments where this service faces the public internet the playground is a reconnaissance tool for attackers. It is not gated behind `AdminGuard` and there is no environment-conditional toggle.

**Fix:**
```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  playground: process.env.NODE_ENV !== 'production',
  introspection: process.env.NODE_ENV !== 'production',
}),
```

---

### CR-03: `upsertGraph` Crashes When Roadmap Does Not Exist — Unhandled Null

**File:** `apps/svc-roadmap/src/roadmap/roadmap.service.ts:108–112`

**Issue:** After the transaction the service does:
```typescript
const roadmap = await db.roadmap.findUnique({ where: { id: req.roadmapId }, select: { slug: true } });
return this.getRoadmap({ slug: roadmap?.slug ?? '' });
```
When `req.roadmapId` does not match any roadmap, `roadmap` is `null`. The fallback `roadmap?.slug ?? ''` then calls `getRoadmap({ slug: '' })`. `getRoadmap` with an empty string executes `db.roadmap.findUnique({ where: { slug: '' } })`, which returns `null`, and the function returns `{ roadmap: undefined, nodes: [], edges: [] }` — silently succeeding despite having just orphaned nodes and edges inside a committed transaction (the transaction actually deletes nodes from a non-existent roadmap, which is a no-op, but then tries to create nodes for a `roadmapId` that does not exist, which will throw a Prisma FK violation). The error from the FK violation inside the transaction will propagate as an unhandled rejection with no useful gRPC status code returned to the client.

**Fix:** Validate that the roadmap exists **before** entering the transaction, and return a proper gRPC `NOT_FOUND` status:
```typescript
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

async upsertGraph(req: UpsertGraphRequest): Promise<RoadmapDetail> {
  const exists = await db.roadmap.findUnique({ where: { id: req.roadmapId }, select: { id: true } });
  if (!exists) {
    throw new RpcException({ code: status.NOT_FOUND, message: `Roadmap ${req.roadmapId} not found` });
  }
  // ... transaction ...
}
```

---

### CR-04: `JSON.parse(n.content)` in `upsertGraph` Will Crash on Malformed Input

**File:** `apps/svc-roadmap/src/roadmap/roadmap.service.ts:96`

**Issue:** Inside the transaction loop:
```typescript
content: n.content ? JSON.parse(n.content) : null,
```
`JSON.parse` throws a `SyntaxError` on malformed JSON strings. Because this runs inside a Prisma `$transaction` callback, an uncaught `SyntaxError` will abort the transaction and propagate as an unhandled exception. No error is caught and no meaningful gRPC status is returned to the caller — the service will return an internal server error or drop the connection. Any client able to call `UpsertGraph` (i.e. any admin) can trigger this crash with a node whose `content` field contains invalid JSON.

**Fix:**
```typescript
let parsedContent: unknown = null;
if (n.content) {
  try {
    parsedContent = JSON.parse(n.content);
  } catch {
    throw new RpcException({ code: status.INVALID_ARGUMENT, message: `Node ${n.id}: content is not valid JSON` });
  }
}
// ...
data: { ..., content: parsedContent },
```

---

### CR-05: Incomplete Edge Deletion — Orphaned Edges When Target Nodes Are Replaced

**File:** `apps/svc-roadmap/src/roadmap/roadmap.service.ts:82–83`

**Issue:** The edge-deletion step before graph replacement is:
```typescript
await tx.edge.deleteMany({ where: { sourceId: { in: nodeIds } } });
await tx.node.deleteMany({ where: { roadmapId: req.roadmapId } });
```
This only deletes edges where the **source** node belongs to the roadmap. Edges where the node is only the **target** (`Edge.targetId` in `nodeIds`) are not deleted. The Prisma schema defines `onDelete: Cascade` on both `EdgeSource` and `EdgeTarget` relations, so the subsequent `node.deleteMany` will itself cascade-delete the remaining edges — however, this only works if the DB-level cascade is active. If the DB was created with `db:push` (which may not honour all Prisma cascade directives consistently across PostgreSQL versions) or if someone later changes the schema to `Restrict`, the `node.deleteMany` will throw a FK violation inside the transaction. The code should explicitly delete both directions:

**Fix:**
```typescript
await tx.edge.deleteMany({
  where: {
    OR: [
      { sourceId: { in: nodeIds } },
      { targetId: { in: nodeIds } },
    ],
  },
});
```

---

## Warnings

### WR-01: `AdminGuard` Token Comparison Is Vulnerable to Timing Attacks

**File:** `apps/api-gateway/src/auth/admin.guard.ts:12`

**Issue:** `token !== process.env.ADMIN_TOKEN` is a direct string equality check. JavaScript string comparison short-circuits on the first differing character, leaking timing information. A sufficiently precise attacker on a local network can distinguish "first byte wrong" from "all bytes wrong" and enumerate the token character by character.

**Fix:** Use a constant-time comparison. Node.js `crypto.timingSafeEqual` works on `Buffer`:
```typescript
import { timingSafeEqual, createHash } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

if (!token || !safeCompare(token, adminToken)) { ... }
```

---

### WR-02: `updateRoadmap` Silently Ignores Empty-String Fields — Incorrect Partial-Update Semantics

**File:** `apps/svc-roadmap/src/roadmap/roadmap.service.ts:67–69`

**Issue:**
```typescript
data: {
  title: req.title || undefined,
  description: req.description || undefined,
  coverImage: req.coverImage || undefined,
}
```
The proto wire format encodes unset `string` fields as `""` (empty string). Using `|| undefined` means a caller **cannot** clear `description` or `coverImage` back to `null` — sending `description: ""` is treated as "do not update description", not "set description to null". Additionally, `title: "" || undefined` silently skips updating the title without any validation error, even though an empty title is likely invalid business data.

**Fix:** Distinguish "field not present" from "field set to empty". The cleanest option is to add explicit boolean flags to `UpdateRoadmapRequest` in the proto, or check for a sentinel. At minimum add a guard:
```typescript
if (!req.title && req.title !== undefined) {
  throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'title cannot be empty' });
}
data: {
  ...(req.title   ? { title: req.title }             : {}),
  ...(req.description !== undefined ? { description: req.description || null } : {}),
  ...(req.coverImage  !== undefined ? { coverImage:  req.coverImage  || null } : {}),
}
```

---

### WR-03: `deleteRoadmap` Does Not Verify the Record Exists — Swallows Prisma P2025

**File:** `apps/svc-roadmap/src/roadmap/roadmap.service.ts:73–75`

**Issue:**
```typescript
async deleteRoadmap({ id }: IdRequest): Promise<BoolResponse> {
  await db.roadmap.delete({ where: { id } });
  return { success: true };
}
```
`db.roadmap.delete` throws `PrismaClientKnownRequestError` with code `P2025` when the record does not exist. This exception is not caught, so it propagates as an unhandled internal gRPC error instead of a clean `NOT_FOUND` status.

**Fix:**
```typescript
async deleteRoadmap({ id }: IdRequest): Promise<BoolResponse> {
  try {
    await db.roadmap.delete({ where: { id } });
    return { success: true };
  } catch (e: any) {
    if (e?.code === 'P2025') {
      throw new RpcException({ code: status.NOT_FOUND, message: `Roadmap ${id} not found` });
    }
    throw e;
  }
}
```

---

### WR-04: `CORS` Wildcard — All Origins Accepted by Default

**File:** `apps/api-gateway/src/main.ts:7`

**Issue:** `app.enableCors()` with no options enables CORS for all origins (`*`). Because the REST API accepts write mutations behind `AdminGuard`, a CORS wildcard means a malicious webpage can use stored admin credentials (if a browser extension or user script holds the token) to make cross-origin mutation requests. The intended clients are `apps/web` (port 3001) and `apps/admin` (port 3002) — CORS should be restricted to those origins.

**Fix:**
```typescript
app.enableCors({
  origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3001,http://localhost:3002').split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
});
```

---

### WR-05: REST Controller Accepts Unauthenticated `GET /api/nodes/:id` With No Validation on `id`

**File:** `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts:22–24`

**Issue:** `getNode` passes the raw URL path parameter `id` straight to the gRPC client with no shape validation. Any string (including excessively long strings, Unicode, or path-traversal sequences) is forwarded. While Prisma will safely reject non-cuid strings without SQL injection risk, an empty or very long `id` may produce confusing gRPC errors rather than a `400 Bad Request`, and there is no `ValidationPipe` set up globally or on these endpoints.

**Fix:** Enable the global `ValidationPipe` in `main.ts`:
```typescript
import { ValidationPipe } from '@nestjs/common';
// ...
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```
Add `class-validator` decorators to all Input DTOs (e.g. `@IsString() @IsNotEmpty()` on `slug`, `@IsUUID()` or `@IsCuid()` on `id`).

---

### WR-06: `@Client()` Decorator Used for `RoadmapGrpcClient` — Deprecated Pattern

**File:** `apps/api-gateway/src/roadmap/roadmap.grpc-client.ts:18–26`

**Issue:** The `@Client()` property decorator from `@nestjs/microservices` is the legacy pattern; NestJS documentation marks it as deprecated in favour of `ClientsModule.register(...)` with `@Inject(...)`. The decorator-based approach creates a new `ClientGrpc` instance per class instance instead of sharing a single pooled connection, which can lead to connection proliferation in more complex DI graphs. It also prevents proper connection lifecycle management (graceful shutdown hooks won't close these clients).

**Fix:** Register the client in `RoadmapModule`:
```typescript
// roadmap.module.ts
ClientsModule.register([{
  name: 'ROADMAP_GRPC',
  transport: Transport.GRPC,
  options: { package: 'roadmap', protoPath: ..., url: ... },
}]),
```
Then inject with `@Inject('ROADMAP_GRPC') private client: ClientGrpc`.

---

### WR-07: `getRoadmap` Returns `{ roadmap: undefined, nodes: [], edges: [] }` for Unknown Slug — Callers Receive Inconsistent Shape

**File:** `apps/svc-roadmap/src/roadmap/roadmap.service.ts:36`

**Issue:**
```typescript
if (!roadmap) return { roadmap: undefined, nodes: [], edges: [] };
```
The proto message `RoadmapDetail.roadmap` is typed as `RoadmapItem` (not `optional`). Returning `undefined` for a proto3 message field produces a zero-value/empty object on the wire, not a missing field. This is semantically indistinguishable from a found-but-empty roadmap on the client side. The resolver at `roadmap.resolver.ts:18–20` returns this result directly to the GraphQL client, which declared the field `nullable: true` — so the GraphQL layer passes, but the REST layer returns a `200 OK` with no useful "not found" signal.

**Fix:** Throw a `NOT_FOUND` RpcException instead of returning a partial object:
```typescript
if (!roadmap) {
  throw new RpcException({ code: status.NOT_FOUND, message: `Roadmap "${slug}" not found` });
}
```
Update `roadmap.resolver.ts` to handle the gRPC exception and return `null` for the nullable GraphQL field.

---

## Info

### IN-01: `toNodeItem` and `toRoadmapItem` Use `any` Types — Type Safety Lost

**File:** `apps/svc-roadmap/src/roadmap/roadmap.service.ts:10–21`

**Issue:** Both mapper functions accept `any`, discarding all Prisma-generated type information. Errors from schema changes (renamed fields, changed types) will not be caught at compile time.

**Fix:** Import and use the Prisma generated types:
```typescript
import type { Roadmap, Node } from '@vizteck/db';
function toRoadmapItem(r: Roadmap): RoadmapItem { ... }
function toNodeItem(n: Node): ReturnType<typeof toNodeItem> { ... }
```

---

### IN-02: `console.log` in `svc-roadmap/src/main.ts` and `api-gateway/src/main.ts`

**File:** `apps/svc-roadmap/src/main.ts:18`, `apps/api-gateway/src/main.ts:19–21`

**Issue:** Raw `console.log` is used for startup messages. In production these are unstructured and not associated with any logger, making them invisible in log aggregators that read NestJS's built-in logger output.

**Fix:** Use NestJS's built-in logger:
```typescript
const logger = new Logger('Bootstrap');
logger.log(`svc-roadmap gRPC listening on :${port}`);
```

---

### IN-03: `NodeInput.id` Is Required in DTO But Proto Marks It Optional

**File:** `apps/api-gateway/src/roadmap/roadmap.dto.ts:53`

**Issue:** `NodeInput.id` has `@Field() id!: string` — a required field in the GraphQL schema. However, in the service `upsertGraph`, `n.id || undefined` is used to allow Prisma to auto-generate a cuid when no ID is supplied. The GraphQL API forces the caller to always supply an ID, while the REST body and gRPC call do not. This inconsistency means client-generated IDs are mandatory via GraphQL but optional via REST.

**Fix:** Make `id` optional in `NodeInput`:
```typescript
@Field({ nullable: true }) id?: string;
```

---

### IN-04: Missing `.env.example` for `apps/api-gateway`

**File:** `apps/api-gateway/.env.example` (absent)

**Issue:** The file listed in the review scope does not exist on disk (glob returned no results). `CLAUDE.md` states "Each app has a `.env.example` — copy to `.env` before running." Without this file, developers have no documented starting point and are likely to miss `ADMIN_TOKEN`, causing the CR-01 scenario.

**Fix:** Create `apps/api-gateway/.env.example`:
```
PORT=3000
ROADMAP_SERVICE_URL=localhost:5001
ADMIN_TOKEN=change-me-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

_Reviewed: 2026-06-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
