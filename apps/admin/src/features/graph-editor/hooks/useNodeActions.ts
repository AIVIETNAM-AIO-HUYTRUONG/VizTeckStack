'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeItem,
} from '@vizteck/core';
import type { Dispatch, SetStateAction } from 'react';
import type { EditorNode, EditorEdge, SidePanelState } from '@vizteck/core';

export interface UseNodeActionsParams {
  id: string;
  slug: string | null;
  setEditorNodes: Dispatch<SetStateAction<EditorNode[]>>;
  setEditorEdges: Dispatch<SetStateAction<EditorEdge[]>>;
  setPanel: Dispatch<SetStateAction<SidePanelState>>;
  confirmNavigation: () => boolean;
  setPendingNavUrl: Dispatch<SetStateAction<string>>;
}

function applyFlowChangesToEditorNodes(
  rfChanges: NodeChange[],
  editorNodes: EditorNode[],
): EditorNode[] {
  return editorNodes.map((n) => {
    let updated = n;
    for (const change of rfChanges) {
      if (!('id' in change) || (change as { id: string }).id !== n.id) continue;
      if (change.type === 'position' && 'position' in change && change.position != null) {
        const pos = change.position as { x: number; y: number };
        updated = { ...updated, positionX: pos.x, positionY: pos.y };
      } else if (change.type === 'select' && 'selected' in change) {
        updated = { ...updated, selected: (change as { selected: boolean }).selected };
      }
    }
    return updated;
  });
}

export function useNodeActions({
  id,
  slug,
  setEditorNodes,
  setEditorEdges,
  setPanel,
  confirmNavigation,
  setPendingNavUrl,
}: UseNodeActionsParams) {
  const router = useRouter();

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const relevant = changes.filter(
        (c) =>
          (c.type === 'position' &&
            'position' in c &&
            (c as { position?: unknown }).position != null) ||
          c.type === 'select',
      );
      if (relevant.length === 0) return;
      setEditorNodes((prev) => applyFlowChangesToEditorNodes(relevant, prev));
    },
    [setEditorNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEditorEdges((prev) => {
        const rfEdges = prev.map((e) => ({
          id: e.id,
          source: e.sourceId,
          target: e.targetId,
          label: e.label,
        }));
        const updated = applyEdgeChanges(changes, rfEdges);
        const remainingIds = new Set(updated.map((e) => e.id));
        return prev.filter((e) => remainingIds.has(e.id));
      });
    },
    [setEditorEdges],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const newEdge: EditorEdge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sourceId: connection.source,
        targetId: connection.target,
      };
      setEditorEdges((prev) => [...prev, newEdge]);
    },
    [setEditorEdges],
  );

  // Canvas delete = UNPLACE (D-06): null position keeps node in inventory
  const handleNodesDelete = useCallback(
    (deleted: { id: string }[]) => {
      const deletedIds = new Set<string>(deleted.map((n) => n.id));
      setEditorNodes((prev) =>
        prev.map((n) =>
          deletedIds.has(n.id) ? { ...n, positionX: null, positionY: null } : n,
        ),
      );
    },
    [setEditorNodes],
  );

  const handlePaneContextMenu = useCallback(
    (_event: React.MouseEvent | globalThis.MouseEvent, flowPos: { x: number; y: number }) => {
      setPanel({ open: true, mode: 'create', flowPosition: flowPos });
    },
    [setPanel],
  );

  const handleEdgeClick = useCallback(
    (edgeId: string) => {
      setEditorEdges((prev) => prev.filter((e) => e.id !== edgeId));
    },
    [setEditorEdges],
  );

  const handleDropNode = useCallback(
    (nodeId: string, flowPos: { x: number; y: number }) => {
      if (nodeId.startsWith('newRoadmap:')) {
        // Parse title from drag payload — title is URL-encoded and may contain colons
        const parts = nodeId.split(':');
        const targetRoadmapId = parts[1];
        const targetRoadmapSlug = parts[2];
        const title = decodeURIComponent(parts.slice(3).join(':'));
        setEditorNodes((prev) => {
          if (prev.some((n) => n.type === 'ROADMAP' && n.targetRoadmapId === targetRoadmapId))
            return prev;
          const newNode: EditorNode = {
            id: crypto.randomUUID(),
            roadmapId: id,
            type: 'ROADMAP',
            title,
            positionX: flowPos.x,
            positionY: flowPos.y,
            targetRoadmapId,
            targetRoadmapSlug,
          };
          return [...prev, newNode];
        });
      } else {
        setEditorNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId ? { ...n, positionX: flowPos.x, positionY: flowPos.y } : n,
          ),
        );
      }
    },
    [id, setEditorNodes],
  );

  const handleNodeClick = useCallback(
    (node: NodeItem) => {
      if (node.type === 'LESSON') {
        router.push(`/roadmaps/${id}/nodes/${node.id}?slug=${slug ?? ''}`);
      } else if (node.type === 'ROADMAP' && node.targetRoadmapId && node.targetRoadmapSlug) {
        router.push(`/roadmaps/${node.targetRoadmapId}?slug=${node.targetRoadmapSlug}`);
      } else {
        setPanel({ open: true, mode: 'edit', nodeId: node.id });
      }
    },
    [id, slug, router, setPanel],
  );

  const handleBack = useCallback(() => {
    const url = '/roadmaps';
    const allowed = confirmNavigation();
    if (allowed) router.push(url);
    else setPendingNavUrl(url);
  }, [confirmNavigation, router, setPendingNavUrl]);

  return {
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    handleNodesDelete,
    handlePaneContextMenu,
    handleEdgeClick,
    handleDropNode,
    handleNodeClick,
    handleBack,
  };
}
