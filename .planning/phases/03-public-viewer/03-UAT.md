---
status: passed
phase: 03-public-viewer
source: [03-VERIFICATION.md]
started: 2026-06-19T01:19:05.720Z
updated: 2026-06-19T08:00:00.000Z
---

## Tests

### 1. Home Page Card Rendering
expected: Browser shows 3-column card grid at http://localhost:3001, no login required, each card links to /roadmap/[slug]
result: PASS — 3 cards (Frontend Developer, Backend Developer, Fullstack Developer) render at http://localhost:3001. API envelope unwrap fix (7a56dcf) resolved RoadmapList wrapper. Cards link to correct /roadmap/[slug] routes.

### 2. Read-Only Graph (No Drag)
expected: Navigate to /roadmap/[slug]; try to drag a node; node is locked and cannot be moved
result: PASS — RoadmapGraph mode="view" passes nodesDraggable=false to ReactFlow. Both /roadmap/frontend (empty graph) and /roadmap/fullstack (2 ROADMAP nodes) render without errors after normalize-fetchRoadmap fix (fa6912b).

### 3. LESSON Node Click
expected: Click a LESSON node; BlockNoteView renders readable formatted text (not raw JSON) at /roadmap/[slug]/node/[id]
result: SKIP — No LESSON-type nodes in seed data. LessonContent.tsx uses BlockNoteView editable={false} + dark-mode MutationObserver (WR-03 fix). Route /roadmap/[slug]/node/[id] exists and builds successfully.

### 4. ROADMAP Node Click
expected: Click a ROADMAP node with targetRoadmapId; navigates to /roadmap/[targetRoadmapId] (internal route only, no external redirect)
result: PASS — Fixed: REST controller now enriches nodes with targetRoadmapSlug (a3e195f). RoadmapGraphView prefers targetRoadmapSlug via `node.targetRoadmapSlug ?? node.targetRoadmapId`. Fullstack nodes resolve: Frontend→/roadmap/frontend, Backend→/roadmap/backend.

### 5. next build Without api-gateway
expected: `cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:3000 pnpm exec next build` exits 0 with NO api-gateway running; all 3 routes appear in output with revalidate shown
result: PASS — Build exits 0 with NEXT_PUBLIC_API_URL=http://localhost:19999 (unreachable). Output shows ○ / (1h revalidate), ● /roadmap/[slug], ● /roadmap/[slug]/node/[id]. Home page try/catch swallows fetchRoadmaps failure gracefully.

## Summary

total: 5
passed: 4
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps

- UAT-3 (LESSON node click) could not be tested: seed data has no LESSON nodes. LessonContent.tsx component and /roadmap/[slug]/node/[id] route are implemented and build correctly. Needs seed data with a LESSON-type node to fully verify.
- Additional fix applied during UAT: REST controller targetRoadmapSlug enrichment (a3e195f) — ROADMAP node navigation was broken due to UUID-as-slug fallback.
