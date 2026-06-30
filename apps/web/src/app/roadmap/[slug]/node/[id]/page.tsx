import { LessonLayout } from '@/features/lesson/components/LessonLayout';
import { fetchNode, fetchRoadmapTree } from '@/lib/gql';

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

  const [nodeResult, treeResult] = await Promise.allSettled([
    fetchNode(id),
    fetchRoadmapTree(slug),
  ]);

  if (nodeResult.status === 'rejected') {
    return (
      <div className="text-text-2 text-sm text-center py-16">
        Lesson not found.
      </div>
    );
  }

  const tree = treeResult.status === 'fulfilled' ? treeResult.value : null;

  return (
    <LessonLayout
      node={nodeResult.value}
      tree={tree}
    />
  );
}
