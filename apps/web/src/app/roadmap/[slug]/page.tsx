import { RoadmapGraphView } from '../../../components/RoadmapGraphView';
import { fetchRoadmap } from '../../../lib/api';

export const revalidate = 3600;
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
    return (
      <div
        style={{
          padding: 40,
          color: 'var(--text-3)',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
        }}
      >
        Roadmap not found.
      </div>
    );
  }

  return <RoadmapGraphView detail={detail} slug={slug} />;
}
