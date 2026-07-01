'use client';

import Link from 'next/link';
import { Button } from '@vizteck/ui';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@vizteck/ui';
import { AdminLayout } from '@/components/AdminLayout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RoadmapModal } from '@/features/roadmaps/components/RoadmapModal';
import { useAdminRoadmaps } from '@/features/roadmaps/hooks/useRoadmaps';
import { STATUS_CLASS, STATUS_LABEL } from '@vizteck/core';

function SkeletonRow() {
  return (
    <TableRow className="hover:bg-transparent animate-pulse">
      <TableCell><div className="h-4 bg-bg-2 rounded w-40" /></TableCell>
      <TableCell><div className="h-3.5 bg-bg-2 rounded w-28 font-mono" /></TableCell>
      <TableCell><div className="h-5 bg-bg-2 rounded-full w-16" /></TableCell>
      <TableCell><div className="h-4 bg-bg-2 rounded w-6 ml-auto" /></TableCell>
    </TableRow>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="13" cy="8" r="1.25" fill="currentColor" />
    </svg>
  );
}

export default function RoadmapsPage() {
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
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-[20px] font-semibold text-text-1">Roadmaps</h1>
          <Button variant="primary" size="sm" onClick={() => setModal({ type: 'create' })}>
            + New Roadmap
          </Button>
        </div>

        <div className="bg-bg-1 border border-border rounded-md overflow-hidden">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-bg-2">
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </TableBody>
            </Table>
          ) : loadError ? (
            <div className="text-center py-16 px-4">
              <p className="text-sm text-text-2 mb-4">Failed to load roadmaps.</p>
              <Button variant="primary" size="sm" onClick={retry}>Retry</Button>
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="text-center py-16 px-4">
              <h2 className="font-display text-[20px] font-semibold text-text-1 mb-2">No roadmaps yet</h2>
              <p className="text-sm text-text-2 mb-5">Create your first roadmap to get started.</p>
              <Button variant="primary" size="sm" onClick={() => setModal({ type: 'create' })}>
                + New Roadmap
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-bg-2">
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Slug</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roadmaps.map((roadmap) => (
                  <TableRow key={roadmap.id}>
                    <TableCell>
                      <Link
                        href={`/roadmaps/${roadmap.id}?slug=${roadmap.slug}`}
                        className="font-medium text-text-1 hover:text-indigo transition-colors motion-reduce:transition-none"
                      >
                        {roadmap.title}
                      </Link>
                      {roadmap.description && (
                        <p className="text-xs text-text-3 mt-0.5 line-clamp-1 max-w-[36ch]">
                          {roadmap.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="font-mono text-xs text-text-3">{roadmap.slug}</span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleStatusChange(roadmap)}
                        title="Click to cycle status"
                        className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1 transition-colors motion-reduce:transition-none ${STATUS_CLASS[roadmap.status ?? 'DRAFT'] ?? STATUS_CLASS.DRAFT}`}
                      >
                        {STATUS_LABEL[roadmap.status ?? 'DRAFT'] ?? 'Draft'}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label={`Actions for ${roadmap.title}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-3 hover:text-text-1 hover:bg-bg-2 focus:outline-none focus:ring-2 focus:ring-indigo transition-colors motion-reduce:transition-none"
                          >
                            <DotsIcon />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setModal({ type: 'edit', roadmap })}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            destructive
                            onClick={() => setModal({ type: 'delete', roadmap })}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
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
