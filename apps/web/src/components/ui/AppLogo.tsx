"use client";

import Link from "next/link";

type Props = {
  href?: string;
  compact?: boolean;
};

export default function AppLogo({ href = "/", compact = false }: Props) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(130,198,255,0.32),rgba(37,100,168,0.36))] shadow-glow">
        <div className="absolute inset-[1px] rounded-[15px] bg-[linear-gradient(180deg,#17304c,#0b1729)]" />
        <svg className="relative h-5 w-5 text-brand-200" viewBox="0 0 20 20" fill="none">
          <path d="M3 5.5h6v4H3zM11 5.5h6v4h-6zM3 11.5h14v2H3zM3 15.5h9v2H3z" fill="currentColor" />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-[-0.05em] text-white">Layoutr</div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">AI Workspace</div>
        </div>
      )}
    </div>
  );

  return <Link href={href}>{content}</Link>;
}
