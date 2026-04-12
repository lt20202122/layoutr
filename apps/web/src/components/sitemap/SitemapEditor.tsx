"use client";

import { useState, useCallback } from "react";
import { SitemapNode, buildTree, flattenTree } from "./sitemapUtils";
import SitemapTreeNode from "./SitemapTreeNode";
import NodeDetailPanel from "./NodeDetailPanel";

type Props = {
  projectId: string;
  initialNodes: SitemapNode[];
};

export default function SitemapEditor({ projectId, initialNodes }: Props) {
  const [nodes, setNodes] = useState<SitemapNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const tree = buildTree(nodes);
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const apiBase = `/api/projects/${projectId}/sitemaps`;

  const addNode = useCallback(
    async (parentId: string | null = null) => {
      const siblings = nodes.filter((n) => n.parent_id === parentId);
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "New page",
          type: "page",
          parent_id: parentId,
          order_index: siblings.length,
        }),
      });
      if (!res.ok) return;
      const { data } = await res.json();
      setNodes((prev) => [...prev, data]);
      setSelectedId(data.id);
    },
    [nodes, apiBase]
  );

  const updateNode = useCallback(
    async (id: string, updates: Partial<SitemapNode>) => {
      setSaving((s) => ({ ...s, [id]: true }));
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setSaving((s) => ({ ...s, [id]: false }));
      if (!res.ok) return;
      const { data } = await res.json();
      setNodes((prev) => prev.map((n) => (n.id === id ? data : n)));
    },
    [apiBase]
  );

  const deleteNode = useCallback(
    async (id: string) => {
      // Collect all descendant IDs to remove locally
      const all = flattenTree(buildTree(nodes));
      const toDelete = new Set<string>();
      const collectIds = (nodeId: string) => {
        toDelete.add(nodeId);
        all.filter((n) => n.parent_id === nodeId).forEach((n) => collectIds(n.id));
      };
      collectIds(id);

      await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
      if (selectedId && toDelete.has(selectedId)) setSelectedId(null);
    },
    [nodes, apiBase, selectedId]
  );

  const moveNode = useCallback(
    async (id: string, newParentId: string | null) => {
      const siblings = nodes.filter(
        (n) => n.parent_id === newParentId && n.id !== id
      );
      await updateNode(id, {
        parent_id: newParentId,
        order_index: siblings.length,
      });
    },
    [nodes, updateNode]
  );

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Tree panel */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm font-medium text-gray-400">Sitemap</span>
          <button
            onClick={() => addNode(null)}
            className="text-xs px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-md font-medium transition-colors"
          >
            + Add page
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-3">
              <p className="text-gray-500 text-sm">No pages yet</p>
              <button
                onClick={() => addNode(null)}
                className="text-sm text-brand-400 hover:underline"
              >
                Add your first page
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {tree.map((node) => (
                <SitemapTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={selectedId}
                  saving={saving}
                  onSelect={setSelectedId}
                  onAdd={addNode}
                  onDelete={deleteNode}
                  onMove={moveNode}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode ? (
        <div className="w-80 shrink-0">
          <NodeDetailPanel
            node={selectedNode}
            saving={!!saving[selectedNode.id]}
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedId(null)}
          />
        </div>
      ) : (
        <div className="w-80 shrink-0 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center">
          <p className="text-gray-500 text-sm">Select a page to edit</p>
        </div>
      )}
    </div>
  );
}
