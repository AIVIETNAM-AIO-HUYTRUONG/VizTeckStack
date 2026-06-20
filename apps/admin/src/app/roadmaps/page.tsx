'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@vizteck/ui';
import { AdminLayout } from '@/components/AdminLayout';
import { RoadmapModal } from '@/components/RoadmapModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { apiFetch } from '@/lib/api';

interface Roadmap {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status?: string;
}

const STATUS_CYCLE: Record<string, string> = { DRAFT: 'PUBLIC', PUBLIC: 'PRIVATE', PRIVATE: 'DRAFT' };
const STATUS_LABEL: Record<string, string> = { DRAFT: 'Draft', PUBLIC: 'Public', PRIVATE: 'Private' };
const STATUS_CLASS: Record<string, string> = {
  DRAFT:   'bg-bg-2 text-text-3 border border-border',
  PUBLIC:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700',
  PRIVATE: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700',
};

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; roadmap: Roadmap }
  | { type: 'delete'; roadmap: Roadmap };

export default function RoadmapsPage() {
  useAuthGuard();

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const fetchRoadmaps = useCallback(async () => {
    try {
      const res = await apiFetch('/api/roadmaps');
      const data = await res.json();
      setRoadmaps(data.roadmaps ?? []);
    } catch {
      // apiFetch handles 401 redirect; other errors silently ignored
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  async function handleCreate(data: { title: string; slug: string; description: string }) {
    await apiFetch('/api/roadmaps', {
      method: 'POST',
      body: JSON.stringify({ title: data.title, slug: data.slug, description: data.description }),
    });
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleEdit(roadmap: Roadmap, data: { title: string; slug: string; description: string }) {
    await apiFetch(`/api/roadmaps/${roadmap.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: data.title, description: data.description }),
    });
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleDelete(roadmap: Roadmap) {
    await apiFetch(`/api/roadmaps/${roadmap.id}`, {
      method: 'DELETE',
    });
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleStatusChange(roadmap: Roadmap) {
    const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
    // Optimistic update
    setRoadmaps((prev) => prev.map((r) => r.id === roadmap.id ? { ...r, status: next } : r));
    try {
      await apiFetch(`/api/roadmaps/${roadmap.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: next }),
      });
    } catch {
      await fetchRoadmaps(); // revert on error
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Page heading */}
        <h1 className="text-[20px] font-semibold text-text-1 mb-4">Roadmaps</h1>

        {/* Toolbar */}
        <div className="flex justify-end mb-4">
          <Button variant="primary" onClick={() => setModal({ type: 'create' })}>
            + New Roadmap
          </Button>
        </div>

        {/* Table / empty state */}
        {!loading && roadmaps.length === 0 ? (
          <div className="text-center py-16 bg-bg-1 border border-border rounded-md">
            <h2 className="text-[20px] font-semibold text-text-1 mb-2">No roadmaps yet</h2>
            <p className="text-sm text-text-2 mb-4">
              Create your first roadmap to get started.
            </p>
            <Button variant="primary" onClick={() => setModal({ type: 'create' })}>
              + New Roadmap
            </Button>
          </div>
        ) : (
          <div className="bg-bg-1 border border-border rounded-md overflow-hidden">
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
                    <td className="px-4 py-3 text-xs font-mono text-text-3">
                      {roadmap.slug}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleStatusChange(roadmap)}
                        title="Click to cycle status"
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full cursor-pointer focus:outline-none transition-colors ${STATUS_CLASS[roadmap.status ?? 'DRAFT'] ?? STATUS_CLASS.DRAFT}`}
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
        )}
      </div>

      {/* Modals */}
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
