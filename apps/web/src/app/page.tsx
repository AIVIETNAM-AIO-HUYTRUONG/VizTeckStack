import { Card } from '@vizteck/ui';
import { fetchRoadmaps } from '@/lib/gql';

export const revalidate = 0;

export default async function HomePage() {
  let roadmaps: Awaited<ReturnType<typeof fetchRoadmaps>> = [];
  try {
    roadmaps = await fetchRoadmaps();
  } catch {
    roadmaps = [];
  }

  return (
    <div className="px-6 py-10">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-display font-bold text-[32px] text-text-1 mb-2" style={{ textWrap: 'balance' }}>
          Learning Roadmaps
        </h1>
        <p className="font-body text-base text-text-2 mb-10" style={{ textWrap: 'pretty' }}>
          Browse our structured learning paths and start your journey.
        </p>

        {roadmaps.length === 0 ? (
          <div className="text-text-2 text-sm text-center py-16">
            No roadmaps available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((r) => (
              <a key={r.id} href={`/roadmap/${r.slug}`} className="no-underline block group">
                <Card type="ROADMAP" title={r.title} description={r.description} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
