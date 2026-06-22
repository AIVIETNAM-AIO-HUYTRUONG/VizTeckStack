'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { RoadmapGraph } from '@vizteck/graph';
import type { NodeType } from '@vizteck/ui';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useUnsavedGuard } from '@/lib/useRouteGuard';
import { useGraphEditor } from '@/features/graph-editor/hooks/useGraphEditor';
import { useNodeActions } from '@/features/graph-editor/hooks/useNodeActions';
import type { SidePanelState } from '@/features/graph-editor/hooks/useNodeActions';
import { useGraphDraft } from '@/features/graph-editor/hooks/useGraphDraft';
import { GraphToolbar } from '@/features/graph-editor/components/GraphToolbar';
import { NodeInventory } from '@/features/graph-editor/components/NodeInventory';
import { NodeSidePanel } from '@/features/graph-editor/components/NodeSidePanel';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { EditorNode } from '@/features/graph-editor/services/graph.service';

interface DeleteConfirm {
  open: boolean;
  nodeId: string;
  nodeTitle: string;
}

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

  const {
    loading, saving, saveError, dirty,
    roadmapTitle, roadmapStatus,
    editorNodes, editorEdges, allRoadmaps,
    setEditorNodes, setEditorEdges,
    handleSave, handleChangeStatus,
  } = useGraphEditor(id, slug);

  const [panel, setPanel] = useState<SidePanelState>({ open: false, mode: 'create' });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>({ open: false, nodeId: '', nodeTitle: '' });
  const [pendingNavUrl, setPendingNavUrl] = useState('');

  const { showConfirm: showNavConfirm, confirmNavigation, cancelNavigation, proceedNavigation } =
    useUnsavedGuard(dirty);

  const {
    handleNodesChange, handleEdgesChange, handleConnect,
    handleNodesDelete, handlePaneContextMenu, handleEdgeClick,
    handleDropNode, handleNodeClick, handleBack,
  } = useNodeActions({ id, slug, setEditorNodes, setEditorEdges, setPanel, confirmNavigation, setPendingNavUrl });

  useGraphDraft(id, editorNodes, editorEdges, dirty, loading);

  function handleAddNode() {
    setPanel({ open: true, mode: 'create', flowPosition: undefined });
  }

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
    setEditorNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEditorEdges((prev) => prev.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId));
  }

  function handlePanelSubmit(data: { title: string; type: NodeType; targetRoadmapId?: string; targetRoadmapSlug?: string }) {
    if (panel.mode === 'create') {
      const newNode: EditorNode = {
        id: crypto.randomUUID(),
        roadmapId: id,
        type: data.type,
        title: data.title,
        positionX: panel.flowPosition?.x ?? null,
        positionY: panel.flowPosition?.y ?? null,
        targetRoadmapId: data.targetRoadmapId,
        targetRoadmapSlug: data.targetRoadmapSlug,
      };
      setEditorNodes((prev) => [...prev, newNode]);
    } else if (panel.mode === 'edit' && panel.nodeId) {
      const nodeId = panel.nodeId;
      setEditorNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, title: data.title, type: data.type, targetRoadmapId: data.targetRoadmapId, targetRoadmapSlug: data.targetRoadmapSlug }
            : n,
        ),
      );
    }
    setPanel({ open: false, mode: 'create' });
  }

  function handleAddRoadmapLink(roadmap: { id: string; title: string; slug: string }) {
    const newNode: EditorNode = {
      id: crypto.randomUUID(),
      roadmapId: id,
      type: 'ROADMAP',
      title: roadmap.title,
      positionX: null,
      positionY: null,
      targetRoadmapId: roadmap.id,
      targetRoadmapSlug: roadmap.slug,
    };
    setEditorNodes((prev) => [...prev, newNode]);
  }

  const panelInitial =
    panel.mode === 'edit' && panel.nodeId
      ? (() => {
          const n = editorNodes.find((x) => x.id === panel.nodeId);
          return n ? { title: n.title, type: n.type as NodeType, targetRoadmapId: n.targetRoadmapId } : undefined;
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
    <div className="flex flex-col" style={{ height: '100vh' }}>
      <GraphToolbar
        roadmapTitle={roadmapTitle}
        dirty={dirty}
        saving={saving}
        roadmapStatus={roadmapStatus}
        onAddNode={handleAddNode}
        onSave={handleSave}
        onBack={handleBack}
        onChangeStatus={handleChangeStatus}
      />

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 flex-shrink-0">
          {saveError}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <NodeInventory
          nodes={editorNodes}
          allRoadmaps={allRoadmaps}
          onEditNode={handleEditNode}
          onDeleteNode={handleDeleteNodeRequest}
          onAddRoadmapLink={handleAddRoadmapLink}
        />

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
            onEdgeClick={handleEdgeClick}
            onPaneContextMenu={handlePaneContextMenu}
            onDropNode={handleDropNode}
          />

          {panel.open && (
            <NodeSidePanel
              mode={panel.mode}
              initial={panelInitial}
              allRoadmaps={allRoadmaps}
              onSubmit={handlePanelSubmit}
              onClose={() => setPanel({ open: false, mode: 'create' })}
            />
          )}
        </div>
      </div>

      {deleteConfirm.open && (
        <ConfirmDialog
          heading="Delete node?"
          body={`This will permanently delete "${deleteConfirm.nodeTitle}" and all connected edges. This cannot be undone.`}
          confirmLabel="Delete Node"
          dismissLabel="Keep Node"
          onConfirm={handleDeleteNodeConfirm}
          onClose={() => setDeleteConfirm({ open: false, nodeId: '', nodeTitle: '' })}
        />
      )}

      {showNavConfirm && (
        <ConfirmDialog
          heading="Leave without saving?"
          body="Your graph changes haven't been saved. Leaving now will discard them."
          confirmLabel="Leave anyway"
          dismissLabel="Keep Editing"
          onConfirm={() => {
            proceedNavigation();
            router.push(pendingNavUrl || '/roadmaps');
            setPendingNavUrl('');
          }}
          onClose={cancelNavigation}
        />
      )}
    </div>
  );
}
