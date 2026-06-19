---
phase: 03-public-viewer
verified: 2026-06-19T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open http://localhost:3001 after starting apps/web (pnpm --filter @vizteck/web dev) with api-gateway running. Confirm the home page renders one Card per seeded roadmap without any login prompt."
    expected: "3-column grid of roadmap cards visible; no auth gate; each card links to /roadmap/<slug>"
    why_human: "SSG/ISR rendering and card layout require a live browser render to confirm; grep cannot verify what a browser displays"
  - test: "Navigate to /roadmap/<slug> for any seeded roadmap. Attempt to drag a node."
    expected: "Graph renders read-only; nodes resist dragging; no Save button visible"
    why_human: "Drag behavior is an interactive runtime property of @xyflow/react that cannot be verified by static analysis"
  - test: "Click a LESSON-type node on the roadmap graph page."
    expected: "Browser navigates to /roadmap/<slug>/node/<id> and renders lesson text through BlockNoteView (not raw JSON)"
    why_human: "Navigation and BlockNote rendering are browser-only behaviors; editable={false} is verified in code but rendered output requires visual confirmation"
  - test: "Click a ROADMAP-type node (one with a targetRoadmapId) on the graph."
    expected: "Browser navigates to /roadmap/<targetRoadmapId> — internal path only; no external redirect"
    why_human: "Runtime navigation path cannot be verified statically; T-03-02 open-redirect mitigation must be confirmed live"
  - test: "Confirm next build exits 0 without api-gateway running: cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:3000 pnpm exec next build"
    expected: "Build exits 0; all three routes appear in build output; each carries revalidate 1h"
    why_human: "Build requires Node.js execution with the installed pnpm workspace; cannot run inside static analysis"
---

# Phase 03: Public Viewer Verification Report

**Phase Goal:** Public users can browse roadmaps and read lesson content on apps/web without any auth
**Verified:** 2026-06-19
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | apps/web home page (/) shows a card for each seeded roadmap with no login required | VERIFIED | `apps/web/src/app/page.tsx` calls `fetchRoadmaps()`, renders `<Card>` grid via `@vizteck/ui`, no auth guard; `export const revalidate = 3600` |
| 2 | /roadmap/[slug] renders the roadmap graph read-only — nodes are not draggable | VERIFIED | `RoadmapGraphView` passes `mode="view"` to `<RoadmapGraph>`; `RoadmapGraph.tsx` line 51: `nodesDraggable={!isView}` resolves to `false` when `isView=true`; same for `nodesConnectable`, `elementsSelectable`, `edgesReconnectable` |
| 3 | Clicking a LESSON node navigates to /roadmap/[slug]/node/[id] and shows rendered lesson text | VERIFIED | `RoadmapGraphView.tsx` lines 22-28: `onNodeClick` routes LESSON to `/roadmap/${slug}/node/${node.id}`; `LessonContent.tsx` uses `useCreateBlockNote` + `BlockNoteView editable={false} theme="light"`; guarded against empty/invalid JSON |
| 4 | Pages build statically (next build succeeds without live api-gateway) and carry revalidate: 3600 | VERIFIED | All three pages export `revalidate = 3600`; dynamic pages export `generateStaticParams() { return []; }` and `dynamicParams = true`; fetch calls wrapped in try/catch; params typed as `Promise<{...}>` and awaited (Next.js 16 requirement) |

**Score: 4/4 truths verified**

---

### Plan Must-Have Truths (Plan 03-01: @vizteck/ui)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ROADMAP node renders indigo pill labeled ROADMAP; LESSON node renders emerald pill labeled LESSON | VERIFIED | `NodeBadge.tsx`: ROADMAP bg `#EEF2FF` color `#4F46E5` label "ROADMAP"; LESSON bg `#ECFDF5` color `#059669` label "LESSON" |
| 2 | Button renders primary/secondary/ghost variants using locked design tokens | VERIFIED | `Button.tsx`: primary bg `#4F46E5`; secondary bg white border+text `#4F46E5`; ghost transparent text `#475569`; forwards `...props` merges `style` |
| 3 | Card renders a NodeBadge, title, optional description, and miniGraph slot | VERIFIED | `Card.tsx` renders `<NodeBadge type={type} />`, Space Grotesk title, Inter description, miniGraph slot on `#F1F3F9` |
| 4 | @vizteck/ui can be imported by other workspace packages via barrel export | VERIFIED | `packages/ui/src/index.ts` re-exports Button/ButtonProps/ButtonVariant, Card/CardProps, NodeBadge/NodeType/NodeBadgeProps; imported by `packages/graph/src/RoadmapNode.tsx` |

### Plan Must-Have Truths (Plan 03-02: @vizteck/graph)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | RoadmapGraph renders nodes and edges from NodeItem[]/EdgeItem[] using @xyflow/react | VERIFIED | `RoadmapGraph.tsx` maps NodeItem[] to RF nodes with `type: 'roadmapNode'`, maps EdgeItem[] to RF edges; feeds to `<ReactFlow>` |
| 2 | In mode=view, nodes are not draggable, not connectable, and not selectable | VERIFIED | `const isView = mode === 'view'`; `nodesDraggable={!isView}`, `nodesConnectable={!isView}`, `elementsSelectable={!isView}`, `edgesReconnectable={!isView}` |
| 3 | ROADMAP node renders indigo (#4F46E5) border; LESSON node renders emerald (#059669) border | VERIFIED | `RoadmapNode.tsx` BORDER_COLOR record: ROADMAP `#4F46E5`, LESSON `#059669`; applied as `border: \`2px solid ${borderColor}\`` |
| 4 | Graph imports @xyflow/react/dist/style.css so handles and edges are styled | VERIFIED | `RoadmapGraph.tsx` line 2: `import '@xyflow/react/dist/style.css';` — before component definition |
| 5 | @vizteck/graph can be imported by apps/web via barrel export | VERIFIED | `packages/graph/src/index.ts` exports RoadmapGraph/RoadmapGraphProps, RoadmapNode, NodeItem/EdgeItem/GraphNodeType; imported by `apps/web/src/components/RoadmapGraphView.tsx` |

### Plan Must-Have Truths (Plan 03-03: apps/web)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | apps/web home page (/) shows a card for each roadmap with no login required | VERIFIED | (see ROADMAP SC 1) |
| 2 | /roadmap/[slug] renders the roadmap graph read-only (nodes not draggable) | VERIFIED | (see ROADMAP SC 2) |
| 3 | Clicking a LESSON node navigates to /roadmap/[slug]/node/[id] and shows rendered lesson text | VERIFIED | (see ROADMAP SC 3) |
| 4 | Clicking a ROADMAP node navigates to the target roadmap | VERIFIED | `RoadmapGraphView.tsx` lines 25-27: if `node.type === 'ROADMAP' && node.targetRoadmapId` then `router.push('/roadmap/${node.targetRoadmapId}')` — internal-only (T-03-02 mitigated) |
| 5 | next build succeeds without a live api-gateway and every page carries revalidate = 3600 | VERIFIED | (see ROADMAP SC 4) |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/ui/src/NodeBadge.tsx` | NodeBadge component + NodeType + NodeBadgeProps | VERIFIED | Exists, substantive (DEC-03-09 colors), imported by Card.tsx and RoadmapNode.tsx |
| `packages/ui/src/Button.tsx` | Button with variant prop | VERIFIED | Exists, substantive (3 variants), exported via barrel |
| `packages/ui/src/Card.tsx` | Card (badge + title + description + miniGraph slot) | VERIFIED | Exists, imports NodeBadge, renders all slots |
| `packages/ui/src/index.ts` | Barrel export for @vizteck/ui | VERIFIED | All 3 components + types re-exported |
| `packages/ui/package.json` | @vizteck/ui workspace package (main = ./src/index.ts) | VERIFIED | name `@vizteck/ui`, main `./src/index.ts` |
| `packages/graph/src/RoadmapGraph.tsx` | RoadmapGraph client component with mode=view/edit | VERIFIED | Exists, 'use client', CSS import, nodeTypes at module scope, view/edit flags |
| `packages/graph/src/RoadmapNode.tsx` | Custom @xyflow/react node renderer | VERIFIED | Exists, imports NodeBadge from @vizteck/ui, applies ROADMAP/LESSON border colors |
| `packages/graph/src/types.ts` | NodeItem, EdgeItem, GraphNodeType | VERIFIED | Exists, mirrors NodeDto/EdgeDto field-for-field |
| `packages/graph/package.json` | @vizteck/graph workspace package | VERIFIED | name `@vizteck/graph`, depends on `@xyflow/react ^12.11.0` and `@vizteck/ui workspace:*` |
| `apps/web/next.config.js` | transpilePackages for workspace + ESM-only deps | VERIFIED | All 6 required packages: @vizteck/ui, @vizteck/graph, @xyflow/react, @blocknote/react, @blocknote/core, @blocknote/mantine |
| `apps/web/src/lib/api.ts` | typed fetch helpers + client types | VERIFIED | fetchRoadmaps, fetchRoadmap, fetchNode; RoadmapItem, NodeItem, EdgeItem, RoadmapDetail; uses `cache: 'force-cache'` |
| `apps/web/src/app/page.tsx` | home SSG page, 3-column card grid, revalidate 3600 | VERIFIED | export const revalidate = 3600; 3-col grid; Card from @vizteck/ui; try/catch fetch |
| `apps/web/src/app/roadmap/[slug]/page.tsx` | graph view SSG page | VERIFIED | generateStaticParams, dynamicParams = true, await params, RoadmapGraphView |
| `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` | lesson SSG page | VERIFIED | generateStaticParams, dynamicParams = true, await params, LessonContent |
| `apps/web/src/components/LessonContent.tsx` | BlockNote read-only viewer ('use client') | VERIFIED | 'use client', imports both BlockNote CSS, useCreateBlockNote, BlockNoteView editable={false}, JSON guard |
| `apps/web/src/components/RoadmapGraphView.tsx` | client wrapper rendering RoadmapGraph + Breadcrumb + node-click navigation | VERIFIED | 'use client', imports RoadmapGraph from @vizteck/graph, Breadcrumb, useRouter, internal-only navigation |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/ui/src/Card.tsx` | `packages/ui/src/NodeBadge.tsx` | `import { NodeBadge }` | WIRED | Line 2: `import { NodeBadge, NodeType } from './NodeBadge'`; used in JSX line 27 |
| `packages/ui/src/index.ts` | Button, Card, NodeBadge | barrel re-export | WIRED | All 3 components + 5 types exported |
| `packages/graph/src/RoadmapGraph.tsx` | `@xyflow/react/dist/style.css` | CSS side-effect import | WIRED | Line 2: `import '@xyflow/react/dist/style.css'` before component definition |
| `packages/graph/src/RoadmapGraph.tsx` | `packages/graph/src/RoadmapNode.tsx` | nodeTypes map at module scope | WIRED | Line 9: `const nodeTypes = { roadmapNode: RoadmapNode }` outside component function |
| `packages/graph/src/RoadmapNode.tsx` | `@vizteck/ui (NodeBadge)` | `import { NodeBadge }` | WIRED | Line 3: `import { NodeBadge } from '@vizteck/ui'`; rendered in JSX line 35 |
| `apps/web/src/app/page.tsx` | `/api/roadmaps` | `fetchRoadmaps()` at build time | WIRED | Line 10: `roadmaps = await fetchRoadmaps()` in async component; api.ts line 36: `fetch(\`${API}/api/roadmaps\`, ...)` |
| `apps/web/src/components/RoadmapGraphView.tsx` | `@vizteck/graph (RoadmapGraph)` | import | WIRED | Line 4: `import { RoadmapGraph } from '@vizteck/graph'`; used in JSX |
| `apps/web/src/components/LessonContent.tsx` | `@blocknote/react` | `useCreateBlockNote + BlockNoteView editable=false` | WIRED | Line 6: `import { useCreateBlockNote } from '@blocknote/react'`; line 47: `<BlockNoteView editor={editor} editable={false} theme="light" />` |
| `apps/web/next.config.js` | `@vizteck/ui, @vizteck/graph, @xyflow/react, @blocknote/*` | transpilePackages array | WIRED | All 6 packages present in transpilePackages |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `apps/web/src/app/page.tsx` | `roadmaps` | `fetchRoadmaps()` → `GET /api/roadmaps` → gRPC `getRoadmaps` → Prisma | Real DB query (Phase 2 verified); try/catch returns `[]` at build time | FLOWING (at runtime); STATIC (at build without api-gateway — by design) |
| `apps/web/src/app/roadmap/[slug]/page.tsx` | `detail` | `fetchRoadmap(slug)` → `GET /api/roadmaps/:slug` → gRPC `getRoadmap` → Prisma | Real DB query; try/catch returns "not found" UI | FLOWING (at runtime) |
| `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` | `node` | `fetchNode(id)` → `GET /api/nodes/:id` → gRPC `getNode` → Prisma | `svc-roadmap getNode` confirmed implemented; try/catch returns "not found" UI | FLOWING (at runtime) |
| `apps/web/src/components/RoadmapGraphView.tsx` | `detail.nodes`, `detail.edges` | Passed from RoadmapPage server component | Real data from api-gateway; forwarded as props | FLOWING |
| `apps/web/src/components/LessonContent.tsx` | `contentJson` | Passed from LessonPage server component as `node.content ?? '[]'` | Real BlockNote JSON from DB `Node.content` field; JSON.parse guard handles empty | FLOWING |
| `apps/web/src/app/page.tsx` (MiniGraph slot) | `nodes`, `edges` for MiniGraph | Hardcoded `nodes={[]}` `edges={[]}` | Empty — home list API does not return node position data | HOLLOW_PROP (known stub, visual-only; does not affect phase goal) |
| `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` (MiniGraph sidebar) | `nodes`, `edges` for MiniGraph | Hardcoded `nodes={[]}` `edges={[]}` | Empty — single node endpoint does not return full roadmap graph | HOLLOW_PROP (known stub, visual-only; does not affect phase goal) |

**Note on MiniGraph hollow props:** The SUMMARY.md explicitly documents these as known stubs. MiniGraph renders an empty SVG canvas — the component is fully functional but has no data to draw. This does NOT block any ROADMAP success criterion: the phase goal is "browse roadmaps and read lesson content", which is achieved by Card rendering (not MiniGraph preview) and LessonContent (not sidebar graph). MiniGraph is a future enhancement, not a requirement.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| next.config.js includes all 6 transpilePackages | `node -e "const c=require('./apps/web/next.config.js'); ['@vizteck/ui','@vizteck/graph','@xyflow/react','@blocknote/react','@blocknote/core','@blocknote/mantine'].forEach(p=>{if(!(c.transpilePackages||[]).includes(p)) process.exit(1)})"` | Not run (no Node.js in verifier) — verified by reading file | SKIP (verified by code read) |
| packages/ui package name | `node -e "const p=require('./packages/ui/package.json'); if(p.name!=='@vizteck/ui'||p.main!=='./src/index.ts') process.exit(1)"` | Not run — verified by reading file | SKIP (verified by code read) |
| packages/graph has @xyflow/react dep | `node -e "const p=require('./packages/graph/package.json'); if(!p.dependencies['@xyflow/react']) process.exit(1)"` | Not run — verified by reading file | SKIP (verified by code read) |
| revalidate=3600 in all 3 pages | grep pattern | 3 matches confirmed in page.tsx, roadmap/[slug]/page.tsx, node/[id]/page.tsx | PASS |
| generateStaticParams returns [] | grep pattern | Present in both dynamic pages | PASS |
| await params in dynamic pages | grep pattern | Both pages type params as Promise<{...}> and await | PASS |
| editable={false} in LessonContent | grep pattern | Line 47 of LessonContent.tsx | PASS |
| 'use client' on RoadmapGraph, RoadmapNode, RoadmapGraphView, LessonContent, ThemeToggle | code read | Present as first line in all 5 files | PASS |
| nodeTypes at module scope (not inside component) | code read | Line 9 of RoadmapGraph.tsx — before component function | PASS |
| No Save button in RoadmapGraph | code read | No Save/save/button related to edit in RoadmapGraph.tsx | PASS |
| Internal-only navigation in RoadmapGraphView | code read | router.push('/roadmap/${...}') only — no external URL construction | PASS |

---

### Probe Execution

No probes declared in PLAN.md files. Phase does not have conventional `scripts/*/tests/probe-*.sh`.

Step 7c: SKIPPED (no probes declared or found)

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REQ-public-roadmap-list | 03-01, 03-03 | Public users browse roadmap list at /; cards rendered via SSG | SATISFIED | Home page renders Card grid via fetchRoadmaps; no auth; revalidate=3600 |
| REQ-public-roadmap-graph-view | 03-01, 03-02, 03-03 | /roadmap/[slug] renders read-only graph; ROADMAP node click navigates to target | SATISFIED | RoadmapGraphView + RoadmapGraph mode="view" wired; onNodeClick routes ROADMAP to targetRoadmapId |
| REQ-public-lesson-content-view | 03-03 | /roadmap/[slug]/node/[id] renders lesson content via BlockNote; GET /api/nodes/:id exists | SATISFIED | LessonContent with BlockNoteView editable={false}; api-gateway GET /api/nodes/:id exists and delegates to gRPC getNode which is implemented in svc-roadmap |
| REQ-nfr-ssg-revalidation | 03-03 | All pages use revalidate=3600; build succeeds without live api-gateway | SATISFIED | 3 pages export revalidate=3600; generateStaticParams returns []; try/catch fetch wrappers |

**Note on REQUIREMENTS.md traceability table:** The table at the bottom of REQUIREMENTS.md shows `REQ-public-lesson-content-view` and `REQ-nfr-ssg-revalidation` as "Pending". This is a stale tracking artifact — the actual code satisfies both requirements. The traceability table was not updated when Phase 3 was completed. This is an informational finding, not a gap.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/web/src/app/page.tsx` | 72 | `nodes={[]}` passed to MiniGraph | Info | Empty SVG renders; no ROADMAP SC depends on MiniGraph data; documented known stub in SUMMARY.md |
| `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` | 168 | `nodes={[]}` passed to MiniGraph | Info | Same as above — sidebar mini graph empty |

No TBD/FIXME/XXX/TODO debt markers found in any Phase 3 files. No unimplemented handlers. No placeholder returns in required paths.

---

### Human Verification Required

#### 1. Home Page Card Rendering

**Test:** Start api-gateway and apps/web. Open http://localhost:3001. Confirm the home page displays roadmap cards.
**Expected:** 3-column grid of roadmap cards appears with titles and ROADMAP badges. No login prompt. Each card links to /roadmap/<slug>.
**Why human:** SSG rendering and card layout require a live browser to confirm visual output.

#### 2. Read-Only Graph (No Drag)

**Test:** Navigate to /roadmap/<slug> for any seeded roadmap. Attempt to drag a node.
**Expected:** Graph renders; nodes resist all dragging; no Save button; controls (zoom/fit) present.
**Why human:** Drag behavior is a runtime @xyflow/react property; static analysis cannot confirm interactive lock behavior.

#### 3. LESSON Node Click — BlockNote Render

**Test:** On the graph page, click a LESSON-type node.
**Expected:** Page navigates to /roadmap/<slug>/node/<id>. Lesson text renders through BlockNoteView (readable paragraphs, not raw JSON). The LESSON badge and node title appear above a divider.
**Why human:** BlockNote rendering and navigation are browser-only behaviors; `editable={false}` is in the code but rendered output requires visual confirmation.

#### 4. ROADMAP Node Click — Internal Navigation

**Test:** On a graph that has a ROADMAP-type node with a targetRoadmapId, click it.
**Expected:** Browser navigates to /roadmap/<targetRoadmapId> — the target roadmap's graph page. No external redirect occurs.
**Why human:** Runtime navigation must be confirmed to verify T-03-02 open-redirect mitigation works as coded.

#### 5. next build Without api-gateway

**Test:** Stop api-gateway. Run: `cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:3000 pnpm exec next build`
**Expected:** Build exits 0. Output shows / (static), /roadmap/[slug] (ISR), /roadmap/[slug]/node/[id] (ISR). No TypeScript errors. Each data-fetching route shows revalidate: 3600 or 1h.
**Why human:** Build execution requires the installed Node.js + pnpm workspace which cannot be run inside static analysis.

---

### Gaps Summary

No gaps found. All 4 ROADMAP success criteria are verified at code level (exist, substantive, wired, data flows where applicable). All 4 requirement IDs from PLAN frontmatter are satisfied. No blocker anti-patterns. The MiniGraph hollow props are a documented visual stub that does not affect any phase goal criterion.

The REQUIREMENTS.md traceability table has two stale "Pending" entries for Phase 3 requirements that are actually implemented — this is a documentation artifact, not a code gap.

---

_Verified: 2026-06-19_
_Verifier: Claude (gsd-verifier)_
