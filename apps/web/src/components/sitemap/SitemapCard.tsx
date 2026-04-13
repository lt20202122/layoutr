"use client";

import { useState, useRef, useEffect } from "react";
import {
  SitemapNode, Section, getSections,
  SECTION_COLOR_MAP, CARD_WIDTH, CARD_SECTION_H, CARD_HEADER_H,
} from "./sitemapUtils";

type Props = {
  node: SitemapNode;
  isSelected: boolean;
  isSaving: boolean;
  onSelect: () => void;
  onAdd: () => void;
  onDelete: () => void;
  onRename: (label: string) => void;
};

export default function SitemapCard({
  node, isSelected, isSaving, onSelect, onAdd, onDelete, onRename,
}: Props) {
  const sections = getSections(node);
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(node.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditLabel(node.label); }, [node.label]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commitEdit() {
    setEditing(false);
    const trimmed = editLabel.trim();
    if (trimmed && trimmed !== node.label) onRename(trimmed);
    else setEditLabel(node.label);
  }

  return (
    <div
      onClick={onSelect}
      style={{ width: CARD_WIDTH }}
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-shadow ${
        isSelected
          ? "shadow-[0_0_0_2px_#6172f3,0_8px_24px_rgba(97,114,243,0.3)]"
          : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
      }`}
    >
      {/* Window chrome */}
      <div
        className="flex items-center px-2.5 gap-1.5"
        style={{ height: CARD_HEADER_H, background: "#243048" }}
      >
        {/* Traffic dots */}
        <div className="flex gap-1 shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-400/70" />
          <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
          <div className="w-2 h-2 rounded-full bg-green-400/70" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          {editing ? (
            <input
              ref={inputRef}
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") { setEditing(false); setEditLabel(node.label); }
                e.stopPropagation();
              }}
              onClick={e => e.stopPropagation()}
              className="w-full text-center bg-transparent border-b border-brand-400 outline-none text-white"
              style={{ fontSize: "10px" }}
            />
          ) : (
            <span
              className="text-white/90 font-medium truncate max-w-full"
              style={{ fontSize: "10px" }}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
              title="Double-click to rename"
            >
              {node.label}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {isSaving && (
            <div
              className="w-2 h-2 rounded-full border border-brand-400 border-t-transparent animate-spin mr-0.5"
            />
          )}
          <button
            onClick={e => { e.stopPropagation(); onAdd(); }}
            title="Add child page"
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-brand-400 transition-colors rounded"
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M4.5 1.5v6M1.5 4.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              if (confirm(`Delete "${node.label}" and all children?`)) onDelete();
            }}
            title="Delete page"
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors rounded"
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 2.5h6M3.5 2.5V2h2v.5M3 2.5v4.5h3V2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sections */}
      <div
        className="flex flex-col gap-px"
        style={{ background: "#1a2535", padding: "4px 5px 6px" }}
      >
        {sections.map((section, i) => (
          <SectionBlock key={section.id ?? i} section={section} index={i} totalSections={sections.length} />
        ))}
      </div>
    </div>
  );
}

function SectionBlock({
  section, index, totalSections,
}: { section: Section; index: number; totalSections: number }) {
  const bg = SECTION_COLOR_MAP[section.color] ?? "#3d7ab5";
  const isFirst = index === 0;
  const isLast = index === totalSections - 1;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: CARD_SECTION_H,
        background: bg,
        borderRadius: isFirst ? "4px 4px 2px 2px" : isLast ? "2px 2px 4px 4px" : "2px",
      }}
    >
      {/* Section label */}
      <span
        className="absolute top-1.5 left-2 text-white/90 font-medium select-none"
        style={{ fontSize: "8.5px", letterSpacing: "0.02em" }}
      >
        {section.label}
      </span>

      {/* Decorative placeholder elements */}
      <Placeholders index={index} isFirst={isFirst} isLast={isLast} />
    </div>
  );
}

function Placeholders({ index, isFirst, isLast }: { index: number; isFirst: boolean; isLast: boolean }) {
  if (isFirst) {
    // Header: logo dot + nav links
    return (
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
          <div className="w-4 h-1 rounded-sm bg-white/25" />
        </div>
        <div className="flex gap-1">
          <div className="w-3 h-0.5 rounded-sm bg-white/30" />
          <div className="w-3 h-0.5 rounded-sm bg-white/30" />
          <div className="w-3 h-0.5 rounded-sm bg-white/30" />
        </div>
      </div>
    );
  }

  if (isLast) {
    // Footer: logo + cols
    return (
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="w-2 h-2 rounded-full bg-white/35" />
        <div className="flex gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="w-5 h-0.5 rounded-sm bg-white/30" />
            <div className="w-4 h-0.5 rounded-sm bg-white/20" />
            <div className="w-5 h-0.5 rounded-sm bg-white/20" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="w-5 h-0.5 rounded-sm bg-white/30" />
            <div className="w-4 h-0.5 rounded-sm bg-white/20" />
            <div className="w-5 h-0.5 rounded-sm bg-white/20" />
          </div>
        </div>
      </div>
    );
  }

  if (index % 3 === 1) {
    // Hero / image section
    return (
      <div className="absolute bottom-2 left-2 right-2">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-3 h-0.5 rounded-sm bg-white/20" />
          <div className="w-6 h-0.5 rounded-sm bg-white/30" />
        </div>
        <div className="flex gap-1 justify-center">
          <div className="w-1.5 h-1.5 rounded-sm bg-white/20" />
          <div className="w-1.5 h-1.5 rounded-sm bg-white/35" />
          <div className="w-1.5 h-1.5 rounded-sm bg-white/20" />
        </div>
      </div>
    );
  }

  if (index % 3 === 2) {
    // Grid / highlights
    return (
      <div className="absolute bottom-2 left-2 right-2 flex items-end gap-1">
        <div className="w-2 h-2 rounded-sm bg-white/20" />
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="h-0.5 bg-white/25 rounded-sm" />
          <div className="h-0.5 bg-white/20 rounded-sm w-3/4" />
        </div>
      </div>
    );
  }

  // CTA / text content
  return (
    <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
      <div className="h-0.5 bg-white/25 rounded-sm w-full" />
      <div className="h-0.5 bg-white/20 rounded-sm w-4/5" />
      <div className="h-1.5 bg-white/20 rounded w-8 mt-0.5" />
    </div>
  );
}
