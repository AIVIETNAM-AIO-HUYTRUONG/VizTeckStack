@../../rules/api.md
@../../rules/database.md

# API Gateway (NestJS)

- Port 3000
- `experimentalDecorators: true` and `emitDecoratorMetadata: true` required in tsconfig
- `AdminGuard` in `src/auth/admin.guard.ts` — applies to all protected routes
- REST: `src/controllers/`, GraphQL: Apollo via `src/graphql/`
- Test framework: Jest + ts-jest, `*.spec.ts` alongside source
