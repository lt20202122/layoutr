import Link from "next/link";
import { Bot, Boxes, LayoutTemplate, Sparkles } from "lucide-react";
import LaunchVisitorTracker from "@/components/analytics/LaunchVisitorTracker";
import AppLogo from "@/components/ui/AppLogo";
import WaitlistForm from "@/components/ui/WaitlistForm";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_BYPASS === "true";

const featureCards = [
  {
    icon: Boxes,
    title: "Model-readable project structure",
    body: "Shape sitemaps as living product maps with hierarchy, status, sections, and structure that agents can actually use.",
  },
  {
    icon: LayoutTemplate,
    title: "Wireframes that stay connected",
    body: "Move from sitemap to wireframe without leaving the workspace. Layout blocks, scaffold pages, and refine the system in one place.",
  },
  {
    icon: Bot,
    title: "API and MCP native",
    body: "Give AI coding agents direct access through REST or MCP so they can build, inspect, and modify product structure programmatically.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden pb-20 pt-6 sm:pb-24 sm:pt-8">
      <LaunchVisitorTracker />
      {DEV_MODE && (
        <div className="app-shell mb-6">
          <div className="glass-panel rounded-full px-4 py-2 text-xs text-amber-200">
            Dev bypass is enabled.{" "}
            <Link href="/dashboard" className="font-semibold text-amber-50 underline underline-offset-4">
              Open the dashboard
            </Link>
            {" "}or{" "}
            <Link href="/settings" className="font-semibold text-amber-50 underline underline-offset-4">
              jump to settings
            </Link>
            .
          </div>
        </div>
      )}

      <section className="app-shell">
        <div className="glass-panel-strong relative overflow-hidden rounded-[36px] px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/50 to-transparent" />
          <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <AppLogo />
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <Link href="/docs" className="button-secondary">Read docs</Link>
              <Link href="/pricing" className="button-secondary">Pricing</Link>
              <Link href={DEV_MODE ? "/dashboard" : "/auth/login"} className="button-secondary">
                {DEV_MODE ? "Workspace" : "Sign in"}
              </Link>
            </div>
          </header>

          <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_460px] lg:items-center">
            <div className="max-w-3xl">
              <p className="section-label">AI-native product architecture</p>
              <h1 className="headline-xl mt-5 max-w-4xl text-white">
                Sitemaps and wireframes for AI coding agents.
              </h1>
              <p className="body-lg mt-6 max-w-2xl">
                Plan site structure visually, refine wireframes in one workspace, and let agents read or edit the same project through REST and MCP.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={DEV_MODE ? "/dashboard" : "/auth/signup"} className="button-primary">
                  {DEV_MODE ? "Open dashboard" : "Start free"}
                </Link>
                <Link href="/docs" className="button-secondary">
                  Explore API setup
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                Start free if you want to use the product now. Explore API setup if you want to connect Layoutr to Codex, Claude Code, Cline, or other MCP-capable tools first.
              </p>
              <div className="mt-10 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="status-pill">Visual sitemap editor</span>
                <span className="status-pill">Integrated wireframe canvas</span>
                <span className="status-pill">REST + MCP access</span>
              </div>
            </div>

            <div className="glass-panel rounded-[30px] p-4">
              <div className="rounded-[24px] border border-white/10 bg-ink-950 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Workspace</p>
                    <p className="mt-1 text-sm font-medium text-white">Launch plan</p>
                  </div>
                  <div className="status-pill">
                    <Sparkles className="h-3.5 w-3.5 text-brand-300" />
                    AI connected
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[22px] border border-brand-300/15 bg-brand-400/10 p-4">
                    <div className="flex items-center justify-between text-xs text-brand-100/80">
                      <span>Sitemap</span>
                      <span>12 pages</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-slate-900/80 p-3">
                        <div className="h-2 w-16 rounded-full bg-brand-300/70" />
                        <div className="mt-2 h-1.5 w-10 rounded-full bg-white/20" />
                        <div className="mt-5 h-14 rounded-xl border border-white/8 bg-white/[0.04]" />
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 p-3">
                        <div className="h-2 w-14 rounded-full bg-white/70" />
                        <div className="mt-2 h-1.5 w-8 rounded-full bg-white/20" />
                        <div className="mt-5 h-14 rounded-xl border border-white/8 bg-white/[0.04]" />
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 p-3">
                        <div className="h-2 w-12 rounded-full bg-white/70" />
                        <div className="mt-2 h-1.5 w-9 rounded-full bg-white/20" />
                        <div className="mt-5 h-14 rounded-xl border border-white/8 bg-white/[0.04]" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Wireframe</span>
                        <span>Hero + cards + CTA</span>
                      </div>
                      <div className="mt-4 rounded-[20px] border border-white/10 bg-[#0a1423] p-3">
                        <div className="h-6 rounded-full bg-white/[0.04]" />
                        <div className="mt-3 h-24 rounded-[18px] bg-brand-400/10" />
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="h-16 rounded-2xl bg-white/[0.04]" />
                          <div className="h-16 rounded-2xl bg-white/[0.04]" />
                          <div className="h-16 rounded-2xl bg-white/[0.04]" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Agent prompt</p>
                      <p className="mt-4 text-sm leading-6 text-slate-300">
                        Generate a launch site with docs, pricing, onboarding, and app settings. Keep the layout minimal and developer-first.
                      </p>
                      <div className="mt-6 rounded-2xl border border-brand-300/20 bg-brand-300/10 px-3 py-2 text-xs font-medium text-brand-100">
                        MCP tools ready
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell mt-10 grid gap-6 lg:grid-cols-3">
        {featureCards.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="glass-panel rounded-[28px] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-300/20 bg-brand-400/10">
                <Icon className="h-5 w-5 text-brand-200" />
              </div>
              <h2 className="mt-6 text-xl font-semibold text-white">{feature.title}</h2>
              <p className="body-sm mt-3">{feature.body}</p>
            </article>
          );
        })}
      </section>

      <section className="app-shell mt-10">
        <div className="glass-panel rounded-[34px] px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="section-label">Built for agent workflows</p>
              <h2 className="headline-lg mt-5 max-w-xl text-white">
                A cleaner handoff between planning, structure, and implementation.
              </h2>
            </div>
            <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-semibold text-white">18</p>
                <p className="mt-2 leading-6 text-slate-400">MCP tools for project, sitemap, wireframe, design system, and AI generation flows.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-semibold text-white">2</p>
                <p className="mt-2 leading-6 text-slate-400">Modes of work: direct CRUD for structure and integrated AI for credit-based generation.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-semibold text-white">1</p>
                <p className="mt-2 leading-6 text-slate-400">Shared workspace across humans, API clients, and AI coding agents.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell mt-10">
        <div className="glass-panel rounded-[34px] px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="section-label">Launch tracking</p>
              <h2 className="headline-lg mt-5 max-w-xl text-white">
                Every waitlist signup carries its source.
              </h2>
              <p className="body-sm mt-4 max-w-lg text-slate-300">
                Signups capture source, medium, campaign, content, landing page, referrer, and the lead details needed to qualify launch demand.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-slate-300">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-medium text-white">UTM format</p>
                  <p className="mt-2 text-slate-400">`utm_source=x`, `utm_medium=community`, `utm_campaign=launch_202605_waitlist`, `utm_content=hero_cta`</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-medium text-white">Stored with the lead</p>
                  <p className="mt-2 text-slate-400">Email, company, role, use case, team size, source tags, landing path, and referrer.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#09111f] p-5">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
