"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import BlockLibrary from "./BlockLibrary";
import WireframeBlock from "./WireframeBlock";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlockType =
  | "Hero"
  | "Navbar"
  | "Cards"
  | "CTA"
  | "Form"
  | "Footer"
  | "Text"
  | "Image"
  | "Table";

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
  Navbar: { title: "My App", links: ["Home", "About", "Contact"] },
  Hero: { headline: "Welcome", subheadline: "Start building something great", cta: "Get Started" },
  Cards: { count: 3, title: "Features" },
  CTA: { headline: "Ready to start?", cta: "Sign Up Free" },
  Form: { fields: ["Name", "Email", "Message"], submitLabel: "Send" },
  Footer: { columns: 3, copyright: "© 2024" },
  Text: { content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  Image: { alt: "Image placeholder", caption: "" },
  Table: { columns: ["Name", "Status", "Date"], rows: 5 },
};

// ─── Component ────────────────────────────────────────────────────────────────

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

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);

  const apiBase = activeNodeId
    ? `/api/projects/${projectId}/wireframes/${activeNodeId}`
    : null;

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

      // Optimistic update — show the block immediately before the API responds
      const tempId = `temp-${Date.now()}`;
      const optimisticBlock: Block = {
        id: tempId,
        node_id: activeNodeId,
        type: blockType,
        order_index: blocks.length,
        props: BLOCK_DEFAULTS[blockType] ?? {},
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
          props: BLOCK_DEFAULTS[blockType] ?? {},
        }),
      });
      if (!res.ok) {
        // Rollback on failure
        setBlocks((prev) => prev.filter((b) => b.id !== tempId));
        setSelectedBlockId(null);
        return;
      }
      const { data } = await res.json();
      // Swap the temp block for the real one
      setBlocks((prev) => prev.map((b) => (b.id === tempId ? (data as Block) : b)));
      setSelectedBlockId((data as Block).id);
    },
    [apiBase, activeNodeId, blocks.length]
  );

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
    <div className="flex h-[calc(100vh-10rem)] min-h-[600px] rounded-xl overflow-hidden border border-gray-800">
      {/* ── Left sidebar: Block library ────────────────────────────────── */}
      <BlockLibrary disabled={!activeNodeId} />

      {/* ── Main canvas area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
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

          <div className="ml-auto flex items-center gap-2">
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
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <div className="text-4xl mb-2">🗺</div>
              <p className="text-gray-400 text-sm font-medium">Select a page to start wireframing</p>
              <p className="text-gray-600 text-xs">Then drag blocks from the left panel onto the canvas</p>
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
                    {nodes.find((n) => n.id === activeNodeId)?.label ?? "Page"}
                  </div>
                </div>

                {/* Blocks */}
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <p className="text-gray-600 text-xs">Drop blocks here</p>
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

      {/* ── Right panel: Block props ───────────────────────────────────── */}
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{block.type}</h3>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Props</span>
      </div>

      <div className="space-y-3">
        {Object.entries(localProps).map(([key, value]) => (
          <div key={key}>
            <label className="block text-xs text-gray-400 mb-1 capitalize">{key.replace(/_/g, " ")}</label>
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
