# Phase 03: Public Viewer — Research

**Researched:** 2026-06-18
**Domain:** Next.js 16 SSG, @xyflow/react v12, @blocknote/react, Turborepo workspace packages
**Confidence:** HIGH (core patterns), MEDIUM (Next.js 16 SSG revalidation model)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **DEC-03-01 — Theme:** Light mode by default; no persistence. Toggle state lives in React state only.
- **DEC-03-02 — Home Layout:** 3-column card grid. Each card: NodeBadge, title+subtitle, mini graph SVG preview (dots + lines on #F1F3F9), click navigates to roadmap graph.
- **DEC-03-03 — Lesson Rendering:** @blocknote/react with `editable={false}`. Render only for `node.type === LESSON`.
- **DEC-03-04 — Design Source:** `docs/design/mockup.html` is the canonical reference. Implement exactly.
- **DEC-03-05 — Graph Canvas Background:** Plain fill `#F4F6FB`. No CSS radial-gradient dot pattern.
- **DEC-03-06 — SSG Revalidation:** `revalidate: 3600` on all data-fetching pages.
- **DEC-03-07 — Graph Breadcrumb:** Horizontal row of labeled dots with visited/active/none states.
- **DEC-03-08 — Lesson Page Layout:** 2-column: content left, 280px sidebar right (progress bar, mini graph, "Next Lesson →" CTA).
- **DEC-03-09 — Node Visual Distinction:** ROADMAP = indigo (#4F46E5) border; LESSON = emerald (#059669) border.
- **DEC-03-10 — RoadmapGraph Modes:** `mode="view"` (read-only, no drag, no connect, no Save); `mode="edit"` (Phase 4).

### Claude's Discretion

None listed — all UI decisions are locked in DEC-03-01 through DEC-03-10.

### Deferred Ideas (OUT OF SCOPE)

- apps/admin and all admin-side features
- `mode="edit"` Save button wiring
- Dark sidebar admin nav (Screen 4 in mockup)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-public-roadmap-list | Home page (/) shows roadmap cards SSG, no auth, revalidate 3600 | Next.js 16 `export const revalidate = 3600`, fetch `/api/roadmaps` at build time |
| REQ-public-roadmap-graph-view | /roadmap/[slug] renders RoadmapGraph mode="view", read-only | @xyflow/react `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}` |
| REQ-public-lesson-content-view | /roadmap/[slug]/node/[id] renders BlockNote JSON as rich text | `useCreateBlockNote({ initialContent })` + `<BlockNoteView editable={false} />` |
| REQ-nfr-ssg-revalidation | All pages build statically, carry revalidate: 3600 | `generateStaticParams` + `export const revalidate = 3600` in each page |
</phase_requirements>

---

## Summary

Phase 3 builds three packages and one app:

1. **packages/ui** — shared React components (Button, Card, NodeBadge) with no external library dependency beyond React itself.
2. **packages/graph** — `<RoadmapGraph>` wrapping `@xyflow/react` v12.11.0 with `mode="view"|"edit"` prop.
3. **apps/web** — Next.js 16.2.9 App Router public viewer with SSG pages at `/`, `/roadmap/[slug]`, and `/roadmap/[slug]/node/[id]`.

The runtime version (`next@latest`) is **16.2.9** (not 15). The CONTEXT.md was written when Next.js 15 was current. Next.js 16 is fully backward-compatible for this project's SSG pattern: `cacheComponents` (the new model) is off by default, so `export const revalidate = 3600` and `generateStaticParams` still work exactly as documented. The key breaking change in Next.js 16 is that `params` in page components must now be awaited (`const { slug } = await params`), which all new code must follow.

The @xyflow/react CSS import is mandatory — omitting it produces an unstyled/broken graph. BlockNote requires `@blocknote/core/fonts/inter.css` and `@blocknote/mantine/style.css`. Both packages must be in `transpilePackages` in `next.config.js` because Next.js cannot transpile ESM-only packages from `node_modules` without this setting.

**Primary recommendation:** Install `next@16.2.9`, use `export const revalidate = 3600` (not the `use cache` / `cacheComponents` pattern), and always `await params` in page components.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Roadmap list data fetching | Frontend Server (SSG) | API Gateway (REST) | Home page fetches `/api/roadmaps` at build time via SSG |
| Graph rendering | Browser/Client | Frontend Server (SSR shell) | @xyflow/react requires `'use client'`; page shell is server-rendered |
| Lesson content rendering | Browser/Client | Frontend Server (SSR shell) | @blocknote/react is client-only (`ssr: false` or `'use client'`) |
| Route data hydration | Frontend Server (SSG) | — | `generateStaticParams` pre-renders all slugs/ids at build time |
| Shared UI components (Button, Card, NodeBadge) | Browser/Client | — | packages/ui: pure React, no server logic |
| Design tokens / CSS | Browser/Client | — | CSS custom properties from mockup.html, global stylesheet in apps/web |
| packages/ui and packages/graph transpilation | Frontend Server (build) | — | `transpilePackages` in next.config.js compiles workspace ESM to CJS |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.2.9 | Next.js App Router, SSG, ISR | `npm@latest` as of 2026-06-18; stable SSG + ISR support |
| `react` | 19.x (peer dep of next@16) | Component model | Required by Next.js 16 |
| `react-dom` | 19.x | DOM rendering | Required by Next.js 16 |
| `@xyflow/react` | 12.11.0 | Interactive graph canvas | Official React Flow v12 package; 7.4M weekly downloads |
| `@blocknote/react` | 0.51.4 | BlockNote rich text read-only viewer | Required by DEC-03-03; official BlockNote React package |
| `@blocknote/core` | 0.51.4 | BlockNote core (peer of @blocknote/react) | Required peer dependency |
| `@blocknote/mantine` | 0.51.4 | BlockNote Mantine UI (provides CSS) | Required for styling; `@blocknote/mantine/style.css` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `typescript` | ^5.4.0 | Type safety | Already pinned in repo; all packages use strict mode |
| `@types/react` | ^19.0.0 | React TypeScript types | Required by packages/ui and packages/graph |
| `@types/node` | ^20.0.0 | Node types | Already in root devDependencies |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@xyflow/react` | Cytoscape.js, D3.js | @xyflow/react is purpose-built for React, has React state integration; others require manual DOM management |
| `@blocknote/react` | Tiptap, Slate | CONTEXT.md DEC-03-03 locks BlockNote; Node.content is stored as BlockNote JSON |
| `export const revalidate` | `use cache` / `cacheComponents` | `use cache` requires opting in to Next.js 16 `cacheComponents: true`; old ISR model still works without it |

### Installation

```bash
# packages/ui (new package)
pnpm add react react-dom @types/react @types/react-dom --filter @vizteck/ui

# packages/graph (new package)
pnpm add @xyflow/react --filter @vizteck/graph
pnpm add react react-dom @types/react @types/react-dom --filter @vizteck/graph

# apps/web (new app)
pnpm add next@latest react@latest react-dom@latest --filter @vizteck/web
pnpm add @blocknote/react @blocknote/core @blocknote/mantine --filter @vizteck/web
pnpm add @vizteck/ui @vizteck/graph --filter @vizteck/web
```

**Version verification (run at planning time):**

```bash
npm view next version                  # 16.2.9
npm view @xyflow/react version         # 12.11.0
npm view @blocknote/react version      # 0.51.4
```

---

## Package Legitimacy Audit

> All packages were checked via `gsd-tools query package-legitimacy check --ecosystem npm` on 2026-06-18.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `next` | npm | ~7 yrs | 40M/wk | github.com/vercel/next.js | SUS (too-new latest version) | Approved — major Vercel framework, "too-new" flag is due to latest-version publish date |
| `@xyflow/react` | npm | ~2 yrs | 7.4M/wk | github.com/xyflow/xyflow | SUS (too-new) | Approved — official React Flow v12; replaces `reactflow` package |
| `@blocknote/react` | npm | ~2 yrs | 352K/wk | github.com/TypeCellOS/BlockNote | SUS (too-new) | Approved — official BlockNote React package; matches DEC-03-03 |
| `@blocknote/core` | npm | ~2 yrs | ~400K/wk | github.com/TypeCellOS/BlockNote | SUS (too-new) | Approved — required peer dependency |
| `@blocknote/mantine` | npm | ~2 yrs | ~350K/wk | github.com/TypeCellOS/BlockNote | SUS (too-new) | Approved — required for CSS; official package |
| `react` | npm | 10+ yrs | 147M/wk | github.com/facebook/react | SUS (too-new) | Approved — Facebook/Meta React core |
| `react-dom` | npm | 10+ yrs | 138M/wk | github.com/facebook/react | SUS (too-new) | Approved — Facebook/Meta React core |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** all flagged only because `npm view` returns a recently-published latest version. All packages have authoritative source repos (Vercel, Meta, xyflow, TypeCellOS), high weekly download counts, and are explicitly required by CONTEXT.md decisions. No manual review checkpoint needed — these are verified industry-standard packages. [CITED: npm registry + official GitHub repos]

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (React client)
  └── apps/web (Next.js 16, port 3001, SSG)
        ├── app/page.tsx                   ← SSG, fetches /api/roadmaps at build time
        ├── app/roadmap/[slug]/page.tsx    ← SSG, generateStaticParams, @xyflow/react 'use client'
        └── app/roadmap/[slug]/node/[id]/page.tsx ← SSG, generateStaticParams, @blocknote/react
              |
              | HTTP fetch (build time + revalidate 3600)
              ↓
  apps/api-gateway (NestJS, port 3000)
        ├── GET /api/roadmaps             ← returns RoadmapItem[]
        ├── GET /api/roadmaps/:slug       ← returns RoadmapDetail {roadmap, nodes[], edges[]}
        └── GET /api/nodes/:id           ← returns NodeItem (with content: BlockNote JSON)

packages/ui (shared components, no external library deps)
  └── Button.tsx, Card.tsx, NodeBadge.tsx

packages/graph (wraps @xyflow/react)
  └── RoadmapGraph.tsx   ← 'use client', mode="view"|"edit"
  └── RoadmapNode.tsx    ← custom NodeProps renderer
```

**Data flow at build time:**
```
next build
  → generateStaticParams() calls /api/roadmaps  → gets slug list
  → for each slug: fetch /api/roadmaps/:slug    → gets nodes, edges
  → for each node (type=LESSON): fetch /api/nodes/:id → gets content JSON
  → renders static HTML per route
  → writes revalidate: 3600 into ISR config
```

### Recommended Project Structure

```
packages/ui/
  src/
    Button.tsx       # primary / secondary / ghost variants
    Card.tsx         # roadmap card with mini graph preview area
    NodeBadge.tsx    # ROADMAP (indigo) / LESSON (emerald) pill
    index.ts         # barrel export
  package.json       # name: @vizteck/ui, main: ./src/index.ts (for TSC, no build step needed if transpilePackages)
  tsconfig.json      # extends ../../tsconfig.base.json

packages/graph/
  src/
    RoadmapGraph.tsx # main component, 'use client'
    RoadmapNode.tsx  # custom node renderer (NodeProps)
    index.ts         # barrel export
  package.json       # name: @vizteck/graph
  tsconfig.json

apps/web/
  app/
    layout.tsx       # root layout, Google Fonts import, global CSS vars
    page.tsx         # home: lists roadmaps, export const revalidate = 3600
    roadmap/
      [slug]/
        page.tsx     # graph view, generateStaticParams, export const revalidate = 3600
        node/
          [id]/
            page.tsx # lesson page, generateStaticParams, export const revalidate = 3600
  components/
    Breadcrumb.tsx   # graph breadcrumb (visited/active/none dots)
    MiniGraph.tsx    # SVG mini graph preview for card
  lib/
    api.ts           # typed fetch helpers for api-gateway REST endpoints
  app/globals.css    # CSS custom properties (design tokens), @xyflow/react CSS import
  next.config.js     # transpilePackages: ['@vizteck/ui', '@vizteck/graph', '@xyflow/react', '@blocknote/react', '@blocknote/core', '@blocknote/mantine']
  .env.local         # NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Pattern 1: SSG with revalidate in Next.js 16 App Router

**What:** Export `revalidate` as a constant from page.tsx. Use `generateStaticParams` for dynamic routes. All fetch calls at build time with `cache: 'force-cache'`.

**When to use:** All three public pages in apps/web.

```typescript
// Source: https://nextjs.org/docs/app/guides/caching-without-cache-components
// app/roadmap/[slug]/page.tsx

export const revalidate = 3600;

export async function generateStaticParams() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmaps`, {
    cache: 'force-cache',
  });
  const roadmaps: RoadmapItem[] = await res.json();
  return roadmaps.map((r) => ({ slug: r.slug }));
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next.js 16: params is async — MUST await
  const { slug } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmaps/${slug}`, {
    cache: 'force-cache',
  });
  const detail: RoadmapDetail = await res.json();
  return <RoadmapGraphView detail={detail} />;
}
```

### Pattern 2: @xyflow/react Read-Only Graph

**What:** `ReactFlow` component with interaction props set to false. nodeTypes maps to custom `RoadmapNode` component.

**When to use:** packages/graph `RoadmapGraph.tsx` when `mode="view"`.

```typescript
// Source: https://reactflow.dev/api-reference/react-flow
// packages/graph/src/RoadmapGraph.tsx
'use client';
import '@xyflow/react/dist/style.css';
import { ReactFlow, Background, Controls } from '@xyflow/react';

interface RoadmapGraphProps {
  nodes: NodeItem[];
  edges: EdgeItem[];
  mode: 'view' | 'edit';
}

export function RoadmapGraph({ nodes, edges, mode }: RoadmapGraphProps) {
  const rfNodes = nodes.map((n) => ({
    id: n.id,
    type: 'roadmapNode',
    position: { x: n.positionX, y: n.positionY },
    data: { title: n.title, nodeType: n.type, targetRoadmapId: n.targetRoadmapId },
  }));

  const rfEdges = edges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    label: e.label,
  }));

  const isView = mode === 'view';

  return (
    <div style={{ width: '100%', height: '100%', background: '#F4F6FB' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={!isView}
        nodesConnectable={!isView}
        elementsSelectable={!isView}
        edgesReconnectable={!isView}
        fitView
      >
        <Controls />
      </ReactFlow>
    </div>
  );
}
```

### Pattern 3: Custom Node with NodeProps

**What:** Custom node component receives `NodeProps` from React Flow. Must use `Handle` components for connection points.

```typescript
// Source: https://reactflow.dev/learn/customization/custom-nodes
// packages/graph/src/RoadmapNode.tsx
'use client';
import { Handle, Position, type NodeProps } from '@xyflow/react';

interface RoadmapNodeData {
  title: string;
  nodeType: 'ROADMAP' | 'LESSON';
  targetRoadmapId?: string;
}

export function RoadmapNode({ data }: NodeProps<{ data: RoadmapNodeData }>) {
  const isRoadmap = data.nodeType === 'ROADMAP';
  const borderColor = isRoadmap ? '#4F46E5' : '#059669';
  const badgeBg = isRoadmap ? '#EEF2FF' : '#ECFDF5';
  const badgeColor = isRoadmap ? '#4F46E5' : '#059669';

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div style={{ border: `2px solid ${borderColor}`, background: '#fff', borderRadius: 10, padding: '10px 18px', minWidth: 120, textAlign: 'center' }}>
        <span style={{ background: badgeBg, color: badgeColor, fontFamily: 'JetBrains Mono', fontSize: 9, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>
          {data.nodeType}
        </span>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, marginTop: 4 }}>{data.title}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
```

### Pattern 4: BlockNote Read-Only Viewer

**What:** `useCreateBlockNote` with `initialContent` parsed from JSON string. `BlockNoteView` with `editable={false}` and `theme="light"`.

```typescript
// Source: https://www.blocknotejs.org/docs/editor-basics/setup
// apps/web/components/LessonContent.tsx
'use client';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

interface LessonContentProps {
  contentJson: string; // Node.content from API — BlockNote JSON string
}

export function LessonContent({ contentJson }: LessonContentProps) {
  const blocks = JSON.parse(contentJson);
  const editor = useCreateBlockNote({ initialContent: blocks });
  return <BlockNoteView editor={editor} editable={false} theme="light" />;
}
```

### Pattern 5: transpilePackages in next.config.js

**What:** Next.js cannot process ESM-only packages from node_modules during SSR/SSG. All workspace packages AND @xyflow/react and @blocknote/* must be listed.

```javascript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@vizteck/ui',
    '@vizteck/graph',
    '@xyflow/react',
    '@blocknote/react',
    '@blocknote/core',
    '@blocknote/mantine',
  ],
};

module.exports = nextConfig;
```

### Anti-Patterns to Avoid

- **Sync `params` access in Next.js 16:** `const { slug } = params` → TypeScript error and runtime error. Always `await params`.
- **Importing @xyflow/react CSS inside a 'use client' component after the ReactFlow call:** CSS must be imported at the top of the module, before the component definition.
- **RoadmapGraph without a sized parent:** `<ReactFlow />` requires `width` and `height` set on the parent div. Without it, the canvas renders at 0px height.
- **BlockNote in SSR:** `useCreateBlockNote` and `BlockNoteView` cannot run on the server. Wrap in `'use client'` or use `next/dynamic` with `ssr: false`.
- **Forgetting `@xyflow/react/dist/style.css`:** The graph renders completely unstyled (handles invisible, edge labels missing).
- **Using `revalidate` segment config without `generateStaticParams`:** Pages with dynamic segments will be rendered dynamically (not statically) unless `generateStaticParams` is also exported.
- **Referencing `NEXT_PUBLIC_API_URL` server-side without env var set:** `generateStaticParams` runs in a Node.js process during build. The `.env.local` file is loaded, but the value must exist at build time. Use `process.env.NEXT_PUBLIC_API_URL` (not `process.env.API_URL`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive graph canvas | Custom SVG/canvas drag system | `@xyflow/react` | Edge routing, zoom/pan, handle snapping, viewport math are all handled; custom solution is 1000+ lines |
| Rich text rendering (BlockNote JSON) | JSON-to-HTML parser | `@blocknote/react` + `editable={false}` | BlockNote has 20+ block types; custom renderer breaks on nested lists, code blocks, inline styles |
| SSG with ISR | Custom build scripts | Next.js `generateStaticParams` + `revalidate` | ISR handles stale-while-revalidate at CDN level; custom solution can't replicate this |
| CSS design tokens | Inline styles on every component | CSS custom properties in `globals.css` | Design token system from mockup.html maps directly to CSS vars; use them everywhere |
| Mini graph preview | Full @xyflow/react instance per card | Plain SVG dots + lines | Card mini graph is decorative, not interactive; SVG is lighter and SSR-safe |

**Key insight:** The graph and rich-text problems look simple but have deep edge cases (edge routing, block type extension, viewport transforms). Use the purpose-built libraries.

---

## Common Pitfalls

### Pitfall 1: Next.js 16 `params` must be awaited

**What goes wrong:** TypeScript reports a type error and the value is `undefined` at runtime in Next.js 16.

**Why it happens:** Next.js 16 made all Request APIs (cookies, headers, params, searchParams) asynchronous as a breaking change. Synchronous access was removed in v16 after being temporarily supported in v15.

**How to avoid:** Always destructure after await:
```typescript
const { slug } = await params;      // correct
const { slug } = params;            // ERROR in Next.js 16
```

**Warning signs:** TypeScript errors on `params.slug` if `params` is typed as `Promise<{ slug: string }>`.

### Pitfall 2: @xyflow/react ReactFlowProvider not wrapping the component

**What goes wrong:** Hooks like `useReactFlow()` throw "ReactFlowProvider missing" if called outside a ReactFlow context.

**Why it happens:** @xyflow/react uses React Context internally. The `ReactFlow` component itself provides the context, but utility hooks used in sibling/parent components need an explicit `ReactFlowProvider` wrapper.

**How to avoid:** For simple usage (all hooks inside the `ReactFlow`-rendered tree), no explicit provider needed. If hooks are used in parent components (e.g., breadcrumb that calls `useReactFlow`), wrap the page with `<ReactFlowProvider>`.

**Warning signs:** Error: "Seems like you have not used zustand provider as an ancestor" in console.

### Pitfall 3: @blocknote/react SSR crash

**What goes wrong:** Module not found / hydration error when BlockNote renders on the server.

**Why it happens:** @blocknote/react depends on browser APIs (ProseMirror, CodeMirror) that don't exist in Node.js.

**How to avoid:** Mark the component `'use client'` and ensure the page-level data fetching is in a Server Component that passes serialized content (string) as a prop to the client component.

**Warning signs:** "ReferenceError: window is not defined" during `next build`.

### Pitfall 4: Missing CSS imports cause silent visual breakage

**What goes wrong:** Graph renders without handles, edges appear as bare lines, BlockNote renders unstyled.

**Why it happens:** Both @xyflow/react and @blocknote/mantine ship separate CSS files that are not auto-imported.

**How to avoid:**
- In `packages/graph/src/RoadmapGraph.tsx`: `import '@xyflow/react/dist/style.css';`
- In `apps/web` client component for BlockNote: `import '@blocknote/core/fonts/inter.css'; import '@blocknote/mantine/style.css';`

**Warning signs:** Graph canvas shows nodes but edges are invisible; BlockNote textarea has no formatting.

### Pitfall 5: Workspace packages not in transpilePackages

**What goes wrong:** `SyntaxError: Cannot use import statement in a module` during `next build`.

**Why it happens:** packages/ui and packages/graph are authored as ESM (TypeScript). Next.js doesn't transpile node_modules by default.

**How to avoid:** List all workspace packages AND their internal ESM dependencies in `transpilePackages` in `next.config.js`.

**Warning signs:** Build error mentioning a workspace package file path and "unexpected token".

### Pitfall 6: `generateStaticParams` fetch fails at build time if api-gateway is not running

**What goes wrong:** `next build` fails if `NEXT_PUBLIC_API_URL` points to a live server and the server is down.

**Why it happens:** `generateStaticParams` runs at build time and requires the data source to be available.

**How to avoid:** The success criterion says "Pages build statically WITHOUT a running api-gateway". Two strategies:
1. Return an empty array from `generateStaticParams` (all paths rendered on first request, then cached). Trade-off: no pre-built HTML at deploy.
2. Use a build-time mock/fixture. Trade-off: complexity.

**Recommended approach for this project:** Return an empty array from `generateStaticParams` (`return []`) — this satisfies "next build succeeds without a live api-gateway". The ISR (`revalidate: 3600`) handles actual data fetching on first request and caches thereafter. Add `export const dynamicParams = true` (default) so unknown routes are rendered on demand.

**Warning signs:** `next build` exits with "fetch failed" or "ECONNREFUSED localhost:3000".

---

## Code Examples

### Home page (apps/web/app/page.tsx)

```typescript
// Source: https://nextjs.org/docs/app/guides/caching-without-cache-components
export const revalidate = 3600;

interface RoadmapItem {
  id: string; slug: string; title: string; description?: string; coverImage?: string;
}

export default async function HomePage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmaps`, {
    cache: 'force-cache',
  });
  const roadmaps: RoadmapItem[] = await res.json();
  return (
    <main>
      <div className="roadmap-grid">
        {roadmaps.map((r) => (
          <a key={r.id} href={`/roadmap/${r.slug}`}>
            {/* Card component from packages/ui */}
          </a>
        ))}
      </div>
    </main>
  );
}
```

### Roadmap graph page (apps/web/app/roadmap/[slug]/page.tsx)

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
export const revalidate = 3600;

export async function generateStaticParams() {
  // Return empty array: build succeeds without live api-gateway
  // All paths rendered on first request, then cached via ISR
  return [];
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // Next.js 16: must await
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmaps/${slug}`, {
    cache: 'force-cache',
  });
  const detail = await res.json();
  return <RoadmapGraphView detail={detail} slug={slug} />;
}
```

### Lesson page (apps/web/app/roadmap/[slug]/node/[id]/page.tsx)

```typescript
export const revalidate = 3600;

export async function generateStaticParams() {
  return []; // same ISR-on-demand strategy
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params; // Next.js 16: must await
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nodes/${id}`, {
    cache: 'force-cache',
  });
  const node = await res.json();
  return (
    <div className="lesson-layout">
      <LessonContent contentJson={node.content} />
      {/* Sidebar */}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `reactflow` (npm) | `@xyflow/react` (npm) | v12 (2024) | Package renamed; old `reactflow` is no longer maintained; must use `@xyflow/react` |
| `getStaticProps` (Pages Router) | `generateStaticParams` + `export const revalidate` (App Router) | Next.js 13+ | Pages Router approach doesn't apply to App Router |
| Sync `params` in page components | `await params` | Next.js 15→16 | Breaking change: `params: Promise<{...}>` |
| `next-transpile-modules` package | `transpilePackages` in `next.config.js` | Next.js 13+ | Built-in; no separate package needed |
| `experimental.ppr` route segment | `cacheComponents: true` in next.config | Next.js 16 | Experimental flag removed; unified under `cacheComponents` |
| `middleware.ts` file | `proxy.ts` file | Next.js 16 | Renamed convention; `middleware.ts` is deprecated |

**Deprecated/outdated:**
- `reactflow` npm package: replaced by `@xyflow/react` in v12. Installing `reactflow` gets the old React Flow v11.
- `next/legacy/image`: removed in Next.js 16. Use `next/image`.
- `serverRuntimeConfig` / `publicRuntimeConfig`: removed in Next.js 16. Use `process.env.NEXT_PUBLIC_*` directly.
- `export const revalidate` when `cacheComponents: true` is set: the old ISR model doesn't apply to Cache Components mode.

---

## Runtime State Inventory

> Not applicable — this is a greenfield phase building new packages and apps. No existing runtime state to migrate.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | apps/web build | ✓ | v24.12.0 | — |
| pnpm | workspace | ✓ | 10.30.2 | — |
| Docker + PostgreSQL | api-gateway → svc-roadmap | ✓ (from Phase 2) | — | — |
| api-gateway (port 3000) | `generateStaticParams` fetch | Must be running for SSG prefill | — | Return `[]` from `generateStaticParams` (ISR on demand) |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:**
- api-gateway at build time: use `return []` from `generateStaticParams` so `next build` succeeds without a live server.

---

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected for apps/web yet — Wave 0 must install |
| Config file | None — Wave 0 gap |
| Quick run command | `pnpm --filter @vizteck/web test` (after Wave 0) |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-public-roadmap-list | Home page renders roadmap cards | smoke/e2e | `pnpm --filter @vizteck/web test` | ❌ Wave 0 |
| REQ-public-roadmap-graph-view | /roadmap/[slug] renders graph, nodes not draggable | smoke | `pnpm --filter @vizteck/web test` | ❌ Wave 0 |
| REQ-public-lesson-content-view | /roadmap/[slug]/node/[id] renders lesson text | smoke | `pnpm --filter @vizteck/web test` | ❌ Wave 0 |
| REQ-nfr-ssg-revalidation | `next build` succeeds without running api-gateway | build gate | `pnpm --filter @vizteck/web build` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter @vizteck/web build` (build gate)
- **Per wave merge:** `pnpm build` (full workspace)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/web/__tests__/` — test directory
- [ ] `apps/web/jest.config.js` or `vitest.config.ts` — test runner config
- [ ] Framework install: `pnpm add -D jest @testing-library/react @testing-library/jest-dom --filter @vizteck/web` (or vitest equivalent)
- [ ] `apps/web/package.json` test script

> Note: The primary verification for this phase is `next build` succeeding (REQ-nfr-ssg-revalidation). Unit tests for React components are secondary and can be added incrementally.

---

## Security Domain

> `security_enforcement` is absent from config — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth on public pages |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | All pages are public |
| V5 Input Validation | Partial | Route params ([slug], [id]) used in fetch URLs — validate before use |
| V6 Cryptography | No | No secrets on public viewer |

### Known Threat Patterns for Next.js SSG Public Viewer

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via `[slug]` or `[id]` params | Tampering | Fetch uses slug/id as URL path segments; api-gateway validates and 404s on unknown IDs |
| Open redirect via `targetRoadmapId` node navigation | Elevation | Only navigate to `/roadmap/${targetRoadmapId}` — internal route, not arbitrary URL |
| XSS via BlockNote JSON content | Tampering | BlockNote renderer escapes content; never use `dangerouslySetInnerHTML` with raw content |
| Credential exposure via `NEXT_PUBLIC_API_URL` | Information Disclosure | `NEXT_PUBLIC_*` is deliberately public (api-gateway URL); no secrets in env vars here |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `return []` from `generateStaticParams` satisfies "next build succeeds without live api-gateway" (the pages are ISR-on-demand, not pre-built) | Common Pitfalls / Pitfall 6 | If requirement means "all pages must be HTML files at build time", the project must run api-gateway during CI/CD build |
| A2 | packages/ui and packages/graph use TypeScript source directly (no separate build step), relying on `transpilePackages` in apps/web to compile them | Architecture Patterns | If packages need their own `tsc` build step, Wave 0 of Plan 03-03 must add `pnpm build` calls |
| A3 | Next.js 16.2.9 (`latest` tag) is acceptable for this project. CONTEXT.md says "Next.js 15" but npm `latest` is 16.2.9 | Standard Stack | If project must pin to Next.js 15, use `next@^15.3.9` instead of `next@latest` |
| A4 | `@blocknote/mantine` is the correct UI adapter for BlockNote (not `@blocknote/shadcn` or others) | Standard Stack | If a different UI kit is used, the CSS import path changes |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

> A3 has the highest risk: clarify whether `next@latest (16.2.9)` or `next@^15.3.9` is intended. The SSG pattern works in both, but Next.js 16 has breaking changes (async params) that affect how page components are written.

---

## Open Questions

1. **Next.js 15 vs 16: which version to scaffold apps/web on?**
   - What we know: `npm view next version` = 16.2.9; CONTEXT.md says "Next.js 15". Next.js 16 has one breaking change that affects this phase: `await params`.
   - What's unclear: Is CONTEXT.md outdated or is there a reason to pin to 15?
   - Recommendation: Use `next@latest` (16.2.9). All code examples in this research use the correct async `params` pattern. The ISR model (`revalidate = 3600`) works identically in both versions without `cacheComponents`.

2. **Should `generateStaticParams` return all slugs (pre-built) or empty array (ISR on demand)?**
   - What we know: REQ-nfr-ssg-revalidation says "pages render without a running api-gateway after build". Empty array satisfies the build part; pages still need api-gateway on first request.
   - What's unclear: Does the requirement mean "zero runtime dependency on api-gateway ever" (impossible with ISR) or "build-time no dependency"?
   - Recommendation: Use `return []` for build-time independence. Document in plan that first-page-load requires api-gateway (ISR populates the cache then).

---

## Sources

### Primary (MEDIUM confidence — Context7/official docs)

- [https://nextjs.org/docs/app/api-reference/functions/generate-static-params](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) — generateStaticParams API, async params pattern
- [https://nextjs.org/docs/app/guides/caching-without-cache-components](https://nextjs.org/docs/app/guides/caching-without-cache-components) — revalidate segment config, fetch with cache, ISR model
- [https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages) — transpilePackages for monorepo workspace packages
- [https://nextjs.org/docs/app/guides/upgrading/version-16](https://nextjs.org/docs/app/guides/upgrading/version-16) — Next.js 15→16 breaking changes
- [https://reactflow.dev/api-reference/react-flow](https://reactflow.dev/api-reference/react-flow) — ReactFlow props (nodesDraggable, nodesConnectable, read-only config)
- [https://reactflow.dev/learn/getting-started/installation-and-requirements](https://reactflow.dev/learn/getting-started/installation-and-requirements) — CSS import requirement, parent sizing
- [https://reactflow.dev/learn/customization/custom-nodes](https://reactflow.dev/learn/customization/custom-nodes) — NodeProps, custom node pattern
- [https://www.blocknotejs.org/docs/editor-basics/setup](https://www.blocknotejs.org/docs/editor-basics/setup) — useCreateBlockNote, BlockNoteView, editable prop
- [https://www.blocknotejs.org/docs/react/styling-theming/themes](https://www.blocknotejs.org/docs/react/styling-theming/themes) — CSS imports, theme="light" prop

### Secondary (LOW confidence — npm registry)

- npm registry: `@xyflow/react@12.11.0`, `@blocknote/react@0.51.4`, `next@16.2.9` — version confirmation
- docs/design/mockup.html — canonical design tokens and layout (project-internal, verified by reading the file)

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — package versions verified on npm registry; patterns confirmed via official docs
- Architecture: MEDIUM — follows established Turborepo + Next.js App Router monorepo patterns
- Pitfalls: HIGH — Next.js 16 async params and @xyflow CSS import are documented breaking changes

**Research date:** 2026-06-18
**Valid until:** 2026-07-18 (30 days — Next.js 16 is stable; @xyflow/react 12.x has not had breaking changes since v12.0)

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 3 |
|-----------|-------------------|
| Strict TypeScript (`"strict": true`, all packages extend `tsconfig.base.json`) | packages/ui, packages/graph, apps/web must all extend `tsconfig.base.json` and have zero TS strict errors |
| All packages build via Turborepo pipeline (`dependsOn: ["^build"]`) | packages/ui and packages/graph must be buildable (or transpilePackages must handle this) before apps/web builds |
| `NEXT_PUBLIC_API_URL` env var for web and admin apps | apps/web must have `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3000`; include `.env.example` |
| Dependency rule: `apps/*` imports from `packages/*`; `packages/*` must not import from `apps/*` | packages/ui and packages/graph must not import from apps/* |
| apps/web runs on port 3001 | Next.js dev server must be configured for port 3001 (`next dev --port 3001`) |
| `pnpm proto:gen` must still work after adding new packages | Turborepo tasks are additive; no changes to proto pipeline needed |
