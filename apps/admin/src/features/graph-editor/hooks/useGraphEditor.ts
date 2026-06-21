'use client';

import { useState, useEffect, useRef, useMemo, type Dispatch, type SetStateAction } from 'react';
import {
  loadGraph,
  saveGraph,
  makeSnapshot,
  type EditorNode,
  type EditorEdge,
  type RoadmapEntry,
} from '../services/graph.service';
import { updateRoadmap } from '@/features/roadmaps/services/roadmap.service';

export function useGraphEditor(id: string, slug: string | null) {
  const [loading, setLoading] = useState(true);
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [roadmapStatus, setRoadmapStatus] = useState('DRAFT');
  const [editorNodes, setEditorNodes] = useState<EditorNode[]>([]);
  const [editorEdges, setEditorEdges] = useState<EditorEdge[]>([]);
  const [allRoadmaps, setAllRoadmaps] = useState<RoadmapEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savedSnapshotRef = useRef<string>('');

  const currentSnapshot = useMemo(() => makeSnapshot(editorNodes, editorEdges), [editorNodes, editorEdges]);
  const dirty = loading ? false : currentSnapshot !== savedSnapshotRef.current;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    loadGraph(slug, id)
      .then((data) => {
        if (cancelled) return;
        setRoadmapTitle(data.roadmapTitle);
        setRoadmapStatus(data.roadmapStatus);
        setEditorNodes(data.nodes);
        setEditorEdges(data.edges);
        setAllRoadmaps(data.allRoadmaps);
        savedSnapshotRef.current = data.savedSnapshot;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, id]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveGraph(id, editorNodes, editorEdges);
      savedSnapshotRef.current = makeSnapshot(editorNodes, editorEdges);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Save failed. Check your connection and try again.',
      );
      console.error('[useGraphEditor] save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeStatus(next: string) {
    const prev = roadmapStatus;
    setRoadmapStatus(next);
    try {
      await updateRoadmap(id, { status: next });
    } catch {
      setRoadmapStatus(prev);
    }
  }

  return {
    loading,
    saving,
    saveError,
    dirty,
    roadmapTitle,
    roadmapStatus,
    editorNodes,
    editorEdges,
    allRoadmaps,
    setEditorNodes: setEditorNodes as Dispatch<SetStateAction<EditorNode[]>>,
    setEditorEdges: setEditorEdges as Dispatch<SetStateAction<EditorEdge[]>>,
    handleSave,
    handleChangeStatus,
  };
}
