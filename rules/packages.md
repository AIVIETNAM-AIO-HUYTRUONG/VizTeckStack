# Package Rules

## Dependency direction
- `apps/*` → `packages/*` ✓
- `packages/core` → `packages/graphql-client`, `@xyflow/react`, `packages/ui` ✓
- `packages/graph`, `packages/lesson` → `packages/core` only ✓
- `packages/*` → `apps/*` ✗ never

## Shim packages (graph, lesson)
- `packages/graph` and `packages/lesson` are re-export shims only
- Do NOT add source files to them — all logic goes in `packages/core`

## Core package layout
```
packages/core/src/
  roadmap/
    graph/          ← sub-feature
  lesson/
    content-editor/ ← sub-feature
    page-tree/      ← sub-feature
    search/         ← sub-feature
```
Each feature/sub-feature: `types.ts`, `*.service.ts`, `hooks/`, `components/`, `utils/`
