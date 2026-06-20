---
status: testing
phase: 02-core-services
source: [02-VERIFICATION.md]
started: 2026-06-18T10:00:00Z
updated: 2026-06-18T10:00:00Z
---

## Current Test

number: 1
name: svc-roadmap gRPC Boot Log
expected: |
  Console output includes 'svc-roadmap gRPC listening on :5001' with no errors after starting with Postgres running
awaiting: user response

## Tests

### 1. svc-roadmap gRPC Boot Log
expected: Run `docker compose up -d postgres && pnpm --filter @vizteck/svc-roadmap dev` → Console logs 'svc-roadmap gRPC listening on :5001' with no Prisma errors
result: [pending]

### 2. api-gateway HTTP Boot (No Crash)
expected: With svc-roadmap running, `pnpm --filter @vizteck/api-gateway dev` → Logs `:3000`, `/graphql`, `/api-docs` URLs with no `Cannot find module 'ts-morph'` crash
result: [pending]

### 3. GET /api/roadmaps Returns Seeded Data
expected: `curl http://localhost:3000/api/roadmaps` → JSON array with seeded roadmaps (non-empty, each with id/slug/title)
result: [pending]

### 4. GraphQL Query Executes
expected: `curl -X POST http://localhost:3000/graphql -H 'Content-Type: application/json' -d '{"query":"{roadmaps{id title}}"}' → { "data": { "roadmaps": [...] } }` with roadmap data
result: [pending]

### 5. AdminGuard Blocks Unauthenticated Writes
expected: `curl -X POST http://localhost:3000/api/roadmaps -H 'Content-Type: application/json' -d '{"slug":"t","title":"T"}'` → HTTP 401 Unauthorized
result: [pending]

### 6. AdminGuard Allows Authenticated Writes
expected: `curl -X POST http://localhost:3000/api/roadmaps -H 'Content-Type: application/json' -H 'Authorization: Bearer supersecret' -d '{"slug":"test-verify","title":"Test"}'` → HTTP 201 with created roadmap JSON
result: [pending]

### 7. Unit Test Suites Pass
expected: `pnpm --filter @vizteck/svc-roadmap test` passes 2/2 AND `pnpm --filter @vizteck/api-gateway test` passes 2/2
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
