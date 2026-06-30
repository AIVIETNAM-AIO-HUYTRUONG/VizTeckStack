// roadmap
export * from './roadmap/types';
export * from './roadmap/utils/constants';
export * from './roadmap/roadmap.service';
export { useRoadmaps } from './roadmap/hooks/useRoadmaps';

// graph — domain
export * from './roadmap/graph/types';
export * from './roadmap/graph/graph.service';
export { useGraphEditor } from './roadmap/graph/hooks/useGraphEditor';
export { useGraphDraft } from './roadmap/graph/hooks/useGraphDraft';
// graph — UI (moved from packages/graph)
export { RoadmapGraph } from './roadmap/graph/components/RoadmapGraph';
export type { RoadmapGraphProps } from './roadmap/graph/components/RoadmapGraph';
export { RoadmapNode } from './roadmap/graph/components/RoadmapNode';
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

// lesson — domain
export * from './lesson/types';
export * from './lesson/lesson.service';
export { useLessonEditor } from './lesson/useLessonEditor';
export { useLessonPageShell } from './lesson/useLessonPageShell';
export { usePageTree } from './lesson/usePageTree';
// lesson — UI (moved from packages/lesson)
export { LessonEditor } from './lesson/ui/LessonEditor';
export type { LessonEditorProps } from './lesson/ui/LessonEditor';
export { LessonViewer } from './lesson/ui/LessonViewer';
export type { LessonViewerProps } from './lesson/ui/LessonViewer';
export { LessonPageShell } from './lesson/ui/LessonPageShell';
export type { LessonPageShellProps } from './lesson/ui/LessonPageShell';
export { LessonPageLayout } from './lesson/ui/LessonPageLayout';
export type { LessonPageLayoutProps } from './lesson/ui/LessonPageLayout';
export { CoverDisplay } from './lesson/ui/CoverDisplay';
export type { CoverDisplayProps } from './lesson/ui/CoverDisplay';
export { BreadcrumbDisplay } from './lesson/ui/BreadcrumbDisplay';
export type { BreadcrumbDisplayProps } from './lesson/ui/BreadcrumbDisplay';
export { PageTreeSidebar } from './lesson/ui/PageTreeSidebar';
export type { PageTreeSidebarProps } from './lesson/ui/PageTreeSidebar';
export { PageTreeItem } from './lesson/ui/PageTreeItem';
export type { PageTreeItemProps } from './lesson/ui/PageTreeItem';
export { SearchModal } from './lesson/ui/SearchModal';
export type { SearchModalProps } from './lesson/ui/SearchModal';
export { useSearchModal } from './lesson/ui/useSearchModal';
export { useSearch } from './lesson/ui/useSearch';
export type { TimeGroup } from './lesson/ui/useSearch';
