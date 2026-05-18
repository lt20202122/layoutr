import Link from "next/link";
import FooterFigures from "./FooterFigures";

export default function Footer() {
  return (
    <footer className="w-full mt-24 bg-[#0a3528] text-white">
      {/* figures sit right on the top edge */}
      <FooterFigures />

      <div className="max-w-screen-xl mx-auto px-[150px] py-16 grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-x-16 gap-y-8">

        {/* brand */}
        <div className="flex flex-col gap-4">
          <span className="font-heading text-xl tracking-tight">Layoutr</span>
          <span className="text-sm text-white/40">English</span>
        </div>

        {/* GET STARTED */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] tracking-widest text-white/40 uppercase mb-1">Get started</p>
          <FooterLink href="/dashboard">Open editor</FooterLink>
          <FooterLink href="/docs">Documentation</FooterLink>
          <FooterLink href="/pricing">Pricing</FooterLink>
        </div>

        {/* LAYOUTR */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] tracking-widest text-white/40 uppercase mb-1">Layoutr</p>
          <FooterLink href="/about">About us</FooterLink>
          <FooterLink href="/blog">Blog</FooterLink>
          <FooterLink href="/changelog">Changelog</FooterLink>
        </div>

        {/* THE PRODUCT */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] tracking-widest text-white/40 uppercase mb-1">The product</p>
          <FooterLink href="/features/sitemaps">Sitemaps</FooterLink>
          <FooterLink href="/features/wireframes">Wireframes</FooterLink>
          <FooterLink href="/features/ai">AI agent</FooterLink>
          <FooterLink href="/features/api">API & MCP</FooterLink>
        </div>

        {/* LEGAL */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] tracking-widest text-white/40 uppercase mb-1">Legal</p>
          <FooterLink href="/legal/terms">Terms & conditions</FooterLink>
          <FooterLink href="/legal/privacy">Privacy policy</FooterLink>
        </div>
      </div>

      <div className="border-t border-white/10 px-[150px] py-5 text-white/30 text-xs">
        © {new Date().getFullYear()} Layoutr. All rights reserved.
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-white/70 hover:text-white transition-colors duration-150"
    >
      {children}
    </Link>
  );
}
