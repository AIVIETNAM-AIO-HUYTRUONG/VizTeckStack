---
name: VizTeckStack Admin
description: CMS and graph editor for educators building visual technology learning roadmaps.
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
  heading:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "20px"
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
    lineHeight: 1.5
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
components:
  button-primary:
    backgroundColor: "{colors.blueprint}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.blueprint-mid}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.blueprint}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.blueprint-lt}"
    textColor: "{colors.blueprint}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-1}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
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

# Design System: VizTeckStack Admin

## 1. Overview

**Creative North Star: "The Technical Notebook"**

The admin is where educators author. It is a focused creation tool — like a well-structured engineering notebook that stays out of the writer's way. Every panel, modal, and canvas control exists to reduce cognitive load during content production, not to demonstrate visual sophistication.

The design register is dense product UI. Users spend sessions inside this surface — building roadmap graphs, writing lesson pages, managing node relationships. The interface must disappear into the task. Consistency is a feature: the same button shape, the same form vocabulary, the same panel rhythm across every screen. Surprises cost attention; attention is the resource being protected.

This surface explicitly rejects: novelty for its own sake, decorative motion, invented affordances for standard tasks (custom scrollbars, bespoke form controls), and any visual treatment that would cause a moment of "what does this do?" The comparison class is Notion and Linear — not because they are aspirational brands, but because they have solved the problem of staying out of the way.

**Key Characteristics:**
- Tool density: more form controls, more table rows, tighter spacing than the public viewer
- Consistent vocabulary: one button shape, one input style, one modal pattern — everywhere
- Graph canvas is first-class: the full-viewport editor page has its own layout system outside AdminLayout
- No decorative motion: transitions convey state (modal open, tab switch, skeleton fade) — nothing else
- Dark mode is first-class: both themes are symmetric, not approximated

## 2. Colors

The admin palette is Restrained. Blueprint drives primary actions and node type classification; Growth classifies lesson content. Everything else is cool slate.

### Primary

- **Blueprint Ink** (`#4F46E5`): Primary buttons, ROADMAP badge, focused input rings, active table row indicator. Appears on ≤15% of any screen surface.
- **Blueprint Mid** (`#6366F1`): Hover state on Blueprint elements only. Not used independently.
- **Blueprint Pale** (`#EEF2FF`): ROADMAP badge background, selected state tint. Never a panel or page background.

### Secondary

- **Growth Active** (`#059669`): LESSON badge. Signals lesson content type and save-success feedback states.
- **Growth Pale** (`#ECFDF5`): LESSON badge background only.

### Neutral

- **Outer Shell** (`#F8F9FC` / dark: `#0F172A`): Page background. The admin's outer surface.
- **Surface** (`#FFFFFF` / dark: `#1E293B`): Header, modals, panels, table backgrounds.
- **Inner Field** (`#F1F3F9` / dark: `#334155`): Table row hover backgrounds, skeleton loaders, graph canvas background in sidebar previews.
- **Edge** (`#E2E8F0` / dark: `#334155`): All borders — table rows, card outlines, input strokes, header divider.
- **Primary Ink** (`#0F172A` / dark: `#F8FAFC`): Headings, primary text.
- **Secondary Ink** (`#475569` / dark: `#CBD5E1`): Body text, secondary labels, descriptions.
- **Muted Ink** (`#94A3B8` / dark: `#64748B`): Placeholders, timestamps, suppressed metadata. Never body copy.

### Named Rules

**The One Voice Rule.** Blueprint and Growth carry semantic meaning — node type and primary action. Every other use of either color erodes that meaning. A green success toast is the Growth budget spent; a green row highlight is it overdrafted.

**The No-Shadow Rule.** Surfaces distinguish themselves through background tone and borders. Shadows appear only in modals and floating dropdowns. Admin panels do not float; they sit in the layout.

## 3. Typography

**Heading/Title Font:** Space Grotesk — for page headings, modal titles, card titles, navigation brand
**Body/Label Font:** Inter — for all prose, form labels, button text, table data, descriptions
**Badge Font:** JetBrains Mono — for ROADMAP and LESSON node type labels exclusively

**Character:** Admin is Inter-dominant. Space Grotesk appears only at the top of the hierarchy — page title, modal heading, navigation wordmark. The moment you write a button or a table cell in Space Grotesk, the tool feels like a landing page. Keep the split strict.

### Hierarchy

- **Heading** (Space Grotesk 600, 20px, −0.01em, 1.3 lh): Page-level section title (`Roadmaps`, `Edit Roadmap`). One per page context.
- **Title** (Space Grotesk 600, 16px, normal, 1.4 lh): Modal headings, sidebar section labels, card titles within the lesson shell.
- **Body** (Inter 400, 16px, normal, 1.5 lh): Table cell content, descriptions, form hint text, panel prose.
- **Label** (Inter 600, 14px, normal, 1.4 lh): Button text, form field labels, table column headers, nav link text.
- **Caption** (Inter 400, 12px, normal, 1.4 lh): Slug preview text, timestamps, character counts, supplementary hints.
- **Badge** (JetBrains Mono 700, 9px, 0.05em, uppercase): ROADMAP and LESSON type classifiers only.

### Named Rules

**The Font Split Rule.** Space Grotesk = headings and identity. Inter = everything a user interacts with. JetBrains Mono = node type labels. One element, one typeface. Never blend them on the same element.

**The Density Rule.** Admin typography stays at 16px body across both surfaces for consistency. Density is achieved through tighter padding and row heights, not smaller type.

## 4. Elevation

The admin is flat by default. Layout structure comes from the three-layer neutral background stack — Outer Shell frames the page, Surface raises the header and content panels, Inner Field depresses table backgrounds and canvas. No box-shadows at rest.

### Shadow Vocabulary

- **Modal overlay** (`rgba(0,0,0,0.5)` backdrop): Full-screen modal only. The visual contract that something is blocking interaction.
- **Dropdown float** (`0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)`): Command palettes, dropdowns using `position: fixed` to escape scroll containers.

### Named Rules

**The Flat-By-Default Rule.** No decorative shadows. Depth is communicated by tone (Outer Shell → Surface → Inner Field) and by the 1px Edge borders that frame panels and tables. A shadow on a resting panel surface is visual noise, not hierarchy.

## 5. Components

### Buttons

Responsive and tactile — clear feedback on every interaction, no theatrical choreography.

- **Shape:** 6px radius (`--radius-sm`)
- **Primary:** Blueprint Ink bg, white text, 8px 16px padding, Inter 600 14px. Hover: Blueprint Mid bg, `translateY(-1px)`. Transition: `150ms ease`. Focus: 2px Blueprint outline, 2px offset.
- **Secondary:** White bg, Blueprint Ink text + border. Hover: Blueprint Pale bg.
- **Ghost:** Transparent bg, Secondary Ink text. Hover: Inner Field bg, Primary Ink text.
- **Disabled:** `opacity: 0.5`, `pointer-events: none`.
- **Reduced motion:** `transition: none`, no `translateY`.

### Node Badges

- **Shape:** Full pill (`9999px`)
- **ROADMAP:** Blueprint Pale bg, Blueprint Ink text, JetBrains Mono 700 9px, uppercase, 0.05em tracking.
- **LESSON:** Growth Pale bg, Growth Active text, same spec.
- Not used outside of node type classification.

### Tables / List Views

- **Container:** Surface bg, 1px Edge border, `--radius-md`, `overflow: hidden`
- **Row:** `px-4 py-3`, `border-b border-edge`. Last row has no border.
- **Loading state:** Skeleton animation — `bg-surface-2` rounded bars pulsing at `1.5s` ease-in-out. No spinners in table context.
- **Empty state:** Centered in bordered container. Heading (Space Grotesk 600 20px) + body text + primary action button.
- **Error state:** Centered error message + Retry button. Same container structure as empty state.

### Modals

- **Overlay:** `rgba(0,0,0,0.5)` backdrop, `z-50`, click-to-close
- **Container:** Surface bg, `--radius-md` (10px), 24px padding
- **Structure:** `aria-labelledby` heading (Space Grotesk 600, 18px) → form or content → action row (right-aligned: primary button left of dismiss)
- **Escape key:** always closes. Focus trap inside while open.
- **Width:** `max-w-md` default; `max-w-lg` for wider forms.

### Form Inputs

- **Style:** White bg, 1px Edge border, 6px radius, `10px 12px` padding, Inter 400 16px
- **Focus:** Blueprint Ink border, `0 0 0 3px rgba(79,70,229,0.10)` ring
- **Label:** Inter 600 14px, Primary Ink, placed above field with 6px gap
- **Helper / slug preview:** Caption below field, Muted Ink
- **Error:** Red (`#EF4444`) border + caption below
- **Disabled:** 50% opacity, `cursor: not-allowed`, Inner Field bg

### Admin Header

- **Height:** 56px, fixed at top
- **Background:** Surface, 1px Edge border-bottom
- **Left:** Space Grotesk 600 18px wordmark
- **Right:** ThemeToggle + Ghost "Log out" button, 12px gap

### Graph Canvas (Full-Viewport Editor)

This page does **not** use AdminLayout. It owns its full viewport.

- **Layout:** `100vh`, toolbar pinned at top, canvas fills remainder
- **Canvas bg:** Outer Shell in light, `#0F172A` in dark
- **Node at rest:** Surface bg, 1px Edge border, `--radius-md`, `p-3`
- **Node selected:** 2px Blueprint Ink border, Blueprint Pale bg tint
- **Toolbar:** Surface bg, 1px Edge border-bottom, same height as AdminHeader — visually unified
- **Controls (zoom/pan):** ReactFlow native, styled to match surface tokens (bg-2, edge border, no box-shadow)

### Node Inventory (Side Panel)

- **Container:** Surface bg, 1px Edge border-left, fixed width (`w-64`)
- **Section headers:** Caption Inter 400 12px uppercase, Muted Ink, `px-4 pt-4 pb-1`
- **Node item:** `px-4 py-2`, draggable. Hover: Inner Field bg.
- **Off-canvas nodes:** same list style, Muted Ink label to indicate they exist but are not placed

### Lesson Page Shell (Edit Mode)

- **Cover zone:** Full-width image area; hover reveals upload/paste/remove controls
- **Title:** Inline editable heading (Space Grotesk 600, 28px), blur-to-save
- **Content area:** BlockNote editor, Inter 400 16px, max-width ~720px centered
- **Page tree sidebar:** Caption-weight labels, tree indentation, active item in Blueprint Pale bg

## 6. Do's and Don'ts

### Do:

- **Do** use Blueprint and Growth only at node type and primary action moments.
- **Do** use flat surfaces at rest — depth through the three-layer neutral stack and 1px Edge borders.
- **Do** keep Space Grotesk for headings and identity; Inter for everything a user interacts with.
- **Do** handle all interactive states in every component: hover, focus, active, disabled, loading (skeleton), error.
- **Do** write empty states that teach: "Create your first roadmap to get started," not "No roadmaps found."
- **Do** use skeleton loaders for async list views — never a spinner in the center of a content area.
- **Do** use `position: fixed` or `<dialog>` for dropdowns inside `overflow: hidden` containers.
- **Do** include `@media (prefers-reduced-motion: reduce)` for every transition — `transition: none` or instant crossfade.
- **Do** keep Admin Header and GraphToolbar at the same visual height (56px) so the editor feels unified.

### Don't:

- **Don't** use Blueprint or Growth as decorative colors — no section backgrounds, no row highlights for non-semantic purposes.
- **Don't** add `border-left` wider than 1px as a colored accent stripe. Use bg tint or full border instead.
- **Don't** use `background-clip: text` gradient text.
- **Don't** add box-shadow to panels, tables, or sidebar containers at rest.
- **Don't** wrap the Graph Editor page in AdminLayout — it manages its own full-viewport layout.
- **Don't** use Space Grotesk in buttons, table cells, form labels, or body text. The Font Split Rule is structural.
- **Don't** add modal-first dialogs where inline or progressive editing would work — admin users are in a workflow, not browsing.
- **Don't** add decorative motion — no orchestrated entrance animations on page load. Transitions only: modal open/close, skeleton fade, tab switch.
- **Don't** make the admin look like Udemy or a gamified platform. No XP bars, badge grids, or progress celebration UI that distracts from authoring work.
- **Don't** use `999` or `9999` for z-index. Use a semantic scale: dropdown (10) → sticky (20) → modal-backdrop (40) → modal (50) → toast (60) → tooltip (70).
