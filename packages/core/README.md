# packages/core — @vizteck/core

Nguồn sự thật duy nhất cho toàn bộ logic nghiệp vụ của VizTeckStack. Apps và shim packages đều import từ đây.

## Nguyên tắc thiết kế

**Feature-first + Sub-feature nesting**: Mỗi feature có `types.ts`, `*.service.ts`, `components/`, `hooks/`, `utils/`. Sub-feature là folder lồng nhau theo cùng pattern.

**Dependency Inversion (ApolloLike pattern)**: Tất cả service và hook nhận `ApolloLike` (`{ query, mutate }`) làm tham số đầu tiên. Không bao giờ import singleton Apollo client. Apps inject client qua thin wrapper hooks. Mục đích: tránh xung đột `graphql@16/17` giữa `@vizteck/graphql-client` và admin app.

## Cấu trúc

```
src/
  roadmap/                  — Feature: roadmap
    types.ts
    roadmap.service.ts
    hooks/
      useRoadmaps.ts
    utils/
      constants.ts
    graph/                  — Sub_feature: graph canvas

  lesson/                   — Feature: bài học (chỉ logic layout ở root)
    types.ts
    lesson.service.ts
    components/             — Layout: LessonPageShell, LessonPageLayout, BreadcrumbDisplay, CoverDisplay
    hooks/
      useLessonPageShell.ts
    utils/
      utils.ts
    content-editor/         — Sub_feature: soạn thảo nội dung
    page-tree/              — Sub_feature: cây trang
    search/                 — Sub_feature: tìm kiếm

  index.ts                  — Barrel export công khai
```

## Public API

`src/index.ts` là điểm import duy nhất từ bên ngoài. Path nội bộ có thể thay đổi khi refactor — symbols trong `index.ts` thì không bao giờ thay đổi.

```ts
import {
  RoadmapGraph, useGraphEditor, useGraphDraft,
  LessonEditor, LessonViewer, LessonPageShell,
  usePageTree, useSearch, useSearchModal,
} from '@vizteck/core';
```

## Chạy tests

```bash
pnpm --filter @vizteck/core build
# Tests nằm trong packages/core/src/ dưới dạng *.spec.tsx
```
