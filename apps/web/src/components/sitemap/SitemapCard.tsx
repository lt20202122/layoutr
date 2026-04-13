"use client";

import { useState, useRef, useEffect } from "react";
import {
  SitemapNode, Section, getSections,
  SECTION_COLOR_MAP, CARD_WIDTH, CARD_SECTION_H, CARD_HEADER_H,
  CARD_BODY_PAD, CARD_SECTION_GAP,
} from "./sitemapUtils";

type Props = {
  node: SitemapNode;
  isSelected: boolean;
  isSaving: boolean;
  collapsed: boolean;
  onSelect: () => void;
  onCollapse: () => void;
  onDelete: () => void;
  onAdd: () => void;
  onRename: (label: string) => void;
};

export default function SitemapCard({
  node, isSelected, isSaving, collapsed,
  onSelect, onCollapse, onDelete, onAdd, onRename,
}: Props) {
  const sections = getSections(node);
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(node.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditLabel(node.label); }, [node.label]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function commitEdit() {
    setEditing(false);
    const t = editLabel.trim();
    if (t && t !== node.label) onRename(t);
    else setEditLabel(node.label);
  }

  return (
    <div
      style={{ width: CARD_WIDTH }}
      className={`relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected
          ? "shadow-[0_0_0_2.5px_#6172f3,0_0_28px_rgba(97,114,243,0.35)]"
          : "shadow-[0_0_0_1px_rgba(255,255,255,0.07)] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.15)]"
      }`}
      onClick={onSelect}
    >
      {/* ── Window chrome ── */}
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{ height: CARD_HEADER_H, background: "#1e2d42" }}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Red — delete */}
          <button
            onClick={e => {
              e.stopPropagation();
              if (confirm(`Delete "${node.label}" and all its children?`)) onDelete();
            }}
            className="w-3 h-3 rounded-full flex items-center justify-center group/dot transition-transform hover:scale-110 active:scale-95"
            style={{ background: "#ff5f57" }}
            title="Delete page"
          >
            <svg className="opacity-0 group-hover/dot:opacity-100 transition-opacity" width="5" height="5" viewBox="0 0 5 5" fill="none">
              <path d="M1 1l3 3M4 1L1 4" stroke="white" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </button>

          {/* Yellow — collapse */}
          <button
            onClick={e => { e.stopPropagation(); onCollapse(); }}
            className="w-3 h-3 rounded-full flex items-center justify-center group/dot transition-transform hover:scale-110 active:scale-95"
            style={{ background: "#ffbd2e" }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <svg className="opacity-0 group-hover/dot:opacity-100 transition-opacity" width="5" height="5" viewBox="0 0 5 5" fill="none">
                <path d="M1 2.5h3M2.5 1v3" stroke="white" strokeWidth="1" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="opacity-0 group-hover/dot:opacity-100 transition-opacity" width="5" height="5" viewBox="0 0 5 5" fill="none">
                <path d="M1 2.5h3" stroke="white" strokeWidth="1" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Green — open detail */}
          <button
            onClick={e => { e.stopPropagation(); onSelect(); }}
            className="w-3 h-3 rounded-full flex items-center justify-center group/dot transition-transform hover:scale-110 active:scale-95"
            style={{ background: "#28c840" }}
            title="Open details"
          >
            <svg className="opacity-0 group-hover/dot:opacity-100 transition-opacity" width="5" height="5" viewBox="0 0 5 5" fill="none">
              <path d="M1.5 2.5L2.5 3.5L4 1.5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Page title */}
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
              className="w-full text-center bg-transparent border-b border-brand-400/60 outline-none text-white text-xs"
            />
          ) : (
            <span
              className="text-white/85 font-medium text-xs truncate max-w-full select-none"
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
              title="Double-click to rename"
            >
              {node.label}
            </span>
          )}
        </div>

        {/* Saving spinner */}
        {isSaving && (
          <div className="w-2.5 h-2.5 rounded-full border-2 border-brand-400 border-t-transparent animate-spin shrink-0" />
        )}

        {/* Collapsed icon */}
        {collapsed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-500 shrink-0">
            <rect x="1.5" y="1" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3.5 4h5M3.5 6.5h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* ── Sections (hidden when collapsed) ── */}
      {!collapsed && (
        <>
          <div
            className="flex flex-col"
            style={{
              background: "#151e2d",
              padding: `${CARD_BODY_PAD}px ${CARD_BODY_PAD}px 0`,
              gap: CARD_SECTION_GAP,
            }}
          >
            {sections.map((section, i) => (
              <SectionBlock
                key={section.id ?? i}
                section={section}
                index={i}
                totalSections={sections.length}
              />
            ))}
          </div>

          {/* ── Add child button ── */}
          <div
            className="flex items-center justify-center"
            style={{
              background: "#151e2d",
              padding: `${CARD_BODY_PAD}px`,
            }}
          >
            <button
              onClick={e => { e.stopPropagation(); onAdd(); }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg transition-colors group/add"
              style={{
                height: 30,
                border: "1.5px dashed rgba(155, 89, 182, 0.5)",
                background: "rgba(155, 89, 182, 0.05)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(155,89,182,0.9)";
                (e.currentTarget as HTMLElement).style.background = "rgba(155,89,182,0.12)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(155,89,182,0.5)";
                (e.currentTarget as HTMLElement).style.background = "rgba(155,89,182,0.05)";
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1.5v7M1.5 5h7" stroke="#9b59b6" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="text-purple-400/80 group-hover/add:text-purple-300 transition-colors select-none"
                style={{ fontSize: "9px", fontWeight: 500 }}>
                Add child page
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Section block ───────────────────────────────────────────────────────────

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
        borderRadius: isFirst && isLast ? 8 : isFirst ? "8px 8px 3px 3px" : isLast ? "3px 3px 8px 8px" : 3,
      }}
    >
      {/* Section label */}
      <span
        className="absolute top-2.5 left-3 text-white font-semibold select-none"
        style={{ fontSize: "11px", letterSpacing: "0.01em", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
      >
        {section.label}
      </span>

      {/* Placeholder UI elements */}
      <Placeholders index={index} isFirst={isFirst} isLast={isLast} />
    </div>
  );
}

function Placeholders({ isFirst, isLast, index }: { index: number; isFirst: boolean; isLast: boolean }) {
  if (isFirst) {
    return (
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-white/30" />
          <div className="w-8 h-1.5 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-1 rounded-full bg-white/25" />
          <div className="w-6 h-1 rounded-full bg-white/25" />
          <div className="w-6 h-1 rounded-full bg-white/25" />
        </div>
      </div>
    );
  }

  if (isLast) {
    return (
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="w-4 h-4 rounded-full bg-white/25" />
        <div className="flex gap-3">
          <div className="flex flex-col gap-1">
            <div className="w-7 h-1 rounded-full bg-white/30" />
            <div className="w-5 h-1 rounded-full bg-white/20" />
            <div className="w-7 h-1 rounded-full bg-white/20" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="w-7 h-1 rounded-full bg-white/30" />
            <div className="w-5 h-1 rounded-full bg-white/20" />
            <div className="w-7 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    );
  }

  if (index % 3 === 1) {
    return (
      <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5">
        <div className="w-full h-1.5 rounded-full bg-white/20" />
        <div className="w-4/5 h-1.5 rounded-full bg-white/15" />
        <div className="flex gap-1.5 mt-0.5">
          <div className="w-3 h-3 rounded-sm bg-white/20" />
          <div className="w-3 h-3 rounded-sm bg-white/30" />
          <div className="w-3 h-3 rounded-sm bg-white/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5">
      <div className="w-full h-1.5 rounded-full bg-white/20" />
      <div className="w-3/4 h-1.5 rounded-full bg-white/15" />
      <div className="w-10 h-3 rounded-md bg-white/20 mt-0.5" />
    </div>
  );
}
