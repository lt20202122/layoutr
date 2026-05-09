"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import BlockLibrary from "./BlockLibrary";
import WireframeBlock, { BLOCK_LAYOUT_VARIANTS, DEFAULT_LAYOUTS } from "./WireframeBlock";
import { estimateCredits, ModelId } from "@/lib/credits";
import { PLAN_ALLOWED_MODELS } from "@/lib/plans";
import { mapSectionToBlock, Section } from "../sitemap/sitemapUtils";
import {
  createGuestWireframeBlock,
  deleteGuestWireframeBlock,
  listGuestWireframeBlocks,
  updateGuestWireframeBlock,
} from "@/lib/guest-storage";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type BlockType =
  | "Hero" | "Navbar" | "Cards" | "CTA" | "Form"
  | "Footer" | "Text" | "Image" | "Table";

export interface Block {
  id: string;
  node_id: string;
  type: string;
  label?: string | null;
  composition?: any[] | null;
  order_index: number;
  props: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface SitemapNodeRef {
  id: string;
  label: string;
  type: string;
  metadata?: {
    sections?: Section[];
  } | null;
}

type Transform = { x: number; y: number; scale: number };

interface Props {
  projectId: string;
  nodes: SitemapNodeRef[];
  selectedNodeId: string | null;
  initialBlocks: Block[];
  userPlan: string;
  guestMode?: boolean;
}

// â”€â”€â”€ Default block props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BLOCK_DEFAULTS: Record<BlockType, Record<string, unknown>> = {
  Navbar: { title: "My App", links: ["Home", "About", "Contact"] },
  Hero: { headline: "Welcome", subheadline: "Start building something great", cta: "Get Started" },
  Cards: { count: 3, title: "Features" },
  CTA: { headline: "Ready to start?", cta: "Sign Up Free" },
  Form: { fields: ["Name", "Email", "Message"], submitLabel: "Send" },
  Footer: { columns: 3, copyright: "Â© 2024" },
  Text: { content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  Image: { alt: "Image placeholder", caption: "" },
  Table: { columns: ["Name", "Status", "Date"], rows: 5 },
};

// â”€â”€â”€ AI tier config (mirrors AiPanel) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type TierId = ModelId;

interface Tier {
  id: TierId;
  tier: "Starter" | "Pro" | "Max";
  modelLabel: string;
  provider: "google" | "deepseek" | "anthropic" | "openai";
  dot: string;
  locked?: boolean;
}

const TIERS: Tier[] = [
  { id: "deepseek-chat", tier: "Starter", modelLabel: "deepseek-v4-flash", provider: "deepseek", dot: "bg-green-400" },
  { id: "claude-sonnet-4-5", tier: "Pro", modelLabel: "claude-sonnet-4.5", provider: "anthropic", dot: "bg-red-400" },
  { id: "gpt-5.5", tier: "Max", modelLabel: "gpt-5.5", provider: "openai", dot: "bg-purple-400" },
];

// â”€â”€â”€ Rule-based scaffold â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getDefaultBlocksForPage(label: string, sections?: Section[]) {
  if (sections && sections.length > 0) {
    return sections.map((s) => mapSectionToBlock(s.label));
  }
  const l = label.toLowerCase();
  const is = (kw: string[]) => kw.some((k) => l.includes(k));

  if (is(["login", "sign in", "signin", "register", "auth", "signup", "sign up"])) {
    return [
      { type: "Navbar" as BlockType, layout: "minimal" },
      { type: "Form" as BlockType, layout: "card" },
      { type: "Footer" as BlockType, layout: "centered" },
    ];
  }
  if (is(["contact", "support", "help"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Hero" as BlockType, layout: "minimal" },
      { type: "Form" as BlockType, layout: "card" },
      { type: "Footer" as BlockType, layout: "simple" },
    ];
  }
  if (is(["pricing", "plans", "billing"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Hero" as BlockType, layout: "minimal" },
      { type: "Cards" as BlockType, layout: "grid-3" },
      { type: "CTA" as BlockType, layout: "banner" },
      { type: "Footer" as BlockType, layout: "columns" },
    ];
  }
  if (is(["about", "team", "company", "mission"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Hero" as BlockType, layout: "split" },
      { type: "Text" as BlockType, layout: "two-column" },
      { type: "Cards" as BlockType, layout: "grid-2" },
      { type: "Footer" as BlockType, layout: "columns" },
    ];
  }
  if (is(["blog", "article", "post", "news", "press"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Hero" as BlockType, layout: "minimal" },
      { type: "Text" as BlockType, layout: "body" },
      { type: "Cards" as BlockType, layout: "grid-2" },
      { type: "Footer" as BlockType, layout: "simple" },
    ];
  }
  if (is(["dashboard", "admin", "analytics", "overview", "app"])) {
    return [
      { type: "Navbar" as BlockType, layout: "default" },
      { type: "Cards" as BlockType, layout: "grid-2" },
      { type: "Table" as BlockType, layout: "basic" },
      { type: "Footer" as BlockType, layout: "simple" },
    ];
  }
  // Default: landing/home
  return [
    { type: "Navbar" as BlockType, layout: "default" },
    { type: "Hero" as BlockType, layout: "centered" },
    { type: "Cards" as BlockType, layout: "grid-3" },
    { type: "CTA" as BlockType, layout: "banner" },
    { type: "Footer" as BlockType, layout: "columns" },
  ];
}

// â”€â”€â”€ Tier dropdown (for Assign Layouts modal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TierDropdown({
  value,
  onChange,
  disabled,
  userPlan,
}: {
  value: TierId;
  onChange: (id: TierId) => void;
  disabled?: boolean;
  userPlan: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = TIERS.find((t) => t.id === value)!;

  // Compute allowed models dynamically
  const allowedModels = PLAN_ALLOWED_MODELS[userPlan as keyof typeof PLAN_ALLOWED_MODELS] || PLAN_ALLOWED_MODELS.free;
  const tiersWithLock = TIERS.map((t) => ({ ...t, locked: !allowedModels.includes(t.id) }));

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
            {selected.modelLabel} Â· {estimateCredits(selected.id).label} cr
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
          {tiersWithLock.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (!t.locked) {
                  onChange(t.id);
                  setOpen(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-gray-800 transition-colors text-left group relative ${t.id === value ? "bg-gray-800/60" : ""
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
                    Model not available on {userPlan} plan.{" "}
                    <a href="/pricing" className="text-brand-400 underline decoration-brand-400/30">View plans --&gt;</a>
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

// â”€â”€â”€ Assign Layouts modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AssignLayoutsModal({
  projectId,
  pageCount,
  onClose,
  onSuccess,
  userPlan,
}: {
  projectId: string;
  pageCount: number;
  onClose: () => void;
  onSuccess: () => void;
  userPlan: string;
}) {
  const [tierId, setTierId] = useState<TierId>("deepseek-chat");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    pages_updated: number;
    credits_used: number;
    credits_cost_usd: number;
    credits_remaining: number | null;
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="glass-panel-strong relative w-full max-w-md rounded-[30px] p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-base">*</span>
              Assign Layouts with AI
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              AI will analyze your sitemap and assign the optimal block layout for each page ({pageCount} page{pageCount !== 1 ? "s" : ""}).
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-full border border-white/10 p-2 text-slate-400 hover:text-white">
            x
          </button>
        </div>

        {!result ? (
          <>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">AI Model</label>
              <TierDropdown value={tierId} onChange={setTierId} disabled={loading} userPlan={userPlan} />
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-400 space-y-1">
              <p>Existing wireframe blocks for all pages will be replaced.</p>
              <p className="text-slate-500">Cost: {estimateCredits(tier.id).label} credits</p>
            </div>

            {error && (
              <div className="rounded-[22px] border border-red-300/20 bg-red-500/10 p-4 text-xs text-red-100">{error}</div>
            )}

            <div className="flex gap-2">
              <button onClick={onClose} className="button-secondary flex-1 justify-center rounded-full text-xs">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={loading}
                className="button-primary flex-1 justify-center rounded-full text-xs disabled:opacity-50"
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
                    Assigning...
                  </>
                ) : (
                  `Assign ${pageCount} Page${pageCount !== 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-400/10 p-4 text-xs space-y-1">
              <p className="text-emerald-100 font-medium">
                Layouts assigned to {result.pages_updated} page{result.pages_updated !== 1 ? "s" : ""}
              </p>
              <p className="text-slate-300">
                Used <span className="text-white font-medium">{result.credits_used} credits</span>
                {result.credits_remaining !== null && (
                  <> - <span className="text-white font-medium">{result.credits_remaining}</span> remaining</>
                )}
              </p>
            </div>
            <button onClick={() => { onSuccess(); onClose(); }} className="button-primary w-full justify-center rounded-full text-xs">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function WireframeEditor({
  projectId,
  nodes,
  selectedNodeId,
  initialBlocks,
  userPlan,
  guestMode = false,
}: Props) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(selectedNodeId);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [draggingOver, setDraggingOver] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [scaffolding, setScaffolding] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

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
    if (guestMode) {
      setBlocks(listGuestWireframeBlocks(activeNodeId) as Block[]);
      return;
    }
    fetch(`/api/projects/${projectId}/wireframes/${activeNodeId}`)
      .then((r) => r.json())
      .then((j) => setBlocks((j.data ?? []) as Block[]))
      .catch(() => { });
  }, [guestMode, activeNodeId, projectId]);

  // â”€â”€ Pan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Drop from library â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      if (guestMode) {
        const data = createGuestWireframeBlock(projectId, activeNodeId, {
          type: blockType,
          order_index: blocks.length,
          props: { ...(BLOCK_DEFAULTS[blockType] ?? {}), layout },
        });
        setBlocks((prev) => prev.map((b) => (b.id === tempId ? data : b)));
        setSelectedBlockId(data.id);
        return;
      }

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
    [guestMode, apiBase, activeNodeId, blocks.length, projectId]
  );

  // â”€â”€ Scaffold current page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const scaffoldPage = useCallback(async () => {
    if (!apiBase || !activeNodeId || !activeNode) return;
    setScaffolding(true);
    const defaultBlocks = getDefaultBlocksForPage(activeNode.label, activeNode.metadata?.sections);

    if (guestMode) {
      const nextBlocks = defaultBlocks.map((block, index) =>
        createGuestWireframeBlock(projectId, activeNodeId, {
          type: block.type,
          order_index: index,
          props: { ...BLOCK_DEFAULTS[block.type as BlockType], layout: block.layout },
        })
      );
      setBlocks(nextBlocks);
      setScaffolding(false);
      return;
    }

    for (const [i, b] of defaultBlocks.entries()) {
      await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: b.type,
          order_index: i,
          props: { ...BLOCK_DEFAULTS[b.type as BlockType], layout: b.layout },
        }),
      });
    }
    const res = await fetch(apiBase);
    const json = await res.json();
    setBlocks((json.data ?? []) as Block[]);
    setScaffolding(false);
  }, [guestMode, apiBase, activeNodeId, activeNode, projectId]);

  // â”€â”€ Auto-assign all pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const autoAssignAllPages = useCallback(async () => {
    if (guestMode) return;
    setAutoAssigning(true);
    try {
      await fetch(`/api/projects/${projectId}/wireframes/auto-assign`, {
        method: "POST",
      });
      if (activeNodeId) {
        const res = await fetch(`/api/projects/${projectId}/wireframes/${activeNodeId}`);
        const json = await res.json();
        setBlocks((json.data ?? []) as Block[]);
      }
    } catch {
    } finally {
      setAutoAssigning(false);
    }
  }, [guestMode, projectId, activeNodeId]);

  // â”€â”€ Reload current page blocks (after AI assign) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const reloadBlocks = useCallback(() => {
    if (!activeNodeId) return;
    if (guestMode) {
      setBlocks(listGuestWireframeBlocks(activeNodeId) as Block[]);
      return;
    }
    fetch(`/api/projects/${projectId}/wireframes/${activeNodeId}`)
      .then((r) => r.json())
      .then((j) => setBlocks((j.data ?? []) as Block[]))
      .catch(() => { });
  }, [guestMode, activeNodeId, projectId]);

  // â”€â”€ Block update â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const updateBlock = useCallback(
    async (blockId: string, updates: Partial<Block>) => {
      if (!activeNodeId) return;
      if (guestMode) {
        const data = updateGuestWireframeBlock(projectId, activeNodeId, blockId, updates);
        if (!data) return;
        setBlocks((prev) => prev.map((b) => (b.id === blockId ? data : b)));
        return;
      }
      const res = await fetch(
        `/api/projects/${projectId}/wireframes/${activeNodeId}/${blockId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      if (!res.ok) return;
      const { data } = await res.json();
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? (data as Block) : b)));
    },
    [guestMode, projectId, activeNodeId]
  );

  // â”€â”€ Block delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const deleteBlock = useCallback(
    async (blockId: string) => {
      if (!activeNodeId) return;
      if (guestMode) {
        deleteGuestWireframeBlock(projectId, activeNodeId, blockId);
      } else {
        await fetch(`/api/projects/${projectId}/wireframes/${activeNodeId}/${blockId}`, {
          method: "DELETE",
        });
      }
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      if (selectedBlockId === blockId) setSelectedBlockId(null);
    },
    [guestMode, projectId, activeNodeId, selectedBlockId]
  );

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

  return (
    <>
      <div className="glass-panel-strong flex min-h-[720px] overflow-hidden rounded-[32px]">
        <BlockLibrary disabled={!activeNodeId} />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 shrink-0 flex-wrap">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Page</span>
            {nodes.length > 0 ? (
              <select
                id="wireframe-node-picker"
                value={activeNodeId ?? ""}
                onChange={(e) => {
                  setActiveNodeId(e.target.value || null);
                  setSelectedBlockId(null);
                }}
                className="field w-auto min-w-[220px] py-2.5"
              >
                <option value="">Pick a page</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-600">No pages yet. Create them in the sitemap first.</span>
            )}

            {activeNodeId && blocks.length === 0 && !scaffolding && (
              <button
                onClick={scaffoldPage}
                className="button-secondary rounded-full px-4 py-2 text-xs"
                title="Auto-generate blocks from sitemap page type"
              >
                Scaffold
              </button>
            )}
            {scaffolding && <span className="text-xs text-slate-500">Scaffolding...</span>}

            <div className="ml-auto flex items-center gap-2">
              {pageNodes.length > 0 && (
                <button
                  onClick={autoAssignAllPages}
                  disabled={autoAssigning || guestMode}
                  className="button-secondary rounded-full px-4 py-2 text-xs disabled:opacity-50"
                  title={guestMode ? "Requires an account for credit-based generation" : "Auto-generate blocks for all pages (3 credits)"}
                >
                  {guestMode ? "Auto-assign locked" : autoAssigning ? "Auto-assigning..." : "Auto-assign All"}
                </button>
              )}

              {pageNodes.length > 0 && (
                <button
                  onClick={() => !guestMode && setShowAssignModal(true)}
                  disabled={guestMode}
                  className="button-primary rounded-full px-4 py-2 text-xs disabled:opacity-50"
                  title={guestMode ? "Requires an account for AI layout assignment" : "Use AI to assign optimal layouts for all pages"}
                >
                  {guestMode ? "AI layouts locked" : "Assign Layouts"}
                </button>
              )}

              <button
                id="wireframe-zoom-in"
                onClick={() => setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.2) }))}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-slate-300"
              >+</button>
              <button
                id="wireframe-zoom-out"
                onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.3, t.scale * 0.8) }))}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-slate-300"
              >-</button>
            </div>
          </div>

          <div
            ref={canvasRef}
            id="wireframe-canvas"
            className="flex-1 relative overflow-hidden select-none"
            style={{
              background:
                "linear-gradient(180deg,#07111f,#091423)",
              cursor: dragging.current ? "grabbing" : "grab",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={onDrop}
          >
            {draggingOver && (
              <div className="absolute inset-0 border-2 border-brand-300/40 pointer-events-none z-10 bg-brand-300/10" />
            )}

            {!activeNodeId ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Wireframe canvas</div>
                <p className="text-white text-lg font-medium">Select a page to start wireframing</p>
                <p className="text-slate-500 text-sm">Drag blocks from the left panel, scaffold a layout, or assign layouts across all pages.</p>
                {pageNodes.length > 0 && (
                  guestMode ? (
                    <div className="mt-2 rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
                      Guest mode supports manual wireframing and local scaffolding.{" "}
                      <Link href="/auth/signup" className="text-brand-200 hover:text-white">
                        Create an account
                      </Link>{" "}
                      to unlock AI layouts, credits, API access, and MCP tools.
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="button-primary mt-2 rounded-full"
                    >
                      Assign Layouts for All Pages
                    </button>
                  )
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
                <div
                  className="relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/80 shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
                  style={{ width: 400 }}
                >
                  <div className="flex items-center gap-1.5 border-b border-white/8 bg-black/10 px-3 py-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-300/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-300/70" />
                    <div className="mx-2 flex h-5 flex-1 items-center rounded-full bg-white/[0.04] px-3 text-[10px] text-slate-500">
                      {activeNode?.label ?? "Page"}
                    </div>
                  </div>

                  {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <p className="text-slate-500 text-xs">Drop blocks here</p>
                      <button
                        onClick={scaffoldPage}
                        disabled={scaffolding}
                        className="button-secondary rounded-full px-4 py-2 text-xs disabled:opacity-50"
                      >
                        {scaffolding ? "Scaffolding..." : "Auto-scaffold from sitemap"}
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

            <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-400 font-mono tabular-nums">
              {Math.round(transform.scale * 100)}%
            </div>
          </div>
        </div>

        <div
          className={`shrink-0 border-l border-white/8 bg-black/10 transition-all duration-200 overflow-auto ${selectedBlock ? "w-[320px]" : "w-0 overflow-hidden"
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
      {showAssignModal && !guestMode && (
        <AssignLayoutsModal
          projectId={projectId}
          pageCount={pageNodes.length}
          onClose={() => setShowAssignModal(false)}
          onSuccess={reloadBlocks}
          userPlan={userPlan}
        />
      )}
    </>
  );
}

// â”€â”€â”€ Block props panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BlockPropsPanel({
  block,
  onUpdate,
}: {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}) {
  const [localProps, setLocalProps] = useState<Record<string, unknown>>(block.props);
  const [localLabel, setLocalLabel] = useState(block.label || "");
  const [localType, setLocalType] = useState(block.type);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocalProps(block.props);
    setLocalLabel(block.label || "");
    setLocalType(block.type);
    setDirty(false);
  }, [block.id, block.props, block.label, block.type]);

  function handlePropChange(key: string, value: unknown) {
    setLocalProps((p) => ({ ...p, [key]: value }));
    setDirty(true);
  }

  const variants = BLOCK_LAYOUT_VARIANTS[localType] ?? [];
  const currentLayout = (localProps.layout as string) || DEFAULT_LAYOUTS[localType] || "default";

  // Non-layout props
  const otherProps = Object.entries(localProps).filter(([k]) => k !== "layout");

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label">Block inspector</p>
          <h3 className="mt-2 text-sm font-semibold text-white">Edit block properties</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">Props</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Label</label>
          <input
            type="text"
            value={localLabel}
            onChange={(e) => { setLocalLabel(e.target.value); setDirty(true); }}
            className="field py-2.5 text-xs"
            placeholder="e.g. Why Us"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Type</label>
          <input
            type="text"
            value={localType}
            onChange={(e) => { setLocalType(e.target.value); setDirty(true); }}
            className="field py-2.5 text-xs"
            placeholder="e.g. Hero"
          />
        </div>
      </div>

      <hr className="border-white/8" />

      {variants.length > 0 && (
        <div>
          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Layout preset</label>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((variant) => (
              <button
                key={variant}
                onClick={() => {
                  setLocalProps((p) => ({ ...p, layout: variant }));
                  setDirty(true);
                }}
                className={`text-[11px] py-2 px-3 rounded-2xl border transition-colors text-left truncate ${currentLayout === variant
                    ? "bg-brand-300/12 border-brand-300/30 text-brand-100 font-semibold"
                    : "bg-white/[0.03] border-white/8 text-slate-400 hover:border-white/16 hover:text-slate-200"
                  }`}
              >
                {variant}
              </button>
            ))}
          </div>
        </div>
      )}

      {otherProps.length > 0 && (
        <div className="space-y-3">
          {otherProps.map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1 capitalize">
                {key.replace(/_/g, " ")}
              </label>
              {Array.isArray(value) ? (
                <textarea
                  id={`prop-${block.id}-${key}`}
                  rows={3}
                  value={(value as string[]).join("\n")}
                  onChange={(e) => handlePropChange(key, e.target.value.split("\n"))}
                  className="field resize-none font-mono text-xs"
                />
              ) : typeof value === "number" ? (
                <input
                  id={`prop-${block.id}-${key}`}
                  type="number"
                  value={value}
                  onChange={(e) => handlePropChange(key, Number(e.target.value))}
                  className="field text-xs"
                />
              ) : (
                <input
                  id={`prop-${block.id}-${key}`}
                  type="text"
                  value={String(value ?? "")}
                  onChange={(e) => handlePropChange(key, e.target.value)}
                  className="field text-xs"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {dirty && (
        <button
          id="wireframe-save-props"
          onClick={() => {
            onUpdate({
              props: localProps,
              label: localLabel,
              type: localType,
            });
            setDirty(false);
          }}
          className="button-primary w-full justify-center rounded-full text-xs"
        >
          Save changes
        </button>
      )}
    </div>
  );
}

