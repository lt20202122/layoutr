"use client";

import { Bot, Sparkles, WandSparkles } from "lucide-react";
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
          metadata: { sections: DEFAULT_SECTIONS },
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
      setSaving((state) => ({ ...state, [id]: true }));
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setSaving((state) => ({ ...state, [id]: false }));
      if (!res.ok) return;
      const { data } = await res.json();
      setNodes((prev) => prev.map((node) => (node.id === id ? data : node)));
    },
    [apiBase]
  );

  const deleteNode = useCallback(
    async (id: string) => {
      const all = flattenTree(buildTree(nodes));
      const toDelete = new Set<string>();
      const collect = (nodeId: string) => {
        toDelete.add(nodeId);
        all.filter((n) => n.parent_id === nodeId).forEach((n) => collect(n.id));
      };
      collect(id);
      await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
      if (selectedId && toDelete.has(selectedId)) setSelectedId(null);
    },
    [nodes, apiBase, selectedId]
  );

  const autoAssignWireframes = useCallback(async () => {
    if (
      !confirm(
        "This will auto-generate wireframes for all pages based on their sitemap sections. Cost: 3 credits. Continue?"
      )
    ) {
      return;
    }
    setAutoAssigning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/wireframes/auto-assign`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "Failed to auto-assign wireframes");
      } else {
        alert("Wireframes auto-generated successfully.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setAutoAssigning(false);
    }
  }, [projectId]);

  return (
    <div className="glass-panel-strong overflow-hidden rounded-[32px]">
      <div className="flex min-h-[720px]">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="section-label">Canvas</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span>{nodes.length} node{nodes.length === 1 ? "" : "s"}</span>
                <span className="text-slate-600">/</span>
                <span>Plan-aware sections</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="ai-panel-toggle"
                onClick={() => setAiPanelOpen((open) => !open)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  aiPanelOpen
                    ? "bg-brand-400 text-slate-950"
                    : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                }`}
              >
                <Bot className="h-4 w-4" />
                AI tools
              </button>

              <button
                onClick={autoAssignWireframes}
                disabled={autoAssigning}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.08] disabled:opacity-50"
                title="Auto-generate wireframes for all pages (3 credits)"
              >
                <WandSparkles className="h-4 w-4 text-brand-300" />
                {autoAssigning ? "Assigning..." : "Auto-assign wireframes"}
              </button>

              <button id="sitemap-add-page" onClick={() => addNode(null)} className="button-primary gap-2">
                <Sparkles className="h-4 w-4" />
                Add page
              </button>
            </div>
          </div>

          <div className="relative flex-1">
            {generating && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950/70 backdrop-blur-md">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2.5 w-2.5 rounded-full bg-brand-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-200">Generating sitemap...</p>
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

        <div
          className={`shrink-0 border-l border-white/8 bg-black/10 transition-all duration-200 ${
            selectedNode ? "w-[340px]" : "w-0 overflow-hidden"
          }`}
        >
          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              saving={!!saving[selectedNode.id]}
              onUpdate={(updates) => updateNode(selectedNode.id, updates)}
              onDelete={() => deleteNode(selectedNode.id)}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>

        <div
          className={`shrink-0 border-l border-white/8 bg-black/10 transition-all duration-200 ${
            aiPanelOpen ? "w-[340px]" : "w-0 overflow-hidden"
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
    </div>
  );
}
