"use client";

import React from "react";
import type { Block } from "./WireframeEditor";

// ─── Layout variants ──────────────────────────────────────────────────────────

export const BLOCK_LAYOUT_VARIANTS: Record<string, string[]> = {
  Navbar:  ["default", "centered", "minimal"],
  Hero:    ["centered", "split", "minimal", "fullscreen"],
  Cards:   ["grid-3", "grid-2", "list", "horizontal"],
  CTA:     ["banner", "split", "minimal"],
  Form:    ["stacked", "inline", "card"],
  Footer:  ["columns", "simple", "centered"],
  Text:    ["body", "two-column", "highlight"],
  Image:   ["full-width", "contained", "gallery"],
  Table:   ["basic", "striped", "compact"],
};

export const DEFAULT_LAYOUTS: Record<string, string> = {
  Navbar:  "default",
  Hero:    "centered",
  Cards:   "grid-3",
  CTA:     "banner",
  Form:    "stacked",
  Footer:  "columns",
  Text:    "body",
  Image:   "full-width",
  Table:   "basic",
};

// ─── Block heights ────────────────────────────────────────────────────────────

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

// ─── Accent badge colors ──────────────────────────────────────────────────────

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

// ─── Wireframe primitives ─────────────────────────────────────────────────────

function WL({ w = "100%", opacity = 0.5 }: { w?: string | number; opacity?: number }) {
  return <div className="rounded bg-gray-500 shrink-0" style={{ width: w, height: 2, opacity }} />;
}

function WBox({ w, h, className = "" }: { w?: string | number; h: number; className?: string }) {
  return (
    <div
      className={`border border-gray-600/50 bg-gray-700/20 rounded shrink-0 ${className}`}
      style={{ width: w ?? "100%", height: h }}
    />
  );
}

function WBtn({ w = 48, h = 16, accent = false }: { w?: number | string; h?: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-full shrink-0 ${
        accent ? "bg-brand-700/50 border border-brand-600/40" : "border border-gray-600/50 bg-gray-700/30"
      }`}
      style={{ width: w, height: h }}
    />
  );
}

function WCircle({ size = 12 }: { size?: number }) {
  return <div className="rounded-full bg-gray-600/50 shrink-0" style={{ width: size, height: size }} />;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function NavbarDefault() {
  return (
    <div className="flex items-center justify-between px-4 h-full">
      <div className="flex items-center gap-2">
        <WCircle size={20} />
        <WL w={48} />
      </div>
      <div className="flex items-center gap-3">
        <WL w={22} opacity={0.35} />
        <WL w={28} opacity={0.35} />
        <WL w={32} opacity={0.35} />
        <WL w={20} opacity={0.35} />
      </div>
      <WBtn w={52} h={18} accent />
    </div>
  );
}

function NavbarCentered() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-1.5">
      <div className="flex items-center gap-2">
        <WCircle size={14} />
        <WL w={40} />
      </div>
      <div className="flex items-center gap-4">
        <WL w={20} opacity={0.35} />
        <WL w={24} opacity={0.35} />
        <WL w={28} opacity={0.35} />
        <WL w={20} opacity={0.35} />
      </div>
    </div>
  );
}

function NavbarMinimal() {
  return (
    <div className="flex items-center justify-between px-4 h-full">
      <div className="flex items-center gap-2">
        <WCircle size={20} />
        <WL w={48} />
      </div>
      <div className="flex flex-col gap-1">
        <WL w={18} />
        <WL w={18} />
        <WL w={18} />
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroCentered() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
      <WL w="68%" />
      <WL w="52%" opacity={0.45} />
      <WL w="44%" opacity={0.35} />
      <div className="flex gap-2 mt-1">
        <WBtn w={64} h={20} accent />
        <WBtn w={64} h={20} />
      </div>
    </div>
  );
}

function HeroSplit() {
  return (
    <div className="flex h-full px-3 gap-3 items-center">
      <div className="flex-1 flex flex-col gap-2 py-3">
        <WL w="85%" />
        <WL w="70%" opacity={0.5} />
        <WL w="60%" opacity={0.4} />
        <div className="mt-1.5 flex gap-1.5">
          <WBtn w={52} h={16} accent />
          <WBtn w={52} h={16} />
        </div>
      </div>
      <WBox w="42%" h={92} />
    </div>
  );
}

function HeroMinimal() {
  return (
    <div className="flex flex-col justify-center h-full gap-2.5 px-6">
      <WL w="62%" />
      <WL w="50%" opacity={0.45} />
      <WL w="40%" opacity={0.35} />
    </div>
  );
}

function HeroFullscreen() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-3 overflow-hidden">
      <div className="absolute inset-0 bg-gray-700/40" />
      <div className="relative flex flex-col items-center gap-2.5">
        <WL w={160} />
        <WL w={120} opacity={0.45} />
        <WL w={96} opacity={0.35} />
        <WBtn w={72} h={22} accent />
      </div>
    </div>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function CardsGrid3() {
  return (
    <div className="flex gap-2.5 px-3 items-center h-full">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 flex flex-col gap-2">
          <WBox w="100%" h={38} />
          <WL w="78%" />
          <WL w="60%" opacity={0.4} />
        </div>
      ))}
    </div>
  );
}

function CardsGrid2() {
  return (
    <div className="flex gap-3 px-4 items-center h-full">
      {[0, 1].map((i) => (
        <div key={i} className="flex-1 flex flex-col gap-2">
          <WBox w="100%" h={46} />
          <WL w="80%" />
          <WL w="65%" opacity={0.4} />
          <WL w="52%" opacity={0.3} />
        </div>
      ))}
    </div>
  );
}

function CardsList() {
  return (
    <div className="flex flex-col justify-center gap-2.5 px-4 h-full">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <WBox w={28} h={28} className="rounded-lg" />
          <div className="flex-1 flex flex-col gap-1.5">
            <WL w="62%" />
            <WL w="48%" opacity={0.4} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardsHorizontal() {
  return (
    <div className="flex flex-col justify-center gap-2.5 px-3 h-full">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-2.5 border border-gray-700/30 rounded-lg p-1.5">
          <WBox w={52} h={44} className="rounded" />
          <div className="flex-1 flex flex-col gap-1.5">
            <WL w="72%" />
            <WL w="56%" opacity={0.4} />
            <WL w="44%" opacity={0.3} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2.5 bg-brand-900/20 border-y border-brand-800/30">
      <WL w="44%" />
      <WL w="34%" opacity={0.45} />
      <WBtn w={72} h={22} accent />
    </div>
  );
}

function CTASplit() {
  return (
    <div className="flex items-center h-full px-4 gap-4">
      <div className="flex-1 flex flex-col gap-2">
        <WL w="76%" />
        <WL w="60%" opacity={0.4} />
        <WL w="52%" opacity={0.35} />
      </div>
      <div className="flex flex-col gap-1.5 items-stretch w-32">
        <WBox w="100%" h={22} className="rounded" />
        <WBox w="100%" h={22} className="rounded" />
        <WBtn w="100%" h={22} accent />
      </div>
    </div>
  );
}

function CTAMinimal() {
  return (
    <div className="flex items-center justify-center h-full gap-5 px-8">
      <div className="flex flex-col gap-1.5">
        <WL w={100} />
        <WL w={80} opacity={0.4} />
      </div>
      <WBtn w={72} h={22} accent />
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function FormStacked() {
  return (
    <div className="flex flex-col justify-center gap-2 px-5 h-full">
      <WL w="38%" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-1">
          <WL w="28%" opacity={0.4} />
          <WBox w="100%" h={20} />
        </div>
      ))}
      <WBtn w={84} h={22} accent />
    </div>
  );
}

function FormInline() {
  return (
    <div className="flex flex-col justify-center gap-2 px-5 h-full">
      <WL w="38%" />
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <WL w="55%" opacity={0.4} />
            <WBox w="100%" h={18} />
          </div>
        ))}
      </div>
      <WBtn w={84} h={22} accent />
    </div>
  );
}

function FormCard() {
  return (
    <div className="flex items-center justify-center h-full px-8">
      <div className="border border-gray-600/40 rounded-lg p-3 w-full flex flex-col gap-2 bg-gray-800/20">
        <WL w="42%" />
        {[0, 1, 2].map((i) => (
          <WBox key={i} w="100%" h={18} />
        ))}
        <WBtn w="100%" h={22} accent />
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterColumns() {
  return (
    <div className="flex px-4 h-full items-center gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex-1 flex flex-col gap-1.5">
          <WL w="58%" />
          <WL w="44%" opacity={0.35} />
          <WL w="50%" opacity={0.3} />
          <WL w="38%" opacity={0.25} />
        </div>
      ))}
    </div>
  );
}

function FooterSimple() {
  return (
    <div className="flex items-center justify-between px-4 h-full">
      <div className="flex items-center gap-2">
        <WCircle size={16} />
        <WL w={44} />
      </div>
      <div className="flex gap-3">
        <WL w={24} opacity={0.4} />
        <WL w={28} opacity={0.4} />
        <WL w={24} opacity={0.4} />
        <WL w={20} opacity={0.4} />
      </div>
      <WL w={60} opacity={0.25} />
    </div>
  );
}

function FooterCentered() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <div className="flex items-center gap-2">
        <WCircle size={16} />
        <WL w={44} />
      </div>
      <div className="flex gap-4">
        <WL w={24} opacity={0.4} />
        <WL w={28} opacity={0.4} />
        <WL w={24} opacity={0.4} />
        <WL w={20} opacity={0.4} />
      </div>
      <WL w={84} opacity={0.2} />
    </div>
  );
}

// ─── Text ─────────────────────────────────────────────────────────────────────

function TextBody() {
  return (
    <div className="flex flex-col justify-center gap-2 px-5 h-full">
      <WL w="96%" />
      <WL w="88%" opacity={0.7} />
      <WL w="92%" opacity={0.65} />
      <WL w="72%" opacity={0.5} />
    </div>
  );
}

function TextTwoColumn() {
  return (
    <div className="flex px-4 h-full items-center gap-4">
      {[0, 1].map((c) => (
        <div key={c} className="flex-1 flex flex-col gap-2">
          <WL w="96%" />
          <WL w="88%" opacity={0.6} />
          <WL w="80%" opacity={0.5} />
          <WL w="68%" opacity={0.4} />
        </div>
      ))}
    </div>
  );
}

function TextHighlight() {
  return (
    <div className="flex px-4 h-full items-center gap-3">
      <div className="flex-1 flex flex-col gap-2">
        <WL w="92%" />
        <WL w="80%" opacity={0.6} />
        <WL w="86%" opacity={0.5} />
      </div>
      <div className="w-24 h-12 border-l-2 border-brand-600/60 bg-brand-900/20 rounded-r px-2 flex flex-col justify-center gap-1.5 shrink-0">
        <WL w="92%" opacity={0.7} />
        <WL w="76%" opacity={0.5} />
      </div>
    </div>
  );
}

// ─── Image ────────────────────────────────────────────────────────────────────

function ImageFullWidth() {
  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gray-700/20" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(45deg,rgba(255,255,255,0.04) 25%,transparent 25%),linear-gradient(-45deg,rgba(255,255,255,0.04) 25%,transparent 25%)",
          backgroundSize: "24px 24px",
        }}
      />
      <WBox w={56} h={36} className="relative opacity-60" />
    </div>
  );
}

function ImageContained() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 px-10">
      <WBox w="72%" h={70} />
      <WL w="42%" opacity={0.4} />
    </div>
  );
}

function ImageGallery() {
  return (
    <div className="grid grid-cols-3 gap-1.5 h-full p-2.5">
      {[...Array(6)].map((_, i) => (
        <WBox key={i} w="100%" h={36} />
      ))}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

const TABLE_COLS = [44, 64, 48, 36];

function TableBasic() {
  return (
    <div className="flex flex-col h-full px-3 py-2">
      <div className="flex gap-2 bg-gray-700/30 rounded-t-md px-2 py-1.5">
        {TABLE_COLS.map((w, i) => <WL key={i} w={w} />)}
      </div>
      {[0, 1, 2, 3].map((r) => (
        <div key={r} className="flex gap-2 px-2 py-1.5 border-b border-gray-700/20">
          {TABLE_COLS.map((w, i) => <WL key={i} w={w} opacity={0.35} />)}
        </div>
      ))}
    </div>
  );
}

function TableStriped() {
  return (
    <div className="flex flex-col h-full px-3 py-2">
      <div className="flex gap-2 bg-brand-900/30 rounded-t-md px-2 py-1.5">
        {TABLE_COLS.map((w, i) => <WL key={i} w={w} />)}
      </div>
      {[0, 1, 2, 3].map((r) => (
        <div
          key={r}
          className={`flex gap-2 px-2 py-1.5 border-b border-gray-700/20 ${r % 2 === 0 ? "bg-gray-800/20" : ""}`}
        >
          {TABLE_COLS.map((w, i) => <WL key={i} w={w} opacity={0.35} />)}
        </div>
      ))}
    </div>
  );
}

function TableCompact() {
  return (
    <div className="flex flex-col h-full px-3 py-1">
      <div className="flex gap-2 bg-gray-700/30 px-2 py-1">
        {TABLE_COLS.map((w, i) => <WL key={i} w={w} />)}
      </div>
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <div key={r} className="flex gap-2 px-2 py-1 border-b border-gray-700/15">
          {TABLE_COLS.map((w, i) => <WL key={i} w={w} opacity={0.3} />)}
        </div>
      ))}
    </div>
  );
}

// ─── Layout render map ────────────────────────────────────────────────────────

const LAYOUT_RENDERS: Record<string, Record<string, () => React.ReactElement>> = {
  Navbar:  { default: NavbarDefault, centered: NavbarCentered, minimal: NavbarMinimal },
  Hero:    { centered: HeroCentered, split: HeroSplit, minimal: HeroMinimal, fullscreen: HeroFullscreen },
  Cards:   { "grid-3": CardsGrid3, "grid-2": CardsGrid2, list: CardsList, horizontal: CardsHorizontal },
  CTA:     { banner: CTABanner, split: CTASplit, minimal: CTAMinimal },
  Form:    { stacked: FormStacked, inline: FormInline, card: FormCard },
  Footer:  { columns: FooterColumns, simple: FooterSimple, centered: FooterCentered },
  Text:    { body: TextBody, "two-column": TextTwoColumn, highlight: TextHighlight },
  Image:   { "full-width": ImageFullWidth, contained: ImageContained, gallery: ImageGallery },
  Table:   { basic: TableBasic, striped: TableStriped, compact: TableCompact },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function WireframeBlock({ block, isSelected, onSelect, onDelete }: Props) {
  const height = BLOCK_HEIGHTS[block.type] ?? 72;
  const accent = BLOCK_ACCENTS[block.type] ?? "bg-gray-800 text-gray-400 border-gray-700";
  const layout = (block.props?.layout as string) || DEFAULT_LAYOUTS[block.type] || "default";
  const LayoutVisual = LAYOUT_RENDERS[block.type]?.[layout] ?? LAYOUT_RENDERS[block.type]?.["default"];

  return (
    <div
      data-block="true"
      id={`wireframe-block-${block.id}`}
      onClick={onSelect}
      className={`
        relative group w-full cursor-pointer border-b transition-all duration-150
        ${isSelected
          ? "border-brand-500/60 bg-brand-900/10"
          : "border-gray-700/40 bg-gray-800/20 hover:bg-gray-800/40 hover:border-gray-600/60"
        }
      `}
      style={{ height, minHeight: height }}
    >
      {/* Layout visual fills the block */}
      <div className="absolute inset-0 overflow-hidden">
        {LayoutVisual ? (
          <LayoutVisual />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${accent} backdrop-blur-sm`}>
              {block.type}
            </span>
          </div>
        )}
      </div>

      {/* Type + layout badge — top-left, shown on hover */}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${accent} backdrop-blur-sm`}>
          {block.type}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded border border-gray-600/50 bg-gray-900/80 text-gray-400 backdrop-blur-sm">
          {layout}
        </span>
      </div>

      {/* Selection ring */}
      {isSelected && (
        <div className="absolute inset-0 ring-1 ring-brand-500/60 pointer-events-none z-10" />
      )}

      {/* Delete button */}
      {isSelected && (
        <button
          id={`delete-block-${block.id}`}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-red-900/60 hover:bg-red-700 border border-red-700/60 rounded text-red-300 text-[10px] transition-colors z-20"
          title="Delete block"
        >
          ×
        </button>
      )}

      {/* Drag handle */}
      <div className="absolute left-1 inset-y-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="flex flex-col gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-gray-500" />
          ))}
        </div>
      </div>
    </div>
  );
}
