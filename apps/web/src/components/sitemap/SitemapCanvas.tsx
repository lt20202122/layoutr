"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  SitemapNode, computeLayout, getSections,
  cardHeight, flattenTree, CARD_WIDTH,
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
  tree, selectedId, saving, onSelect, onAdd, onDelete, onRename,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 80, scale: 1 });
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);

  // Center on first load
  useEffect(() => {
    if (!initialized.current && containerRef.current && tree.length > 0) {
      initialized.current = true;
      const { width } = containerRef.current.getBoundingClientRect();
      setTransform({ x: width / 2, y: 80, scale: 1 });
    }
  }, [tree.length]);

  const positions = computeLayout(tree);
  const allNodes = flattenTree(tree);

  // Connections
  const connections: { fromId: string; toId: string }[] = [];
  const walkConnections = (nodes: SitemapNode[]) => {
    nodes.forEach(n => {
      n.children?.forEach(child => {
        connections.push({ fromId: n.id, toId: child.id });
      });
      if (n.children) walkConnections(n.children);
    });
  };
  walkConnections(tree);

  // Pan
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
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // Zoom towards cursor
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform(t => {
      const newScale = Math.max(0.25, Math.min(2.5, t.scale * factor));
      const r = newScale / t.scale;
      return { x: mx + (t.x - mx) * r, y: my + (t.y - my) * r, scale: newScale };
    });
  }, []);

  function resetView() {
    if (!containerRef.current) return;
    const { width } = containerRef.current.getBoundingClientRect();
    setTransform({ x: width / 2, y: 80, scale: 1 });
  }

  const isEmpty = tree.length === 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: "#1a2535", cursor: dragging.current ? "grabbing" : "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <p className="text-gray-500 text-sm">No pages yet</p>
          <button
            onClick={() => onAdd(null)}
            className="text-sm text-brand-400 hover:underline"
          >
            Add your first page
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
          {/* SVG connection lines */}
          <svg
            style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
          >
            {connections.map(({ fromId, toId }) => {
              const fp = positions.get(fromId);
              const tp = positions.get(toId);
              const fromNode = allNodes.find(n => n.id === fromId);
              if (!fp || !tp || !fromNode) return null;

              const fh = cardHeight(getSections(fromNode));
              const x1 = fp.x + CARD_WIDTH / 2;
              const y1 = fp.y + fh;
              const x2 = tp.x + CARD_WIDTH / 2;
              const y2 = tp.y;
              const my = (y1 + y2) / 2;

              return (
                <path
                  key={`${fromId}-${toId}`}
                  d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
                  stroke="#3d5a80"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.75"
                />
              );
            })}
          </svg>

          {/* Cards */}
          {allNodes.map(node => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            return (
              <div
                key={node.id}
                data-card="true"
                style={{ position: "absolute", left: pos.x, top: pos.y }}
              >
                <SitemapCard
                  node={node}
                  isSelected={selectedId === node.id}
                  isSaving={!!saving[node.id]}
                  onSelect={() => onSelect(node.id)}
                  onAdd={() => onAdd(node.id)}
                  onDelete={() => onDelete(node.id)}
                  onRename={label => onRename(node.id, label)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={() => setTransform(t => ({ ...t, scale: Math.min(2.5, t.scale * 1.2) }))}
          className="w-8 h-8 bg-gray-800/90 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 text-base flex items-center justify-center font-light"
        >+</button>
        <button
          onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.25, t.scale * 0.8) }))}
          className="w-8 h-8 bg-gray-800/90 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 text-base flex items-center justify-center font-light"
        >−</button>
        <button
          onClick={resetView}
          title="Reset view"
          className="w-8 h-8 bg-gray-800/90 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-700 flex items-center justify-center transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-600 font-mono">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}
