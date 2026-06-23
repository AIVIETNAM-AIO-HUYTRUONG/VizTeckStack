"use client";

import dynamic from "next/dynamic";
import { use } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { useLessonEditor } from "@/features/lessons/hooks/useLessonEditor";
import { useLessonPageShell } from "@/features/lessons/hooks/useLessonPageShell";
import { LessonTitleEditor } from "@/features/lessons/components/LessonTitleEditor";
import { CoverImage } from "@/features/lessons/components/CoverImage";
import { LessonPageShell } from "@vizteck/lesson";

const LessonEditor = dynamic(
  () => import("@vizteck/lesson").then((m) => m.LessonEditor),
  { ssr: false, loading: () => <div className="text-sm text-text-2 py-4">Loading editor…</div> }
);

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  useAuthGuard();
  const { id, nodeId } = use(params);

  const {
    loading,
    notFound,
    lesson,
    titleSaveStatus,
    handleSaveContent,
    handleSaveTitle,
  } = useLessonEditor(nodeId);

  const { cover, icon, setCover, setIcon } = useLessonPageShell(
    nodeId,
    lesson?.coverImage,
    lesson?.icon,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-2 text-sm">
        Loading lesson…
      </div>
    );
  }

  if (notFound || !lesson) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <p className="text-sm text-text-2">Node not found. It may have been deleted.</p>
        <a href="/roadmaps" className="text-sm text-indigo hover:underline mt-2 inline-block">
          ← Back to Roadmaps
        </a>
      </div>
    );
  }

  const shellNode = {
    id: nodeId,
    title: lesson.title,
    coverImage: cover,
    icon,
    content: lesson.content ?? null,
    type: (lesson.type === "ROADMAP" ? "ROADMAP" : "LESSON") as "LESSON" | "ROADMAP",
  };

  return (
    <LessonPageShell
      mode="edit"
      node={shellNode}
      breadcrumb={[]}
      coverSlot={
        <CoverImage
          cover={cover}
          icon={icon}
          breadcrumb={[]}
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
  );
}
