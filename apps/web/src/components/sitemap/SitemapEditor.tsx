"use client";

import { useState, useCallback } from "react";
import { SitemapNode, buildTree, flattenTree, DEFAULT_SECTIONS } from "./sitemapUtils";
import SitemapCanvas from "./SitemapCanvas";
import NodeDetailPanel from "./NodeDetailPanel";
import AiPanel from "./AiPanel";

type Props = {
  projectId: string;
  initialNodes: SitemapNode[];
  userPlan: string;
};

export default function SitemapEditor({ projectId, initialNodes, userPlan }: Props) {
  const [nodes, setNodes] = useState<SitemapNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const tree = buildTree(nodes);
  const selectedNode = nodes.find(n => n.id === selectedId) ?? null;
  const apiBase = `/api/projects/${projectId}/sitemaps`;

  const addNode = useCallback(async (parentId: string | null = null) => {
    const siblings = nodes.filter(n => n.parent_id === parentId);
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: "New page",
        type: "page",
        parent_id: parentId,
        order_index: siblings.length,
        metadata: { sections: DEFAULT_SECTIONS },
      }),
    });
    if (!res.ok) return;
    const { data } = await res.json();
    setNodes(prev => [...prev, data]);
    setSelectedId(data.id);
  }, [nodes, apiBase]);

  const updateNode = useCallback(async (id: string, updates: Partial<SitemapNode>) => {
    setSaving(s => ({ ...s, [id]: true }));
    const res = await fetch(`${apiBase}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(s => ({ ...s, [id]: false }));
    if (!res.ok) return;
    const { data } = await res.json();
    setNodes(prev => prev.map(n => n.id === id ? data : n));
  }, [apiBase]);

  const deleteNode = useCallback(async (id: string) => {
    const all = flattenTree(buildTree(nodes));
    const toDelete = new Set<string>();
    const collect = (nodeId: string) => {
      toDelete.add(nodeId);
      all.filter(n => n.parent_id === nodeId).forEach(n => collect(n.id));
    };
    collect(id);
    await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
    if (selectedId && toDelete.has(selectedId)) setSelectedId(null);
  }, [nodes, apiBase, selectedId]);

  const autoAssignWireframes = useCallback(async () => {
    if (!confirm("This will auto-generate wireframes for ALL pages based on their sitemap sections. Cost: 3 credits. Continue?")) return;
    setAutoAssigning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/wireframes/auto-assign`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "Failed to auto-assign wireframes");
      } else {
        alert("Wireframes auto-generated successfully!");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setAutoAssigning(false);
    }
  }, [projectId]);

  return (
    <div className="flex gap-0 h-[calc(100vh-10rem)] min-h-[600px] rounded-xl overflow-hidden border border-gray-800">
      {/* Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
          <span className="text-sm font-medium text-gray-400">Sitemap</span>
          <div className="flex items-center gap-2">
            {/* AI toggle */}
            <button
              id="ai-panel-toggle"
              onClick={() => setAiPanelOpen(o => !o)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                aiPanelOpen
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-900/40"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              <span>✨</span>
              <span>AI</span>
            </button>
 
            {/* Auto-assign wireframes */}
            <button
              onClick={autoAssignWireframes}
              disabled={autoAssigning}
              className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-md font-medium transition-colors disabled:opacity-50"
              title="Auto-generate wireframes for all pages (3 credits)"
            >
              {autoAssigning ? "Assigning…" : "Auto-assign Wireframes (3 cr)"}
            </button>
            <button
              id="sitemap-add-page"
              onClick={() => addNode(null)}
              className="text-xs px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-md font-medium transition-colors"
            >
              + Add page
            </button>
          </div>
        </div>

        {/* Canvas with generating overlay */}
        <div className="flex-1 relative">
          {generating && (
            <div className="absolute inset-0 z-20 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-300 font-medium">AI is building your sitemap…</p>
            </div>
          )}
          <SitemapCanvas
            tree={tree}
            selectedId={selectedId}
            saving={saving}
            onSelect={setSelectedId}
            onAdd={addNode}
            onDelete={deleteNode}
            onRename={(id, label) => updateNode(id, { label })}
          />
        </div>
      </div>

      {/* Detail panel */}
      <div
        className={`shrink-0 border-l border-gray-800 bg-gray-900 transition-all duration-200 ${
          selectedNode ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            saving={!!saving[selectedNode.id]}
            onUpdate={updates => updateNode(selectedNode.id, updates)}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {/* AI Panel */}
      <div
        className={`shrink-0 border-l border-gray-800 bg-gray-900/95 transition-all duration-200 ${
          aiPanelOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        {aiPanelOpen && (
          <AiPanel
            projectId={projectId}
            onNodesUpdated={(updated) => setNodes(updated as SitemapNode[])}
            onGenerating={setGenerating}
            userPlan={userPlan}
          />
        )}
      </div>
    </div>
  );
}
