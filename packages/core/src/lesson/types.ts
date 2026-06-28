// packages/core/src/lesson/types.ts
// Note: BreadcrumbItem, LessonShellNode, PageTreeNode, PageTree are temporarily
// imported from @vizteck/lesson. Task 6 will inline them here.
export type { BreadcrumbItem, LessonShellNode, PageTreeNode, PageTree } from '@vizteck/lesson';

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
