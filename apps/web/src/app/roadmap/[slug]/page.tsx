import { notFound } from 'next/navigation';
import { RoadmapGraphView } from '../../../components/RoadmapGraphView';
import { fetchRoadmap } from '../../../lib/api';

export const revalidate = 0;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Return empty array: build succeeds without live api-gateway.
  // All paths rendered on first request via ISR (Pitfall 6).
  return [];
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next.js 16: params is async — MUST await (Pitfall 1)
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
