import { LessonLayout } from '@/features/lesson/components/LessonLayout';
import { fetchNode } from '@/features/lesson/services/node.service';
import { fetchRoadmap } from '@/features/roadmap/services/roadmap.service';

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

  const [nodeResult, roadmapResult] = await Promise.allSettled([
    fetchNode(id),
    fetchRoadmap(slug),
  ]);

  if (nodeResult.status === 'rejected') {
    return (
      <div className="text-text-3 text-sm text-center py-16">
        Lesson not found.
      </div>
    );
  }

  const roadmapNodes =
    roadmapResult.status === 'fulfilled' ? roadmapResult.value.nodes : [];
  const roadmapEdges =
    roadmapResult.status === 'fulfilled' ? roadmapResult.value.edges : [];

  return (
    <LessonLayout
      slug={slug}
      node={nodeResult.value}
      roadmapNodes={roadmapNodes}
      roadmapEdges={roadmapEdges}
    />
  );
}
