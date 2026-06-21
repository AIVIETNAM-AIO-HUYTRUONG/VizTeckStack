'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  cycleStatus,
  STATUS_CYCLE,
  type Roadmap,
  type CreateRoadmapInput,
  type UpdateRoadmapInput,
} from '../services/roadmap.service';

export type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; roadmap: Roadmap }
  | { type: 'delete'; roadmap: Roadmap };

export function useRoadmaps() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const fetchRoadmaps = useCallback(async () => {
    try {
      const data = await getRoadmaps();
      setRoadmaps(data);
    } catch {
      // apiFetch handles 401 redirect; other errors silently ignored
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  async function handleCreate(data: CreateRoadmapInput) {
    await createRoadmap(data);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleEdit(roadmap: Roadmap, data: UpdateRoadmapInput) {
    await updateRoadmap(roadmap.id, data);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleDelete(roadmap: Roadmap) {
    await deleteRoadmap(roadmap.id);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleStatusChange(roadmap: Roadmap) {
    // Optimistic update using STATUS_CYCLE constant from service
    const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
    setRoadmaps((prev) =>
      prev.map((r) => (r.id === roadmap.id ? { ...r, status: next } : r)),
    );
    try {
      await cycleStatus(roadmap);
    } catch {
      await fetchRoadmaps(); // revert on error
    }
  }

  return {
    roadmaps,
    loading,
    modal,
    setModal,
    handleCreate,
    handleEdit,
    handleDelete,
    handleStatusChange,
  };
}
