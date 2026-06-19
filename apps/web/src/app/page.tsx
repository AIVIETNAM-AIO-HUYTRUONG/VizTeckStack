import { Card } from '@vizteck/ui';
import { MiniGraph } from '../components/MiniGraph';
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
    <div style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 32,
            color: 'var(--text-1)',
            marginBottom: 8,
          }}
        >
          Learning Roadmaps
        </h1>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            color: 'var(--text-2)',
            marginBottom: 40,
          }}
        >
          Browse our structured learning paths and start your journey.
        </p>

        {roadmaps.length === 0 ? (
          <div
            style={{
              color: 'var(--text-3)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              textAlign: 'center',
              padding: '64px 0',
            }}
          >
            No roadmaps available yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
            }}
          >
            {roadmaps.map((r) => (
              <a
                key={r.id}
                href={`/roadmap/${r.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <Card
                  type="ROADMAP"
                  title={r.title}
                  description={r.description}
                  miniGraph={
                    <MiniGraph nodes={[]} edges={[]} width={200} height={80} />
                  }
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
