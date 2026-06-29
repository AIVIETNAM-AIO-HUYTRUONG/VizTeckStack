---
name: VizTeckStack Web
description: Public viewer for visual technology learning roadmaps — where learners navigate and study.
colors:
  blueprint: "#4F46E5"
  blueprint-mid: "#6366F1"
  blueprint-lt: "#EEF2FF"
  growth: "#059669"
  growth-lt: "#ECFDF5"
  surface-0: "#F8F9FC"
  surface-1: "#FFFFFF"
  surface-2: "#F1F3F9"
  edge: "#E2E8F0"
  ink-1: "#0F172A"
  ink-2: "#475569"
  ink-3: "#94A3B8"
  dark-surface-0: "#0F172A"
  dark-surface-1: "#1E293B"
  dark-surface-2: "#334155"
  dark-edge: "#334155"
  dark-ink-1: "#F8FAFC"
  dark-ink-2: "#CBD5E1"
  dark-ink-3: "#64748B"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  badge:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  card-roadmap:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink-1}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-roadmap-hover:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink-1}"
    rounded: "{rounded.lg}"
    padding: "20px"
  node-badge-roadmap:
    backgroundColor: "{colors.blueprint-lt}"
    textColor: "{colors.blueprint}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.badge}"
  node-badge-lesson:
    backgroundColor: "{colors.growth-lt}"
    textColor: "{colors.growth}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.badge}"
---

# Design System: VizTeckStack Web

## 1. Overview

**Creative North Star: "The Structured Atlas"**

The web viewer is where learners navigate. It is a knowledge map — a place where structure itself is the interface. Users open it to understand where topics live in relation to each other, to follow a path through a domain, and to read lessons at the depth they choose.

The design register is reading-first product UI. Unlike the admin's tool density, the web viewer prioritizes visual clarity, generous whitespace, and sustained reading comfort. The roadmap graph makes relationships spatial; the lesson shell makes long-form technical content legible. Both modes ask the same thing of the design: stay out of the way and let the content lead.

This surface explicitly rejects the eLearning marketplace aesthetic — no promotional framing, no star ratings in primary UI, no countdown timers, no "bestseller" badges. A learner who opens a roadmap is already committed; the interface does not need to sell them anything. The comparison class is a well-designed technical documentation site (MDN, the Rust Book) merged with a spatial navigation tool.

**Key Characteristics:**
- Reading-first density: 16px body, 72ch max line length, generous paragraph spacing on lesson pages
- Display headings reach 32px — the only surface in the system that uses Display weight (Space Grotesk 700)
- Graph canvas is navigational, not editorial — nodes are read-only, interactive for clicking-through
- Empty states are informative, not apologetic
- No user-facing admin chrome: no edit buttons, no status labels, no draft/private indicators

## 2. Colors

The web palette is Restrained. Blueprint marks navigation landmarks and ROADMAP nodes; Growth marks LESSON content. The cool slate neutrals recede so roadmap structure and lesson content can lead.

### Primary

- **Blueprint Ink** (`#4F46E5`): ROADMAP node badges, active navigation links, clickable node borders on graph hover. Not used on text links in lesson body — ink-first prose links stay in Primary Ink with underline.
- **Blueprint Mid** (`#6366F1`): Hover state on blueprint-colored interactive elements.
- **Blueprint Pale** (`#EEF2FF`): ROADMAP badge backgrounds, selected node surface tint in graph view.

### Secondary

- **Growth Active** (`#059669`): LESSON node badges, "currently reading" indicators in page tree.
- **Growth Pale** (`#ECFDF5`): LESSON badge backgrounds, active page tree item background.

### Neutral

- **Outer Shell** (`#F8F9FC` / dark: `#0F172A`): Page background. The viewer's outermost layer.
- **Surface** (`#FFFFFF` / dark: `#1E293B`): Card backgrounds, lesson content columns, page tree panel.
- **Inner Field** (`#F1F3F9` / dark: `#334155`): Graph canvas background, code block backgrounds within lessons, inset areas.
- **Edge** (`#E2E8F0` / dark: `#334155`): Card borders, dividers, page tree item separators.
- **Primary Ink** (`#0F172A` / dark: `#F8FAFC`): Display headings, card titles, lesson page headings.
- **Secondary Ink** (`#475569` / dark: `#CBD5E1`): Card descriptions, breadcrumb text, body prose.
- **Muted Ink** (`#94A3B8` / dark: `#64748B`): Timestamps, node counts, supplementary metadata. Never body copy.

### Named Rules

**The One Voice Rule.** Blueprint and Growth mark type classification (ROADMAP vs LESSON) and navigation state. They are the map's legend. Using either as a decorative accent anywhere else corrupts the system's ability to orient the learner.

**The Prose Ink Rule.** Body text in lesson pages is Secondary Ink (`#475569`), not Muted Ink (`#94A3B8`). Secondary Ink passes 4.5:1 contrast on Surface. Muted Ink is below threshold for body copy — use it only for metadata, never for reading content.

## 3. Typography

**Display/Heading Font:** Space Grotesk — page titles, roadmap names, section headings
**Body Font:** Inter — all lesson prose, card descriptions, navigation text, metadata
**Badge Font:** JetBrains Mono — ROADMAP and LESSON type labels only

**Character:** Space Grotesk at 32px and 700 weight is the web viewer's distinctive voice — it appears here and nowhere in the admin. The confidence of its geometric construction at display size establishes the page before the learner reads a word. Inter's humanist warmth handles long-form reading without fatigue. The pairing has maximal contrast: neither family resembles the other.

### Hierarchy

- **Display** (Space Grotesk 700, 32px, −0.02em, 1.2 lh): Page-level title — the roadmap name on the homepage grid heading ("Learning Roadmaps"), the lesson page title. Used once per page. Use `text-wrap: balance`.
- **Heading** (Space Grotesk 600, 24px, −0.01em, 1.3 lh): Section titles within lesson content (H2). Use `text-wrap: balance`.
- **Title** (Space Grotesk 600, 16px, normal, 1.4 lh): Card titles, roadmap names in the grid, lesson sub-section headings (H3).
- **Body** (Inter 400, 16px, normal, 1.6 lh): Lesson prose, card descriptions. Max **72ch** line length on lesson reading columns. Use `text-wrap: pretty` to reduce orphans.
- **Label** (Inter 600, 14px, normal, 1.4 lh): Navigation links, breadcrumb segments, page tree items, button text.
- **Caption** (Inter 400, 12px, normal, 1.4 lh): Node counts, reading time estimates, timestamps.
- **Badge** (JetBrains Mono 700, 9px, 0.05em, uppercase): ROADMAP and LESSON type classifiers only.

### Named Rules

**The Display Ceiling Rule.** Display (32px, 700) belongs to the web viewer's identity headings. No element goes above 32px. No clamp scaling — consistent DPI viewing means fixed sizes are right.

**The Reading Width Rule.** Lesson body columns are capped at 72ch. Technical prose at wider widths loses readability. The page tree sidebar and cover image do not count toward this limit.

**The Two-Font Rule.** Space Grotesk for headings, Inter for reading. No exceptions in the web viewer. A paragraph in Space Grotesk would read as interface, not content.

## 4. Elevation

The web viewer is flat by default. Cards lift very slightly on hover to signal navigability; everything else is border-defined. The lesson page layout has no chrome — it is a content column, not a panel system.

### Shadow Vocabulary

- **Card hover lift** (`0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`): Applied to roadmap cards on hover only, as navigation feedback. Removed at rest.
- **Search modal overlay** (`rgba(0,0,0,0.4)` backdrop): Behind the search/command modal when open.

### Named Rules

**The Content-First Rule.** The lesson page has no floating panels, no sticky sidebars with shadows, no elevated toolbars. The cover, title, and body are on a single flat plane. The page tree sidebar sits in the layout flow; it does not float above content.

## 5. Components

### Roadmap Cards (Homepage Grid)

The primary navigational surface on the homepage.

- **Shape:** 16px radius (`--radius-lg`)
- **Background:** Surface (`#FFFFFF`)
- **Border:** 1px Edge, no shadow at rest
- **Padding:** 20px
- **Hover:** `translateY(-2px)` + hover-lift shadow, `150ms ease`
- **Internal structure:** NodeBadge → Title (Space Grotesk 600 16px) → Description (Inter 400 14px, Secondary Ink) → optional mini-graph preview (Inner Field bg, rounded-md, `min-h-[80px]`)
- **Grid:** `grid-cols-3` desktop, `grid-cols-1` mobile, `gap-6`

### Node Badges

- **Shape:** Full pill (`9999px`)
- **ROADMAP:** Blueprint Pale bg, Blueprint Ink text, JetBrains Mono 700 9px, uppercase, 0.05em tracking.
- **LESSON:** Growth Pale bg, Growth Active text, same spec.

### Graph Canvas (View Mode)

- **Canvas bg:** Inner Field (`#F1F3F9`) — slightly recessed from the page bg
- **Nodes:** Surface bg, 1px Edge border, `--radius-md`. Clickable nodes have a pointer cursor and Blueprint Ink border on hover.
- **Non-clickable nodes (no link):** default cursor, no hover border change
- **Controls (zoom/pan):** minimal, token-matched: Surface bg, Edge border, no shadow

### Lesson Page Shell

The reading surface. Notion-style, no admin chrome.

- **Cover zone:** Full-width image, no overlay by default. If no cover is set, the zone is omitted entirely — not an empty gray rectangle.
- **Title:** Display weight heading (Space Grotesk 700, 32px), rendered as `h1`
- **Breadcrumb:** Caption Inter 400 12px, Muted Ink, slash-separated. Links in Secondary Ink.
- **Body column:** `max-w-[720px]` centered, 64px top padding below title, `px-6` on mobile
- **Body text:** Inter 400 16px, Secondary Ink, 1.6 line-height, `max-w-[72ch]`, `text-wrap: pretty`
- **Page tree sidebar:** Sticky on desktop (`top-6`), hidden on mobile. Inter 400 14px, tree indentation. Active item: Growth Pale bg, Growth Active text (LESSON) or Blueprint Pale bg (ROADMAP).

### Breadcrumb Display

- **Style:** `caption` weight, Muted Ink, inline with `/` separator
- **Links:** Secondary Ink, no underline at rest, underline on hover
- **Last segment:** Primary Ink, not a link

### Empty State (No Roadmaps)

- **Container:** Centered in page, `py-16`
- **Text:** Secondary Ink, Inter 400 14px, single sentence: "No roadmaps available yet."
- **No illustrative icons or decorative empty-state art** — text suffices

## 6. Do's and Don'ts

### Do:

- **Do** use Display (Space Grotesk 700, 32px) for roadmap page title and lesson page title — the only surface in the system that reaches this size.
- **Do** cap lesson body text at 72ch. Long-form technical reading requires this.
- **Do** use `text-wrap: balance` on Display and Heading elements; `text-wrap: pretty` on all body prose.
- **Do** keep the lesson page flat — no elevated panels, no floating chrome, no sticky toolbars with shadows.
- **Do** omit the cover zone entirely when no cover image is set (not an empty gray area).
- **Do** use Blueprint badge on ROADMAP nodes, Growth badge on LESSON nodes, consistently.
- **Do** include `@media (prefers-reduced-motion: reduce)` on card hover transitions — instant on reduced-motion preference.
- **Do** ensure Secondary Ink (`#475569`) is used for all body prose — not Muted Ink, which fails 4.5:1 on white.

### Don't:

- **Don't** add any admin-facing UI to the web viewer: no edit buttons, no status indicators, no draft labels.
- **Don't** use Blueprint or Growth as decorative colors — section backgrounds, divider accents, highlight bars.
- **Don't** add `border-left` wider than 1px as a colored accent stripe on cards or callouts. Background tint or full border instead.
- **Don't** use `background-clip: text` gradient text. Single solid colors only.
- **Don't** build the homepage to look like Udemy: no star ratings, no enrollment counts in primary UI, no "bestseller" or "new" badge overlays on cards.
- **Don't** add XP bars, achievement badges, or progress celebration animations. Learners are focused adults; measure progress spatially through the graph, not gamification.
- **Don't** add a sticky header or nav chrome to the lesson page. The lesson shell is flat; the cover + title + body is the UI.
- **Don't** use Space Grotesk for body text in lesson pages. The moment lesson prose switches to Space Grotesk, it reads as interface, not content.
- **Don't** add numbered section markers (01 / 02 / 03) or tiny uppercase eyebrow labels above roadmap cards or lesson sections. These are AI grammar, not design voice.
- **Don't** warm-tint the background. The outer shell stays cool-neutral (`#F8F9FC`). Drift toward beige severs the brand from its technical identity.
