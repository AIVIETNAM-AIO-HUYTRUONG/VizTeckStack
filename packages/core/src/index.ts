// auth
export * from './auth/types';

// user-management
export * from './user-management/types';
export * from './user-management/user.service';
export { useUsers } from './user-management/hooks/useUsers';

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
export { useLessonEditor } from './lesson/content-editor/hooks/useLessonEditor';
export { useLessonPageShell } from './lesson/hooks/useLessonPageShell';
export { usePageTree } from './lesson/page-tree/hooks/usePageTree';
// lesson — UI (moved from packages/lesson)
export { LessonEditor } from './lesson/content-editor/components/LessonEditor';
export { TocBlock, lessonSchema } from './lesson/content-editor/blocks/TocBlock';
export type { LessonSchema } from './lesson/content-editor/blocks/TocBlock';
export type { LessonEditorProps } from './lesson/content-editor/components/LessonEditor';
export { LessonViewer } from './lesson/content-editor/components/LessonViewer';
export type { LessonViewerProps } from './lesson/content-editor/components/LessonViewer';
export { LessonPageShell } from './lesson/components/LessonPageShell';
export type { LessonPageShellProps } from './lesson/components/LessonPageShell';
export { LessonPageLayout } from './lesson/components/LessonPageLayout';
export type { LessonPageLayoutProps } from './lesson/components/LessonPageLayout';
export { CoverDisplay } from './lesson/components/CoverDisplay';
export type { CoverDisplayProps } from './lesson/components/CoverDisplay';
export { BreadcrumbDisplay } from './lesson/components/BreadcrumbDisplay';
export type { BreadcrumbDisplayProps } from './lesson/components/BreadcrumbDisplay';
export { PageTreeSidebar } from './lesson/page-tree/components/PageTreeSidebar';
export type { PageTreeSidebarProps } from './lesson/page-tree/components/PageTreeSidebar';
export { PageTreeItem } from './lesson/page-tree/components/PageTreeItem';
export type { PageTreeItemProps } from './lesson/page-tree/components/PageTreeItem';
export { SearchModal } from './lesson/search/components/SearchModal';
export type { SearchModalProps } from './lesson/search/components/SearchModal';
export { useSearchModal } from './lesson/search/hooks/useSearchModal';
export { useSearch } from './lesson/search/hooks/useSearch';
export type { TimeGroup } from './lesson/search/hooks/useSearch';
