"use client";

import { useState, useEffect } from "react";
import { SitemapNode, NodeType, NodeStatus, NODE_TYPE_ICONS } from "./sitemapUtils";

type Props = {
  node: SitemapNode;
  saving: boolean;
  onUpdate: (updates: Partial<SitemapNode>) => void;
  onDelete: () => void;
  onClose: () => void;
};

const NODE_TYPES: NodeType[] = ["page", "section", "folder", "link", "modal", "component"];
const NODE_STATUSES: NodeStatus[] = ["draft", "review", "approved", "live"];

export default function NodeDetailPanel({ node, saving, onUpdate, onDelete, onClose }: Props) {
  const [label, setLabel] = useState(node.label);
  const [urlPath, setUrlPath] = useState(node.url_path ?? "");
  const [notes, setNotes] = useState(node.notes ?? "");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLabel(node.label);
    setUrlPath(node.url_path ?? "");
    setNotes(node.notes ?? "");
    setDirty(false);
  }, [node.id]);

  function saveChanges() {
    onUpdate({
      label: label.trim() || node.label,
      url_path: urlPath || null,
      notes: notes || null,
    });
    setDirty(false);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-sm font-medium text-gray-400">Page details</span>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-gray-500">Saving...</span>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Label */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => { setLabel(e.target.value); setDirty(true); }}
            onBlur={saveChanges}
            onKeyDown={(e) => e.key === "Enter" && saveChanges()}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Type</label>
          <div className="grid grid-cols-3 gap-1.5">
            {NODE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => onUpdate({ type: t })}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  node.type === t
                    ? "bg-brand-600/30 border border-brand-600/50 text-brand-300"
                    : "bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                <span>{NODE_TYPE_ICONS[t]}</span>
                <span className="capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</label>
          <div className="grid grid-cols-2 gap-1.5">
            {NODE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => onUpdate({ status: s })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  node.status === s
                    ? "bg-brand-600/30 border border-brand-600/50 text-brand-300"
                    : "bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* URL Path */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">URL path</label>
          <input
            type="text"
            value={urlPath}
            onChange={(e) => { setUrlPath(e.target.value); setDirty(true); }}
            onBlur={saveChanges}
            placeholder="/about"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
            onBlur={saveChanges}
            rows={4}
            placeholder="Add notes about this page..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Metadata */}
        <div className="pt-2 border-t border-gray-800 space-y-1 text-xs text-gray-500">
          <p>ID: <span className="font-mono text-gray-400">{node.id.slice(0, 8)}…</span></p>
          <p>Created: {new Date(node.created_at).toLocaleDateString()}</p>
          <p>Updated: {new Date(node.updated_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
        {dirty && (
          <button
            onClick={saveChanges}
            className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold transition-colors"
          >
            Save changes
          </button>
        )}
        <button
          onClick={() => { if (confirm(`Delete "${node.label}"?`)) onDelete(); }}
          className="py-2 px-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-lg text-xs font-semibold text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
