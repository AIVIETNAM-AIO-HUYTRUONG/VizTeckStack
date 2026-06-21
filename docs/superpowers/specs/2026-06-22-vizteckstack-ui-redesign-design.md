# VizTeckStack UI Redesign — Design Spec & Stitch Prompts

**Date:** 2026-06-22  
**Scope:** `apps/web` + `apps/admin` + `packages/ui` + `packages/graph`  
**Direction:** Vibrant / Educational  
**Animation:** Expressive (Three.js hero, spring micro-interactions, stagger entrances)  
**Target tool:** [Stitch by Google](https://stitch.withgoogle.com) — use Section 5 prompts directly  

---

## TABLE OF CONTENTS

1. [Project Context](#1-project-context)
2. [New Design System](#2-new-design-system)
3. [Surface Specs](#3-surface-specs)
4. [Component Library & Animation Specs](#4-component-library--animation-specs)
5. [Stitch Prompts](#5-stitch-prompts)

---

## 1. PROJECT CONTEXT

### Architecture Overview

VizTeckStack là visual learning platform — public roadmap viewer + admin CMS. Polyglot monorepo.

```
apps/web   (Next.js 15, port 3001) — Public learner-facing site
apps/admin (Next.js 15, port 3002) — Creator CMS + graph editor
packages/ui     — Shared Button, Card, NodeBadge
packages/graph  — RoadmapGraph (xyflow/React Flow)
packages/lesson — LessonEditor + LessonViewer (BlockNote)
```

### Key Pages to Redesign

| Surface | File | Current State |
|---|---|---|
| Web landing | `apps/web/src/app/page.tsx` | Minimal header + plain card grid |
| Web layout/nav | `apps/web/src/app/layout.tsx` | h-14 plain bar + ThemeToggle |
| Roadmap graph | `apps/web/src/features/roadmap/components/RoadmapGraphView.tsx` | Raw React Flow |
| Lesson page | `apps/web/src/features/lesson/components/LessonLayout.tsx` | Two-col, functional but plain |
| Admin login | `apps/admin/src/app/login/page.tsx` | Centered card, minimal |
| Admin dashboard | `apps/admin/src/app/roadmaps/page.tsx` | Plain table |
| Admin layout | `apps/admin/src/components/AdminLayout.tsx` | Flat h-14 header |
| Button | `packages/ui/src/Button.tsx` | primary + ghost only |
| Card | `packages/ui/src/Card.tsx` | Flat border, no hover |

### Non-Obvious Constraints (from CLAUDE.md)

- **Graph editor page is standalone** — `apps/admin/src/app/roadmaps/[id]/page.tsx` does NOT use `AdminLayout`. Never wrap it.
- **Dark mode** — `darkMode: 'class'` in Tailwind. Blocking `<script>` in layout sets `.dark` on `<html>` before paint (FOUC prevention). Do not remove.
- **Tailwind semantic tokens** — always use `bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo`. Never hardcode hex in Tailwind classes.
- **Three.js / React Three Fiber** — must be dynamic imported (`ssr: false`) — cannot run server-side.
- **`packages/graph` measuredRef cache** — do not remove; nodes go invisible without it.

### Current Design Tokens (globals.css)

```css
/* Light mode */
--indigo: #4F46E5;  --indigo-mid: #6366F1;  --indigo-lt: #EEF2FF;
--emerald: #059669; --emerald-lt: #ECFDF5;
--bg-0: #F8F9FC;    --bg-1: #FFFFFF;         --bg-2: #F1F3F9;
--border: #E2E8F0;
--text-1: #0F172A;  --text-2: #475569;       --text-3: #94A3B8;
--radius-sm: 6px;   --radius-md: 10px;       --radius-lg: 16px;

/* Dark mode (.dark) */
--bg-0: #0F172A;    --bg-1: #1E293B;         --bg-2: #334155;
--border: #334155;
--text-1: #F8FAFC;  --text-2: #CBD5E1;       --text-3: #64748B;
```

---

## 2. NEW DESIGN SYSTEM

### 2.1 Extended Color Palette

Keep existing tokens. Add the following to `globals.css`:

```css
:root {
  /* New accent colors */
  --violet: #7C3AED;
  --violet-mid: #8B5CF6;
  --violet-lt: #FAF5FF;
  --amber: #F59E0B;
  --amber-lt: #FFFBEB;

  /* Gradient tokens (use in CSS, not Tailwind directly) */
  --gradient-primary: linear-gradient(135deg, #4F46E5, #7C3AED);
  --gradient-edu:     linear-gradient(135deg, #7C3AED, #059669);
  --gradient-bg:      linear-gradient(160deg, #EEF2FF 0%, #FAF5FF 40%, #ECFDF5 100%);
  --gradient-hero-text: linear-gradient(135deg, #4F46E5, #7C3AED);

  /* Extended radius */
  --radius-xl: 20px;

  /* Elevation shadows */
  --shadow-card:     0 4px 16px rgba(79, 70, 229, 0.08);
  --shadow-card-hover: 0 8px 28px rgba(79, 70, 229, 0.16);
  --shadow-featured: 0 8px 36px rgba(79, 70, 229, 0.22);
  --shadow-glow:     0 0 24px rgba(79, 70, 229, 0.4);
}

.dark {
  /* Gradient BG dark override */
  --gradient-bg: linear-gradient(160deg, #1E1B4B 0%, #2D1B69 40%, #064E3B 100%);
}
```

Add to `tailwind.config.js` extend:

```js
colors: {
  violet: 'var(--violet)',
  'violet-lt': 'var(--violet-lt)',
  amber: 'var(--amber)',
  'amber-lt': 'var(--amber-lt)',
},
boxShadow: {
  card: 'var(--shadow-card)',
  'card-hover': 'var(--shadow-card-hover)',
  featured: 'var(--shadow-featured)',
  glow: 'var(--shadow-glow)',
},
```

### 2.2 Typography Scale

| Role | Font | Weight | Size | Usage |
|---|---|---|---|---|
| Hero | Space Grotesk | 800 | 48–72px | Landing hero headline |
| H1 | Space Grotesk | 700 | 28–36px | Page titles |
| H2 | Space Grotesk | 700 | 20–24px | Section headings |
| H3 | Space Grotesk | 600 | 16–18px | Card titles |
| Body | Inter | 400/500 | 14–16px | Paragraphs, UI |
| Caption | Inter | 400 | 12px | Sublabels, metadata |
| Badge | JetBrains Mono | 700 | 9–11px | NodeBadge, slugs, code |

Hero headline gets `background: var(--gradient-hero-text); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`

### 2.3 Card Elevation System

| Level | When | Style |
|---|---|---|
| 0 — Flat | Default | `border: 1px solid var(--border)` |
| 1 — Hover | Mouse over | `border-color: #C7D2FE; box-shadow: var(--shadow-card-hover); transform: translateY(-4px)` |
| 2 — Featured | Promoted/selected | `background: var(--gradient-bg); border-color: #C7D2FE; box-shadow: var(--shadow-featured)` |

### 2.4 Animation Token Set

Add to `globals.css`:

```css
:root {
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 600ms;
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 3. SURFACE SPECS

### 3.1 Web Landing (`apps/web`)

#### Nav (`layout.tsx`)
- Height: 56px
- Background: `rgba(255,255,255,0.75)` + `backdrop-filter: blur(12px)` + `border-bottom: 1px solid rgba(99,102,241,0.1)`
- Left: gradient icon (28×28, `border-radius: 8px`, `background: var(--gradient-primary)`) + "VizTeckStack" Space Grotesk 800
- Right: ghost nav link "Roadmaps" + gradient CTA button "Get Started →" (`border-radius: 10px`)
- Dark mode: bg `rgba(15,23,42,0.8)` + same blur

#### Hero Section (`page.tsx`)
- `<HeroCanvas>` — Three.js canvas, full-width, absolute positioned behind content (see Section 4.2)
- Radial gradient overlay on top of canvas: `radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.06), transparent 70%)`
- Content centered, `max-width: 720px`, `padding: 80px 24px 64px`
- Chip badge: `background: rgba(79,70,229,0.1); border: 1px solid rgba(79,70,229,0.25); border-radius: 9999px` + "Visual Learning Platform" in JetBrains Mono uppercase
- Headline: "Learn Tech " (dark) + "Visually." (gradient text) — Space Grotesk 800 64px mobile→48px
- Subtitle: Inter 16px `text-text-2`, max-width 480px
- CTAs: primary gradient button + secondary white `border: 1.5px solid #C7D2FE`

#### Roadmap Cards Grid
- Section heading "Popular Roadmaps" Space Grotesk 700 24px
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, gap 20px
- Card: white bg, `border-radius: 14px`, border, padding 20px
- Top: colored icon square (gradient bg, 40×40, `border-radius: 10px`)
- Body: title Space Grotesk 700, description Inter 14px text-text-2
- Bottom: progress bar (optional placeholder) + node count
- Hover: elevation level 1, `transition: all var(--duration-base) var(--ease-spring)`
- Entrance: stagger 80ms per card, `translateY(20px) → 0`, `opacity 0 → 1`, `duration: var(--duration-slow)`

### 3.2 Admin Dashboard (`apps/admin`)

#### Admin Header (`AdminLayout.tsx`)
- Replace flat `bg-bg-1` with `background: var(--gradient-primary)`
- Logo: white icon 22×22 `border-radius: 6px; background: rgba(255,255,255,0.2)` + white wordmark + `/ Admin` white-50
- Right: avatar circle + "Log out" white-70 ghost button

#### Roadmap List (table → cards, `roadmaps/page.tsx`)
- Remove `<table>`. Replace with vertical list of card rows.
- Each row: `background: bg-bg-1; border-radius: 12px; padding: 14px 16px; border: 1px solid var(--border)`
- Left: colored icon square (40×40 gradient, roadmap color)
- Center: title Space Grotesk 700 + slug JetBrains Mono text-text-3
- Right: status pill + Edit/Delete buttons
- Active/hover: `border-color: #C7D2FE; box-shadow: var(--shadow-card)`
- "+ New Roadmap" button: gradient with `box-shadow: var(--shadow-card)`

#### Admin Login (`login/page.tsx`)
- Full page: `background: var(--gradient-bg)`
- Card: `border-radius: 20px; padding: 32px; box-shadow: 0 8px 40px rgba(79,70,229,0.18); border: 1px solid rgba(99,102,241,0.15)`
- Logo icon: 44×44 `border-radius: 14px; background: var(--gradient-primary); box-shadow: var(--shadow-glow)`
- Input: `background: #F8F9FF; border: 1.5px solid #C7D2FE; border-radius: 8px`
- Input focus: `border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(79,70,229,0.15)`
- Submit button: gradient, full-width, `border-radius: 10px`, `box-shadow: var(--shadow-card)`

### 3.3 Roadmap Graph View (`apps/web`)

- Keep existing React Flow implementation
- Node cards: `border-radius: 10px`, ROADMAP nodes `border: 2px solid var(--indigo)`, LESSON nodes `border: 2px solid var(--emerald)`
- Selected node: `box-shadow: var(--shadow-glow)`, pulsing ring animation
- Toolbar: glassmorphism pill `background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border-radius: 9999px`
- Edge color: `#4F46E5` with opacity 0.5; selected edge: opacity 1.0

### 3.4 Lesson Page (`apps/web`)

- Left column: cleaner typography, `h1` Space Grotesk 800 32px, `hr` with gradient `background: var(--gradient-primary); height: 2px`
- Sidebar cards: `border-radius: 14px`, hover elevation level 1
- "Back to Roadmap" button: full-width gradient, `border-radius: 10px`

---

## 4. COMPONENT LIBRARY & ANIMATION SPECS

### 4.1 Updated Components

#### `packages/ui/src/Button.tsx`

Add variants and size prop:

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';
```

| Variant | Style |
|---|---|
| `primary` | `background: var(--gradient-primary); color: white; box-shadow: var(--shadow-card); border-radius: 10px` |
| `secondary` | `border: 1.5px solid #C7D2FE; color: var(--indigo); bg: rgba(79,70,229,0.04); border-radius: 10px` |
| `ghost` | `border: none; color: var(--text-2); bg: transparent` |
| `success` | `background: linear-gradient(135deg, #059669, #10B981); color: white; box-shadow: 0 4px 12px rgba(5,150,105,0.3)` |

All buttons: `transform: scale(1.02)` on hover, `transition: var(--duration-fast) var(--ease-smooth)`.  
Add `loading?: boolean` prop → spinner icon + `opacity: 0.7`.  
Add `iconLeft?: ReactNode` and `iconRight?: ReactNode` slots.

#### `packages/ui/src/Card.tsx`

Add `featured?: boolean` prop:
- Default: elevation 0
- Hover: elevation 1 (via CSS group-hover or onMouseEnter)
- `featured`: elevation 2 + `featured` badge chip

Add optional `progress?: number` prop (0–100) → renders gradient progress bar at bottom.

#### `packages/ui/src/NodeBadge.tsx`

Increase badge size: `text-[10px]` → `text-[11px]`, `px-2.5 py-1`.  
Add `FEATURED` type with amber color.

### 4.2 Three.js Hero (`HeroCanvas.tsx`)

**Install:**
```bash
pnpm --filter @vizteck/web add three @types/three
```

**File:** `apps/web/src/components/HeroCanvas.tsx`

```
SCENE
  Camera: PerspectiveCamera, FOV 60, position (0, 0, 5)
  Renderer: WebGLRenderer, alpha: true, antialias: true
  Background: transparent (CSS gradient shows through)

NODES — 15 SphereGeometry instances
  Radius: random 0.05–0.15
  Colors (MeshBasicMaterial): rotate through [#4F46E5, #7C3AED, #059669, #F59E0B, #6366F1]
  Initial positions: random in box (-3..3, -2..2, -1..1)
  Float animation: position.y += sin(time * speed + phaseOffset) * 0.002 per frame
  Mouse parallax: target.x = cursor.x * 0.4; lerp toward target * 0.05 per frame

EDGES — LineSegments rebuilt each frame
  Connect all node pairs where distance < 1.8
  Opacity: 1 - (distance / 1.8), capped 0.1–0.5
  Color: #4F46E5
  LineBasicMaterial, transparent: true

PARTICLES — Points, BufferGeometry
  Count: 80 points
  PointsMaterial: size 0.025, color #818CF8, opacity 0.35, transparent: true
  Drift: position += velocity * 0.0008 per frame
  Wrap: reset to opposite side when out of [-4, 4] bounds

PERFORMANCE
  useRef for renderer/scene (no React re-renders inside animation loop)
  ResizeObserver for canvas sizing
  Dispose all geometry + materials on unmount (useEffect cleanup)
  If window.devicePixelRatio > 2: reduce node count to 8, particle count to 40
  prefers-reduced-motion: skip animation loop, render 1 static frame only
```

**Usage in `page.tsx`:**
```tsx
const HeroCanvas = dynamic(() => import('@/components/HeroCanvas'), { ssr: false });

// In hero section:
<div style={{ position: 'relative' }}>
  <HeroCanvas className="absolute inset-0 w-full h-full" />
  <div style={{ position: 'relative', zIndex: 1 }}>
    {/* Hero text content */}
  </div>
</div>
```

### 4.3 Micro-Interaction Specs

#### Page Enter Animations
```css
/* Hero content */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-enter { animation: fadeUp var(--duration-slow) var(--ease-smooth) 100ms both; }

/* Card stagger — apply via JS IntersectionObserver */
.card-enter { animation: fadeUp var(--duration-slow) var(--ease-smooth) calc(var(--i) * 80ms) both; }
/* Set --i as inline style per card: style={{ '--i': index }} */
```

#### Interaction States
| Element | Hover | Active | Transition |
|---|---|---|---|
| Button primary | `scale(1.02)` + shadow brighten | `scale(0.98)` | 150ms smooth |
| Card | `translateY(-4px)` + shadow | — | 300ms spring |
| Status badge | — | pulse ring 400ms | on click |
| Graph node | glow pulse | — | selected state |
| Nav CTA | gradient shift to violet | — | 200ms smooth |

#### Loading & Success States
- **Skeleton:** `background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-1) 50%, var(--bg-2) 75%)` + `background-size: 400%` shimmer keyframe
- **Button loading:** Replace text with `<Spinner />` + opacity 0.7, pointer-events none
- **Graph save:** indigo 2px progress bar at top of toolbar, animates 0→100% then fades out
- **Status → PUBLIC:** `canvas-confetti` burst, 800ms, colors `[#4F46E5, #7C3AED, #059669, #F59E0B]`
- **Lesson complete:** emerald glow pulse on corresponding node in mini-graph

---

## 5. STITCH PROMPTS

> **How to use:** Go to [stitch.withgoogle.com](https://stitch.withgoogle.com). Paste the **Design Tokens Reference** block first as context, then paste one prompt per screen. Generate each screen separately.

---

### 🎨 Design Tokens Reference (paste first in every Stitch session)

```
BRAND COLORS
Primary:   Indigo #4F46E5 | Indigo-mid #6366F1 | Indigo-light #EEF2FF
Accent:    Violet #7C3AED | Violet-light #FAF5FF
Success:   Emerald #059669 | Emerald-light #ECFDF5
Highlight: Amber #F59E0B

NEUTRALS (light mode)
Backgrounds: #F8F9FC (page) / #FFFFFF (card) / #F1F3F9 (subtle)
Text:        #0F172A (primary) / #475569 (secondary) / #94A3B8 (muted)
Border:      #E2E8F0

TYPOGRAPHY
Display headings: Space Grotesk, weight 700–800
Body & UI:        Inter, weight 400–600
Code & badges:    JetBrains Mono, weight 700

CORNER RADIUS
6px (small) / 10px (medium) / 14px (large) / 20px (extra-large) / 9999px (pill)

BRAND GRADIENTS
Primary:  left-to-right #4F46E5 → #7C3AED
Success:  left-to-right #059669 → #10B981
Page BG:  diagonal #EEF2FF → #FAF5FF → #ECFDF5 (tricolor soft)
```

---

### PROMPT 1 — Web Landing Page

```
Design a vibrant, educational learning platform landing page inspired by roadmap.sh, Codecademy, and Miro. Light mode. Soft tricolor gradient page background: indigo-light #EEF2FF → violet-light #FAF5FF → emerald-light #ECFDF5, diagonal.

HEADER / NAV
Glassmorphism navbar, height 56px, frosted glass effect (semi-transparent white + blur). Left side: small branded logo icon (28×28 rounded rectangle, indigo→violet gradient #4F46E5→#7C3AED) next to wordmark "VizTeckStack" in Space Grotesk 800, dark. Right side: ghost nav link "Roadmaps" in slate-500 + CTA button with indigo→violet gradient fill, rounded corners (10px), white text "Get Started →", subtle shadow.

HERO SECTION
Full-width hero with an interactive 3D canvas background showing a glowing knowledge graph: 15 floating spheres in indigo, violet, emerald, amber — connected by semi-transparent indigo lines — slowly drifting and pulsing in space. Slightly transparent so the tricolor page gradient shows through.

Over the canvas, centered content:
- Small chip badge: semi-transparent indigo bg, indigo border, "VISUAL LEARNING PLATFORM" in JetBrains Mono uppercase 11px
- Large headline: "Learn Tech" in dark #0F172A + "Visually." on next line with gradient text fill indigo→violet — Space Grotesk 800, 64px desktop / 40px mobile
- Subtitle: "Structured roadmaps with interactive graphs — từ beginner đến expert, từng node một." Inter 16px, slate-500, max-width 480px, centered
- Two CTA buttons: (1) primary gradient button "Explore Roadmaps →" with indigo shadow glow; (2) secondary outlined button "How it works" white bg, indigo border

ROADMAP CARDS GRID
Section: "Popular Roadmaps" heading Space Grotesk 700 24px. Responsive 3-column grid below.

Each card: white background, 14px border radius, 20px padding, subtle border.
- Top area: colorful gradient icon square (40×40, 10px radius): Frontend=indigo→violet; Backend=violet→purple; DevOps=emerald→teal
- Title: Space Grotesk 700 14px, dark
- Description: Inter 13px, slate-500, 2 lines max
- Bottom: thin gradient progress bar (indigo→violet, showing partial completion) + "X/10 nodes" caption in slate-400 monospace

Card hover state: lifts 4px up, indigo-200 border, soft indigo shadow glow. Smooth spring transition.

Cards animate in on page load: staggered slide-up from 20px below, 80ms delay between each card.

OVERALL FEEL
Energetic, educational, modern. Generous whitespace. Color pops: indigo + violet + emerald + amber. Clean typography hierarchy. Spring-based animations. Inspired by Linear, roadmap.sh, Notion — but more colorful and playful. Suitable for developers learning tech skills.
```

---

### PROMPT 2 — Admin Dashboard

```
Design a vibrant SaaS admin dashboard for a learning content management system. Same brand design system as the public site — consistent colors and typography. Light mode.

HEADER
Full-width gradient header bar, height 52px, background indigo #4F46E5 → violet #7C3AED (left to right). Left side: small white icon square (22×22, 6px radius, rgba white 20% bg) next to "VizTeckStack" wordmark in white Space Grotesk 800 + "/ Admin" in white-50 opacity, smaller. Right side: small circle avatar placeholder + "Log out" text in white-70 opacity.

PAGE CONTENT (below header, white/light bg)
Page title "Roadmaps" in Space Grotesk 800 28px dark + subtitle "3 roadmaps total" in slate-400 below. Top-right: "+ New Roadmap" button with indigo→violet gradient fill, 10px radius, white text, indigo shadow.

ROADMAP LIST — card rows (not a table)
Vertical stack of card rows, each: white bg, 12px border radius, 14px padding, subtle border.
- Left: colored gradient icon square (36×36, 10px radius): first=indigo-light bg, second=violet-light bg, third=emerald-light bg
- Center: roadmap title Space Grotesk 700 14px dark + slug "/frontend-dev" in JetBrains Mono 10px slate-400
- Right side: status pill badge (PUBLIC=emerald bg + text, DRAFT=indigo bg + text, PRIVATE=slate) + "Edit" ghost button + "Delete" red ghost button

Active row (second one): indigo-200 border + very subtle indigo shadow — shows selection state.

EMPTY STATE (show as a smaller reference below the list)
Center-aligned empty state card: "No roadmaps yet" heading + "Create your first roadmap to get started." subtitle + gradient "+ New Roadmap" button.

OVERALL FEEL
Professional but vibrant. Gradient header gives strong brand identity. Content area clean white with color pops on badges and CTAs. Inspired by Linear Admin, Vercel Dashboard — with educational brand colors. Efficient, clear information hierarchy.
```

---

### PROMPT 3 — Admin Login Page

```
Design a beautiful, branded admin authentication page for a tech learning platform.

BACKGROUND
Full-page soft diagonal gradient: indigo-light #EEF2FF → violet-light #FAF5FF → emerald-light #ECFDF5. Subtle floating decorative elements in the background (blurred colored orbs in indigo and violet, very low opacity).

CENTER CARD
White card, perfectly centered (vertically and horizontally), width 400px, 20px border radius, 32px padding, indigo-tinted box shadow (0 8px 40px rgba(79,70,229,0.18)), very subtle indigo border (rgba 15%).

Card content top to bottom:
1. Logo icon: 44×44 rounded rectangle (14px radius), indigo→violet gradient fill #4F46E5→#7C3AED, glowing indigo shadow (0 0 24px rgba(79,70,229,0.4)). Centered.
2. Wordmark: "VizTeckStack" Space Grotesk 800 20px dark, centered, 8px below icon
3. Subtitle: "Admin Console" Inter 13px slate-400, centered, 4px below
4. 20px gap
5. Label: "Admin token" Inter 700 12px dark, left-aligned
6. Password input: height 38px, background #F8F9FF, border 1.5px indigo-200, 8px radius, indigo focus ring (3px rgba(79,70,229,0.15)), placeholder "Enter your token" in slate-300, password dots when filled
7. Error state (show below input): "Invalid token. Please try again." in red-500, 12px
8. 16px gap
9. Submit button: full-width, gradient indigo→violet, 10px radius, height 40px, white "Sign In →" Inter 700 13px, indigo glow shadow. Loading state shows spinner + "Signing in…"

OVERALL FEEL
Premium, trustworthy, branded. The gradient background + glowing logo icon makes it feel modern and distinctive. Not generic — clearly VizTeckStack's admin portal.
```

---

### PROMPT 4 — Roadmap Graph View (Public)

```
Design a beautiful interactive roadmap viewer page for a visual learning platform. Light mode.

HEADER
Same glassmorphism nav as landing page: frosted glass 56px bar, logo icon + "VizTeckStack" wordmark, right side ThemeToggle toggle button.

BREADCRUMB (below nav)
Slim breadcrumb bar: "Home → Frontend Dev Roadmap" in Inter 13px slate-400, with "Home" as indigo clickable link. Padding 12px 24px.

MAIN CANVAS AREA (full viewport height minus nav + breadcrumb)
Interactive knowledge graph on a subtle dot-grid background (#F8F9FC with dots pattern in slate-200).

NODES — rounded cards floating on canvas:
- ROADMAP node type: white card, 10px radius, 2px indigo border #4F46E5, title in Space Grotesk 700 13px, small "ROADMAP" badge in indigo-light. Shadow: indigo shadow-card.
- LESSON node type: white card, 10px radius, 2px emerald border #059669, title in Space Grotesk 700 13px, small "LESSON" badge in emerald-light.
- Selected node: same style + glowing indigo aura ring (pulsing) + slightly larger shadow.

EDGES
Curved lines connecting nodes, indigo #4F46E5 color, 1.5px stroke, 40% opacity. Arrowheads at target end. Selected edge: full opacity, slightly thicker.

TOOLBAR (top-right corner)
Glassmorphism pill container (frosted white, blur, pill shape): zoom in (+), zoom out (−), fit view (⊡), separator, dark mode toggle — all as small icon buttons inside the pill.

NODE SIDE PANEL (right side, slides in when node selected)
280px panel sliding in from right: white bg, left border indigo-200. Shows node title Space Grotesk 700, type badge, description, and "Open Lesson →" gradient button if LESSON type.

OVERALL FEEL
Spatial, visual, beautiful. Feels like a premium mind-map tool (Miro / Obsidian Canvas). Clean canvas with pops of indigo and emerald. Interactive and explorable.
```

---

### PROMPT 5 — Lesson Reading Page (Public)

```
Design a clean, focused lesson reading page for a tech learning platform. Light mode.

HEADER
Same glassmorphism nav: frosted glass 56px, VizTeckStack logo + "Roadmaps" nav link + theme toggle.

BREADCRUMB
"Home → Frontend Dev → React Hooks" Inter 13px slate-400, indigo links, 12px 24px padding.

MAIN CONTENT (max-width 1200px, centered, 24px padding, two-column layout)

LEFT COLUMN (flex-1, min-width 0):
- "LESSON" badge: emerald pill (emerald-light bg, emerald text, JetBrains Mono 10px uppercase)
- Lesson title "Understanding React Hooks" Space Grotesk 800 32px dark
- Gradient divider line: 2px height, indigo→violet gradient, full width, 8px margin
- Rich text content area: Inter 16px, 1.7 line-height, comfortable reading.
  Code blocks: dark background #0F172A, 10px radius, padding 16px, JetBrains Mono 13px, syntax highlighting in indigo (keywords) + emerald (strings) + amber (variables).
  Inline code: indigo-light bg, indigo text, 4px padding, 4px radius.

RIGHT SIDEBAR (280px, fixed width, shrink 0):
Card 1 — "Progress": white bg, 14px radius, border, padding 20px.
  Circular progress ring placeholder (indigo stroke, 64px) + "0% complete" + "Progress tracking coming soon" in slate-300 12px.

Card 2 — "Roadmap Overview": white bg, 14px radius, border, padding 20px.
  Mini graph preview: tiny node dots connected by lines in a simplified visualization, 240×100px, indigo nodes.

Card 3 — "Back to Roadmap" button: full-width, indigo→violet gradient, 10px radius, white text "← Back to Roadmap", indigo glow shadow.

Sidebar cards: hover state lifts slightly with indigo shadow.

OVERALL FEEL
Calm, focused, premium. Like a beautiful online textbook. Clean typography, subtle use of color. The sidebar keeps the learner oriented within the roadmap while the left column provides distraction-free reading. Inspired by Notion docs + Linear changelog.
```

---

## APPENDIX — Package Install Commands

```bash
# Three.js for hero canvas
pnpm --filter @vizteck/web add three @types/three

# Confetti for publish celebration
pnpm --filter @vizteck/admin add canvas-confetti @types/canvas-confetti

# Optional: Framer Motion for page transitions (if preferred over CSS animations)
pnpm --filter @vizteck/web add framer-motion
pnpm --filter @vizteck/admin add framer-motion
```

---

*Generated from brainstorming session 2026-06-22. Stitch prompts in Section 5 are the primary deliverable — use them directly at stitch.withgoogle.com.*
