"use client";

import { useState, useEffect } from "react";
import {
  SitemapNode, Section, SectionColor,
  getSections, SECTION_COLOR_MAP, SECTION_COLOR_OPTIONS, NodeStatus,
} from "./sitemapUtils";

type Props = {
  node: SitemapNode;
  saving: boolean;
  onUpdate: (updates: Partial<SitemapNode>) => void;
  onDelete: () => void;
  onClose: () => void;
};

const NODE_STATUSES: NodeStatus[] = ["draft", "review", "approved", "live"];

export default function NodeDetailPanel({ node, saving, onUpdate, onDelete, onClose }: Props) {
  const [label, setLabel] = useState(node.label);
  const [urlPath, setUrlPath] = useState(node.url_path ?? "");
  const [notes, setNotes] = useState(node.notes ?? "");
  const [sections, setSections] = useState<Section[]>(getSections(node));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLabel(node.label);
    setUrlPath(node.url_path ?? "");
    setNotes(node.notes ?? "");
    setSections(getSections(node));
    setDirty(false);
  }, [node.id]);

  function saveText() {
    if (!dirty) return;
    onUpdate({
      label: label.trim() || node.label,
      url_path: urlPath || null,
      notes: notes || null,
    });
    setDirty(false);
  }

  function saveSections(next: Section[]) {
    setSections(next);
    onUpdate({ metadata: { ...(node.metadata ?? {}), sections: next } });
  }

  function addSection() {
    const next: Section[] = [
      ...sections,
      { id: crypto.randomUUID(), label: "Section", color: "blue" },
    ];
    saveSections(next);
  }

  function updateSection(id: string, changes: Partial<Section>) {
    const next = sections.map(s => s.id === id ? { ...s, ...changes } : s);
    saveSections(next);
  }

  function deleteSection(id: string) {
    saveSections(sections.filter(s => s.id !== id));
  }

  function moveSection(id: string, dir: -1 | 1) {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    saveSections(next);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <span className="text-sm font-medium text-gray-300 truncate mr-2">{node.label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-xs text-gray-500">Saving…</span>}
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Label */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-800/60 space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Label</label>
          <input
            value={label}
            onChange={e => { setLabel(e.target.value); setDirty(true); }}
            onBlur={saveText}
            onKeyDown={e => e.key === "Enter" && saveText()}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Status */}
        <div className="px-4 py-3 border-b border-gray-800/60 space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
          <div className="grid grid-cols-2 gap-1.5">
            {NODE_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => onUpdate({ status: s })}
                className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
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

        {/* URL */}
        <div className="px-4 py-3 border-b border-gray-800/60 space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">URL path</label>
          <input
            value={urlPath}
            onChange={e => { setUrlPath(e.target.value); setDirty(true); }}
            onBlur={saveText}
            placeholder="/about"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Sections */}
        <div className="px-4 py-3 border-b border-gray-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sections</label>
            <button
              onClick={addSection}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              + Add
            </button>
          </div>

          <div className="space-y-1.5">
            {sections.map((section, i) => (
              <div key={section.id} className="flex items-center gap-2 group">
                {/* Color dot selector */}
                <div className="relative">
                  <select
                    value={section.color}
                    onChange={e => updateSection(section.id, { color: e.target.value as SectionColor })}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  >
                    {SECTION_COLOR_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <div
                    className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                    style={{ background: SECTION_COLOR_MAP[section.color] }}
                  />
                </div>

                {/* Label input */}
                <input
                  value={section.label}
                  onChange={e => updateSection(section.id, { label: e.target.value })}
                  className="flex-1 min-w-0 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />

                {/* Move + delete */}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveSection(section.id, -1)}
                    disabled={i === 0}
                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 disabled:opacity-20"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M4 6V2M2 4l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveSection(section.id, 1)}
                    disabled={i === sections.length - 1}
                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 disabled:opacity-20"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M4 2v4M2 4l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-400"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="px-4 py-3 border-b border-gray-800/60 space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); setDirty(true); }}
            onBlur={saveText}
            rows={3}
            placeholder="Add notes…"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Meta */}
        <div className="px-4 py-3 text-xs text-gray-600 space-y-0.5">
          <p>ID: <span className="font-mono text-gray-500">{node.id.slice(0, 8)}…</span></p>
          <p>Updated: {new Date(node.updated_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800 shrink-0 flex gap-2">
        {dirty && (
          <button
            onClick={saveText}
            className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold transition-colors"
          >
            Save
          </button>
        )}
        <button
          onClick={() => { if (confirm(`Delete "${node.label}"?`)) onDelete(); }}
          className="py-2 px-3 bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 rounded-lg text-xs font-semibold text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
