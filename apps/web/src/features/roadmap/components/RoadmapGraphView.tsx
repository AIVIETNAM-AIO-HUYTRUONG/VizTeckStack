'use client';

import { useRouter } from 'next/navigation';
import { RoadmapGraph } from '@vizteck/core';
import type { NodeItem } from '@vizteck/core';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { RoadmapDetail } from '@/lib/gql';

interface RoadmapGraphViewProps {
  detail: RoadmapDetail;
  slug: string;
}

export function RoadmapGraphView({ detail, slug }: RoadmapGraphViewProps) {
  const router = useRouter();

  const breadcrumbItems = [
    { label: 'Home', href: '/', state: 'visited' as const },
    { label: detail.roadmap?.title ?? slug, href: `/roadmap/${slug}`, state: 'active' as const },
  ];

  const handleNodeClick = (node: NodeItem) => {
    if (node.type === 'LESSON') {
      router.push(`/roadmap/${slug}/node/${node.id}`);
    } else if (node.type === 'ROADMAP' && (node.targetRoadmapSlug ?? node.targetRoadmapId)) {
      router.push(`/roadmap/${node.targetRoadmapSlug ?? node.targetRoadmapId}`);
    }
  };

  const lessonCount = detail.nodes.filter((n) => n.type === 'LESSON').length;

  return (
    <div className="px-4 sm:px-6 pt-6 pb-6">
      <Breadcrumb items={breadcrumbItems} />
      <h1
        className={`font-display font-bold text-[32px] text-text-1 tracking-tight leading-[1.1] mt-4 [overflow-wrap:break-word] ${detail.roadmap?.description || lessonCount > 0 ? 'mb-3' : 'mb-5'}`}
        style={{ textWrap: 'balance' }}
      >
        {detail.roadmap?.title}
      </h1>
      {(detail.roadmap?.description || lessonCount > 0) && (
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {detail.roadmap?.description && (
            <p className="font-body text-sm text-text-2 max-w-[560px] m-0 leading-relaxed">
              {detail.roadmap.description}
            </p>
          )}
          {lessonCount > 0 && (
            <span className="flex-shrink-0 font-mono text-[10px] font-semibold text-text-2 bg-bg-2 border border-border rounded-full px-2.5 py-0.5 uppercase tracking-wider">
              {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
      <div className="h-[55vh] sm:h-[70vh] w-full rounded-lg overflow-hidden border border-border" role="region" aria-label="Roadmap graph">
        <RoadmapGraph
          nodes={detail.nodes}
          edges={detail.edges}
          mode="view"
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
}
