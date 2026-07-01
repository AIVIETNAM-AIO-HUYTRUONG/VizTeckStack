---
name: vizteck:debug-canvas
description: Use when debugging React Flow canvas issues — invisible nodes, position not saving, drag/drop broken, nodes going visibility:hidden, or measuredRef cache problems in RoadmapGraph.
user-invocable: true
---

# Debug Canvas Workflow

Checklist theo thứ tự — dừng khi tìm thấy root cause.

## Symptom: Nodes bị `visibility: hidden`

**Root cause gần như chắc chắn:** `measuredRef` cache bị xóa hoặc bypass.

```
RoadmapGraph → measuredRef (Map<nodeId, dimensions>)
```

React Flow's `adoptUserNodes` reset `measured` sau mỗi re-render. `measuredRef` là workaround.

Kiểm tra:
1. `measuredRef` còn tồn tại trong `RoadmapGraph`?
2. Code nào gần đây xóa hoặc reset map này?
3. `onNodesChange` có đang overwrite node `measured` property không?

## Symptom: Node drop không hoạt động

Kiểm tra drag payload format trong `handleDropNode`:
```ts
// Case 1: existing node reposition
"clx123..."   ← bare UUID

// Case 2: new roadmap node from palette
"newRoadmap:<id>:<slug>:<encodeURIComponent(title)>"

// Parse title đúng cách (title có thể chứa colon)
const parts = payload.split(':')
const title = decodeURIComponent(parts.slice(3).join(':'))
```

Trap thường gặp: `parts[3]` bị cắt khi title có dấu `:`.

## Symptom: Position không save

1. Kiểm tra `Node.positionX/Y` — `null` là off-canvas, không phải bug
2. `POST /api/roadmaps/:id/graph` có đang bị gọi đúng không?
3. UpsertGraph là DELETE+INSERT — tất cả nodes phải có trong payload, không chỉ node vừa move

## Symptom: Graph editor page bị wrap trong AdminLayout

`apps/admin/src/app/roadmaps/[id]/page.tsx` phải standalone:
- Không import `AdminLayout`
- Layout riêng với `height: 100vh`
- `ThemeToggle` nằm trong `GraphToolbar`, không phải layout

## Symptom: Nested setState gây duplicate

```ts
// SAI — Strict Mode gọi outer updater 2 lần
setNodes(prev => {
  setEdges(prev2 => ...)  // ← nested
  return ...
})

// ĐÚNG — derive trước, set sau
const newEdges = computeEdges(nodes)
setNodes(newNodes)
setEdges(newEdges)
```

## Debug tools

```bash
# Xem network calls đến graph endpoint
# DevTools → Network → filter "graph"

# Kiểm tra node data từ API
curl http://localhost:3000/api/roadmaps/<slug> | jq '.nodes[] | {id, positionX, positionY}'
```
