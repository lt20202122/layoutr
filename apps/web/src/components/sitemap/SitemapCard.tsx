"use client";

import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  SitemapNode,
  Section,
  getSections,
  SECTION_COLOR_MAP,
  CARD_WIDTH,
  CARD_SECTION_H,
  CARD_HEADER_H,
  CARD_BODY_PAD,
  CARD_SECTION_GAP,
  STATUS_UI_COLORS,
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
  node,
  isSelected,
  isSaving,
  collapsed,
  onSelect,
  onCollapse,
  onDelete,
  onAdd,
  onRename,
}: Props) {
  const sections = getSections(node);
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(node.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const uiColors = STATUS_UI_COLORS[node.status] || STATUS_UI_COLORS.draft;

  useEffect(() => {
    setEditLabel(node.label);
  }, [node.label]);

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
      style={{ width: CARD_WIDTH }}
      className={`overflow-hidden rounded-[24px] border bg-[#0c1728] shadow-[0_24px_60px_rgba(0,0,0,0.22)] transition-all duration-200 ${
        isSelected
          ? "border-brand-300/50 ring-2 ring-brand-300/25"
          : "border-white/8 hover:border-white/16"
      }`}
      onClick={onSelect}
    >
      <div
        className="flex items-center gap-2 px-3"
        style={{ height: CARD_HEADER_H, background: uiColors.bg }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${node.label}" and all its children?`)) onDelete();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-white/75 hover:bg-black/20"
          title="Delete page"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onCollapse();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-white/75 hover:bg-black/20"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        <div className="min-w-0 flex-1 text-center">
          {editing ? (
            <input
              ref={inputRef}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") {
                  setEditing(false);
                  setEditLabel(node.label);
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full border-b border-white/30 bg-transparent text-center text-xs font-medium text-white outline-none"
            />
          ) : (
            <span
              className={`${uiColors.text} inline-block max-w-full truncate text-xs font-semibold`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              {node.label}
            </span>
          )}
        </div>

        {isSaving ? (
          <div className="h-7 w-7 rounded-full border border-white/10 bg-black/10" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-white/75">
            <Check className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <div
            className="flex flex-col bg-[#0c1728]"
            style={{ padding: `${CARD_BODY_PAD}px ${CARD_BODY_PAD}px 0`, gap: CARD_SECTION_GAP }}
          >
            {sections.map((section, index) => (
              <SectionBlock
                key={section.id ?? index}
                section={section}
                index={index}
                totalSections={sections.length}
              />
            ))}
          </div>

          <div className="bg-[#0c1728] px-3 pb-3 pt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-300/25 bg-brand-400/10 text-xs font-medium text-brand-100 hover:bg-brand-400/14"
            >
              <Plus className="h-3.5 w-3.5" />
              Add child page
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SectionBlock({
  section,
  index,
  totalSections,
}: {
  section: Section;
  index: number;
  totalSections: number;
}) {
  const bg = SECTION_COLOR_MAP[section.color] ?? "#3d7ab5";
  const isFirst = index === 0;
  const isLast = index === totalSections - 1;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: CARD_SECTION_H,
        background: bg,
        borderRadius: isFirst && isLast ? 12 : isFirst ? "12px 12px 4px 4px" : isLast ? "4px 4px 12px 12px" : 4,
      }}
    >
      <span
        className="absolute left-3 top-2.5 text-[11px] font-semibold text-white"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
      >
        {section.label}
      </span>

      <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
        <div className="h-1.5 rounded-full bg-white/22" />
        <div className="h-1.5 w-4/5 rounded-full bg-white/16" />
        {!isLast && <div className="h-5 w-12 rounded-full bg-white/18" />}
      </div>
    </div>
  );
}
