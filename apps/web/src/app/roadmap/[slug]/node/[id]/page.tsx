import { LessonLayout } from '@/features/lesson/components/LessonLayout';
import { fetchNode, fetchBreadcrumb } from '@/features/lesson/services/node.service';

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
  const { id } = await params;

  const [nodeResult, breadcrumbResult] = await Promise.allSettled([
    fetchNode(id),
    fetchBreadcrumb(id),
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

  return (
    <LessonLayout
      node={nodeResult.value}
      breadcrumb={breadcrumb}
    />
  );
}
