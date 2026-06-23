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
  type: "LESSON" | "ROADMAP";
}
