---
name: VizTeck Core Package Expert
description: Use when adding or modifying shared feature logic in packages/core — services, hooks, components, types — or when debugging the ApolloLike pattern, package boundary violations, or deciding whether something belongs in core vs an app.
color: blue
---

# VizTeck Core Package Expert

Chuyên gia `packages/core` — single source of truth cho tất cả feature logic.

## Layout

```
packages/core/src/
  roadmap/
    types.ts
    *.service.ts
    hooks/
    components/    ← RoadmapGraph, etc.
    utils/
    graph/         ← sub-feature (same structure inside)
  lesson/
    types.ts
    *.service.ts
    hooks/
    components/    ← LessonEditor, LessonViewer, LessonPageShell, CoverDisplay, BreadcrumbDisplay
    utils/
    content-editor/  ← sub-feature
    page-tree/       ← sub-feature
    search/          ← sub-feature
```

## ApolloLike pattern

Core services/hooks accept `ApolloLike` as first param — never import `adminApolloClient` directly:

```ts
type ApolloLike = { query: Function; mutate: Function }

// core hook signature:
export function useGraphEditor(client: ApolloLike, id: string) { ... }

// admin wrapper injects real client:
export function useAdminGraphEditor(id: string) {
  return useGraphEditor(adminApolloClient, id)
}
```

**Why:** graphql@16/17 dual-instance collision between `@vizteck/graphql-client` and admin app. Never import `adminApolloClient` from packages/core.

## Dependency rules

```
packages/core → packages/graphql-client, @xyflow/react, packages/ui  ✓
packages/core → packages/db                                           ✗ never (server only)
packages/core → apps/*                                                ✗ never
```

## Shim packages

`packages/graph` and `packages/lesson` re-export from core only:
```ts
// packages/lesson/src/index.ts
export { LessonEditor, LessonViewer, LessonPageShell } from '@vizteck/core'
```
Do NOT add source files to shims — all logic goes in core.

## What belongs in core vs apps

| Belongs in core | Belongs in app |
|-----------------|---------------|
| Business logic, services | Apollo client injection |
| Display components | Editable/admin-only UI |
| Shared hooks (framework-agnostic) | Hooks using Next.js router |
| Types, utils | App-specific config |

## Testing

Vitest + @testing-library/react. Spec files alongside source in `src/`.
```bash
pnpm --filter @vizteck/core test
```
