import { notFound } from 'next/navigation';
import { RoadmapGraphView } from '@/features/roadmap/components/RoadmapGraphView';
import { fetchRoadmap } from '@/features/roadmap/services/roadmap.service';

export const revalidate = 0;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let detail: Awaited<ReturnType<typeof fetchRoadmap>>;
  try {
    detail = await fetchRoadmap(slug);
  } catch {
    notFound();
  }

  if (!detail.roadmap || detail.roadmap.status !== 'PUBLIC') {
    notFound();
  }

  return <RoadmapGraphView detail={detail} slug={slug} />;
}
