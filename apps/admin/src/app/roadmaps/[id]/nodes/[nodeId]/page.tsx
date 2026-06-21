'use client';

import dynamic from 'next/dynamic';
import { use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useLessonEditor } from '@/features/lessons/hooks/useLessonEditor';
import { LessonTitleEditor } from '@/features/lessons/components/LessonTitleEditor';

const LessonEditor = dynamic(
  () => import('@/features/lessons/components/LessonEditor').then((m) => m.LessonEditor),
  { ssr: false, loading: () => <div className="text-sm text-text-2 py-4">Loading editor…</div> },
);

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  useAuthGuard();
  const { id, nodeId } = use(params);
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';

  const {
    loading,
    notFound,
    lesson,
    titleSaveStatus,
    handleSaveContent,
    handleSaveTitle,
  } = useLessonEditor(nodeId);

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
        <Link href="/roadmaps" className="text-sm text-indigo hover:underline mt-2 inline-block">
          ← Back to Roadmaps
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <nav className="flex items-center gap-1 text-sm text-text-3 mb-4">
        <Link href="/roadmaps" className="hover:text-indigo transition-colors">
          ← Roadmaps
        </Link>
        <span>/</span>
        <Link
          href={`/roadmaps/${id}?slug=${slug}`}
          className="hover:text-indigo transition-colors"
        >
          Graph Editor
        </Link>
        <span>/</span>
        <span className="text-text-1">{lesson.title}</span>
      </nav>

      <LessonTitleEditor
        title={lesson.title}
        saveStatus={titleSaveStatus}
        onSave={handleSaveTitle}
      />

      <LessonEditor
        initialContentJson={lesson.content ?? ''}
        onSave={handleSaveContent}
      />
    </div>
  );
}
