'use client';

import dynamic from 'next/dynamic';
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';

// ---------------------------------------------------------------------------
// Types — shapes returned by the REST API
// ---------------------------------------------------------------------------

interface ApiNode {
  id: string;
  roadmapId: string;
  type: string | number;  // proto3: numeric on wire (0/1), string in REST
  title: string;
  positionX?: number | null;
  positionY?: number | null;
  targetRoadmapId?: string;
  content?: string;
}

interface ApiEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

interface NodeInput {
  id: string;
  type: 'ROADMAP' | 'LESSON';
  title: string;
  positionX?: number;
  positionY?: number;
  targetRoadmapId?: string;
  content?: string;
}

interface EdgeInput {
  sourceId: string;
  targetId: string;
  label?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeNodeType(type: unknown): 'ROADMAP' | 'LESSON' {
  if (type === 0 || type === 'ROADMAP') return 'ROADMAP';
  return 'LESSON';
}

// ---------------------------------------------------------------------------
// Dynamic import — BlockNote is browser-only; ssr:false required
// ---------------------------------------------------------------------------
const LessonEditor = dynamic(
  () => import('@/components/LessonEditor').then((m) => m.LessonEditor),
  { ssr: false, loading: () => <div className="text-sm text-text-2 py-4">Loading editor…</div> },
);

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  useAuthGuard();

  // params is a Promise in Next.js 16 — await with React.use()
  const { id, nodeId } = use(params);
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Full graph data — kept in state because UpsertGraph is full-replace
  const [allNodes, setAllNodes] = useState<ApiNode[]>([]);
  const [allEdges, setAllEdges] = useState<ApiEdge[]>([]);

  // Target node (lesson being edited)
  const [targetNode, setTargetNode] = useState<ApiNode | null>(null);
  const [roadmapTitle, setRoadmapTitle] = useState('');

  // ---------------------------------------------------------------------------
  // Load: fetch full graph + target node detail in parallel
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        const [graphRes, nodeRes] = await Promise.all([
          apiFetch(`/api/roadmaps/${slug}`),
          apiFetch(`/api/nodes/${nodeId}`),
        ]);

        if (cancelled) return;

        if (!graphRes.ok || !nodeRes.ok) {
          setNotFound(true);
          return;
        }

        const graphData = await graphRes.json() as {
          roadmap: { title: string };
          nodes?: ApiNode[];
          edges?: ApiEdge[];
        };
        const nodeData = await nodeRes.json() as {
          node?: ApiNode;
        };

        if (cancelled) return;

        const nodes = graphData.nodes ?? [];
        const edges = graphData.edges ?? [];

        setRoadmapTitle(graphData.roadmap?.title ?? '');
        setAllNodes(nodes);
        setAllEdges(edges);

        // Find the target node within the full graph; fallback to node detail
        const found =
          nodes.find((n) => n.id === nodeId) ?? nodeData.node ?? null;

        if (!found) {
          setNotFound(true);
          return;
        }

        // Use content from nodeData.node (most up-to-date detail endpoint)
        setTargetNode({
          ...found,
          content: nodeData.node?.content ?? found.content,
        });
      } catch {
        setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, nodeId]);

  // ---------------------------------------------------------------------------
  // handleSave — merge updated content into the full graph and call UpsertGraph
  //
  // CRITICAL (Pitfall 1): UpsertGraph is a full-replace DELETE+INSERT.
  // We MUST send ALL nodes and ALL edges — sending only the updated node
  // would delete all siblings.
  // ---------------------------------------------------------------------------
  const handleSave = useCallback(
    async (contentJson: string) => {
      // Build full node list, replacing only the target node's content
      const nodes: NodeInput[] = allNodes.map((n) => ({
        id: n.id,
        type: normalizeNodeType(n.type),
        title: n.title,
        ...(n.positionX != null ? { positionX: n.positionX } : {}),
        ...(n.positionY != null ? { positionY: n.positionY } : {}),
        ...(n.targetRoadmapId ? { targetRoadmapId: n.targetRoadmapId } : {}),
        // Replace content only for the node being edited; keep others unchanged
        content: n.id === nodeId ? contentJson : n.content,
      }));

      const edges: EdgeInput[] = allEdges.map((e) => ({
        sourceId: e.sourceId,
        targetId: e.targetId,
        ...(e.label ? { label: e.label } : {}),
      }));

      const res = await apiFetch(`/api/roadmaps/${id}/graph`, {
        method: 'POST',
        body: JSON.stringify({ nodes, edges }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Save failed (${res.status}): ${text}`);
      }

      // Update local allNodes state with new content so subsequent saves are consistent
      setAllNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, content: contentJson } : n)),
      );
    },
    [allNodes, allEdges, id, nodeId],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-2 text-sm">
        Loading lesson…
      </div>
    );
  }

  if (notFound || !targetNode) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <p className="text-sm text-text-2">
          Node not found. It may have been deleted.
        </p>
        <Link href="/roadmaps" className="text-sm text-indigo hover:underline mt-2 inline-block">
          ← Back to Roadmaps
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-text-3 mb-4">
        <Link href="/roadmaps" className="hover:text-indigo transition-colors">
          ← Roadmaps
        </Link>
        <span>/</span>
        <Link
          href={`/roadmaps/${id}?slug=${slug}`}
          className="hover:text-indigo transition-colors"
        >
          {roadmapTitle}
        </Link>
        <span>/</span>
        <span className="text-text-1">{targetNode.title}</span>
      </nav>

      {/* Page heading */}
      <h1 className="text-xl font-semibold text-text-1 mb-4">
        {targetNode.title}
      </h1>

      {/* Lesson editor — loaded client-side only via dynamic import */}
      <LessonEditor
        initialContentJson={targetNode.content ?? ''}
        onSave={handleSave}
      />
    </div>
  );
}
