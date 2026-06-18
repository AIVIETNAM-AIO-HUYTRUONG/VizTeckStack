# Phase 03: Public Viewer — Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 20
**Analogs found:** 14 / 20 (6 are greenfield with no codebase analog — use RESEARCH.md patterns)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/ui/package.json` | config | — | `packages/db/package.json` | role-match |
| `packages/ui/tsconfig.json` | config | — | `packages/db/tsconfig.json` | exact |
| `packages/ui/src/index.ts` | utility | — | `packages/db/index.ts` | role-match |
| `packages/ui/src/Button.tsx` | component | request-response | none | no analog |
| `packages/ui/src/Card.tsx` | component | request-response | none | no analog |
| `packages/ui/src/NodeBadge.tsx` | component | request-response | none | no analog |
| `packages/graph/package.json` | config | — | `packages/db/package.json` | role-match |
| `packages/graph/tsconfig.json` | config | — | `packages/db/tsconfig.json` | exact |
| `packages/graph/src/index.ts` | utility | — | `packages/db/index.ts` | role-match |
| `packages/graph/src/RoadmapGraph.tsx` | component | request-response | none | no analog (RESEARCH.md Pattern 2) |
| `packages/graph/src/RoadmapNode.tsx` | component | request-response | none | no analog (RESEARCH.md Pattern 3) |
| `apps/web/next.config.js` | config | — | `apps/api-gateway/package.json` (scripts/build conventions) | partial |
| `apps/web/.env.example` | config | — | `apps/api-gateway` `.env.example` (not present, use CLAUDE.md env table) | partial |
| `apps/web/src/app/page.tsx` | component | request-response (SSG) | none | no analog (RESEARCH.md Pattern 1) |
| `apps/web/src/app/roadmap/[slug]/page.tsx` | component | request-response (SSG) | none | no analog (RESEARCH.md Pattern 1) |
| `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` | component | request-response (SSG) | none | no analog (RESEARCH.md Pattern 4) |
| `apps/web/src/components/Breadcrumb.tsx` | component | request-response | none | no analog |
| `apps/web/src/components/MiniGraph.tsx` | component | request-response | none | no analog |
| `apps/web/tailwind.config.ts` | config | — | none | no analog |
| `apps/web/src/lib/api.ts` | utility | request-response | `apps/api-gateway/src/roadmap/roadmap.dto.ts` (type shapes) | partial |

---

## Pattern Assignments

### `packages/ui/package.json` and `packages/graph/package.json` (config)

**Analog:** `packages/db/package.json` (lines 1-25)

**Core pattern:**
```json
{
  "name": "@vizteck/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

Key deviation from packages/db: use `"main": "./src/index.ts"` (no separate build step — apps/web uses `transpilePackages` to compile at app build time). packages/db uses `"main": "./dist/index.js"` because it has its own `tsc` build step. packages/ui and packages/graph do NOT need a `tsc` build step.

For `packages/graph/package.json`, add `@xyflow/react` to dependencies and reference `@vizteck/ui` as a workspace dependency.

---

### `packages/ui/tsconfig.json` and `packages/graph/tsconfig.json` (config)

**Analog:** `packages/db/tsconfig.json` (lines 1-8)

**Core pattern** — copy exactly, adjust `include`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"]
}
```

Key additions vs packages/db analog:
- `"jsx": "react-jsx"` — required for TSX compilation
- `"rootDir": "./src"` — source is under `src/`, not root
- `"include": ["src/**/*"]` — covers all component files

---

### `packages/ui/src/index.ts` and `packages/graph/src/index.ts` (utility — barrel export)

**Analog:** `packages/db/index.ts` (lines 1-10) — barrel re-export pattern

**Core pattern:**
```typescript
// packages/ui/src/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
export { Card } from './Card';
export type { CardProps } from './Card';
export { NodeBadge } from './NodeBadge';
export type { NodeBadgeProps } from './NodeBadge';
```

```typescript
// packages/graph/src/index.ts
export { RoadmapGraph } from './RoadmapGraph';
export type { RoadmapGraphProps } from './RoadmapGraph';
export { RoadmapNode } from './RoadmapNode';
```

Note: packages/db uses `export * from '@prisma/client'` for re-exporting a dependency. packages/ui and packages/graph export their own components only.

---

### `packages/ui/src/NodeBadge.tsx` (component, request-response)

**No codebase analog.** Use RESEARCH.md Pattern (DEC-03-09 design tokens).

**Design token reference** (from CONTEXT.md DEC-03-09):
```typescript
// packages/ui/src/NodeBadge.tsx
import React from 'react';

export type NodeType = 'ROADMAP' | 'LESSON';

export interface NodeBadgeProps {
  type: NodeType;
}

const BADGE_STYLES: Record<NodeType, { bg: string; color: string; label: string }> = {
  ROADMAP: { bg: '#EEF2FF', color: '#4F46E5', label: 'ROADMAP' },
  LESSON:  { bg: '#ECFDF5', color: '#059669', label: 'LESSON'  },
};

export function NodeBadge({ type }: NodeBadgeProps) {
  const s = BADGE_STYLES[type];
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 9,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 20,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {s.label}
    </span>
  );
}
```

---

### `packages/ui/src/Button.tsx` (component, request-response)

**No codebase analog.** Use CONTEXT.md DEC-03-01 (light mode, indigo accent).

**Pattern — variant prop with design tokens:**
```typescript
// packages/ui/src/Button.tsx
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Design tokens from mockup.html:
// primary:   bg #4F46E5, text white
// secondary: bg white, border #4F46E5, text #4F46E5
// ghost:     bg transparent, text #475569
export function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  // ... variant-driven inline styles using design tokens
}
```

---

### `packages/ui/src/Card.tsx` (component, request-response)

**No codebase analog.** Use CONTEXT.md DEC-03-02 (card layout: badge + title + subtitle + mini graph area).

**Pattern:**
```typescript
// packages/ui/src/Card.tsx
import React from 'react';
import { NodeBadge, NodeType } from './NodeBadge';

export interface CardProps {
  type: NodeType;
  title: string;
  description?: string;
  miniGraph?: React.ReactNode; // MiniGraph SVG slot
  onClick?: () => void;
}

export function Card({ type, title, description, miniGraph, onClick }: CardProps) {
  // bg: #FFFFFF, border: #E2E8F0, borderRadius: 16px
  // miniGraph rendered in #F1F3F9 background area (DEC-03-02)
}
```

---

### `packages/graph/src/RoadmapGraph.tsx` (component, request-response — 'use client')

**No codebase analog.** Use RESEARCH.md Pattern 2 verbatim.

Key points extracted from RESEARCH.md lines 271-321:
- Must have `'use client'` directive at top
- Import `'@xyflow/react/dist/style.css'` before component definition
- Parent `<div>` must have explicit width/height (DEC-03-05: `background: '#F4F6FB'`)
- Read-only props when `mode === 'view'`: `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`, `edgesReconnectable={false}`
- `nodeTypes` object must be defined outside the component (stable reference, prevents remount)

```typescript
'use client';
import '@xyflow/react/dist/style.css';
import { ReactFlow, Controls } from '@xyflow/react';
import { RoadmapNode } from './RoadmapNode';

const nodeTypes = { roadmapNode: RoadmapNode };

export interface RoadmapGraphProps {
  nodes: NodeItem[];
  edges: EdgeItem[];
  mode: 'view' | 'edit';
}
```

---

### `packages/graph/src/RoadmapNode.tsx` (component, request-response — 'use client')

**No codebase analog.** Use RESEARCH.md Pattern 3.

The NodeDto shape from `apps/api-gateway/src/roadmap/roadmap.dto.ts` (lines 15-24) defines the data contract:
- `id: string`, `type: 'ROADMAP' | 'LESSON'`, `title: string`, `positionX: number`, `positionY: number`, `targetRoadmapId?: string`

```typescript
'use client';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeBadge } from '@vizteck/ui';

// Border colors from DEC-03-09:
// ROADMAP border: #4F46E5, LESSON border: #059669
// borderRadius: 10px (md token from CONTEXT.md)
```

---

### `apps/web/next.config.js` (config)

**Analog:** RESEARCH.md Pattern 5 (no codebase analog exists — apps/web is a new app).

**Full pattern** (RESEARCH.md lines 388-404):
```javascript
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

Note: `module.exports` (CJS), not `export default` — this is a `.js` file, not `.mjs`.

---

### `apps/web/.env.example` (config)

**Analog:** CLAUDE.md environment variables table.

```bash
# apps/web/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Copy to `.env.local` before running. `NEXT_PUBLIC_` prefix is required for browser-accessible env vars in Next.js. Both build-time (`generateStaticParams`) and runtime fetch calls use `process.env.NEXT_PUBLIC_API_URL`.

---

### `apps/web/src/app/page.tsx` (component, SSG request-response)

**No codebase analog** (apps/web does not exist yet). Use RESEARCH.md Pattern 1 + Code Examples (lines 508-535).

**Core SSG pattern:**
```typescript
export const revalidate = 3600; // DEC-03-06

// TypeScript types copied from apps/api-gateway/src/roadmap/roadmap.dto.ts shape:
interface RoadmapItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
}

export default async function HomePage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmaps`, {
    cache: 'force-cache',
  });
  const roadmaps: RoadmapItem[] = await res.json();
  // render 3-column card grid (DEC-03-02)
}
```

No `generateStaticParams` needed (this is the root route, not a dynamic segment).

---

### `apps/web/src/app/roadmap/[slug]/page.tsx` (component, SSG request-response)

**No codebase analog.** Use RESEARCH.md Pattern 1 + Code Examples (lines 537-561).

**Key Next.js 16 requirement — params must be awaited:**
```typescript
export const revalidate = 3600;
export const dynamicParams = true; // allow ISR on unknown slugs

export async function generateStaticParams() {
  return []; // build succeeds without live api-gateway (Pitfall 6)
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;  // Next.js 16: Promise type
}) {
  const { slug } = await params;  // MUST await — sync access is a runtime error in Next.js 16
  // fetch /api/roadmaps/:slug, render <RoadmapGraph mode="view" />
}
```

---

### `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` (component, SSG + BlockNote)

**No codebase analog.** Use RESEARCH.md Pattern 4 + Code Examples (lines 563-589).

**Key patterns:**
```typescript
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // same ISR-on-demand strategy
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params; // Next.js 16: both params must be awaited together
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nodes/${id}`, {
    cache: 'force-cache',
  });
  const node = await res.json();
  // Two-column layout (DEC-03-08): left = <LessonContent />, right = 280px sidebar
  // LessonContent must be a 'use client' component (BlockNote is browser-only)
}
```

NodeDto type shape from `apps/api-gateway/src/roadmap/roadmap.dto.ts` lines 15-24.

---

### `apps/web/src/components/Breadcrumb.tsx` (component, request-response)

**No codebase analog.** Implement from scratch per DEC-03-07.

**State model:**
```typescript
// DEC-03-07 states:
type BreadcrumbState = 'visited' | 'active' | 'none';

interface BreadcrumbItem {
  label: string;
  href: string;
  state: BreadcrumbState;
}

// visited: white fill (#FFFFFF), indigo stroke (#4F46E5), indigo connector line
// active:  indigo fill (#4F46E5), white text, no connector line after
// none:    gray fill (#94A3B8), gray stroke, gray connector line
```

SVG or styled divs — horizontal row of dots with connecting lines. No @xyflow/react dependency.

---

### `apps/web/src/components/MiniGraph.tsx` (component, request-response)

**No codebase analog.** Plain SVG per RESEARCH.md "Don't Hand-Roll" table:

> "Mini graph preview — Use Plain SVG dots + lines. Card mini graph is decorative, not interactive; SVG is lighter and SSR-safe."

```typescript
// MiniGraph receives simplified node/edge positions for SVG rendering
// Background: #F1F3F9 (DEC-03-02, --bg-2 token)
// Not a @xyflow/react instance — plain <svg> element
// SSR-safe: no browser APIs required
interface MiniGraphProps {
  nodes: Array<{ id: string; x: number; y: number; type: 'ROADMAP' | 'LESSON' }>;
  edges: Array<{ sourceId: string; targetId: string }>;
  width?: number;
  height?: number;
}
```

---

### `apps/web/src/lib/api.ts` (utility, request-response)

**Partial analog:** `apps/api-gateway/src/roadmap/roadmap.dto.ts` (lines 7-37) defines the response shapes.

**Pattern — typed fetch helpers:**
```typescript
// apps/web/src/lib/api.ts
// Types mirror roadmap.dto.ts shapes (without NestJS decorators)

export interface RoadmapItem {
  id: string; slug: string; title: string; description?: string; coverImage?: string;
}

export interface NodeItem {
  id: string; roadmapId: string; type: 'ROADMAP' | 'LESSON';
  title: string; positionX: number; positionY: number;
  targetRoadmapId?: string; content?: string;
}

export interface EdgeItem {
  id: string; sourceId: string; targetId: string; label?: string;
}

export interface RoadmapDetail {
  roadmap?: RoadmapItem;
  nodes: NodeItem[];
  edges: EdgeItem[];
}

const API = process.env.NEXT_PUBLIC_API_URL;

export async function fetchRoadmaps(): Promise<RoadmapItem[]> {
  const res = await fetch(`${API}/api/roadmaps`, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`fetchRoadmaps: ${res.status}`);
  return res.json();
}
// + fetchRoadmap(slug), fetchNode(id)
```

---

### `apps/web/tailwind.config.ts` (config)

**No codebase analog** (no Tailwind used elsewhere in the project). apps/web uses Tailwind CSS for utility classes alongside CSS custom properties from mockup.html.

**Minimal pattern for design token integration:**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: { DEFAULT: '#4F46E5', mid: '#6366F1', lt: '#EEF2FF' },
        emerald: { DEFAULT: '#059669', lt: '#ECFDF5' },
        bg: { 0: '#F8F9FC', 1: '#FFFFFF', 2: '#F1F3F9' },
        border: '#E2E8F0',
        text: { 1: '#0F172A', 2: '#475569', 3: '#94A3B8' },
      },
      borderRadius: { sm: '6px', md: '10px', lg: '16px' },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
export default config;
```

---

## Shared Patterns

### TypeScript strict mode (all packages)

**Source:** `tsconfig.base.json` (lines 1-15)
**Apply to:** `packages/ui/tsconfig.json`, `packages/graph/tsconfig.json`, `apps/web/tsconfig.json`

All tsconfig files must `"extends": "../../tsconfig.base.json"` (or `"../../../tsconfig.base.json"` for apps two levels deep). The base sets `"strict": true`, `"module": "commonjs"`, `"target": "ES2022"`. Apps using Next.js also need `"jsx": "react-jsx"` and Next.js adds its own lib overrides via the framework tsconfig.

---

### Workspace package naming convention

**Source:** `packages/db/package.json` line 2, `packages/proto/package.json` line 2
**Apply to:** All new packages

Pattern: `"name": "@vizteck/<package-name>"`, `"version": "0.0.1"`, `"private": true`.

Workspace cross-references use `"@vizteck/ui": "workspace:*"` (pnpm workspace protocol).

---

### REST API response types

**Source:** `apps/api-gateway/src/roadmap/roadmap.dto.ts` (lines 7-37)
**Apply to:** `apps/web/src/lib/api.ts`, all page components that consume API data

The DTO file is the authoritative shape. New client-side types in `lib/api.ts` must mirror this shape (strip NestJS decorators, keep field names and optional markers identical).

Key field: `content?: string` on NodeDto is the BlockNote JSON string. Only present when `type === 'LESSON'`.

---

### Design tokens (CSS custom properties)

**Source:** `docs/design/mockup.html` (canonical per DEC-03-04)
**Apply to:** `apps/web/src/app/globals.css`, all component inline styles

Token reference (from CONTEXT.md):
```css
:root {
  --indigo:      #4F46E5;
  --indigo-mid:  #6366F1;
  --indigo-lt:   #EEF2FF;
  --emerald:     #059669;
  --emerald-lt:  #ECFDF5;
  --bg-0:        #F8F9FC;
  --bg-1:        #FFFFFF;
  --bg-2:        #F1F3F9;
  --border:      #E2E8F0;
  --text-1:      #0F172A;
  --text-2:      #475569;
  --text-3:      #94A3B8;
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
}
```

---

### SSG + ISR pattern (Next.js 16)

**Source:** RESEARCH.md Pattern 1 (lines 233-266)
**Apply to:** All three page components in apps/web

Three required exports per dynamic-segment page:
1. `export const revalidate = 3600;` — ISR 1-hour revalidation (DEC-03-06)
2. `export const dynamicParams = true;` — allow ISR on paths not in generateStaticParams
3. `export async function generateStaticParams() { return []; }` — empty = build succeeds without live api-gateway

Plus: `params` must be typed as `Promise<{...}>` and destructured with `await`.

---

## No Analog Found

Files with no close match in the codebase (planner must use RESEARCH.md patterns or design specs):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `packages/ui/src/Button.tsx` | component | request-response | No React components exist yet in the codebase |
| `packages/ui/src/Card.tsx` | component | request-response | No React components exist yet |
| `packages/ui/src/NodeBadge.tsx` | component | request-response | No React components exist yet |
| `packages/graph/src/RoadmapGraph.tsx` | component | request-response | No @xyflow/react usage in codebase |
| `packages/graph/src/RoadmapNode.tsx` | component | request-response | No custom React Flow nodes in codebase |
| `apps/web/src/components/Breadcrumb.tsx` | component | request-response | No SVG navigation components in codebase |
| `apps/web/src/components/MiniGraph.tsx` | component | request-response | No SVG graph previews in codebase |
| `apps/web/tailwind.config.ts` | config | — | Tailwind is not used elsewhere |

All eight are greenfield. Planner should reference: RESEARCH.md Patterns 2-5, CONTEXT.md design tokens (DEC-03-09), and `docs/design/mockup.html` for visual spec.

---

## Metadata

**Analog search scope:** `packages/db/`, `packages/proto/`, `apps/api-gateway/src/`, `tsconfig.base.json`
**Files scanned:** `packages/db/package.json`, `packages/db/tsconfig.json`, `packages/db/index.ts`, `packages/proto/package.json`, `apps/api-gateway/src/roadmap/roadmap.dto.ts`, `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`, `tsconfig.base.json`
**Pattern extraction date:** 2026-06-18
