"use client";

import type { Block } from "./WireframeEditor";

// Visual height per block type (roughly proportional to real content)
const BLOCK_HEIGHTS: Record<string, number> = {
  Navbar:  48,
  Hero:    120,
  Cards:   100,
  CTA:     72,
  Form:    140,
  Footer:  80,
  Text:    64,
  Image:   100,
  Table:   120,
};

// Accent colours per type for the label badge
const BLOCK_ACCENTS: Record<string, string> = {
  Navbar:  "bg-blue-900/40 text-blue-300 border-blue-700/40",
  Hero:    "bg-purple-900/40 text-purple-300 border-purple-700/40",
  Cards:   "bg-teal-900/40 text-teal-300 border-teal-700/40",
  CTA:     "bg-brand-900/40 text-brand-300 border-brand-700/40",
  Form:    "bg-yellow-900/40 text-yellow-300 border-yellow-700/40",
  Footer:  "bg-gray-700/40 text-gray-400 border-gray-600/40",
  Text:    "bg-slate-800/60 text-slate-300 border-slate-600/40",
  Image:   "bg-rose-900/40 text-rose-300 border-rose-700/40",
  Table:   "bg-indigo-900/40 text-indigo-300 border-indigo-700/40",
};

interface Props {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function WireframeBlock({ block, isSelected, onSelect, onDelete }: Props) {
  const height = BLOCK_HEIGHTS[block.type] ?? 72;
  const accent = BLOCK_ACCENTS[block.type] ?? "bg-gray-800 text-gray-400 border-gray-700";

  return (
    <div
      data-block="true"
      id={`wireframe-block-${block.id}`}
      onClick={onSelect}
      className={`
        relative group w-full cursor-pointer border-b transition-all duration-150
        ${isSelected
          ? "border-brand-500/60 bg-brand-900/10 ring-1 ring-brand-500/40"
          : "border-gray-700/40 bg-gray-800/30 hover:bg-gray-800/50 hover:border-gray-600/60"
        }
      `}
      style={{ height, minHeight: height }}
    >
      {/* Pattern grid overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 7px,rgba(255,255,255,.03) 7px,rgba(255,255,255,.03) 8px),repeating-linear-gradient(90deg,transparent,transparent 7px,rgba(255,255,255,.03) 7px,rgba(255,255,255,.03) 8px)",
        }}
      />

      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${accent} backdrop-blur-sm`}
        >
          {block.type}
        </span>
      </div>

      {/* Delete button */}
      {isSelected && (
        <button
          id={`delete-block-${block.id}`}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-red-900/60 hover:bg-red-700 border border-red-700/60 rounded text-red-300 text-[10px] transition-colors"
          title="Delete block"
        >
          ×
        </button>
      )}

      {/* Drag handle indicator */}
      <div className={`absolute left-1 inset-y-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity`}>
        <div className="flex flex-col gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-gray-500" />
          ))}
        </div>
      </div>
    </div>
  );
}
