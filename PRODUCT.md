# Product

## Register

product

## Users

Two distinct groups who share the same underlying content:

**Educators / content authors** (admin, port 3002): Build and publish structured technology learning roadmaps. They author graph-based roadmaps on a visual canvas and write Notion-style lesson pages. Their primary context is focused creation work — like using Figma or Notion. They need a tool that disappears and lets them think about content, not interface.

**Developers / learners** (web, port 3001): Self-directed learners following visual roadmaps to level up their technical skills. They navigate node graphs, read lesson pages, and track their own progression. Their context is focused study — they're in a learning mindset, not browsing mode.

## Product Purpose

VizTeckStack is an EdTech platform for creating, publishing, and consuming visual technology learning roadmaps. It replaces flat course catalogs with interactive graph-based paths that show how topics relate. The admin gives educators a graph canvas + structured lesson editor. The public viewer gives learners a clear, navigable path through technical knowledge.

Success looks like: an educator can build a complete roadmap in a session without fighting the UI; a learner can open any lesson and immediately understand where they are and where they're going.

## Brand Personality

Clear · Structured · Sharp

Voice: precise and confident, not hushed or performatively humble. Explains itself through structure, not prose. Technical — comfortable in a world where users know what a dependency graph is. Calm guidance over excitement; learners are in a focused state, not a shopping state.

## Anti-references

- **Udemy / Coursera**: bloated, sales-heavy eLearning aesthetic — countdown timers, star ratings everywhere, course-catalog clutter, promotional banner stacking. VizTeckStack is a precision learning tool, not a marketplace.
- **Generic SaaS with gradient text and hero metric tiles**: the standard B2B playbook (navy sidebar, gradient CTAs, floating stat cards). Design here serves the craft of learning, not conversion optimization.
- **Over-gamified learning apps**: XP bars, achievement badges foregrounded in the UI, confetti animations. Learners are adults in technical domains; treat them accordingly.

## Design Principles

1. **Structure is the product.** The graph canvas and lesson hierarchy are not decorative — they are the core UI affordance. Make relationships visible, navigation obvious, and position clear at all times.
2. **The tool disappears into the task.** Consistent vocabulary, predictable behavior, no invented affordances. Admin should feel as fluid as Notion. Viewer should feel as clear as a well-made textbook.
3. **Precision earns trust.** Every state — hover, focus, loading, error, empty — is handled. Missing states break the mental model; complete states build it.
4. **Warmth through restraint.** Calm, focused palette with accent used only for action and state — not decoration. Clarity creates warmth here, not color saturation.
5. **Visual thinking over verbal description.** Show structure spatially. Node relationships, breadcrumbs, page trees, and graph layouts should make the information architecture intuitive without explanation.

## Accessibility & Inclusion

Target: WCAG AA minimum across both surfaces.
- 4.5:1 contrast for body text, 3:1 for large text and interactive elements
- Full keyboard navigation for all interactive surfaces (graph canvas toolbar, modals, lesson editor)
- Semantic HTML and ARIA labels throughout
- Dark mode implemented (already in place)
- Reduced motion: all animations must degrade gracefully with `prefers-reduced-motion: reduce`
- Touch targets: minimum 44px for all interactive elements
