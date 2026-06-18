---
phase: 03-public-viewer
plan: "01"
subsystem: packages/ui
tags: [react, components, design-system, typescript]
dependency_graph:
  requires: []
  provides: ["@vizteck/ui", "NodeBadge", "Button", "Card", "NodeType"]
  affects: ["packages/graph", "apps/web"]
tech_stack:
  added: ["react@19", "@types/react@19", "react-dom@19"]
  patterns: ["barrel-export", "inline-styles-design-tokens", "strict-typescript"]
key_files:
  created:
    - packages/ui/package.json
    - packages/ui/tsconfig.json
    - packages/ui/src/index.ts
    - packages/ui/src/NodeBadge.tsx
    - packages/ui/src/Button.tsx
    - packages/ui/src/Card.tsx
  modified: []
decisions:
  - "No build step for packages/ui — main points to ./src/index.ts; apps/web uses transpilePackages to compile at build time (deviation from packages/db which uses ./dist)"
  - "All design tokens applied as inline styles (no Tailwind or CSS modules) — keeps package free of CSS toolchain dependencies"
  - "Button.children comes from React.ButtonHTMLAttributes<HTMLButtonElement> — no explicit children prop needed"
metrics:
  duration: "5m"
  completed: "2026-06-18"
  tasks_completed: 2
  files_created: 6
  files_modified: 0
---

# Phase 03 Plan 01: @vizteck/ui Shared Component Package Summary

**One-liner:** NodeBadge/Button/Card design-system primitives with DEC-03-09 color tokens, exported via barrel from @vizteck/ui workspace package (no build step).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold @vizteck/ui package (config + barrel) | 23cfc43 | packages/ui/package.json, packages/ui/tsconfig.json, packages/ui/src/index.ts |
| 2 | Implement NodeBadge, Button, Card components | 8bdc31e | packages/ui/src/NodeBadge.tsx, packages/ui/src/Button.tsx, packages/ui/src/Card.tsx |

## What Was Built

### @vizteck/ui workspace package

A shared React component package with no separate build step. apps/web and packages/graph will consume this via `transpilePackages` in their Next.js config.

**Package config:**
- `name: @vizteck/ui`, `main: ./src/index.ts`, `types: ./src/index.ts`
- Extends `../../tsconfig.base.json` with `jsx: react-jsx`
- dependencies: react@^19, react-dom@^19

### Components

**NodeBadge** (`packages/ui/src/NodeBadge.tsx`)
- `NodeType = 'ROADMAP' | 'LESSON'`
- ROADMAP: bg `#EEF2FF`, color `#4F46E5`, label "ROADMAP"
- LESSON: bg `#ECFDF5`, color `#059669`, label "LESSON"
- Pill style: JetBrains Mono 9px/700, padding 2px 8px, borderRadius 20, letterSpacing 0.05em

**Button** (`packages/ui/src/Button.tsx`)
- `ButtonVariant = 'primary' | 'secondary' | 'ghost'`
- primary: bg `#4F46E5`, text white
- secondary: bg white, border + text `#4F46E5`
- ghost: transparent bg, text `#475569`
- Extends `React.ButtonHTMLAttributes<HTMLButtonElement>`, forwards `...props` and merges `style`

**Card** (`packages/ui/src/Card.tsx`)
- Props: `type: NodeType`, `title`, `description?`, `miniGraph?: React.ReactNode`, `onClick?`
- bg `#FFFFFF`, border `1px solid #E2E8F0`, borderRadius 16px
- Renders NodeBadge, Space Grotesk title, Inter description, miniGraph slot on `#F1F3F9` background

**Barrel** (`packages/ui/src/index.ts`)
- Exports: `Button`, `ButtonVariant` (type), `ButtonProps` (type), `Card`, `CardProps` (type), `NodeBadge`, `NodeType` (type), `NodeBadgeProps` (type)

## Verification Results

```
pnpm --filter @vizteck/ui exec tsc --noEmit  → exit 0 (strict mode, zero errors)
node -e "require('./packages/ui/package.json').name === '@vizteck/ui'"  → OK
grep NodeBadge packages/ui/src/Card.tsx  → 2 matches (import + usage)
All three components: Button, Card, NodeBadge exported via barrel
No apps/* imports (dependency rule satisfied)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] React types not installed before typecheck**
- **Found during:** Task 2 verification (tsc --noEmit)
- **Issue:** `@types/react` was not installed in the pnpm virtual store because `pnpm install` had not been run after adding packages/ui/package.json
- **Fix:** Ran `pnpm install` at workspace root to add react, react-dom, @types/react, @types/react-dom to the virtual store
- **Files modified:** pnpm-lock.yaml (lock file updated automatically)
- **Commit:** Resolved before Task 2 commit; no separate commit needed

## Known Stubs

None. All three components are fully implemented with proper design tokens and functional props.

## Threat Flags

None. packages/ui is pure presentational React with no network I/O, no env vars, and no secrets.

## Self-Check: PASSED

- [x] packages/ui/package.json exists with name @vizteck/ui
- [x] packages/ui/tsconfig.json exists extending ../../tsconfig.base.json
- [x] packages/ui/src/index.ts exists with all 3 component exports
- [x] packages/ui/src/NodeBadge.tsx exists with ROADMAP/LESSON badge styles
- [x] packages/ui/src/Button.tsx exists with primary/secondary/ghost variants
- [x] packages/ui/src/Card.tsx exists importing NodeBadge
- [x] Commits 23cfc43 and 8bdc31e verified in git log
- [x] TypeScript strict typecheck exits 0
