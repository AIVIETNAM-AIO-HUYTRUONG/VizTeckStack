'use client';

import Link from 'next/link';
import { Button } from '@vizteck/ui';
import { AdminLayout } from '@/components/AdminLayout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RoadmapModal } from '@/features/roadmaps/components/RoadmapModal';
import { useAdminRoadmaps } from '@/features/roadmaps/hooks/useRoadmaps';
import { STATUS_CLASS, STATUS_LABEL } from '@vizteck/core';
import { useAuthGuard } from '@/lib/useAuthGuard';

export default function RoadmapsPage() {
  useAuthGuard();

  const {
    roadmaps,
    loading,
    loadError,
    retry,
    modal,
    setModal,
    handleCreate,
    handleEdit,
    handleDelete,
    handleStatusChange,
  } = useAdminRoadmaps();

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <h1 className="text-[20px] font-semibold text-text-1 mb-4">Roadmaps</h1>

        <div className="flex justify-end mb-4">
          <Button variant="primary" onClick={() => setModal({ type: 'create' })}>
            + New Roadmap
          </Button>
        </div>

        {loading ? (
          <div className="bg-bg-1 border border-border rounded-md overflow-hidden animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex gap-4 px-4 py-3 ${i < 2 ? 'border-b border-border' : ''}`}>
                <div className="h-4 bg-bg-2 rounded w-48" />
                <div className="h-4 bg-bg-2 rounded w-32" />
                <div className="h-4 bg-bg-2 rounded w-16" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-16 bg-bg-1 border border-border rounded-md">
            <p className="text-sm text-text-2 mb-4">Failed to load roadmaps.</p>
            <Button variant="primary" onClick={retry}>Retry</Button>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="text-center py-16 bg-bg-1 border border-border rounded-md">
            <h2 className="text-[20px] font-semibold text-text-1 mb-2">No roadmaps yet</h2>
            <p className="text-sm text-text-2 mb-4">Create your first roadmap to get started.</p>
            <Button variant="primary" onClick={() => setModal({ type: 'create' })}>
              + New Roadmap
            </Button>
          </div>
        ) : (
          <div className="bg-bg-1 border border-border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-2 border-b border-border">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-text-2">Title</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-text-2">Slug</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-text-2">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-text-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map((roadmap, idx) => (
                  <tr
                    key={roadmap.id}
                    className={`min-h-[44px] hover:bg-bg-2 ${idx < roadmaps.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-text-1">
                      <Link
                        href={`/roadmaps/${roadmap.id}?slug=${roadmap.slug}`}
                        className="text-text-1 hover:text-indigo hover:underline"
                      >
                        {roadmap.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-3">{roadmap.slug}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleStatusChange(roadmap)}
                        title="Click to cycle status"
                        className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1 transition-colors motion-reduce:transition-none ${STATUS_CLASS[roadmap.status ?? 'DRAFT'] ?? STATUS_CLASS.DRAFT}`}
                      >
                        {STATUS_LABEL[roadmap.status ?? 'DRAFT'] ?? 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal({ type: 'edit', roadmap })}
                          className="text-sm text-text-2 hover:text-text-1 px-2 py-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setModal({ type: 'delete', roadmap })}
                          className="text-sm text-red-500 hover:text-red-600 px-2 py-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {modal.type === 'create' && (
        <RoadmapModal
          mode="create"
          onSubmit={handleCreate}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
      {modal.type === 'edit' && (
        <RoadmapModal
          mode="edit"
          initial={modal.roadmap}
          onSubmit={(data) => handleEdit(modal.roadmap, data)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
      {modal.type === 'delete' && (
        <ConfirmDialog
          heading="Delete roadmap?"
          body={`This will permanently delete "${modal.roadmap.title}" and all its nodes and edges. This cannot be undone.`}
          confirmLabel="Delete Roadmap"
          dismissLabel="Keep Roadmap"
          onConfirm={() => handleDelete(modal.roadmap)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </AdminLayout>
  );
}
