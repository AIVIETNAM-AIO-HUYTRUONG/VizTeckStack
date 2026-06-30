import { Card } from '@vizteck/ui';
import { fetchRoadmaps } from '@/lib/gql';

export const revalidate = 0;

function MiniGraph() {
  return (
    <svg
      width="200"
      height="160"
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="100" y1="18" x2="60" y2="75" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <line x1="100" y1="18" x2="150" y2="75" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <line x1="60" y1="75" x2="30" y2="140" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <line x1="60" y1="75" x2="90" y2="140" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <line x1="150" y1="75" x2="155" y2="140" stroke="#4F46E5" strokeOpacity="0.2" strokeWidth="1.5" />
      <circle cx="100" cy="18" r="9" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="60" cy="75" r="9" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="150" cy="75" r="9" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="30" cy="140" r="9" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="90" cy="140" r="9" fill="#4F46E5" fillOpacity="0.22" stroke="#4F46E5" strokeOpacity="0.7" strokeWidth="2" />
      <circle cx="155" cy="140" r="9" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeOpacity="0.35" strokeWidth="1.5" />
    </svg>
  );
}

export default async function HomePage() {
  let roadmaps: Awaited<ReturnType<typeof fetchRoadmaps>> = [];
  try {
    roadmaps = await fetchRoadmaps();
  } catch {
    roadmaps = [];
  }

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-16 flex flex-col lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1 min-w-0">
            <h1
              className="font-display font-bold text-[32px] text-text-1 tracking-tight leading-[1.1] mb-4"
                style={{ textWrap: 'balance' }}
            >
              Navigate your technical journey.
            </h1>
            <p
              className="font-body text-base text-text-2 max-w-[480px] leading-relaxed mb-6"
                style={{ textWrap: 'pretty' }}
            >
              Graph-based roadmaps that show how technical topics relate — structured paths you can follow at your own pace.
            </p>
            <span className="inline-flex items-center gap-2 text-sm text-text-2">
              Press{' '}
              <kbd className="font-mono text-xs bg-bg-2 border border-border rounded px-1.5 py-0.5 text-text-2 leading-none">
                ⌘K
              </kbd>
              {' '}to search
            </span>
          </div>

          <div className="hidden lg:flex flex-shrink-0 items-center justify-center mt-10 lg:mt-0">
            <MiniGraph />
          </div>
        </div>
      </section>

      {/* Roadmaps */}
      <section className="max-w-[1200px] mx-auto px-6 pt-10 pb-16">
        {roadmaps.length === 0 ? (
          <p className="text-text-2 text-sm text-center py-16">
            No roadmaps available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((r) => (
              <a key={r.id} href={`/roadmap/${r.slug}`} className="no-underline block group">
                <Card type="ROADMAP" title={r.title} description={r.description} />
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
