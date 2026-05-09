"use client";

import React from "react";
import type { Block } from "./WireframeEditor";

export const BLOCK_LAYOUT_VARIANTS: Record<string, string[]> = {
  Navbar: ["default", "centered", "minimal"],
  Hero: ["centered", "split", "minimal", "fullscreen", "angled"],
  Cards: ["grid-3", "grid-2", "list", "horizontal", "features"],
  CTA: ["banner", "split", "minimal"],
  Form: ["stacked", "inline", "card"],
  Footer: ["columns", "simple", "centered"],
  Text: ["body", "two-column", "highlight"],
  Image: ["full-width", "contained", "gallery"],
  Table: ["basic", "striped", "compact"],
  FAQ: ["accordion", "grid"],
  Testimonials: ["grid", "carousel", "single"],
  Pricing: ["cards", "table", "minimal"],
  Stats: ["grid", "simple"],
};

export const DEFAULT_LAYOUTS: Record<string, string> = {
  Navbar: "default",
  Hero: "centered",
  Cards: "grid-3",
  CTA: "banner",
  Form: "stacked",
  Footer: "columns",
  Text: "body",
  Image: "full-width",
  Table: "basic",
  FAQ: "accordion",
  Testimonials: "grid",
  Pricing: "cards",
  Stats: "grid",
};

const BLOCK_HEIGHTS: Record<string, number> = {
  Navbar: 48,
  Hero: 120,
  Cards: 100,
  CTA: 72,
  Form: 140,
  Footer: 80,
  Text: 64,
  Image: 100,
  Table: 120,
  FAQ: 130,
  Testimonials: 100,
  Pricing: 150,
  Stats: 80,
};

const BLOCK_ACCENTS: Record<string, string> = {
  Navbar: "text-sky-200",
  Hero: "text-cyan-200",
  Cards: "text-emerald-200",
  CTA: "text-brand-100",
  Form: "text-amber-200",
  Footer: "text-slate-300",
  Text: "text-slate-200",
  Image: "text-rose-200",
  Table: "text-indigo-200",
  FAQ: "text-emerald-200",
  Testimonials: "text-pink-200",
  Pricing: "text-orange-200",
  Stats: "text-sky-200",
};

function WL({ w = "100%", opacity = 0.5 }: { w?: string | number; opacity?: number }) {
  return <div className="shrink-0 rounded-full bg-white" style={{ width: w, height: 2, opacity }} />;
}

function WBox({ w, h, className = "" }: { w?: string | number; h: number; className?: string }) {
  return (
    <div
      className={`shrink-0 rounded-[10px] border border-white/10 bg-white/[0.04] ${className}`}
      style={{ width: w ?? "100%", height: h }}
    />
  );
}

function WBtn({ w = 48, h = 16, accent = false }: { w?: number | string; h?: number; accent?: boolean }) {
  return (
    <div
      className={`shrink-0 rounded-full ${accent ? "bg-brand-300/70" : "border border-white/12 bg-white/[0.05]"}`}
      style={{ width: w, height: h }}
    />
  );
}

function WCircle({ size = 12 }: { size?: number }) {
  return <div className="shrink-0 rounded-full bg-white/20" style={{ width: size, height: size }} />;
}

function NavbarDefault() {
  return (
    <div className="flex h-full items-center justify-between px-4">
      <div className="flex items-center gap-2"><WCircle size={18} /><WL w={42} /></div>
      <div className="flex items-center gap-3"><WL w={22} opacity={0.35} /><WL w={26} opacity={0.35} /><WL w={20} opacity={0.35} /></div>
      <WBtn w={50} h={18} accent />
    </div>
  );
}
function NavbarCentered() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5">
      <div className="flex items-center gap-2"><WCircle size={14} /><WL w={40} /></div>
      <div className="flex items-center gap-3"><WL w={20} opacity={0.35} /><WL w={24} opacity={0.35} /><WL w={20} opacity={0.35} /></div>
    </div>
  );
}
function NavbarMinimal() {
  return (
    <div className="flex h-full items-center justify-between px-4">
      <div className="flex items-center gap-2"><WCircle size={18} /><WL w={44} /></div>
      <div className="space-y-1"><WL w={16} /><WL w={16} /><WL w={16} /></div>
    </div>
  );
}
function HeroCentered() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8">
      <WL w="68%" />
      <WL w="52%" opacity={0.45} />
      <WL w="40%" opacity={0.35} />
      <div className="mt-1 flex gap-2"><WBtn w={64} h={20} accent /><WBtn w={64} h={20} /></div>
    </div>
  );
}
function HeroSplit() {
  return (
    <div className="flex h-full items-center gap-3 px-3">
      <div className="flex-1 space-y-2"><WL w="84%" /><WL w="70%" opacity={0.5} /><WL w="58%" opacity={0.4} /><div className="mt-2 flex gap-2"><WBtn w={52} h={16} accent /><WBtn w={52} h={16} /></div></div>
      <WBox w="42%" h={92} />
    </div>
  );
}
function HeroMinimal() {
  return <div className="flex h-full flex-col justify-center gap-2.5 px-6"><WL w="62%" /><WL w="50%" opacity={0.45} /><WL w="40%" opacity={0.35} /></div>;
}
function HeroFullscreen() {
  return <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden"><div className="absolute inset-0 bg-white/[0.03]" /><div className="relative flex flex-col items-center gap-2.5"><WL w={160} /><WL w={120} opacity={0.45} /><WL w={96} opacity={0.35} /><WBtn w={72} h={22} accent /></div></div>;
}
function HeroAngled() {
  return <div className="relative flex h-full items-center overflow-hidden px-6"><div className="absolute inset-0 origin-top-left skew-y-[-6deg] border-t border-white/10 bg-white/[0.03] translate-y-4" /><div className="relative flex w-full flex-col gap-2.5"><WL w="55%" /><WL w="40%" opacity={0.4} /><WBtn w={64} h={18} accent /></div></div>;
}
function CardsGrid3() {
  return <div className="flex h-full items-center gap-2.5 px-3">{[0, 1, 2].map((i) => <div key={i} className="flex-1 space-y-2"><WBox h={38} /><WL w="78%" /><WL w="60%" opacity={0.4} /></div>)}</div>;
}
function CardsGrid2() {
  return <div className="flex h-full items-center gap-3 px-4">{[0, 1].map((i) => <div key={i} className="flex-1 space-y-2"><WBox h={46} /><WL w="80%" /><WL w="65%" opacity={0.4} /><WL w="52%" opacity={0.3} /></div>)}</div>;
}
function CardsList() {
  return <div className="flex h-full flex-col justify-center gap-2.5 px-4">{[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-3"><WBox w={28} h={28} /><div className="flex-1 space-y-1.5"><WL w="62%" /><WL w="48%" opacity={0.4} /></div></div>)}</div>;
}
function CardsHorizontal() {
  return <div className="flex h-full flex-col justify-center gap-2.5 px-3">{[0, 1].map((i) => <div key={i} className="flex items-center gap-2.5 rounded-xl border border-white/8 p-1.5"><WBox w={52} h={44} /><div className="flex-1 space-y-1.5"><WL w="72%" /><WL w="56%" opacity={0.4} /><WL w="44%" opacity={0.3} /></div></div>)}</div>;
}
function CardsFeatures() {
  return <div className="grid h-full grid-cols-2 items-center gap-x-4 gap-y-3 px-4">{[0, 1, 2, 3].map((i) => <div key={i} className="flex items-start gap-2.5"><WCircle size={14} /><div className="flex-1 space-y-1.5"><WL w="85%" /><WL w="60%" opacity={0.35} /></div></div>)}</div>;
}
function CTABanner() {
  return <div className="flex h-full flex-col items-center justify-center gap-2.5 border-y border-white/8 bg-brand-300/10"><WL w="44%" /><WL w="34%" opacity={0.45} /><WBtn w={72} h={22} accent /></div>;
}
function CTASplit() {
  return <div className="flex h-full items-center gap-4 px-4"><div className="flex-1 space-y-2"><WL w="76%" /><WL w="60%" opacity={0.4} /><WL w="52%" opacity={0.35} /></div><div className="flex w-32 flex-col gap-1.5"><WBox h={22} /><WBox h={22} /><WBtn w="100%" h={22} accent /></div></div>;
}
function CTAMinimal() {
  return <div className="flex h-full items-center justify-center gap-5 px-8"><div className="space-y-1.5"><WL w={100} /><WL w={80} opacity={0.4} /></div><WBtn w={72} h={22} accent /></div>;
}
function FormStacked() {
  return <div className="flex h-full flex-col justify-center gap-2 px-5"><WL w="38%" />{[0, 1, 2].map((i) => <div key={i} className="space-y-1"><WL w="28%" opacity={0.4} /><WBox h={20} /></div>)}<WBtn w={84} h={22} accent /></div>;
}
function FormInline() {
  return <div className="flex h-full flex-col justify-center gap-2 px-5"><WL w="38%" /><div className="grid grid-cols-2 gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="space-y-1"><WL w="55%" opacity={0.4} /><WBox h={18} /></div>)}</div><WBtn w={84} h={22} accent /></div>;
}
function FormCard() {
  return <div className="flex h-full items-center justify-center px-8"><div className="w-full space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3"><WL w="42%" />{[0, 1, 2].map((i) => <WBox key={i} h={18} />)}<WBtn w="100%" h={22} accent /></div></div>;
}
function FooterColumns() {
  return <div className="flex h-full items-center gap-4 px-4">{[0, 1, 2, 3].map((i) => <div key={i} className="flex-1 space-y-1.5"><WL w="58%" /><WL w="44%" opacity={0.35} /><WL w="50%" opacity={0.3} /><WL w="38%" opacity={0.25} /></div>)}</div>;
}
function FooterSimple() {
  return <div className="flex h-full items-center justify-between px-4"><div className="flex items-center gap-2"><WCircle size={16} /><WL w={44} /></div><div className="flex gap-3"><WL w={24} opacity={0.4} /><WL w={28} opacity={0.4} /><WL w={20} opacity={0.4} /></div><WL w={60} opacity={0.25} /></div>;
}
function FooterCentered() {
  return <div className="flex h-full flex-col items-center justify-center gap-2"><div className="flex items-center gap-2"><WCircle size={16} /><WL w={44} /></div><div className="flex gap-4"><WL w={24} opacity={0.4} /><WL w={28} opacity={0.4} /><WL w={20} opacity={0.4} /></div><WL w={84} opacity={0.2} /></div>;
}
function TextBody() {
  return <div className="flex h-full flex-col justify-center gap-2 px-5"><WL w="96%" /><WL w="88%" opacity={0.7} /><WL w="92%" opacity={0.65} /><WL w="72%" opacity={0.5} /></div>;
}
function TextTwoColumn() {
  return <div className="flex h-full items-center gap-4 px-4">{[0, 1].map((c) => <div key={c} className="flex-1 space-y-2"><WL w="96%" /><WL w="88%" opacity={0.6} /><WL w="80%" opacity={0.5} /><WL w="68%" opacity={0.4} /></div>)}</div>;
}
function TextHighlight() {
  return <div className="flex h-full items-center gap-3 px-4"><div className="flex-1 space-y-2"><WL w="92%" /><WL w="80%" opacity={0.6} /><WL w="86%" opacity={0.5} /></div><div className="w-24 shrink-0 rounded-r px-2 py-2" style={{ borderLeft: "2px solid rgba(95,180,255,0.6)", background: "rgba(95,180,255,0.08)" }}><WL w="92%" opacity={0.7} /><WL w="76%" opacity={0.5} /></div></div>;
}
function ImageFullWidth() {
  return <div className="relative flex h-full items-center justify-center overflow-hidden"><div className="absolute inset-0 bg-white/[0.02]" /><WBox w={56} h={36} className="relative opacity-60" /></div>;
}
function ImageContained() {
  return <div className="flex h-full flex-col items-center justify-center gap-2 px-10"><WBox w="72%" h={70} /><WL w="42%" opacity={0.4} /></div>;
}
function ImageGallery() {
  return <div className="grid h-full grid-cols-3 gap-1.5 p-2.5">{[...Array(6)].map((_, i) => <WBox key={i} h={36} />)}</div>;
}
function TableBasic() {
  const cols = [44, 64, 48, 36];
  return <div className="flex h-full flex-col px-3 py-2"><div className="flex gap-2 rounded-t-md bg-white/[0.05] px-2 py-1.5">{cols.map((w, i) => <WL key={i} w={w} />)}</div>{[0, 1, 2, 3].map((r) => <div key={r} className="flex gap-2 border-b border-white/6 px-2 py-1.5">{cols.map((w, i) => <WL key={i} w={w} opacity={0.35} />)}</div>)}</div>;
}
function TableStriped() {
  const cols = [44, 64, 48, 36];
  return <div className="flex h-full flex-col px-3 py-2"><div className="flex gap-2 rounded-t-md bg-brand-300/10 px-2 py-1.5">{cols.map((w, i) => <WL key={i} w={w} />)}</div>{[0, 1, 2, 3].map((r) => <div key={r} className={`flex gap-2 border-b border-white/6 px-2 py-1.5 ${r % 2 === 0 ? "bg-white/[0.02]" : ""}`}>{cols.map((w, i) => <WL key={i} w={w} opacity={0.35} />)}</div>)}</div>;
}
function TableCompact() {
  const cols = [44, 64, 48, 36];
  return <div className="flex h-full flex-col px-3 py-1"><div className="flex gap-2 bg-white/[0.05] px-2 py-1">{cols.map((w, i) => <WL key={i} w={w} />)}</div>{[0, 1, 2, 3, 4, 5].map((r) => <div key={r} className="flex gap-2 border-b border-white/[0.05] px-2 py-1">{cols.map((w, i) => <WL key={i} w={w} opacity={0.3} />)}</div>)}</div>;
}
function FAQAccordion() {
  return <div className="flex h-full flex-col justify-center gap-2 px-6"><div className="mb-2"><WL w="30%" /></div>{[0, 1, 2, 3].map((i) => <div key={i} className="flex items-center justify-between border-b border-white/8 py-2"><WL w="70%" opacity={0.5} /><div className="mr-1 h-2.5 w-2.5 rotate-45 border-b border-r border-white/30" /></div>)}</div>;
}
function TestimonialsGrid() {
  return <div className="flex h-full items-center gap-3 px-4">{[0, 1, 2].map((i) => <div key={i} className="flex-1 space-y-2 rounded-xl border border-white/8 bg-white/[0.03] p-2"><div className="mb-1 flex gap-1">{[0, 1, 2, 3, 4].map((s) => <div key={s} className="h-1.5 w-1.5 rounded-full bg-amber-300/70" />)}</div><WL w="90%" opacity={0.6} /><WL w="75%" opacity={0.4} /><div className="mt-1 flex items-center gap-2"><WCircle size={16} /><WL w={32} opacity={0.3} /></div></div>)}</div>;
}
function PricingCards() {
  return <div className="flex h-full items-center gap-3 px-4">{[0, 1, 2].map((i) => <div key={i} className={`flex-1 space-y-2 rounded-xl border p-3 text-center ${i === 1 ? "border-brand-300/20 bg-brand-300/10" : "border-white/8 bg-white/[0.03]"}`}><WL w="60%" /><WL w="40%" opacity={0.5} /><div className="my-1 flex items-baseline justify-center gap-1"><WL w={24} /><span className="text-[10px] text-white/30">/mo</span></div><div className="space-y-1.5"><WL w="80%" opacity={0.3} /><WL w="85%" opacity={0.3} /><WL w="70%" opacity={0.3} /></div><WBtn w="100%" h={18} accent={i === 1} /></div>)}</div>;
}
function StatsGrid() {
  return <div className="flex h-full items-center justify-center gap-6 px-8">{[0, 1, 2, 3].map((i) => <div key={i} className="flex flex-col items-center gap-1.5"><WL w={36} /><WL w={48} opacity={0.4} /></div>)}</div>;
}
function GenerativeLayout({ composition }: { composition: any[] }) {
  return <div className="flex h-full flex-col justify-center gap-2 px-6">{composition.map((item, i) => {
    const { type, props } = item;
    if (type === "WL") return <WL key={i} {...props} />;
    if (type === "WBox") return <WBox key={i} {...props} />;
    if (type === "WBtn") return <WBtn key={i} {...props} />;
    if (type === "WCircle") return <WCircle key={i} {...props} />;
    return null;
  })}</div>;
}

const LAYOUT_RENDERS: Record<string, Record<string, () => React.ReactElement>> = {
  Navbar: { default: NavbarDefault, centered: NavbarCentered, minimal: NavbarMinimal },
  Hero: { centered: HeroCentered, split: HeroSplit, minimal: HeroMinimal, fullscreen: HeroFullscreen, angled: HeroAngled },
  Cards: { "grid-3": CardsGrid3, "grid-2": CardsGrid2, list: CardsList, horizontal: CardsHorizontal, features: CardsFeatures },
  CTA: { banner: CTABanner, split: CTASplit, minimal: CTAMinimal },
  Form: { stacked: FormStacked, inline: FormInline, card: FormCard },
  Footer: { columns: FooterColumns, simple: FooterSimple, centered: FooterCentered },
  Text: { body: TextBody, "two-column": TextTwoColumn, highlight: TextHighlight },
  Image: { "full-width": ImageFullWidth, contained: ImageContained, gallery: ImageGallery },
  Table: { basic: TableBasic, striped: TableStriped, compact: TableCompact },
  FAQ: { accordion: FAQAccordion, grid: CardsGrid2 },
  Testimonials: { grid: TestimonialsGrid, carousel: TestimonialsGrid, single: HeroMinimal },
  Pricing: { cards: PricingCards, table: TableBasic, minimal: CardsGrid3 },
  Stats: { grid: StatsGrid, simple: StatsGrid },
};

interface Props {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function WireframeBlock({ block, isSelected, onSelect, onDelete }: Props) {
  const height = BLOCK_HEIGHTS[block.type] ?? 72;
  const accent = BLOCK_ACCENTS[block.type] ?? "text-slate-200";
  const layout = (block.props?.layout as string) || DEFAULT_LAYOUTS[block.type] || "default";
  const LayoutVisual = block.composition
    ? () => <GenerativeLayout composition={block.composition as any[]} />
    : LAYOUT_RENDERS[block.type]?.[layout] ?? LAYOUT_RENDERS[block.type]?.default;

  return (
    <div
      data-block="true"
      id={`wireframe-block-${block.id}`}
      onClick={onSelect}
      className={`group relative w-full cursor-pointer border-b ${
        isSelected
          ? "border-brand-300/30 bg-brand-300/10"
          : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
      style={{ height, minHeight: height }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {LayoutVisual ? (
          <LayoutVisual />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className={`rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs font-semibold ${accent}`}>
              {block.label || block.type}
            </span>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <span className={`rounded-full border border-white/10 bg-slate-950/85 px-2 py-1 text-[10px] font-semibold ${accent}`}>
          {block.label || block.type}
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/85 px-2 py-1 text-[10px] text-slate-400">
          {block.composition ? "Generative" : layout}
        </span>
      </div>

      {isSelected && <div className="pointer-events-none absolute inset-0 ring-1 ring-brand-300/50" />}

      {isSelected && (
        <button
          id={`delete-block-${block.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-red-300/20 bg-red-500/10 text-red-100"
          title="Delete block"
        >
          x
        </button>
      )}
    </div>
  );
}
