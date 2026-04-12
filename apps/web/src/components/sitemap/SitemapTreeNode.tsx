"use client";

import { useState } from "react";
import { SitemapNode, NODE_TYPE_ICONS, STATUS_COLORS } from "./sitemapUtils";

type Props = {
  node: SitemapNode;
  depth: number;
  selectedId: string | null;
  saving: Record<string, boolean>;
  onSelect: (id: string) => void;
  onAdd: (parentId: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, parentId: string | null) => void;
};

export default function SitemapTreeNode({
  node,
  depth,
  selectedId,
  saving,
  onSelect,
  onAdd,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [hovering, setHovering] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isSaving = saving[node.id];

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${
          isSelected
            ? "bg-brand-600/20 border border-brand-600/40"
            : "hover:bg-gray-800 border border-transparent"
        }`}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
        onClick={() => onSelect(node.id)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className={`w-4 h-4 flex items-center justify-center text-gray-500 transition-transform ${
            hasChildren ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${expanded ? "rotate-90" : ""}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Icon */}
        <span className="text-sm select-none">{NODE_TYPE_ICONS[node.type]}</span>

        {/* Label */}
        <span className={`flex-1 text-sm truncate ${isSelected ? "text-white" : "text-gray-300"}`}>
          {node.label}
        </span>

        {/* Status badge */}
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[node.status]}`}>
          {node.status}
        </span>

        {/* Saving indicator */}
        {isSaving && (
          <span className="w-3 h-3 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        )}

        {/* Actions (visible on hover/select) */}
        {(hovering || isSelected) && !isSaving && (
          <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onAdd(node.id)}
              title="Add child page"
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-brand-400 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${node.label}" and all its children?`)) onDelete(node.id);
              }}
              title="Delete"
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <SitemapTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              saving={saving}
              onSelect={onSelect}
              onAdd={onAdd}
              onDelete={onDelete}
              onMove={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
