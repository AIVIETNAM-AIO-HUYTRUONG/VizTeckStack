import { LessonLayout } from '@/features/lesson/components/LessonLayout';
import { fetchNode } from '@/features/lesson/services/node.service';

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

  let node: Awaited<ReturnType<typeof fetchNode>>;
  try {
    node = await fetchNode(id);
  } catch {
    return (
      <div className="text-text-3 text-sm text-center py-16">
        Lesson not found.
      </div>
    );
  }

  return <LessonLayout slug={slug} node={node} />;
}
