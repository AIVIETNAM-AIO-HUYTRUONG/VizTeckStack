import { NodeBadge, Button } from '@vizteck/ui';
import { LessonContent } from '../../../../../components/LessonContent';
import { MiniGraph } from '../../../../../components/MiniGraph';
import { fetchNode } from '../../../../../lib/api';

export const revalidate = 0;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Return empty array: build succeeds without live api-gateway.
  // All paths rendered on first request via ISR (Pitfall 6).
  return [];
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  // Next.js 16: params is async — MUST await (Pitfall 1)
  const { slug, id } = await params;

  let node: Awaited<ReturnType<typeof fetchNode>>;
  try {
    node = await fetchNode(id);
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
        Lesson not found.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px 24px 48px',
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        gap: 32,
      }}
    >
      {/* Left: lesson content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 12 }}>
          <NodeBadge type={node.type} />
        </div>
        <h1
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 28,
            color: 'var(--text-1)',
            marginBottom: 16,
          }}
        >
          {node.title}
        </h1>
        <hr
          style={{
            border: 'none',
            borderTop: '1px solid var(--border)',
            marginBottom: 24,
          }}
        />
        {node.type === 'LESSON' ? (
          <LessonContent contentJson={node.content ?? '[]'} />
        ) : (
          <div
            style={{
              color: 'var(--text-3)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
            }}
          >
            This node does not contain lesson content.
          </div>
        )}
      </div>

      {/* Right: 280px sidebar */}
      <aside
        style={{
          width: 280,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Progress card */}
        <div
          style={{
            background: 'var(--bg-1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <h3
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text-1)',
              marginBottom: 12,
            }}
          >
            Progress
          </h3>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              color: 'var(--text-3)',
              marginTop: 8,
            }}
          >
            Progress tracking coming soon.
          </p>
        </div>

        {/* Mini graph card */}
        <div
          style={{
            background: 'var(--bg-1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <h3
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text-1)',
              marginBottom: 12,
            }}
          >
            Roadmap Overview
          </h3>
          <MiniGraph nodes={[]} edges={[]} width={240} height={100} />
        </div>

        {/* Next Lesson CTA */}
        <a href={`/roadmap/${slug}`} style={{ textDecoration: 'none' }}>
          <Button
            variant="primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Back to Roadmap →
          </Button>
        </a>
      </aside>
    </div>
  );
}
