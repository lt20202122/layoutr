"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CreditCard, FolderKanban, Settings } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Projects", icon: FolderKanban },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm ${
              active
                ? "bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgba(143,208,255,0.18)]"
                : "text-slate-400 hover:bg-white/[0.035] hover:text-slate-100"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-brand-300" : "text-slate-500"}`} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
