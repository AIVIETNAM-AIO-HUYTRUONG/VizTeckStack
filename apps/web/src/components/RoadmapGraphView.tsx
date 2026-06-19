'use client';

import { useRouter } from 'next/navigation';
import { RoadmapGraph } from '@vizteck/graph';
import type { NodeItem } from '@vizteck/graph';
import { Breadcrumb } from './Breadcrumb';
import type { RoadmapDetail } from '../lib/api';

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
    } else if (node.type === 'ROADMAP' && node.targetRoadmapId) {
      // Mitigates T-03-02 open redirect: only navigate to internal /roadmap/ path
      router.push(`/roadmap/${node.targetRoadmapId}`);
    }
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Breadcrumb items={breadcrumbItems} />
      <div style={{ height: '70vh', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
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
