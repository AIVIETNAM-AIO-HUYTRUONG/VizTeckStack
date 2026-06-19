import { Card } from '@vizteck/ui';
import { fetchRoadmaps } from '../lib/api';

export const revalidate = 3600;

export default async function HomePage() {
  let roadmaps: Awaited<ReturnType<typeof fetchRoadmaps>> = [];
  try {
    roadmaps = await fetchRoadmaps();
  } catch {
    // api-gateway not running at build time — render empty grid
    roadmaps = [];
  }

  return (
    <div className="px-6 py-10">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-display font-bold text-[32px] text-text-1 mb-2">
          Learning Roadmaps
        </h1>
        <p className="font-body text-base text-text-2 mb-10">
          Browse our structured learning paths and start your journey.
        </p>

        {roadmaps.length === 0 ? (
          <div className="text-text-3 text-sm text-center py-16">
            No roadmaps available yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {roadmaps.map((r) => (
              <a key={r.id} href={`/roadmap/${r.slug}`} className="no-underline block">
                {/* miniGraph omitted until /api/roadmaps returns node positions */}
                <Card type="ROADMAP" title={r.title} description={r.description} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
