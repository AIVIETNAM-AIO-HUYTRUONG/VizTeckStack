'use client';

import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  applyEdgeChanges,
  type Connection, type NodeChange, type EdgeChange,
  RoadmapGraph,
} from '@vizteck/graph';
import type { NodeItem, EdgeItem } from '@vizteck/graph';
import type { NodeType } from '@vizteck/ui';
import { GraphToolbar } from '@/components/GraphToolbar';
import { NodeInventory } from '@/components/NodeInventory';
import { NodeSidePanel } from '@/components/NodeSidePanel';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { apiFetch } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useUnsavedGuard } from '@/lib/useRouteGuard';

// ---- Local types ----

interface EditorNode extends NodeItem {
  // positionX/Y are number | null (unplaced = null)
}

interface EditorEdge extends EdgeItem {}

interface SidePanelState {
  open: boolean;
  mode: 'create' | 'edit';
  nodeId?: string;           // set when editing
  flowPosition?: { x: number; y: number }; // set for right-click create (placed)
}

interface DeleteConfirm {
  open: boolean;
  nodeId: string;
  nodeTitle: string;
}

// ---- Helpers ----

function makeSnapshot(nodes: EditorNode[], edges: EditorEdge[]): string {
  return JSON.stringify({
    nodes: nodes.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      positionX: n.positionX,
      positionY: n.positionY,
      targetRoadmapId: n.targetRoadmapId ?? null,
      content: n.content ?? null,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sourceId: e.sourceId,
      targetId: e.targetId,
      label: e.label ?? null,
    })),
  });
}

// Apply React Flow NodeChanges back into EditorNode list (position updates only)
function applyFlowChangesToEditorNodes(
  rfChanges: NodeChange[],
  editorNodes: EditorNode[],
): EditorNode[] {
  return editorNodes.map((n) => {
    for (const change of rfChanges) {
      if (
        change.type === 'position' &&
        change.id === n.id &&
        'position' in change &&
        change.position != null
      ) {
        const pos = change.position as { x: number; y: number };
        return { ...n, positionX: pos.x, positionY: pos.y };
      }
    }
    return n;
  });
}

// ---- Page component ----

export default function GraphEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  useAuthGuard();

  const { id } = use(params);
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [editorNodes, setEditorNodes] = useState<EditorNode[]>([]);
  const [editorEdges, setEditorEdges] = useState<EditorEdge[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savedSnapshotRef = useRef<string>('');

  // Side panel state
  const [panel, setPanel] = useState<SidePanelState>({ open: false, mode: 'create' });

  // Delete confirm dialog
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>({
    open: false,
    nodeId: '',
    nodeTitle: '',
  });

  // Nav guard
  const currentSnapshot = makeSnapshot(editorNodes, editorEdges);
  const dirty = loading ? false : currentSnapshot !== savedSnapshotRef.current;
  const { showConfirm: showNavConfirm, confirmNavigation, cancelNavigation, proceedNavigation } =
    useUnsavedGuard(dirty);

  // ---- Initial load ----
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await apiFetch(`/api/roadmaps/${slug}`);
        if (!res.ok) return;
        const data = await res.json() as {
          roadmap: { title: string };
          nodes: NodeItem[];
          edges: EdgeItem[];
        };
        if (cancelled) return;
        setRoadmapTitle(data.roadmap?.title ?? '');
        const nodes: EditorNode[] = data.nodes.map((n) => ({ ...n }));
        const edges: EditorEdge[] = data.edges.map((e) => ({ ...e }));
        setEditorNodes(nodes);
        setEditorEdges(edges);
        savedSnapshotRef.current = makeSnapshot(nodes, edges);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  // ---- React Flow callbacks ----

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setEditorNodes((prev) => applyFlowChangesToEditorNodes(changes, prev));
  }, []);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEditorEdges((prev) => {
      // Use @xyflow applyEdgeChanges on a temporary RF-shaped list, then reconcile
      const rfEdges = prev.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        label: e.label,
      }));
      const updated = applyEdgeChanges(changes, rfEdges);
      // Keep only edges still present
      const remainingIds = new Set(updated.map((e) => e.id));
      return prev.filter((e) => remainingIds.has(e.id));
    });
  }, []);

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const newEdge: EditorEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sourceId: connection.source,
      targetId: connection.target,
    };
    setEditorEdges((prev) => [...prev, newEdge]);
  }, []);

  // Canvas delete = UNPLACE (D-06): set position to null, keep in inventory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodesDelete = useCallback((deleted: any[]) => {
    const deletedIds = new Set<string>(deleted.map((n: { id: string }) => n.id));
    setEditorNodes((prev) =>
      prev.map((n) =>
        deletedIds.has(n.id) ? { ...n, positionX: null, positionY: null } : n,
      ),
    );
  }, []);

  // Right-click on canvas = create node at that position (placed)
  const handlePaneContextMenu = useCallback(
    (_event: React.MouseEvent | globalThis.MouseEvent, flowPos: { x: number; y: number }) => {
      setPanel({ open: true, mode: 'create', flowPosition: flowPos });
    },
    [],
  );

  // Drop from inventory = place node at drop position
  const handleDropNode = useCallback((nodeId: string, flowPos: { x: number; y: number }) => {
    setEditorNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, positionX: flowPos.x, positionY: flowPos.y } : n,
      ),
    );
  }, []);

  // Canvas node click = open edit panel
  const handleNodeClick = useCallback((node: NodeItem) => {
    setPanel({ open: true, mode: 'edit', nodeId: node.id });
  }, []);

  // ---- Toolbar actions ----

  function handleAddNode() {
    setPanel({ open: true, mode: 'create', flowPosition: undefined });
  }

  function handleBack() {
    const allowed = confirmNavigation();
    if (allowed) {
      router.push('/roadmaps');
    }
    // If not allowed, showNavConfirm will become true and dialog renders
  }

  // ---- Side panel submit ----

  function handlePanelSubmit(data: { title: string; type: NodeType }) {
    if (panel.mode === 'create') {
      const newNode: EditorNode = {
        id: crypto.randomUUID(),
        roadmapId: id,
        type: data.type,
        title: data.title,
        positionX: panel.flowPosition?.x ?? null,
        positionY: panel.flowPosition?.y ?? null,
      };
      setEditorNodes((prev) => [...prev, newNode]);
    } else if (panel.mode === 'edit' && panel.nodeId) {
      const nodeId = panel.nodeId;
      setEditorNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, title: data.title, type: data.type } : n,
        ),
      );
    }
    setPanel({ open: false, mode: 'create' });
  }

  function handlePanelClose() {
    setPanel({ open: false, mode: 'create' });
  }

  // ---- Inventory actions ----

  function handleEditNode(nodeId: string) {
    setPanel({ open: true, mode: 'edit', nodeId });
  }

  function handleDeleteNodeRequest(nodeId: string) {
    const node = editorNodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDeleteConfirm({ open: true, nodeId, nodeTitle: node.title });
  }

  function handleDeleteNodeConfirm() {
    const { nodeId } = deleteConfirm;
    setDeleteConfirm({ open: false, nodeId: '', nodeTitle: '' });
    // Remove node AND cascade-delete all edges referencing it
    setEditorNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEditorEdges((prev) =>
      prev.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId),
    );
  }

  function handleDeleteNodeCancel() {
    setDeleteConfirm({ open: false, nodeId: '', nodeTitle: '' });
  }

  // ---- Save Graph ----

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError('');

    try {
      const nodes = editorNodes.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        positionX: n.positionX ?? undefined,
        positionY: n.positionY ?? undefined,
        targetRoadmapId: n.targetRoadmapId,
        content: n.content,
      }));

      const edges = editorEdges.map((e) => ({
        sourceId: e.sourceId,
        targetId: e.targetId,
        label: e.label,
      }));

      const res = await apiFetch(`/api/roadmaps/${id}/graph`, {
        method: 'POST',
        body: JSON.stringify({ nodes, edges }),
      });

      if (!res.ok) {
        const text = await res.text();
        setSaveError(`Save failed: ${text || res.status}`);
        return;
      }

      // Re-snapshot from current state so dirty resets to false
      savedSnapshotRef.current = makeSnapshot(editorNodes, editorEdges);
    } catch (err) {
      setSaveError('Save failed. Check your connection and try again.');
      console.error('[GraphEditor] save error:', err);
    } finally {
      setSaving(false);
    }
  }

  // ---- Render ----

  // Determine the initial values for the side panel
  const panelInitial =
    panel.mode === 'edit' && panel.nodeId
      ? (() => {
          const n = editorNodes.find((x) => x.id === panel.nodeId);
          return n ? { title: n.title, type: n.type as NodeType } : undefined;
        })()
      : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-2 text-sm">
        Loading graph…
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Toolbar */}
      <GraphToolbar
        roadmapTitle={roadmapTitle}
        dirty={dirty}
        saving={saving}
        onAddNode={handleAddNode}
        onSave={handleSave}
        onBack={handleBack}
      />

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 flex-shrink-0">
          {saveError}
        </div>
      )}

      {/* Canvas zone — relative so the side panel can overlay it */}
      <div className="flex-1 relative overflow-hidden">
        <RoadmapGraph
          nodes={editorNodes}
          edges={editorEdges}
          mode="edit"
          onNodeClick={handleNodeClick}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodesDelete={handleNodesDelete}
          onPaneContextMenu={handlePaneContextMenu}
          onDropNode={handleDropNode}
        />

        {/* Side panel overlay */}
        {panel.open && (
          <NodeSidePanel
            mode={panel.mode}
            initial={panelInitial}
            onSubmit={handlePanelSubmit}
            onClose={handlePanelClose}
          />
        )}
      </div>

      {/* Node inventory */}
      <NodeInventory
        nodes={editorNodes}
        onEditNode={handleEditNode}
        onDeleteNode={handleDeleteNodeRequest}
      />

      {/* Inventory delete confirm */}
      {deleteConfirm.open && (
        <ConfirmDialog
          heading="Delete node?"
          body={`This will permanently delete "${deleteConfirm.nodeTitle}" and all connected edges. This cannot be undone.`}
          confirmLabel="Delete Node"
          dismissLabel="Keep Node"
          onConfirm={handleDeleteNodeConfirm}
          onClose={handleDeleteNodeCancel}
        />
      )}

      {/* Unsaved navigation guard */}
      {showNavConfirm && (
        <ConfirmDialog
          heading="Leave without saving?"
          body="Your graph changes haven't been saved. Leaving now will discard them."
          confirmLabel="Leave anyway"
          dismissLabel="Keep Editing"
          onConfirm={() => {
            proceedNavigation();
            router.push('/roadmaps');
          }}
          onClose={cancelNavigation}
        />
      )}
    </div>
  );
}
