"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import BlockLibrary from "./BlockLibrary";
import WireframeBlock, { BLOCK_LAYOUT_VARIANTS, DEFAULT_LAYOUTS } from "./WireframeBlock";
import { estimateCredits, formatCreditsUsd, ModelId } from "@/lib/credits";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlockType =
  | "Hero" | "Navbar" | "Cards" | "CTA" | "Form"
  | "Footer" | "Text" | "Image" | "Table";

export interface Block {
  id: string;
  node_id: string;
  type: string;
  order_index: number;
  props: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface SitemapNodeRef {
  id: string;
  label: string;
  type: string;
}

type Transform = { x: number; y: number; scale: number };

interface Props {
  projectId: string;
  nodes: SitemapNodeRef[];
  selectedNodeId: string | null;
  initialBlocks: Block[];
}

// ─── Default block props ──────────────────────────────────────────────────────

const BLOCK_DEFAULTS: Record<BlockType, Record<string, unknown>> = {
  Navbar:  { title: "My App", links: ["Home", "About", "Contact"] },
  Hero:    { headline: "Welcome", subheadline: "Start building something great", cta: "Get Started" },
  Cards:   { count: 3, title: "Features" },
  CTA:     { headline: "Ready to start?", cta: "Sign Up Free" },
  Form:    { fields: ["Name", "Email", "Message"], submitLabel: "Send" },
  Footer:  { columns: 3, copyright: "© 2024" },
  Text:    { content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  Image:   { alt: "Image placeholder", caption: "" },
  Table:   { columns: ["Name", "Status", "Date"], rows: 5 },
};

// ─── AI tier config (mirrors AiPanel) ────────────────────────────────────────

type TierId = ModelId;

interface Tier {
  id: TierId;
  tier: "Starter" | "Pro" | "Max";
  modelLabel: string;
  provider: "google" | "deepseek" | "anthropic";
  dot: string;
  locked?: boolean;
}

const TIERS: Tier[] = [
  { id: "deepseek-chat",     tier: "Starter", modelLabel: "deepseek-v4-flash", provider: "deepseek",  dot: "bg-green-400" },
  { id: "claude-sonnet-4-5", tier: "Pro",     modelLabel: "claude-sonnet-4.5", provider: "anthropic", dot: "bg-red-400" },
  { id: "gpt-5.5",           tier: "Max",     modelLabel: "gpt-5.5",           provider: "openai",    dot: "bg-purple-400", locked: true },
];

// ─── Rule-based scaffold ──────────────────────────────────────────────────────

function getDefaultBlocksForPage(label: string) {
  const l = label.toLowerCase();
  const is = (kw: string[]) => kw.some((k) => l.includes(k));

  if (is(["login", "sign in", "signin", "register", "auth", "signup", "sign up"])) {
    return [
      { type: "Navbar" as BlockType, layout: "minimal" },
      { type: "Form"   as BlockType, layout: "card" },
      { type: "Footer" as BlockType, layout: "centered" },
    ];
  }
  if (is(["contact", "support", "help"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Hero"   as BlockType, layout: "minimal" },
      { type: "Form"   as BlockType, layout: "card" },
      { type: "Footer" as BlockType, layout: "simple" },
    ];
  }
  if (is(["pricing", "plans", "billing"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Hero"   as BlockType, layout: "minimal" },
      { type: "Cards"  as BlockType, layout: "grid-3" },
      { type: "CTA"    as BlockType, layout: "banner" },
      { type: "Footer" as BlockType, layout: "columns" },
    ];
  }
  if (is(["about", "team", "company", "mission"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Hero"   as BlockType, layout: "split" },
      { type: "Text"   as BlockType, layout: "two-column" },
      { type: "Cards"  as BlockType, layout: "grid-2" },
      { type: "Footer" as BlockType, layout: "columns" },
    ];
  }
  if (is(["blog", "article", "post", "news", "press"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Hero"   as BlockType, layout: "minimal" },
      { type: "Text"   as BlockType, layout: "body" },
      { type: "Cards"  as BlockType, layout: "grid-2" },
      { type: "Footer" as BlockType, layout: "simple" },
    ];
  }
  if (is(["dashboard", "admin", "analytics", "overview", "app"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Cards"  as BlockType, layout: "grid-2" },
      { type: "Table"  as BlockType, layout: "basic" },
      { type: "Footer" as BlockType, layout: "simple" },
    ];
  }
  // Default: landing/home
  return [
    { type: "Navbar" as BlockType, layout: "default" },
    { type: "Hero"   as BlockType, layout: "centered" },
    { type: "Cards"  as BlockType, layout: "grid-3" },
    { type: "CTA"    as BlockType, layout: "banner" },
    { type: "Footer" as BlockType, layout: "columns" },
  ];
}

// ─── Tier dropdown (for Assign Layouts modal) ─────────────────────────────────

function TierDropdown({
  value,
  onChange,
  disabled,
}: {
  value: TierId;
  onChange: (id: TierId) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = TIERS.find((t) => t.id === value)!;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-xs bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot}`} />
          <span className="font-medium">{selected.tier}</span>
          <span className="text-gray-500 truncate">
            {selected.modelLabel} · {estimateCredits(selected.id).label} cr
          </span>
        </span>
        <svg
          className={`w-3 h-3 text-gray-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (!t.locked) {
                  onChange(t.id);
                  setOpen(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-gray-800 transition-colors text-left group relative ${
                t.id === value ? "bg-gray-800/60" : ""
              } ${t.locked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
              <span className="font-medium text-white w-12 shrink-0 flex items-center gap-1.5">
                {t.tier}
                {t.locked && (
                  <svg className="w-2.5 h-2.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                )}
              </span>
              <span className="text-gray-400">{t.modelLabel}</span>
              <span className="ml-auto text-gray-500 shrink-0">
                {estimateCredits(t.id).label} cr
              </span>

              {t.locked && (
                <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 w-48 p-2.5 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-[60]">
                  <p className="text-[10px] leading-relaxed text-gray-300">
                    Avaidable at Pro Plan.{" "}
                    <span className="text-brand-400 underline decoration-brand-400/30">View plans --&gt;</span>
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Assign Layouts modal ─────────────────────────────────────────────────────

function AssignLayoutsModal({
  projectId,
  pageCount,
  onClose,
  onSuccess,
}: {
  projectId: string;
  pageCount: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tierId, setTierId] = useState<TierId>("deepseek-chat");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    pages_updated: number;
    credits_used: number;
    credits_cost_usd: number;
    credits_remaining: number | null;
    byok: boolean;
  } | null>(null);

  const tier = TIERS.find((t) => t.id === tierId)!;

  async function handleAssign() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/wireframes/assign-layouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: tier.id, provider: tier.provider }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Assignment failed. Please try again.");
        return;
      }
      setResult(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-base">✦</span>
              Assign Layouts with AI
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              AI will analyze your sitemap and assign the optimal block layout for each page
              ({pageCount} page{pageCount !== 1 ? "s" : ""}).
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-colors text-sm"
          >
            ×
          </button>
        </div>

        {!result ? (
          <>
            {/* Model picker */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                AI Model
              </label>
              <TierDropdown value={tierId} onChange={setTierId} disabled={loading} />
            </div>

            {/* Info box */}
            <div className="p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-xs text-gray-400 space-y-1">
              <p>Existing wireframe blocks for all pages will be replaced.</p>
              <p className="text-gray-500">
                Cost: {estimateCredits(tier.id).label} credits
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 text-xs py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={loading}
                className="flex-1 text-xs py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-white animate-bounce"
                          style={{ animationDelay: `${i * 0.12}s` }}
                        />
                      ))}
                    </div>
                    Assigning…
                  </>
                ) : (
                  `Assign ${pageCount} Page${pageCount !== 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="space-y-4">
            <div className="p-3 bg-green-900/20 border border-green-800/40 rounded-xl text-xs space-y-1">
              <p className="text-green-300 font-medium">
                ✓ Layouts assigned to {result.pages_updated} page{result.pages_updated !== 1 ? "s" : ""}
              </p>
              {result.byok ? (
                <p className="text-gray-400">Using your own API key — no credits deducted</p>
              ) : (
                <p className="text-gray-400">
                  Used <span className="text-white font-medium">{result.credits_used} credits</span>
                  {result.credits_remaining !== null && (
                    <> · <span className="text-white font-medium">{result.credits_remaining}</span> remaining</>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="w-full text-xs py-2 bg-brand-600 hover:bg-brand-500 rounded-lg font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WireframeEditor({
  projectId,
  nodes,
  selectedNodeId,
  initialBlocks,
}: Props) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(selectedNodeId);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [draggingOver, setDraggingOver] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [scaffolding, setScaffolding] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);

  const apiBase = activeNodeId
    ? `/api/projects/${projectId}/wireframes/${activeNodeId}`
    : null;

  const pageNodes = nodes.filter((n) => n.type === "page");
  const activeNode = nodes.find((n) => n.id === activeNodeId) ?? null;

  // Centre canvas on mount
  useEffect(() => {
    if (!initialized.current && canvasRef.current) {
      initialized.current = true;
      const { width } = canvasRef.current.getBoundingClientRect();
      setTransform({ x: width / 2 - 200, y: 40, scale: 1 });
    }
  }, []);

  // Reload blocks when node changes
  useEffect(() => {
    if (!activeNodeId) { setBlocks([]); return; }
    fetch(`/api/projects/${projectId}/wireframes/${activeNodeId}`)
      .then((r) => r.json())
      .then((j) => setBlocks((j.data ?? []) as Block[]))
      .catch(() => {});
  }, [activeNodeId, projectId]);

  // ── Pan ────────────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-block]")) return;
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform((t) => {
      const newScale = Math.max(0.3, Math.min(3, t.scale * factor));
      const r = newScale / t.scale;
      return { x: mx + (t.x - mx) * r, y: my + (t.y - my) * r, scale: newScale };
    });
  }, []);

  // ── Drop from library ──────────────────────────────────────────────────────
  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDraggingOver(false);
      if (!apiBase || !activeNodeId) return;

      const blockType = e.dataTransfer.getData("blockType") as BlockType;
      if (!blockType) return;

      const layout = DEFAULT_LAYOUTS[blockType] ?? "default";

      const tempId = `temp-${Date.now()}`;
      const optimisticBlock: Block = {
        id: tempId,
        node_id: activeNodeId,
        type: blockType,
        order_index: blocks.length,
        props: { ...BLOCK_DEFAULTS[blockType] ?? {}, layout },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBlocks((prev) => [...prev, optimisticBlock]);
      setSelectedBlockId(tempId);

      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: blockType,
          order_index: blocks.length,
          props: { ...BLOCK_DEFAULTS[blockType] ?? {}, layout },
        }),
      });
      if (!res.ok) {
        setBlocks((prev) => prev.filter((b) => b.id !== tempId));
        setSelectedBlockId(null);
        return;
      }
      const { data } = await res.json();
      setBlocks((prev) => prev.map((b) => (b.id === tempId ? (data as Block) : b)));
      setSelectedBlockId((data as Block).id);
    },
    [apiBase, activeNodeId, blocks.length]
  );

  // ── Scaffold current page ──────────────────────────────────────────────────
  const scaffoldPage = useCallback(async () => {
    if (!apiBase || !activeNodeId || !activeNode) return;
    setScaffolding(true);
    const defaultBlocks = getDefaultBlocksForPage(activeNode.label);
    for (const [i, b] of defaultBlocks.entries()) {
      await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: b.type,
          order_index: i,
          props: { ...BLOCK_DEFAULTS[b.type], layout: b.layout },
        }),
      });
    }
    const res = await fetch(apiBase);
    const json = await res.json();
    setBlocks((json.data ?? []) as Block[]);
    setScaffolding(false);
  }, [apiBase, activeNodeId, activeNode]);

  // ── Reload current page blocks (after AI assign) ───────────────────────────
  const reloadBlocks = useCallback(() => {
    if (!activeNodeId) return;
    fetch(`/api/projects/${projectId}/wireframes/${activeNodeId}`)
      .then((r) => r.json())
      .then((j) => setBlocks((j.data ?? []) as Block[]))
      .catch(() => {});
  }, [activeNodeId, projectId]);

  // ── Block update ───────────────────────────────────────────────────────────
  const updateBlock = useCallback(
    async (blockId: string, props: Record<string, unknown>) => {
      if (!activeNodeId) return;
      const res = await fetch(
        `/api/projects/${projectId}/wireframes/${activeNodeId}/${blockId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ props }),
        }
      );
      if (!res.ok) return;
      const { data } = await res.json();
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? (data as Block) : b)));
    },
    [projectId, activeNodeId]
  );

  // ── Block delete ───────────────────────────────────────────────────────────
  const deleteBlock = useCallback(
    async (blockId: string) => {
      if (!activeNodeId) return;
      await fetch(`/api/projects/${projectId}/wireframes/${activeNodeId}/${blockId}`, {
        method: "DELETE",
      });
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      if (selectedBlockId === blockId) setSelectedBlockId(null);
    },
    [projectId, activeNodeId, selectedBlockId]
  );

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

  return (
    <>
      <div className="flex h-[calc(100vh-10rem)] min-h-[600px] rounded-xl overflow-hidden border border-gray-800">
        {/* ── Left sidebar: Block library ──────────────────────────────── */}
        <BlockLibrary disabled={!activeNodeId} />

        {/* ── Main canvas area ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0 flex-wrap">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Page</span>
            {nodes.length > 0 ? (
              <select
                id="wireframe-node-picker"
                value={activeNodeId ?? ""}
                onChange={(e) => {
                  setActiveNodeId(e.target.value || null);
                  setSelectedBlockId(null);
                }}
                className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— pick a page —</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-gray-600">No pages — create some in the sitemap first</span>
            )}

            {/* Scaffold button (only when page selected + empty) */}
            {activeNodeId && blocks.length === 0 && !scaffolding && (
              <button
                onClick={scaffoldPage}
                className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-300 font-medium transition-colors"
                title="Auto-generate blocks from sitemap page type"
              >
                Scaffold
              </button>
            )}
            {scaffolding && (
              <span className="text-xs text-gray-500">Scaffolding…</span>
            )}

            <div className="ml-auto flex items-center gap-2">
              {/* Assign Layouts AI button */}
              {pageNodes.length > 0 && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-xs px-3 py-1.5 bg-brand-900/40 hover:bg-brand-800/60 border border-brand-700/50 hover:border-brand-600/70 rounded-lg text-brand-300 font-semibold transition-colors flex items-center gap-1.5"
                  title="Use AI to assign optimal layouts for all pages"
                >
                  <span className="text-[11px]">✦</span>
                  Assign Layouts
                </button>
              )}

              <button
                id="wireframe-zoom-in"
                onClick={() => setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.2) }))}
                className="w-7 h-7 bg-gray-800 border border-gray-700 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center text-base font-light"
              >+</button>
              <button
                id="wireframe-zoom-out"
                onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.3, t.scale * 0.8) }))}
                className="w-7 h-7 bg-gray-800 border border-gray-700 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center text-base font-light"
              >−</button>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            id="wireframe-canvas"
            className="flex-1 relative overflow-hidden select-none"
            style={{ background: "#0f172a", cursor: dragging.current ? "grabbing" : "grab" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={onDrop}
          >
            {/* Drop indicator */}
            {draggingOver && (
              <div className="absolute inset-0 border-2 border-brand-500/50 rounded pointer-events-none z-10 bg-brand-500/5" />
            )}

            {!activeNodeId ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="text-4xl mb-1">🗺</div>
                <p className="text-gray-400 text-sm font-medium">Select a page to start wireframing</p>
                <p className="text-gray-600 text-xs">Then drag blocks from the left panel, or use Scaffold / Assign Layouts</p>
                {pageNodes.length > 0 && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="mt-2 text-xs px-4 py-2 bg-brand-900/40 hover:bg-brand-800/60 border border-brand-700/50 rounded-lg text-brand-300 font-semibold transition-colors flex items-center gap-2"
                  >
                    <span className="text-sm">✦</span>
                    Assign Layouts for All Pages
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  transformOrigin: "0 0",
                  transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
                }}
              >
                {/* Page frame */}
                <div
                  className="relative bg-gray-800/40 border border-gray-700/60 rounded-xl overflow-hidden"
                  style={{ width: 400 }}
                >
                  {/* Browser chrome */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-900/80 border-b border-gray-700/60">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    <div className="flex-1 mx-2 h-4 bg-gray-700/60 rounded text-[9px] text-gray-500 px-2 flex items-center">
                      {activeNode?.label ?? "Page"}
                    </div>
                  </div>

                  {/* Blocks */}
                  {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <p className="text-gray-600 text-xs">Drop blocks here</p>
                      <button
                        onClick={scaffoldPage}
                        disabled={scaffolding}
                        className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                      >
                        {scaffolding ? "Scaffolding…" : "Auto-scaffold from sitemap"}
                      </button>
                    </div>
                  ) : (
                    <div>
                      {[...blocks]
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((block) => (
                          <WireframeBlock
                            key={block.id}
                            block={block}
                            isSelected={selectedBlockId === block.id}
                            onSelect={() =>
                              setSelectedBlockId((prev) =>
                                prev === block.id ? null : block.id
                              )
                            }
                            onDelete={() => deleteBlock(block.id)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Zoom label */}
            <div className="absolute bottom-3 left-3 text-xs text-gray-700 font-mono tabular-nums">
              {Math.round(transform.scale * 100)}%
            </div>
          </div>
        </div>

        {/* ── Right panel: Block props ─────────────────────────────────── */}
        <div
          className={`shrink-0 border-l border-gray-800 bg-gray-900 transition-all duration-200 overflow-auto ${
            selectedBlock ? "w-64" : "w-0 overflow-hidden"
          }`}
        >
          {selectedBlock && (
            <BlockPropsPanel
              block={selectedBlock}
              onUpdate={(props) => updateBlock(selectedBlock.id, props)}
            />
          )}
        </div>
      </div>

      {/* Assign Layouts modal */}
      {showAssignModal && (
        <AssignLayoutsModal
          projectId={projectId}
          pageCount={pageNodes.length}
          onClose={() => setShowAssignModal(false)}
          onSuccess={reloadBlocks}
        />
      )}
    </>
  );
}

// ─── Block props panel ────────────────────────────────────────────────────────

function BlockPropsPanel({
  block,
  onUpdate,
}: {
  block: Block;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const [localProps, setLocalProps] = useState<Record<string, unknown>>(block.props);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocalProps(block.props);
    setDirty(false);
  }, [block.id, block.props]);

  function handleChange(key: string, value: unknown) {
    setLocalProps((p) => ({ ...p, [key]: value }));
    setDirty(true);
  }

  const variants = BLOCK_LAYOUT_VARIANTS[block.type] ?? [];
  const currentLayout = (localProps.layout as string) || DEFAULT_LAYOUTS[block.type] || "default";

  // Non-layout props
  const otherProps = Object.entries(localProps).filter(([k]) => k !== "layout");

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{block.type}</h3>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Props</span>
      </div>

      {/* Layout picker */}
      {variants.length > 0 && (
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
            Layout
          </label>
          <div className="grid grid-cols-2 gap-1">
            {variants.map((variant) => (
              <button
                key={variant}
                onClick={() => {
                  setLocalProps((p) => ({ ...p, layout: variant }));
                  setDirty(true);
                }}
                className={`text-[11px] py-1.5 px-2 rounded border transition-colors text-left truncate ${
                  currentLayout === variant
                    ? "bg-brand-900/40 border-brand-600/60 text-brand-300 font-semibold"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                }`}
              >
                {variant}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Other props */}
      {otherProps.length > 0 && (
        <div className="space-y-3">
          {otherProps.map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1 capitalize">
                {key.replace(/_/g, " ")}
              </label>
              {Array.isArray(value) ? (
                <textarea
                  id={`prop-${block.id}-${key}`}
                  rows={3}
                  value={(value as string[]).join("\n")}
                  onChange={(e) => handleChange(key, e.target.value.split("\n"))}
                  className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono"
                />
              ) : typeof value === "number" ? (
                <input
                  id={`prop-${block.id}-${key}`}
                  type="number"
                  value={value}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <input
                  id={`prop-${block.id}-${key}`}
                  type="text"
                  value={String(value ?? "")}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {dirty && (
        <button
          id="wireframe-save-props"
          onClick={() => { onUpdate(localProps); setDirty(false); }}
          className="w-full text-xs py-2 bg-brand-600 hover:bg-brand-500 rounded-lg font-semibold transition-colors"
        >
          Save changes
        </button>
      )}
    </div>
  );
}
