// packages/core/src/lesson/types.ts
// Types previously in packages/lesson/src/types.ts, now the single source of truth.

export interface BreadcrumbItem {
  title: string;
  slug: string | null;
  nodeId: string | null;
}

export interface LessonShellNode {
  id: string;
  title: string;
  coverImage: string | null;
  icon: string | null;
  content: string | null;
  type: 'LESSON' | 'ROADMAP';
}

export interface PageTreeNode {
  id: string;
  title: string;
  type: 'LESSON' | 'ROADMAP';
  slug?: string;            // ROADMAP: targetRoadmap slug (web: /roadmap/[slug])
  targetRoadmapId?: string; // ROADMAP: targetRoadmap UUID (admin: /roadmaps/[id])
  roadmapSlug?: string;     // LESSON: parent roadmap slug (web: /roadmap/[slug]/node/[id])
  roadmapId?: string;       // LESSON: parent roadmap UUID (admin: /roadmaps/[id]/nodes/[nodeId])
  children?: PageTreeNode[];
}

export interface PageTree {
  rootSlug: string;
  rootTitle: string;
  nodes: PageTreeNode[];
}

export interface LessonNode {
  id: string;
  roadmapId: string;
  type: string;
  title: string;
  content?: string;
  coverImage?: string | null;
  icon?: string | null;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseLessonEditorResult {
  loading: boolean;
  notFound: boolean;
  lesson: LessonNode | null;
  titleSaveStatus: SaveStatus;
  handleSaveContent: (contentJson: string) => Promise<void>;
  handleSaveTitle: (title: string) => Promise<void>;
}
