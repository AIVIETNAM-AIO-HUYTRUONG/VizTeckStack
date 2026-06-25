'use client';

import { useRouter } from 'next/navigation';
import { RoadmapGraph } from '@vizteck/graph';
import type { NodeItem } from '@vizteck/graph';
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

  return (
    <div className="px-6 pb-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="h-[70vh] w-full rounded-lg overflow-hidden">
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
