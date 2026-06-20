# Phase 03 — Public Viewer: Context

> Generated from `/gsd-discuss-phase 3` session on 2026-06-18.

## Phase Goal

Build the public-facing roadmap viewer: shared UI package, interactive graph component, and Next.js 15 SSG app.

---

## Scope

| Plan | Description |
|------|-------------|
| 03-01 | `packages/ui` — shared React components (Button, Card, NodeBadge) |
| 03-02 | `packages/graph` — `<RoadmapGraph>` built on `@xyflow/react` |
| 03-03 | `apps/web` — Next.js 15 SSG public viewer |

---

## Design Reference

Designs produced in `pencil-demo.pen` (project-local Pencil file). Three screens:

| Frame | Name | Status |
|-------|------|--------|
| uuWLs | 01 — Home Page | Complete |
| gXkrT | 02 — Roadmap Graph | Complete |
| vTLW1 | 03 — Lesson | Complete |

Design tokens (sourced from `docs/design/mockup.html`):

```
Fonts:    Space Grotesk 700 (display), Inter (body), JetBrains Mono (mono)
Colors:
  --indigo:      #4F46E5   (ROADMAP badge, active states, CTA)
  --indigo-mid:  #6366F1
  --indigo-lt:   #EEF2FF   (ROADMAP badge background)
  --emerald:     #059669   (LESSON badge, active states)
  --emerald-lt:  #ECFDF5   (LESSON badge background)
  --bg-0:        #F8F9FC   (page background)
  --bg-1:        #FFFFFF   (card/nav background)
  --bg-2:        #F1F3F9   (mini graph background)
  --border:      #E2E8F0
  --text-1:      #0F172A   (headings)
  --text-2:      #475569   (body)
  --text-3:      #94A3B8   (meta/muted)
Radius:   sm=6px, md=10px, lg=16px
```

---

## Decisions

### DEC-03-01 — Theme Default
**Light mode by default**, with a toggle available. No persistence (sessionStorage or localStorage) required for Phase 3 — toggle state lives in React state only.

### DEC-03-02 — Home Page Layout
**3-column card grid** for roadmap listing. Each card shows:
- Node type badge (ROADMAP / LESSON)
- Title + subtitle
- Mini graph SVG preview (absolutely-positioned dots + connecting lines on `#F1F3F9` background)
- Click → navigate to roadmap graph page

### DEC-03-03 — Lesson Content Rendering
**BlockNote read-only viewer** (`@blocknote/react` with `editable={false}`). Lesson content stored as BlockNote JSON in `Node.content`. Render only when `node.type === LESSON`.

### DEC-03-04 — Design Source
Implement matching `docs/design/mockup.html` exactly. The HTML mockup is the canonical design reference. Pencil frames in `pencil-demo.pen` are the approved visual spec.

### DEC-03-05 — Graph Canvas Background
Plain fill `#F4F6FB` for the React Flow canvas. Do NOT attempt a CSS radial-gradient dot pattern via inline styles — it degrades on SSG and adds complexity. The dot grid from the mockup is decorative only.

### DEC-03-06 — SSG Revalidation
`revalidate: 3600` (1 hour) on all Next.js data-fetching functions. Matches DEC-008 in PROJECT.md.

### DEC-03-07 — Graph Breadcrumb
Signature navigation element: horizontal row of labeled dots connected by colored lines showing the navigation path (e.g., home → fullstack → frontend → html). States:
- `visited` — white fill, indigo stroke, indigo line to next
- `active` — indigo fill, indigo text
- `none` — gray fill, gray stroke, gray line

### DEC-03-08 — Lesson Page Layout
Two-column layout:
- **Left**: Lesson content (BlockNote read-only) with LESSON badge, title, divider, and rich text blocks including code blocks (`#0F172A` background, `JetBrains Mono`)
- **Right**: 280px sidebar with Progress card (progress bar), Mini graph card (dots overview), and "Next Lesson →" CTA button

### DEC-03-09 — Node Type Visual Distinction
| Property | ROADMAP | LESSON |
|----------|---------|--------|
| Border | `#4F46E5` (indigo) | `#059669` (emerald) |
| Badge bg | `#EEF2FF` | `#ECFDF5` |
| Badge text | `#4F46E5` | `#059669` |
| Label | "ROADMAP" | "LESSON" |

### DEC-03-10 — RoadmapGraph Component Modes
`<RoadmapGraph mode="view" />` — read-only, no drag, no connect, no Save button.
`<RoadmapGraph mode="edit" />` — draggable, connectable, shows Save button (Phase 4).
Matches DEC-009 in PROJECT.md.

---

## Key Files

```
packages/ui/src/
  Button.tsx          — primary/secondary/ghost variants
  Card.tsx            — roadmap card with NodeBadge
  NodeBadge.tsx       — ROADMAP (indigo) / LESSON (emerald) pill

packages/graph/src/
  RoadmapGraph.tsx    — @xyflow/react wrapper, mode="view"|"edit"
  RoadmapNode.tsx     — custom node renderer (badge + label + handle)

apps/web/src/
  app/page.tsx              — home, lists roadmaps (SSG, revalidate: 3600)
  app/roadmap/[id]/page.tsx — graph view with breadcrumb
  app/lesson/[id]/page.tsx  — lesson content + sidebar
  components/Breadcrumb.tsx — graph breadcrumb navigation element
  components/MiniGraph.tsx  — small graph preview (SVG or xyflow)
```

---

## Canonical References

- `docs/design/mockup.html` — full 4-screen HTML/CSS mockup (source of truth for tokens + layout)
- `pencil-demo.pen` — approved Pencil design file (3 screens)
- `.planning/PROJECT.md` — DEC-008 (revalidate), DEC-009 (graph modes), DEC-007 (BlockNote JSON)
- `.planning/REQUIREMENTS.md` — REQ-public-roadmap-list, REQ-public-roadmap-graph-view, REQ-public-lesson-content-view, REQ-nfr-ssg-revalidation

---

## Out of Scope (Phase 4)

- Admin CMS / graph editor (`apps/admin`)
- `mode="edit"` Save button wiring
- Dark sidebar admin nav (Screen 4 in mockup)
