import { NodeBadge, Button } from '@vizteck/ui';
import { LessonContent } from './LessonContent';
import { MiniGraph } from './MiniGraph';
import type { NodeItem } from '@/features/lesson/services/node.service';

interface LessonLayoutProps {
  slug: string;
  node: NodeItem;
}

export function LessonLayout({ slug, node }: LessonLayoutProps) {
  return (
    <div className="px-6 pb-12 pt-6 max-w-[1200px] mx-auto flex gap-8">
      {/* Left: lesson content */}
      <div className="flex-1 min-w-0">
        <div className="mb-3">
          <NodeBadge type={node.type} />
        </div>
        <h1 className="font-display font-bold text-[28px] text-text-1 mb-4">
          {node.title}
        </h1>
        <hr className="border-0 border-t border-border mb-6" />
        {node.type === 'LESSON' ? (
          <LessonContent contentJson={node.content ?? '[]'} />
        ) : (
          <p className="text-text-3 text-sm">
            This node does not contain lesson content.
          </p>
        )}
      </div>

      {/* Right: 280px sidebar */}
      <aside className="w-[280px] shrink-0 flex flex-col gap-4">
        {/* Progress card */}
        <div className="bg-bg-1 border border-border rounded-lg p-5">
          <h3 className="font-display font-bold text-sm text-text-1 mb-3">Progress</h3>
          <p className="text-[12px] text-text-3 mt-2">Progress tracking coming soon.</p>
        </div>

        {/* Mini graph card */}
        <div className="bg-bg-1 border border-border rounded-lg p-5">
          <h3 className="font-display font-bold text-sm text-text-1 mb-3">Roadmap Overview</h3>
          <MiniGraph nodes={[]} edges={[]} width={240} height={100} />
        </div>

        {/* Back CTA */}
        <a href={`/roadmap/${slug}`} className="no-underline">
          <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
            Back to Roadmap →
          </Button>
        </a>
      </aside>
    </div>
  );
}
