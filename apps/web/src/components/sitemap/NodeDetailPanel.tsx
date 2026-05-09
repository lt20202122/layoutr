"use client";

import { Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import {
  SitemapNode,
  Section,
  SectionColor,
  getSections,
  SECTION_COLOR_MAP,
  SECTION_COLOR_OPTIONS,
  NodeStatus,
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
  }, [node.id, node.label, node.url_path, node.notes, node.metadata]);

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
    saveSections([...sections, { id: crypto.randomUUID(), label: "Section", color: "blue" }]);
  }

  function updateSection(id: string, changes: Partial<Section>) {
    saveSections(sections.map((section) => (section.id === id ? { ...section, ...changes } : section)));
  }

  function deleteSection(id: string) {
    saveSections(sections.filter((section) => section.id !== id));
  }

  function moveSection(id: string, dir: -1 | 1) {
    const idx = sections.findIndex((section) => section.id === id);
    if (idx < 0) return;
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    saveSections(next);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <p className="section-label">Node details</p>
          <p className="mt-2 text-sm font-medium text-white">{node.label}</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-slate-500">Saving...</span>}
          <button onClick={onClose} className="rounded-full border border-white/10 p-2 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <section>
          <label className="section-label">Label</label>
          <input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setDirty(true);
            }}
            onBlur={saveText}
            onKeyDown={(e) => e.key === "Enter" && saveText()}
            className="field mt-2"
          />
        </section>

        <section>
          <label className="section-label">Status</label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {NODE_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => onUpdate({ status })}
                className={`rounded-2xl px-3 py-2 text-sm capitalize ${
                  node.status === status
                    ? "bg-brand-400 text-slate-950"
                    : "border border-white/10 bg-white/[0.03] text-slate-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="section-label">URL path</label>
          <input
            value={urlPath}
            onChange={(e) => {
              setUrlPath(e.target.value);
              setDirty(true);
            }}
            onBlur={saveText}
            placeholder="/pricing"
            className="field mt-2 font-mono"
          />
        </section>

        <section>
          <div className="flex items-center justify-between">
            <label className="section-label">Sections</label>
            <button onClick={addSection} className="inline-flex items-center gap-1 text-sm font-medium text-brand-200">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {sections.map((section, index) => (
              <div key={section.id} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-start gap-3">
                  <div className="relative mt-1">
                    <select
                      value={section.color}
                      onChange={(e) => updateSection(section.id, { color: e.target.value as SectionColor })}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    >
                      {SECTION_COLOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="h-4 w-4 rounded-full border border-white/20" style={{ background: SECTION_COLOR_MAP[section.color] }} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      value={section.label}
                      onChange={(e) => updateSection(section.id, { label: e.target.value })}
                      className="field py-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveSection(section.id, -1)}
                        disabled={index === 0}
                        className="button-secondary px-3 py-2 disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 1)}
                        disabled={index === sections.length - 1}
                        className="button-secondary px-3 py-2 disabled:opacity-40"
                      >
                        Down
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="rounded-full border border-red-300/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <label className="section-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setDirty(true);
            }}
            onBlur={saveText}
            rows={5}
            placeholder="Add page notes, requirements, or implementation hints."
            className="field mt-2 resize-none"
          />
        </section>

        <section className="rounded-[24px] border border-white/8 bg-black/12 p-4 font-mono text-xs text-slate-500">
          <p>ID: {node.id.slice(0, 8)}...</p>
          <p className="mt-1">Updated: {new Date(node.updated_at).toLocaleDateString()}</p>
        </section>
      </div>

      <div className="flex gap-3 border-t border-white/8 p-5">
        {dirty && (
          <button onClick={saveText} className="button-primary flex-1">
            Save changes
          </button>
        )}
        <button
          onClick={() => {
            if (confirm(`Delete "${node.label}"?`)) onDelete();
          }}
          className="rounded-full border border-red-300/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-100"
        >
          Delete node
        </button>
      </div>
    </div>
  );
}
