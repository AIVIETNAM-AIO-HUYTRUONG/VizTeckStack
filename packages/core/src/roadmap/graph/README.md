# graph — Sub-feature Graph Canvas

Canvas kéo thả node và edge cho roadmap, xây dựng trên `@xyflow/react`.

## Các file

| File | Vai trò |
|------|---------|
| `types.ts` | `NodeItem`, `EdgeItem`, `EditorNode`, `EditorEdge`, `GraphData`, `RoadmapEntry` |
| `graph.service.ts` | `loadGraph`, `saveGraph`, `normalizeNodeType`, `makeSnapshot` |
| `components/RoadmapGraph.tsx` | Component chính — render React Flow canvas (mode="view"\|"edit") |
| `components/RoadmapNode.tsx` | Custom node renderer với badge, icon, title |
| `hooks/useGraphEditor.ts` | Load/save graph state, dirty tracking, cập nhật roadmap status |
| `hooks/useGraphDraft.ts` | Draft persistence qua `sessionStorage` — khôi phục khi reload |

## Cơ chế quan trọng

**measuredRef cache**: `RoadmapGraph` duy trì `measuredRef` (Map của node id → dimensions) để tồn tại sau khi React Flow's `adoptUserNodes` reset `measured` khi re-render. Không xóa hoặc bypass cache này — sẽ khiến node bị `visibility: hidden`.

**NodeInventory drag payload** có 2 dạng:
- Node hiện có (repositioning): UUID thuần — `"clx123..."`
- Node roadmap mới từ palette: `"newRoadmap:<id>:<slug>:<encodeURIComponent(title)>"` — title cần URL-encode vì có thể chứa dấu hai chấm

## Cách dùng

```ts
import { RoadmapGraph, useGraphEditor } from '@vizteck/core';

// mode="view" cho apps/web, mode="edit" cho apps/admin
<RoadmapGraph roadmapId={id} mode="view" />
```
