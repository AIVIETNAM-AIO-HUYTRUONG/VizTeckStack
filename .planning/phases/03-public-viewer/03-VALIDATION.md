---
phase: 03
slug: public-viewer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-18
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected yet — Wave 0 (03-03 Task 1) installs test runner |
| **Config file** | `apps/web/jest.config.js` or `apps/web/vitest.config.ts` (Wave 0 gap) |
| **Quick run command** | `pnpm --filter @vizteck/web build` (primary gate) |
| **Full suite command** | `pnpm build` |
| **Estimated runtime** | ~30–60 seconds (Next.js build) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @vizteck/web build` (or tsc --noEmit for package tasks)
- **After every plan wave:** Run `pnpm build` (full workspace)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 03-01 | 1 | REQ-public-roadmap-list, REQ-public-roadmap-graph-view | Components export named exports; no apps/* imports | build | `pnpm --filter @vizteck/ui build 2>/dev/null; cd packages/ui && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 03-01-02 | 03-01 | 1 | REQ-public-roadmap-list, REQ-public-roadmap-graph-view | NodeBadge renders ROADMAP/LESSON badge with correct colors | type-check | `cd packages/ui && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 03-02-01 | 03-02 | 2 | REQ-public-roadmap-graph-view | @xyflow/react CSS import present; package builds | type-check | `cd packages/graph && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 03-02-02 | 03-02 | 2 | REQ-public-roadmap-graph-view | mode="view" disables drag/connect/pan; no Save button | type-check | `cd packages/graph && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03-03 | 3 | REQ-nfr-ssg-revalidation | transpilePackages set; env vars in .env.example | build | `pnpm --filter @vizteck/web build` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03-03 | 3 | REQ-public-roadmap-list, REQ-public-roadmap-graph-view, REQ-public-lesson-content-view | Components export; BlockNote CSS imports present; no dangerouslySetInnerHTML with raw content | build | `pnpm --filter @vizteck/web build` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03-03 | 3 | REQ-public-roadmap-list, REQ-public-roadmap-graph-view, REQ-public-lesson-content-view, REQ-nfr-ssg-revalidation | All 3 routes exist; revalidate=3600; generateStaticParams returns []; await params used | build | `pnpm --filter @vizteck/web build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/jest.config.js` or `apps/web/vitest.config.ts` — test runner config (optional — build gate is primary)
- [ ] `packages/ui/package.json` — must have `build` or `type-check` script
- [ ] `packages/graph/package.json` — must have `build` or `type-check` script
- [ ] `apps/web/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:3000` for dev

> **Note:** The primary verification gate for this phase is `next build` succeeding (REQ-nfr-ssg-revalidation). Type-check (`tsc --noEmit`) is the per-task gate for packages/ui and packages/graph. Unit tests for React components are secondary and can be added incrementally.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Home page renders 3-column grid with mini graph SVGs in browser | REQ-public-roadmap-list | Visual layout check | Run `pnpm --filter @vizteck/web dev`, visit http://localhost:3001, verify card grid and mini graph dots visible |
| /roadmap/[slug] graph nodes are not draggable | REQ-public-roadmap-graph-view | Interactive behavior | Visit /roadmap/fullstack-dev, try to drag nodes — they must not move |
| Clicking LESSON node navigates to lesson page | REQ-public-lesson-content-view | Interactive navigation | Click a LESSON node in the graph, verify URL changes to /roadmap/[slug]/node/[id] and BlockNote content renders |
| BlockNote content renders with code blocks | REQ-public-lesson-content-view | Visual check | Verify lesson page shows formatted text, headers, and syntax-highlighted code blocks |
| Graph breadcrumb shows visited/active/none dot states | DEC-03-07 | Visual check | Navigate home → roadmap → lesson, verify breadcrumb dots update state at each level |

---

## Security Verification

| Threat | Mitigation | Verifiable |
|--------|-----------|------------|
| Path traversal via [slug]/[id] params | api-gateway validates and 404s on unknown IDs | Manual: fetch /api/roadmaps/../../etc — expect 404 |
| Open redirect via targetRoadmapId navigation | Only navigate to /roadmap/${targetRoadmapId} (internal) | Code review: no arbitrary URL navigation |
| XSS via BlockNote JSON | BlockNote renderer escapes; no dangerouslySetInnerHTML | Code review: search for dangerouslySetInnerHTML in lesson components |

---

## Validation Sign-Off

- [ ] All tasks have automated verify (tsc --noEmit or next build)
- [ ] Sampling continuity: build gate runs after each wave
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags in verify commands
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter when sign-off complete

**Approval:** pending
