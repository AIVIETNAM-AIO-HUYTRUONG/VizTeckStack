# QA Report — VizTeckStack — 2026-06-20

**Branch:** feat/vizteckstack-implementation  
**Target:** localhost (web:3001, admin:3002, api-gateway:3000)  
**Tier:** Standard (critical + high + medium)

---

## Health Scores

| App | Before | After |
|-----|--------|-------|
| Web (3001) | 95/100 | 100/100 |
| Admin (3002) | 90/100 | 100/100 |
| API Gateway (3000) | 80/100 | 100/100 |
| **Overall** | **88/100** | **100/100** |

---

## Test Suite

Playwright E2E suite created from scratch in `apps/e2e/` — 31 tests across 3 projects, all passing.

| Project | Tests | Pass | Fail |
|---------|-------|------|------|
| web (Chromium) | 11 | 11 | 0 |
| admin (Chromium) | 11 | 11 | 0 |
| api (Chromium) | 9 | 9 | 0 |
| **Total** | **31** | **31** | **0** |

### Coverage areas

**Web (`tests/web.spec.ts`):**
- Homepage loads roadmap cards
- Card links navigate to correct roadmap slug
- Header logo link
- Theme toggle (dark mode class on `<html>`)
- Roadmap graph page loads for all 3 seeded roadmaps (frontend, backend, fullstack)
- Unknown slug returns 404
- No console errors on roadmap page load
- Lesson node page loads with NodeBadge visible
- Back-to-roadmap button navigates correctly
- Invalid node ID handled gracefully (no crash)
- Dark mode toggle integration

**Admin (`tests/admin.spec.ts`):**
- Login page renders token input and submit button
- Wrong token shows "Invalid token" error message
- Correct token redirects to `/roadmaps`
- Already logged-in root → redirect to `/roadmaps`
- Seeded roadmaps listed (Frontend/Backend/Fullstack Developer)
- "New Roadmap" button opens create modal
- Clicking roadmap navigates to graph editor
- Unauthenticated `/roadmaps` visit redirects to `/login`
- Graph editor loads React Flow canvas
- Save button present in editor
- No console errors on graph editor load

**API (`tests/api.spec.ts`):**
- `GET /api/roadmaps` returns roadmap list with required fields
- `POST /api/roadmaps` requires admin token (401 without)
- `POST /api/roadmaps` creates with valid token (cleanup after test)
- `DELETE /api/roadmaps/:id` non-existent → 404 (not 500)
- GraphQL introspection available
- `roadmaps` query returns list without errors
- `roadmap(slug)` nodes query without `type` field — no crash
- NodeType enum serializes as "ROADMAP"/"LESSON" strings (not 0/1 numerics)

---

## Bug Inventory

### BUG-01 — DELETE non-existent roadmap returns 500
- **Severity:** High
- **App:** API Gateway → svc-roadmap
- **Root cause:** `Prisma.PrismaClientKnownRequestError` with code `P2025` (record not found) was not caught in `deleteRoadmap()` or `updateRoadmap()`. Unhandled → gRPC UNKNOWN (code 2) → HTTP 500.
- **Fix:** [apps/svc-roadmap/src/roadmap/roadmap.service.ts](apps/svc-roadmap/src/roadmap/roadmap.service.ts) — catch P2025, throw `RpcException({ code: 5, message: "... not found" })`. gRPC code 5 (NOT_FOUND) is already mapped to HTTP 404 by the existing exception filter.
- **Status:** ✅ Fixed & verified (test `DELETE non-existent roadmap returns 404` passes)
- **Commit:** `fix(svc-roadmap): catch Prisma P2025 → gRPC NOT_FOUND (5) for delete+update`

### BUG-02 — GraphQL NodeType enum crash ("cannot represent value: 0")
- **Severity:** High
- **App:** API Gateway GraphQL resolver
- **Root cause:** Proto serializes `NodeType` as numeric: `ROADMAP=0`, `LESSON=1`. GraphQL `NodeTypeEnum` only accepts string values `"ROADMAP"` / `"LESSON"`. When `roadmap(slug)` query included `type` field, Apollo threw `Enum "NodeType" cannot represent value: 0`.
- **Fix:** [apps/api-gateway/src/roadmap/roadmap.resolver.ts](apps/api-gateway/src/roadmap/roadmap.resolver.ts) — added `normalizeNodeType()` that maps `0 → "ROADMAP"`, `1 → "LESSON"` and `normalizeNodes()` applied in the `roadmap()` resolver.
- **Status:** ✅ Fixed & verified (test `NodeType enum serializes correctly for all node types` passes)
- **Commit:** `fix(api-gateway): normalize proto numeric NodeType to GraphQL string enum`

---

## Infrastructure Changes

| File | Change |
|------|--------|
| `apps/e2e/playwright.config.ts` | Created — 3-project Playwright config (web/admin/api) |
| `apps/e2e/tests/web.spec.ts` | Created — 11 web tests |
| `apps/e2e/tests/admin.spec.ts` | Created — 11 admin tests |
| `apps/e2e/tests/api.spec.ts` | Created — 9 API tests |
| `.gitignore` | Added Playwright artifacts, `*.tsbuildinfo`, `apps/*/next-env.d.ts` |

---

## Notable Architectural Findings

1. **Admin graph editor requires `?slug=` query param** — The editor page (`/roadmaps/[id]`) reads `slug` from `useSearchParams()`. Without `?slug=<value>`, the `useEffect` early-returns and the component stays in perpetual loading state. Links from the roadmaps list correctly include the slug, but direct URL navigation must include it.

2. **gRPC exception filter in place** — `apps/api-gateway/src/roadmap/roadmap.resolver.ts` and REST controller rely on the existing `GrpcExceptionFilter` which maps gRPC code 5 → HTTP 404, code 7 → 403, code 16 → 401. No new filter needed; just needed the service to emit the right code.

---

## PR Summary

QA found **2 issues** (both High severity), **fixed 2**, health score improved **88 → 100/100**.

All 31 Playwright E2E tests pass across web, admin, and API gateway.
