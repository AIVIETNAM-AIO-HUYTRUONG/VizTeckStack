'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  cycleStatus,
} from './roadmap.service';
import { STATUS_CYCLE } from './constants';
import type { ApolloLike, Roadmap, CreateRoadmapInput, UpdateRoadmapInput, ModalState } from './types';

export function useRoadmaps(client: ApolloLike) {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const fetchRoadmaps = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getRoadmaps(client);
      setRoadmaps(data);
    } catch {
      // Auto-retry once after 500ms — covers gRPC cold-start on first request
      try {
        await new Promise<void>((r) => setTimeout(r, 500));
        const data = await getRoadmaps(client);
        setRoadmaps(data);
      } catch {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  async function handleCreate(data: CreateRoadmapInput) {
    await createRoadmap(client, data);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleEdit(roadmap: Roadmap, data: UpdateRoadmapInput) {
    await updateRoadmap(client, roadmap.id, data);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleDelete(roadmap: Roadmap) {
    await deleteRoadmap(client, roadmap.id);
    setModal({ type: 'none' });
    await fetchRoadmaps();
  }

  async function handleStatusChange(roadmap: Roadmap) {
    const next = STATUS_CYCLE[roadmap.status ?? 'DRAFT'] ?? 'DRAFT';
    setRoadmaps((prev) =>
      prev.map((r) => (r.id === roadmap.id ? { ...r, status: next } : r)),
    );
    try {
      await cycleStatus(client, roadmap);
    } catch {
      await fetchRoadmaps();
    }
  }

  return {
    roadmaps,
    loading,
    loadError,
    retry: fetchRoadmaps,
    modal,
    setModal,
    handleCreate,
    handleEdit,
    handleDelete,
    handleStatusChange,
  };
}
