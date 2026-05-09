"use client";

import { Grid3X3, Minus, Plus } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  SitemapNode,
  computeLayout,
  getSections,
  cardHeight,
  flattenTree,
  CARD_WIDTH,
} from "./sitemapUtils";
import SitemapCard from "./SitemapCard";

type Transform = { x: number; y: number; scale: number };

type Props = {
  tree: SitemapNode[];
  selectedId: string | null;
  saving: Record<string, boolean>;
  onSelect: (id: string) => void;
  onAdd: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, label: string) => void;
};

export default function SitemapCanvas({
  tree,
  selectedId,
  saving,
  onSelect,
  onAdd,
  onDelete,
  onRename,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 80, scale: 1 });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && containerRef.current && tree.length > 0) {
      initialized.current = true;
      const { width } = containerRef.current.getBoundingClientRect();
      setTransform({ x: width / 2, y: 88, scale: 1 });
    }
  }, [tree.length]);

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const positions = computeLayout(tree, collapsed);
  const allNodes = flattenTree(tree);

  const visibleIds = new Set<string>();
  function collectVisible(nodes: SitemapNode[]) {
    nodes.forEach((node) => {
      visibleIds.add(node.id);
      if (!collapsed.has(node.id) && node.children) collectVisible(node.children);
    });
  }
  collectVisible(tree);

  const connections: { fromId: string; toId: string }[] = [];
  function walkConnections(nodes: SitemapNode[]) {
    nodes.forEach((node) => {
      if (!collapsed.has(node.id)) {
        node.children?.forEach((child) => connections.push({ fromId: node.id, toId: child.id }));
        if (node.children) walkConnections(node.children);
      }
    });
  }
  walkConnections(tree);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-card]")) return;
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

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform((t) => {
      const newScale = Math.max(0.2, Math.min(3, t.scale * factor));
      const ratio = newScale / t.scale;
      return { x: mx + (t.x - mx) * ratio, y: my + (t.y - my) * ratio, scale: newScale };
    });
  }, []);

  function resetView() {
    if (!containerRef.current) return;
    const { width } = containerRef.current.getBoundingClientRect();
    setTransform({ x: width / 2, y: 88, scale: 1 });
  }

  return (
    <div
      ref={containerRef}
      className="surface-grid relative h-full w-full overflow-hidden select-none bg-[linear-gradient(180deg,#07111f,#091423)]"
      style={{ cursor: dragging.current ? "grabbing" : "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      {tree.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="rounded-[22px] border border-brand-300/20 bg-brand-400/10 p-4">
            <Grid3X3 className="h-6 w-6 text-brand-200" />
          </div>
          <p className="text-lg font-medium text-white">No pages yet</p>
          <button onClick={() => onAdd(null)} className="button-primary">
            Add first page
          </button>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            transformOrigin: "0 0",
            transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
          }}
        >
          <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
            {connections.map(({ fromId, toId }) => {
              const fp = positions.get(fromId);
              const tp = positions.get(toId);
              const fromNode = allNodes.find((n) => n.id === fromId);
              if (!fp || !tp || !fromNode) return null;

              const fh = cardHeight(getSections(fromNode), collapsed.has(fromId));
              const x1 = fp.x + CARD_WIDTH / 2;
              const y1 = fp.y + fh;
              const x2 = tp.x + CARD_WIDTH / 2;
              const y2 = tp.y;
              const cy = (y1 + y2) / 2;

              return (
                <path
                  key={`${fromId}-${toId}`}
                  d={`M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`}
                  stroke="rgba(143, 208, 255, 0.38)"
                  strokeWidth="1.4"
                  fill="none"
                />
              );
            })}
          </svg>

          {allNodes
            .filter((node) => visibleIds.has(node.id))
            .map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              return (
                <div key={node.id} data-card="true" style={{ position: "absolute", left: pos.x, top: pos.y }}>
                  <SitemapCard
                    node={node}
                    isSelected={selectedId === node.id}
                    isSaving={!!saving[node.id]}
                    collapsed={collapsed.has(node.id)}
                    onSelect={() => onSelect(node.id)}
                    onCollapse={() => toggleCollapse(node.id)}
                    onDelete={() => onDelete(node.id)}
                    onAdd={() => onAdd(node.id)}
                    onRename={(label) => onRename(node.id, label)}
                  />
                </div>
              );
            })}
        </div>
      )}

      <div className="absolute bottom-5 right-5 flex flex-col gap-2">
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.2) }))}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/80 text-slate-300 hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale * 0.8) }))}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/80 text-slate-300 hover:text-white"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset view"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/80 text-slate-300 hover:text-white"
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-5 left-5 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 font-mono text-xs text-slate-400">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}
