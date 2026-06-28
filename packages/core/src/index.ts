// roadmap
export * from './roadmap/types';
export * from './roadmap/constants';
export * from './roadmap/roadmap.service';
export { useRoadmaps } from './roadmap/useRoadmaps';

// graph — domain
export * from './graph/types';
export * from './graph/graph.service';
export { useGraphEditor } from './graph/useGraphEditor';
export { useGraphDraft } from './graph/useGraphDraft';
// graph — UI (moved from packages/graph)
export { RoadmapGraph } from './graph/ui/RoadmapGraph';
export type { RoadmapGraphProps } from './graph/ui/RoadmapGraph';
export { RoadmapNode } from './graph/ui/RoadmapNode';
// re-export @xyflow/react types previously exposed by packages/graph
export type {
  NodeChange,
  EdgeChange,
  Connection,
  Node as RFNode,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnNodesDelete,
} from '@xyflow/react';
export { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

// lesson (UI components added in Task 6)
export * from './lesson/types';
export * from './lesson/lesson.service';
export { useLessonEditor } from './lesson/useLessonEditor';
export { useLessonPageShell } from './lesson/useLessonPageShell';
export { usePageTree } from './lesson/usePageTree';
