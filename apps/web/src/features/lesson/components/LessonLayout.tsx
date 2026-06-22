"use client";

import dynamic from "next/dynamic";
import { NodeBadge, Button } from "@vizteck/ui";
import { MiniGraph } from "./MiniGraph";
import type { NodeItem } from "@/features/lesson/services/node.service";
import type { EdgeItem } from "@/features/roadmap/services/roadmap.service";

const LessonViewer = dynamic(
  () => import("@vizteck/lesson").then((m) => m.LessonViewer),
  {
    ssr: false,
    loading: () => (
      <div className="text-text-3 text-sm py-6">Loading content…</div>
    ),
  },
);

interface LessonLayoutProps {
  slug: string;
  node: NodeItem;
  roadmapNodes: NodeItem[];
  roadmapEdges: EdgeItem[];
}

export function LessonLayout({ slug, node, roadmapNodes, roadmapEdges }: LessonLayoutProps) {
  const miniNodes = roadmapNodes
    .filter((n) => n.positionX != null && n.positionY != null)
    .map((n) => ({ id: n.id, x: n.positionX, y: n.positionY, type: n.type }));

  const miniEdges = roadmapEdges.map((e) => ({
    sourceId: e.sourceId,
    targetId: e.targetId,
  }));

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
        {node.type === "LESSON" ? (
          <LessonViewer contentJson={node.content ?? "[]"} />
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
          <h3 className="font-display font-bold text-sm text-text-1 mb-3">
            Progress
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-bg-2 rounded-full h-1.5">
              <div className="bg-indigo h-1.5 rounded-full w-0" />
            </div>
            <span className="text-[11px] text-text-3 whitespace-nowrap">0%</span>
          </div>
          <span className="inline-block mt-2 text-[11px] text-text-3 bg-bg-2 rounded-full px-2 py-0.5">
            Coming soon
          </span>
        </div>

        {/* Mini graph card */}
        <div className="bg-bg-1 border border-border rounded-lg p-5">
          <h3 className="font-display font-bold text-sm text-text-1 mb-3">
            Roadmap Overview
          </h3>
          <MiniGraph
            nodes={miniNodes}
            edges={miniEdges}
            currentNodeId={node.id}
            width={240}
            height={100}
          />
        </div>

        {/* Back CTA */}
        <a href={`/roadmap/${slug}`} className="no-underline">
          <Button
            variant="primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Back to Roadmap →
          </Button>
        </a>
      </aside>
    </div>
  );
}
