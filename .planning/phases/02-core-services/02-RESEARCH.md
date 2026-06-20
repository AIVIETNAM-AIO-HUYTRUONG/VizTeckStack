# Phase 2: Core Services — Research

**Researched:** 2026-06-18
**Domain:** NestJS 10 gRPC microservice + NestJS 10 API Gateway (GraphQL + REST)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-grpc-service | svc-roadmap implements full RoadmapService gRPC contract, listens on :5001, UpsertGraph is atomic | Task 4 code verified; GrpcMethod decorator pattern confirmed; Prisma $transaction pattern confirmed |
| REQ-rest-api | api-gateway exposes GET/POST/PUT/DELETE /api/* with Swagger at /api-docs; admin routes require Bearer | Task 5 REST controller + AdminGuard code verified; SwaggerModule.setup confirmed |
| REQ-graphql-api | api-gateway exposes POST /graphql with Apollo Server 4 + autoSchemaFile; admin mutations use AdminGuard | Task 5 resolver code verified; @nestjs/graphql 12 + @nestjs/apollo 12 + @apollo/server 4 pattern confirmed |
</phase_requirements>

---

## Summary

Phase 2 builds the running data pipeline: `apps/svc-roadmap` (NestJS gRPC server backed by Prisma/PostgreSQL) and `apps/api-gateway` (NestJS HTTP server exposing GraphQL + REST, forwarding to svc-roadmap via gRPC client). The implementation plan at `docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md` contains complete, copy-paste-ready code for both apps.

The plan's technical approach is sound. The NestJS 10 + `@GrpcMethod` + `@Client` decorator pattern is standard for this stack. The `@nestjs/graphql@12` + `@nestjs/apollo@12` + `@apollo/server@4` triple is the correct current combination for NestJS 10. Swagger 7 integrates normally with `SwaggerModule.setup`.

**Primary recommendation:** Follow the implementation plan exactly. Key risks are: (1) `@nestjs/graphql@12` requires `ts-morph` as a peer dep for `autoSchemaFile: true` — it must be listed in devDependencies; (2) the `@Client` decorator is deprecated in NestJS microservices in favour of `ClientsModule.register` but still works in NestJS 10; (3) the `protoPath` in `main.ts` and `grpc-client.ts` uses `__dirname`-relative paths that only resolve correctly after `nest build` — the `dev` watch mode path must also work.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| gRPC server (RoadmapService impl) | apps/svc-roadmap | — | Only tier that touches PostgreSQL; pure microservice |
| Database reads/writes | apps/svc-roadmap → PostgreSQL | — | DEC-004: svc-roadmap exclusively owns DB |
| Bearer token auth (AdminGuard) | apps/api-gateway | — | Gateway is the public boundary; svc-roadmap trusts caller |
| GraphQL schema + resolvers | apps/api-gateway | — | Gateway translates gRPC responses to GQL types |
| REST endpoints + Swagger | apps/api-gateway | — | Gateway is the single HTTP surface |
| gRPC client (calls svc-roadmap) | apps/api-gateway | — | Gateway initiates all gRPC calls |
| Proto contract (source of truth) | packages/proto | — | DEC-003: shared; no duplication in apps |

---

## Standard Stack

### Core — svc-roadmap

| Library | Version (plan) | Latest in range | Purpose | Why Standard |
|---------|---------------|-----------------|---------|--------------|
| `@nestjs/common` | ^10.3.0 | 10.4.22 | NestJS core | Framework baseline [VERIFIED: npm registry] |
| `@nestjs/core` | ^10.3.0 | 10.4.22 | NestJS core | Framework baseline [VERIFIED: npm registry] |
| `@nestjs/microservices` | ^10.3.0 | 10.4.22 | gRPC transport + `@GrpcMethod` | NestJS gRPC server integration [VERIFIED: npm registry] |
| `@grpc/grpc-js` | ^1.10.0 | 1.14.4 | gRPC runtime | Official JS gRPC implementation [VERIFIED: npm registry] |
| `@grpc/proto-loader` | ^0.7.13 | 0.8.1 | .proto file loader | Required by `@nestjs/microservices` gRPC transport [VERIFIED: npm registry] |
| `@vizteck/proto` | workspace:* | — | Shared message types | Single source of truth per DEC-003 |
| `@vizteck/db` | workspace:* | — | Prisma client singleton | Single DB access point per DEC-004 |
| `reflect-metadata` | ^0.2.0 | 0.2.2 | Decorator metadata | Required by NestJS [VERIFIED: npm registry] |
| `rxjs` | ^7.8.1 | 7.8.2 | Observable streams | Required by NestJS microservices [VERIFIED: npm registry] |

### Core — api-gateway

| Library | Version (plan) | Latest in range | Purpose | Why Standard |
|---------|---------------|-----------------|---------|--------------|
| `@nestjs/common` | ^10.3.0 | 10.4.22 | NestJS core | — [VERIFIED: npm registry] |
| `@nestjs/core` | ^10.3.0 | 10.4.22 | NestJS core | — [VERIFIED: npm registry] |
| `@nestjs/platform-express` | ^10.3.0 | 10.4.22 | Express HTTP adapter | Default NestJS HTTP server [VERIFIED: npm registry] |
| `@nestjs/microservices` | ^10.3.0 | 10.4.22 | gRPC client (`@Client`) | gRPC client for calling svc-roadmap [VERIFIED: npm registry] |
| `@nestjs/graphql` | ^12.1.0 | 12.2.2 | GraphQL integration | Code-first schema with autoSchemaFile [VERIFIED: npm registry] |
| `@nestjs/apollo` | ^12.1.0 | 12.2.2 | Apollo driver adapter | Connects NestJS to Apollo Server 4 [VERIFIED: npm registry] |
| `@apollo/server` | ^4.10.0 | 4.13.0 | Apollo Server 4 | Required by `@nestjs/apollo@12` [VERIFIED: npm registry] |
| `@nestjs/swagger` | ^7.3.0 | 7.4.2 | Swagger/OpenAPI docs | Auto-generates from decorators [VERIFIED: npm registry] |
| `@grpc/grpc-js` | ^1.10.0 | 1.14.4 | gRPC runtime | gRPC channel for calling svc-roadmap [VERIFIED: npm registry] |
| `@grpc/proto-loader` | ^0.7.13 | 0.8.1 | .proto loader | Required by gRPC client [VERIFIED: npm registry] |
| `graphql` | ^16.8.0 | 16.14.2 | GraphQL runtime | Peer dep of `@nestjs/graphql@12` [VERIFIED: npm registry] |
| `@vizteck/proto` | workspace:* | — | gRPC client types | Source of truth per DEC-003 |
| `reflect-metadata` | ^0.2.0 | 0.2.2 | Decorator metadata | Required by NestJS [VERIFIED: npm registry] |
| `rxjs` | ^7.8.1 | 7.8.2 | Observable → Promise | `firstValueFrom` in gRPC client [VERIFIED: npm registry] |

### Critical Missing Peer Dep

**`ts-morph`** is a required peer of `@nestjs/graphql@12` when using `autoSchemaFile: true`.
The plan's `package.json` for api-gateway does **not** include it. Without it, Apollo/GraphQL schema generation at startup fails with a runtime error.

Add to api-gateway devDependencies:
```json
"ts-morph": "^24.0.0"
```

Peer dep declaration from `@nestjs/graphql@12.2.2`: [VERIFIED: npm registry]
```
"ts-morph": "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0 || ^20.0.0 || ^21.0.0 || ^24.0.0"
```

### Version Compatibility Matrix

| Component | NestJS 10 compat | NestJS 11 compat | Note |
|-----------|-----------------|-----------------|------|
| `@nestjs/graphql@12` | YES (peer: `^9.3.8 \|\| ^10.0.0`) | NO | Requires `@nestjs/graphql@13` for NestJS 11 |
| `@nestjs/apollo@12` | YES | NO | Same constraint |
| `@nestjs/swagger@7` | YES (peer: `^9.0.0 \|\| ^10.0.0`) | NO | Requires `@nestjs/swagger@11` for NestJS 11 |
| `graphql@16` | YES | YES | `@nestjs/graphql@12` peer: `^16.6.0` |

**Note:** npm `latest` tag now resolves to NestJS 11 (`11.1.27`). The plan pins `^10.3.0` which is intentional. Installing without the exact range constraint would pull NestJS 11 and break the graphql/swagger peer deps. The plan's package.json versions are correct and must be used as-is.

**Installation (svc-roadmap):**
```bash
cd apps/svc-roadmap
pnpm install
```

**Installation (api-gateway):**
```bash
cd apps/api-gateway
pnpm install
```

---

## Package Legitimacy Audit

All packages are from the official NestJS, Google gRPC, and Apollo ecosystems.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@nestjs/common` | npm | ~7 yrs | very high | github.com/nestjs/nest | OK | Approved |
| `@nestjs/microservices` | npm | ~7 yrs | very high | github.com/nestjs/nest | OK | Approved |
| `@nestjs/graphql` | npm | ~6 yrs | very high | github.com/nestjs/graphql | OK | Approved |
| `@nestjs/apollo` | npm | ~3 yrs | very high | github.com/nestjs/graphql | OK | Approved |
| `@apollo/server` | npm | ~3 yrs | very high | github.com/apollographql/apollo-server | OK | Approved |
| `@nestjs/swagger` | npm | ~6 yrs | very high | github.com/nestjs/swagger | OK | Approved |
| `@grpc/grpc-js` | npm | ~6 yrs | very high | github.com/grpc/grpc-node | OK | Approved |
| `@grpc/proto-loader` | npm | ~6 yrs | high | github.com/grpc/grpc-node | OK | Approved |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

---

## Architecture Patterns

### System Architecture Diagram

```
Browser / frontends
        │  HTTP (GraphQL / REST)
        ▼
apps/api-gateway  (:3000)
  ├── POST /graphql         ← ApolloDriver, autoSchemaFile: true
  ├── GET|POST|PUT|DELETE /api/*  ← Express controllers
  ├── GET /api-docs         ← SwaggerModule
  ├── AdminGuard            ← reads Authorization: Bearer header
  └── RoadmapGrpcClient     ← wraps @Client({ transport: GRPC })
        │  gRPC (:5001)
        ▼
apps/svc-roadmap  (:5001)
  ├── RoadmapController     ← @GrpcMethod handlers
  └── RoadmapService        ← business logic + Prisma calls
        │  prisma.$transaction / db.*
        ▼
PostgreSQL  (:5432)
```

### Recommended Project Structure

**svc-roadmap:**
```
apps/svc-roadmap/
├── src/
│   ├── main.ts                       # NestFactory.createMicroservice, Transport.GRPC
│   ├── app.module.ts                 # imports RoadmapModule
│   └── roadmap/
│       ├── roadmap.module.ts
│       ├── roadmap.controller.ts     # @GrpcMethod handlers
│       ├── roadmap.service.ts        # db.roadmap.*, db.$transaction
│       └── roadmap.service.spec.ts   # unit tests with jest.mock('@vizteck/db')
├── package.json
├── tsconfig.json
└── .env.example
```

**api-gateway:**
```
apps/api-gateway/
├── src/
│   ├── main.ts                       # NestFactory.create, SwaggerModule.setup
│   ├── app.module.ts                 # GraphQLModule.forRoot(ApolloDriver), RoadmapModule
│   ├── auth/
│   │   └── admin.guard.ts            # CanActivate — HTTP + GQL context
│   └── roadmap/
│       ├── roadmap.module.ts
│       ├── roadmap.grpc-client.ts    # @Client decorator, onModuleInit
│       ├── roadmap.dto.ts            # @ObjectType, @InputType, @Field, @ApiProperty
│       ├── roadmap.resolver.ts       # @Resolver, @Query, @Mutation, @UseGuards
│       ├── roadmap.rest.controller.ts # @Controller('api'), @Get/@Post etc.
│       └── roadmap.resolver.spec.ts  # unit tests mocking RoadmapGrpcClient
├── package.json
├── tsconfig.json
└── .env.example
```

### Pattern 1: NestJS gRPC Microservice (svc-roadmap main.ts)

```typescript
// Source: implementation plan Task 4 Step 9
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'roadmap',
    protoPath: join(__dirname, '../../../packages/proto/roadmap.proto'),
    url: `0.0.0.0:${port}`,
  },
});
await app.listen();
```

The `protoPath` must point to the original `.proto` file (not the generated `.ts`). The path `join(__dirname, '../../../packages/proto/roadmap.proto')` is correct relative to `dist/main.js` after `nest build`. For `dev` watch mode (`nest start --watch`), the compiled output still goes to `dist/` so the same relative path works.

### Pattern 2: @GrpcMethod Controller

```typescript
// Source: implementation plan Task 4 Step 7
@Controller()
export class RoadmapController {
  @GrpcMethod('RoadmapService', 'GetRoadmaps')
  getRoadmaps(data: Empty) { return this.svc.getRoadmaps(data); }
}
```

The service name `'RoadmapService'` must exactly match the `service` name in `roadmap.proto`. The method name `'GetRoadmaps'` must match the `rpc` name. NestJS matches by exact string.

### Pattern 3: @Client gRPC Client (api-gateway)

```typescript
// Source: implementation plan Task 5 Step 5
@Injectable()
export class RoadmapGrpcClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'roadmap',
      protoPath: join(__dirname, '../../../../packages/proto/roadmap.proto'),
      url: process.env.ROADMAP_SERVICE_URL ?? 'localhost:5001',
    },
  })
  private client!: ClientGrpc;

  onModuleInit() {
    this.svc = this.client.getService<GrpcRoadmapService>('RoadmapService');
  }
}
```

`@Client` is deprecated in favour of `ClientsModule.register()` but remains functional in NestJS 10. The plan uses `@Client` which is simpler. The `protoPath` is 4 levels up from `dist/roadmap/` to reach `packages/proto/`.

### Pattern 4: Code-First GraphQL with autoSchemaFile

```typescript
// Source: implementation plan Task 5 Step 11
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,  // generates schema in-memory
  playground: true,
})
```

`autoSchemaFile: true` (in-memory, no file written) requires `ts-morph` as a devDependency. `autoSchemaFile: join(process.cwd(), 'src/schema.gql')` writes to a file and is an alternative if `ts-morph` causes issues.

### Pattern 5: AdminGuard dual HTTP/GQL context

```typescript
// Source: implementation plan Task 5 Step 4
canActivate(context: ExecutionContext): boolean {
  const req = context.getType() === 'http'
    ? context.switchToHttp().getRequest()
    : GqlExecutionContext.create(context).getContext().req;
  // ...
}
```

The guard must handle both HTTP (`getType() === 'http'`) and GraphQL (`getType() === 'graphql'`) execution contexts — otherwise `@UseGuards(AdminGuard)` on resolvers will throw when trying to read headers.

### Pattern 6: UpsertGraph Prisma Transaction

```typescript
// Source: implementation plan Task 4 Step 6
await db.$transaction(async (tx) => {
  // 1. Find existing nodes for this roadmap
  const existingNodes = await tx.node.findMany({ where: { roadmapId }, select: { id: true } });
  const nodeIds = existingNodes.map(n => n.id);
  // 2. Delete edges first (FK constraint: edge.sourceId → node.id)
  await tx.edge.deleteMany({ where: { sourceId: { in: nodeIds } } });
  // 3. Delete nodes (cascade would handle edges but explicit is safer)
  await tx.node.deleteMany({ where: { roadmapId } });
  // 4. Re-insert nodes then edges
  for (const n of req.nodes) { await tx.node.create({ data: { ... } }); }
  for (const e of req.edges) { await tx.edge.create({ data: { ... } }); }
});
```

Edge FK constraints require deleting edges before nodes. The schema has `onDelete: Cascade` on both Edge relations to Node, so `node.deleteMany` alone would cascade — but the plan's explicit edge deletion is correct and safe.

### Anti-Patterns to Avoid

- **Importing `@vizteck/db` in api-gateway:** violates DEC-004. api-gateway must only call svc-roadmap via gRPC.
- **Using `graphql@17`:** `@nestjs/graphql@12` peer dep requires `^16.6.0`. graphql 17 is incompatible.
- **`autoSchemaFile: true` without `ts-morph`:** Will throw `Error: Cannot find module 'ts-morph'` at startup.
- **Omitting `reflect-metadata` import in main.ts:** NestJS decorators silently break without `import 'reflect-metadata'` as the first import. The plan omits it — NestJS CLI (`nest build`) adds it automatically via the NestJS entry point pattern, but it should be verified.
- **Wrong `protoPath` level:** A path off by one directory level causes `Error: no such file or directory` at runtime, not at compile time. Hard to debug.
- **Using `process.env.ROADMAP_SERVICE_URL` in `@Client` options:** `@Client` options are evaluated at class decoration time (module load), before `.env` is parsed if using dotenv lazily. Use the `onModuleInit` pattern with `ClientsModule.register` for env-driven config, or ensure `.env` is loaded before the module resolves. The plan reads `process.env` directly in the options object — this works if the `.env` is loaded before `NestFactory.create`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| gRPC server routing | Custom dispatch map | `@GrpcMethod` + `@nestjs/microservices` | Handles framing, serialisation, error codes |
| GraphQL schema | Manual SDL string | `autoSchemaFile: true` + `@ObjectType`/`@Field` | Code-first derivation keeps types in sync |
| REST API docs | Manual OpenAPI JSON | `@nestjs/swagger` + `@ApiProperty` | Auto-generated from decorators |
| Auth token check | Custom middleware | `AdminGuard implements CanActivate` | Works with `@UseGuards` on both HTTP and GQL |
| Prisma transaction | Manual BEGIN/COMMIT | `db.$transaction(async tx => ...)` | Handles rollback, connection pooling |
| Observable → Promise | Manual subscription | `firstValueFrom(observable)` from rxjs | gRPC client returns Observable; firstValueFrom converts cleanly |

---

## Common Pitfalls

### Pitfall 1: Missing `ts-morph` peer dep for autoSchemaFile
**What goes wrong:** `api-gateway` crashes at startup: `Error: Cannot find module 'ts-morph'`
**Why it happens:** `@nestjs/graphql@12` requires `ts-morph` to introspect decorator metadata for code-first schema generation. The plan's `package.json` does not include it.
**How to avoid:** Add `"ts-morph": "^24.0.0"` to api-gateway's devDependencies.
**Warning signs:** Startup crash immediately after `NestFactory.create(AppModule)`.

### Pitfall 2: NestJS 11 pulled by pnpm instead of NestJS 10
**What goes wrong:** pnpm hoists `@nestjs/common@11` (the current `latest` tag) instead of 10.x; `@nestjs/graphql@12` and `@nestjs/swagger@7` peer dep checks fail.
**Why it happens:** `latest` on npm is now 11.1.27. The plan pins `^10.3.0` which correctly caps at 10.x, but any workspace package that depends on `@nestjs/common` without a version cap would pull 11.
**How to avoid:** The plan's version ranges are correct (`^10.3.0`). Do not change them.
**Warning signs:** `pnpm install` peer dependency warnings mentioning version mismatch between `@nestjs/graphql` and `@nestjs/common`.

### Pitfall 3: `protoPath` resolves incorrectly in dev vs build
**What goes wrong:** `svc-roadmap` starts fine after `nest build` but crashes in `nest start --watch` with proto-loading error.
**Why it happens:** Both `nest build` and `nest start --watch` compile to `dist/` — so `__dirname` will be `dist/` in both cases and the relative path works. However, if someone runs `ts-node src/main.ts` directly (without NestJS CLI), `__dirname` is `src/` and the path is wrong.
**How to avoid:** Always use `nest start --watch` (via `pnpm dev`) — never run `ts-node src/main.ts` directly.
**Warning signs:** `Error: ENOENT: no such file or directory, open '...roadmap.proto'`

### Pitfall 4: `@Client` evaluated before `.env` is loaded
**What goes wrong:** `ROADMAP_SERVICE_URL` in gRPC client is `undefined`, client connects to wrong address.
**Why it happens:** Class property decorators execute at module evaluation time. If `.env` is not loaded before the module is first `require()`-d, `process.env.ROADMAP_SERVICE_URL` is undefined and the fallback `'localhost:5001'` is used.
**How to avoid:** Load `.env` at the very top of `main.ts` before any other imports, or use `ClientsModule.register` with a factory. The plan uses `dotenv`-free approach (NestJS CLI doesn't auto-load `.env`); the `.env` file must be present and NestJS 10 does not auto-load it. Use `@nestjs/config` or ensure `dotenv/config` is imported first.
**Warning signs:** gRPC client connects to `localhost:5001` even when `ROADMAP_SERVICE_URL` is set to a different value.

### Pitfall 5: NodeType enum mapping (proto int ↔ Prisma string)
**What goes wrong:** UpsertGraph saves all nodes as `LESSON` (or `ROADMAP`) regardless of input.
**Why it happens:** proto3 encodes enums as integers (`ROADMAP=0`, `LESSON=1`). Prisma stores them as strings (`'ROADMAP'`, `'LESSON'`). The plan maps `n.type === 0 ? 'ROADMAP' : 'LESSON'` for inserts. The GraphQL layer gets NodeType as the `NodeTypeEnum` string. The dual-direction mapping must be consistent.
**How to avoid:** The plan's `toNodeItem` function maps `n.type === 'ROADMAP' ? 0 : 1` when reading from Prisma (string → int for proto), and `n.type === 0 ? 'ROADMAP' : 'LESSON'` when writing to Prisma (int → string from proto). Keep these two symmetrical.
**Warning signs:** All nodes appear as the same type in the UI.

### Pitfall 6: Edge cascade vs explicit delete order in UpsertGraph
**What goes wrong:** `tx.node.deleteMany` fails with a FK constraint violation.
**Why it happens:** Even though the Prisma schema has `onDelete: Cascade` on both Edge FK relations to Node, in a transaction the Prisma query engine may not execute the cascade before the constraint check in all configurations.
**How to avoid:** Delete edges explicitly before nodes (as the plan does). Always: `deleteMany edges → deleteMany nodes`.
**Warning signs:** `ForeignKeyConstraintError` during UpsertGraph.

---

## Code Examples

### svc-roadmap: NodeType enum conversion (Prisma string ↔ proto int)

```typescript
// Source: implementation plan Task 4 Step 6
// Prisma → proto (reading)
function toNodeItem(n: any) {
  return {
    ...
    type: n.type === 'ROADMAP' ? 0 : 1,  // NodeType.ROADMAP=0, NodeType.LESSON=1
    content: n.content ? JSON.stringify(n.content) : '',
  };
}

// proto → Prisma (writing in UpsertGraph)
type: n.type === 0 ? 'ROADMAP' : 'LESSON',
content: n.content ? JSON.parse(n.content) : null,  // Json? field
```

### api-gateway: firstValueFrom pattern for gRPC Observable

```typescript
// Source: implementation plan Task 5 Step 5
import { firstValueFrom } from 'rxjs';

getRoadmaps() { return firstValueFrom(this.svc.getRoadmaps({})); }
getRoadmap(slug: string) { return firstValueFrom(this.svc.getRoadmap({ slug })); }
```

### api-gateway: AdminGuard context handling

```typescript
// Source: implementation plan Task 5 Step 4
const req = context.getType() === 'http'
  ? context.switchToHttp().getRequest()
  : GqlExecutionContext.create(context).getContext().req;
const token = (req.headers['authorization'] as string | undefined)?.replace('Bearer ', '');
if (!token || token !== process.env.ADMIN_TOKEN) {
  throw new UnauthorizedException('Invalid admin token');
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `grpc` (native) package | `@grpc/grpc-js` | ~2020 | Pure JS, no native binaries — works on all OS [ASSUMED] |
| `@nestjs/graphql` with `express-graphql` | `@nestjs/graphql` + `@nestjs/apollo` + `@apollo/server@4` | Apollo Server 4 (2022) | Plugin architecture changed; `@nestjs/apollo` adapter required [ASSUMED] |
| `apollo-server-express` | `@apollo/server` + `@as-integrations/express` (or `@nestjs/apollo`) | Apollo Server 4 | `apollo-server-express` is deprecated [ASSUMED] |
| `@Client` decorator | `ClientsModule.register()` | NestJS 9+ | `@Client` still works but is soft-deprecated; `ClientsModule` is preferred for env-driven config [ASSUMED] |

**Deprecated/outdated:**
- `grpc` npm package: replaced by `@grpc/grpc-js`; do not install
- `apollo-server-express`: replaced by `@apollo/server`; do not install
- `graphql-tools` for schema stitching: not needed here (code-first autoSchemaFile)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@Client` decorator still works without deprecation errors in NestJS 10.4 | Standard Stack / Pitfalls | Minor: `ClientsModule.register` is a drop-in replacement if `@Client` causes issues |
| A2 | `nest start --watch` compiles to `dist/` making `__dirname`-based protoPath work identically to production build | Pitfall 3 | If wrong, dev mode proto loading fails; fix by using absolute path from repo root |
| A3 | `grpc` (native) package was replaced by `@grpc/grpc-js` | State of the Art | Low — well-established migration |
| A4 | `apollo-server-express` is deprecated since Apollo Server 4 | State of the Art | Low — does not affect this stack |
| A5 | NestJS `.env` is not auto-loaded by the framework (requires explicit dotenv or @nestjs/config) | Pitfall 4 | If NestJS CLI auto-loads `.env`, the pitfall does not apply; but adding dotenv is safer |

---

## Open Questions (RESOLVED)

1. **Does svc-roadmap need `dotenv` or will `.env` be loaded another way?**
   - What we know: The plan does not include `dotenv` in svc-roadmap or api-gateway deps. NestJS 10 does not auto-load `.env`.
   - What's unclear: The execution environment — if run via `pnpm dev` with an `.env` in the app directory, NestJS CLI picks it up in some setups.
   - Recommendation: Add `dotenv/config` import at top of `main.ts` in both apps, or document that `.env` must be present and rely on the NestJS CLI env loading behaviour.

2. **Should `@Client` be replaced with `ClientsModule.register`?**
   - What we know: `@Client` is soft-deprecated but functional in NestJS 10. The plan uses it.
   - What's unclear: Whether pnpm hoisting causes any issues with the decorator binding.
   - Recommendation: Keep `@Client` as in the plan — it works and is simpler for this use case.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js >= 20 | NestJS 10, ts-jest | Yes | v24.12.0 | — |
| pnpm | Monorepo | Yes (assumed, workspace used in Phase 1) | 9+ | — |
| PostgreSQL :5432 | svc-roadmap (Prisma) | Requires `docker compose up -d postgres` | 16 (Docker) | — |
| Docker / Docker Compose | PostgreSQL | [ASSUMED: available] | — | — |
| @nestjs/cli | `nest build`, `nest start` | Must be installed as devDep | ^10.3.0 | `tsc` + manual node |

**Missing dependencies with no fallback:**
- PostgreSQL must be running before `svc-roadmap` starts. The plan includes `docker compose up -d postgres` as a prerequisite step.

**Missing dependencies with fallback:**
- None critical beyond PostgreSQL.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest 29 |
| Config file | inline in package.json (`jest` key) |
| Quick run command | `pnpm test` (from app directory) |
| Full suite command | `pnpm test` from repo root (via Turborepo) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-grpc-service | `getRoadmaps` returns mapped list | unit | `pnpm test` in apps/svc-roadmap | Wave 0 creates file |
| REQ-grpc-service | `getRoadmap` returns detail with nodes/edges | unit | `pnpm test` in apps/svc-roadmap | Wave 0 creates file |
| REQ-graphql-api | `roadmaps()` resolver returns array | unit | `pnpm test` in apps/api-gateway | Wave 0 creates file |
| REQ-graphql-api | `roadmap(slug)` resolver returns detail | unit | `pnpm test` in apps/api-gateway | Wave 0 creates file |
| REQ-rest-api | GET /api/roadmaps returns JSON | smoke | `curl http://localhost:3000/api/roadmaps` | manual |
| REQ-rest-api | POST /api/roadmaps without token returns 401 | smoke | `curl -X POST http://localhost:3000/api/roadmaps` | manual |
| REQ-rest-api | GET /api-docs returns Swagger UI | smoke | `curl http://localhost:3000/api-docs` | manual |

### Sampling Rate
- **Per task commit:** `pnpm test` in the app being implemented
- **Per wave merge:** `pnpm build && pnpm test` from repo root
- **Phase gate:** All unit tests pass + smoke curl commands succeed

### Wave 0 Gaps
- [ ] `apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts` — covers REQ-grpc-service (2 tests)
- [ ] `apps/api-gateway/src/roadmap/roadmap.resolver.spec.ts` — covers REQ-graphql-api (2 tests)
- [ ] Jest config in both package.json files (inline — included in plan)
- [ ] Framework install: included in pnpm install step

*(Both spec files are provided verbatim in the implementation plan — copy-paste ready.)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (admin mutations) | Static Bearer token via `AdminGuard` — not session-based |
| V3 Session Management | No | No sessions; stateless Bearer token |
| V4 Access Control | Yes | `@UseGuards(AdminGuard)` on all write operations |
| V5 Input Validation | Partial | GraphQL type system validates field types; no class-validator in plan |
| V6 Cryptography | No | Token comparison is string equality; no hashing needed for static token |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Missing auth on admin endpoints | Elevation of Privilege | `@UseGuards(AdminGuard)` on all POST/PUT/DELETE routes and GQL mutations |
| Token in query string | Information Disclosure | Only `Authorization: Bearer` header is checked — do not accept token as query param |
| gRPC port exposed externally | Spoofing | svc-roadmap binds to `0.0.0.0:5001` — in production, firewall to internal network only |
| Prototype pollution via JSON.parse in UpsertGraph | Tampering | `node.content` from proto is a string that gets `JSON.parse`-d into Prisma `Json?` — validate or sanitise before parse |

---

## Sources

### Primary (HIGH confidence)
- npm registry — `@nestjs/graphql@12.2.2` peer dependencies (verified via `npm view`)
- npm registry — `@nestjs/apollo@12.2.2` peer dependencies (verified via `npm view`)
- npm registry — `@nestjs/swagger@7.4.2` peer dependencies (verified via `npm view`)
- npm registry — `@nestjs/microservices@10.4.22` peer dependencies (verified via `npm view`)
- `packages/proto/roadmap.proto` (committed, read directly)
- `packages/proto/generated/roadmap.ts` (committed stub, read directly)
- `packages/db/prisma/schema.prisma` (committed, read directly)
- `docs/superpowers/plans/2026-06-18-vizteckstack-implementation.md` (Tasks 4 and 5, read in full)

### Secondary (MEDIUM confidence)
- `.planning/intel/decisions.md` — locked architectural decisions
- `.planning/intel/constraints.md` — API contracts and env var requirements
- `.planning/REQUIREMENTS.md` — acceptance criteria

### Tertiary (LOW confidence)
- `@Client` deprecation status in NestJS 10 [ASSUMED from training knowledge]
- dotenv auto-loading behaviour in NestJS CLI [ASSUMED — verify empirically]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified via `npm view`; peer deps confirmed
- Architecture: HIGH — based on committed proto, schema, and full implementation plan code
- Pitfalls: MEDIUM/HIGH — peer dep pitfall (ts-morph) is VERIFIED; others are ASSUMED from training

**Research date:** 2026-06-18
**Valid until:** 2026-07-18 (stable ecosystem; NestJS 10 pinned)
