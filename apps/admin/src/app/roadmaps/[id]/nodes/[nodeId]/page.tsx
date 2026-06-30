"use client";

import dynamic from "next/dynamic";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAdminLessonEditor } from "@/features/lessons/content-editor/hooks/useLessonEditor";
import { useAdminLessonPageShell } from "@/features/lessons/hooks/useLessonPageShell";
import { useAdminPageTree } from "@/features/lessons/page-tree/hooks/usePageTree";
import { LessonTitleEditor } from "@/features/lessons/components/LessonTitleEditor";
import { CoverImage } from "@/features/lessons/components/CoverImage";
import { LessonPageShell, LessonPageLayout } from "@vizteck/lesson";
import type { PageTreeNode } from "@vizteck/lesson";

const LessonEditor = dynamic(
  () => import("@vizteck/lesson").then((m) => m.LessonEditor),
  { ssr: false, loading: () => <div className="text-sm text-text-2 py-4">Loading editor…</div> }
);

function LessonPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse">
      <div className="h-48 bg-bg-2 rounded-md mb-6" />
      <div className="h-8 bg-bg-2 rounded w-2/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-bg-2 rounded w-full" />
        <div className="h-4 bg-bg-2 rounded w-5/6" />
        <div className="h-4 bg-bg-2 rounded w-4/6" />
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  useAuthGuard();
  const { id, nodeId } = use(params);
  const router = useRouter();
  const slug = useSearchParams().get('slug');

  const {
    loading,
    notFound,
    lesson,
    titleSaveStatus,
    handleSaveContent,
    handleSaveTitle,
  } = useAdminLessonEditor(nodeId);

  const { cover, icon, setCover, setIcon } = useAdminLessonPageShell(
    nodeId,
    lesson?.coverImage,
    lesson?.icon,
  );

  const tree = useAdminPageTree(nodeId);

  const saveStatusLabel =
    titleSaveStatus === "saving" ? "Saving…" :
    titleSaveStatus === "saved"  ? "Saved"   :
    titleSaveStatus === "error"  ? "Error"   :
    null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin nav bar */}
      <div className="sticky top-0 z-50 h-14 flex items-center gap-3 px-4 bg-bg-1 border-b border-border flex-shrink-0">
        <button
          onClick={() => router.push(`/roadmaps/${id}${slug ? `?slug=${slug}` : ''}`)}
          aria-label="Back to graph editor"
          className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1 focus:outline-none focus:ring-2 focus:ring-indigo rounded-sm px-1 -ml-1 transition-colors motion-reduce:transition-none"
        >
          <BackIcon />
          <span className="hidden sm:inline">Graph</span>
        </button>

        <span className="text-border select-none">·</span>

        <span className="text-sm font-medium text-text-1 truncate min-w-0 flex-1">
          {loading ? (
            <span className="inline-block h-4 w-36 bg-bg-2 rounded animate-pulse" />
          ) : (
            lesson?.title || "Untitled"
          )}
        </span>

        {saveStatusLabel && (
          <span
            className={`flex-shrink-0 text-xs tabular-nums ${
              titleSaveStatus === "error" ? "text-red-500" : "text-text-3"
            }`}
          >
            {saveStatusLabel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {loading ? (
          <LessonPageSkeleton />
        ) : notFound || !lesson ? (
          <div className="max-w-3xl mx-auto px-6 py-6">
            <p className="text-sm text-text-2 mb-3">Node not found. It may have been deleted.</p>
            <button
              onClick={() => router.push("/roadmaps")}
              className="text-sm text-indigo hover:underline focus:outline-none"
            >
              ← Back to Roadmaps
            </button>
          </div>
        ) : (
          <LessonPageLayout
            tree={tree ?? undefined}
            currentNodeId={nodeId}
            getLessonHref={(n: PageTreeNode) => `/roadmaps/${n.roadmapId}/nodes/${n.id}`}
            getRoadmapHref={(n: PageTreeNode) =>
              n.targetRoadmapId ? `/roadmaps/${n.targetRoadmapId}` : undefined
            }
          >
            <LessonPageShell
              mode="edit"
              node={{
                id: nodeId,
                title: lesson.title,
                coverImage: cover,
                icon,
                content: lesson.content ?? null,
                type: (lesson.type === "ROADMAP" ? "ROADMAP" : "LESSON") as "LESSON" | "ROADMAP",
              }}
              coverSlot={
                <CoverImage
                  cover={cover}
                  icon={icon}
                  onCoverChange={setCover}
                  onIconChange={setIcon}
                />
              }
              titleSlot={
                <LessonTitleEditor
                  title={lesson.title}
                  saveStatus={titleSaveStatus}
                  onSave={handleSaveTitle}
                />
              }
              contentSlot={
                <LessonEditor
                  initialContentJson={lesson.content ?? ""}
                  onSave={handleSaveContent}
                />
              }
            />
          </LessonPageLayout>
        )}
      </div>
    </div>
  );
}
