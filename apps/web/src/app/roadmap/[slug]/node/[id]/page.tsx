import { LessonLayout } from '@/features/lesson/components/LessonLayout';
import { fetchNode, fetchBreadcrumb } from '@/features/lesson/services/node.service';
import { fetchRoadmapTree } from '@/features/lesson/services/tree.service';

export const revalidate = 0;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const [nodeResult, breadcrumbResult, treeResult] = await Promise.allSettled([
    fetchNode(id),
    fetchBreadcrumb(id),
    fetchRoadmapTree(slug),
  ]);

  if (nodeResult.status === 'rejected') {
    return (
      <div className="text-text-3 text-sm text-center py-16">
        Lesson not found.
      </div>
    );
  }

  const breadcrumb =
    breadcrumbResult.status === 'fulfilled' ? breadcrumbResult.value : [];
  const tree =
    treeResult.status === 'fulfilled' ? treeResult.value : null;

  return (
    <LessonLayout
      node={nodeResult.value}
      breadcrumb={breadcrumb}
      tree={tree}
    />
  );
}
