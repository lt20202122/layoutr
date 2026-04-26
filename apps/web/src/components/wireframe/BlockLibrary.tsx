"use client";

import { type BlockType } from "./WireframeEditor";
import { BLOCK_LAYOUT_VARIANTS } from "./WireframeBlock";

const BLOCKS: { type: BlockType; icon: string; description: string }[] = [
  { type: "Navbar",  icon: "≡",  description: "Navigation bar" },
  { type: "Hero",    icon: "★",  description: "Full-width hero section" },
  { type: "Cards",   icon: "⊞",  description: "Feature cards grid" },
  { type: "CTA",     icon: "→",  description: "Call-to-action banner" },
  { type: "Form",    icon: "⊟",  description: "Input form" },
  { type: "Text",    icon: "T",  description: "Text content" },
  { type: "Image",   icon: "⊡",  description: "Image placeholder" },
  { type: "Table",   icon: "⊞",  description: "Data table" },
  { type: "Footer",  icon: "▬",  description: "Page footer" },
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
    <div className="w-44 shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Blocks</p>
        {disabled && (
          <p className="text-[10px] text-gray-600 mt-0.5">Pick a page first</p>
        )}
      </div>

      {/* Block tiles */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {BLOCKS.map(({ type, icon, description }) => {
          const variantCount = BLOCK_LAYOUT_VARIANTS[type]?.length ?? 0;
          return (
            <div
              key={type}
              id={`block-library-${type.toLowerCase()}`}
              draggable={!disabled}
              onDragStart={(e) => onDragStart(e, type)}
              title={`${description} — ${variantCount} layout${variantCount !== 1 ? "s" : ""}`}
              className={`
                group flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all duration-150
                ${disabled
                  ? "border-gray-800 bg-gray-900/30 opacity-40 cursor-not-allowed"
                  : "border-gray-800 bg-gray-900 hover:border-brand-600/60 hover:bg-brand-900/20 cursor-grab active:cursor-grabbing active:scale-95 active:border-brand-500"
                }
              `}
            >
              <span
                className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-bold shrink-0 transition-colors
                  ${disabled
                    ? "bg-gray-800 text-gray-600"
                    : "bg-gray-800 text-gray-300 group-hover:bg-brand-800/40 group-hover:text-brand-300"
                  }`}
              >
                {icon}
              </span>
              <span className="flex-1 text-xs text-gray-300 font-medium truncate">{type}</span>
              {variantCount > 0 && !disabled && (
                <span className="text-[9px] text-gray-600 group-hover:text-gray-500 shrink-0 font-mono">
                  {variantCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      {!disabled && (
        <div className="px-3 py-2 border-t border-gray-800">
          <p className="text-[10px] text-gray-600">Drag onto canvas · change layout in props</p>
        </div>
      )}
    </div>
  );
}
