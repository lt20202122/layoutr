"use client";

import type { ComponentType } from "react";
import { AlignLeft, AppWindow, FormInput, GalleryHorizontal, LayoutGrid, PanelTop, RectangleEllipsis, Table2 } from "lucide-react";
import { type BlockType } from "./WireframeEditor";
import { BLOCK_LAYOUT_VARIANTS } from "./WireframeBlock";

const BLOCKS: { type: BlockType; icon: ComponentType<{ className?: string }>; description: string }[] = [
  { type: "Navbar", icon: PanelTop, description: "Navigation bar" },
  { type: "Hero", icon: AppWindow, description: "Primary hero section" },
  { type: "Cards", icon: LayoutGrid, description: "Feature cards grid" },
  { type: "CTA", icon: RectangleEllipsis, description: "Call-to-action banner" },
  { type: "Form", icon: FormInput, description: "Input form" },
  { type: "Text", icon: AlignLeft, description: "Text content" },
  { type: "Image", icon: GalleryHorizontal, description: "Image placeholder" },
  { type: "Table", icon: Table2, description: "Data table" },
  { type: "Footer", icon: PanelTop, description: "Page footer" },
];

interface Props {
  disabled?: boolean;
}

export default function BlockLibrary({ disabled }: Props) {
  function onDragStart(e: React.DragEvent, blockType: BlockType) {
    e.dataTransfer.setData("blockType", blockType);
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-white/8 bg-black/12">
      <div className="border-b border-white/8 px-4 py-4">
        <p className="section-label">Blocks</p>
        <p className="mt-2 text-sm text-slate-400">
          {disabled ? "Choose a page before placing blocks." : "Drag blocks onto the canvas."}
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {BLOCKS.map(({ type, icon: Icon, description }) => {
          const variantCount = BLOCK_LAYOUT_VARIANTS[type]?.length ?? 0;
          return (
            <div
              key={type}
              id={`block-library-${type.toLowerCase()}`}
              draggable={!disabled}
              onDragStart={(e) => onDragStart(e, type)}
              title={`${description} - ${variantCount} layouts`}
              className={`rounded-[24px] border p-3 ${
                disabled
                  ? "cursor-not-allowed border-white/6 bg-white/[0.02] opacity-40"
                  : "cursor-grab border-white/8 bg-white/[0.03] hover:border-brand-300/25 hover:bg-brand-400/10 active:cursor-grabbing"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/10">
                  <Icon className="h-4 w-4 text-brand-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{type}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
                {!disabled && <span className="text-[11px] font-mono text-slate-500">{variantCount}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
