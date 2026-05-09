import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppLogo from "@/components/ui/AppLogo";
import CreditsDisplay from "@/components/ui/CreditsDisplay";
import DashboardNav from "@/components/ui/DashboardNav";
import SignOutButton from "@/components/ui/SignOutButton";

const DEV_MODE =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEV_BYPASS === "true";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("user_profiles").select("credits").eq("id", user.id).single()
    : { data: null };

  const { data: projects } = DEV_MODE
    ? await supabase
        .from("projects")
        .select("id, name")
        .order("updated_at", { ascending: false })
        .limit(4)
    : { data: null };

  return (
    <div className="min-h-screen pb-6 pt-4 sm:pb-8 sm:pt-6">
      {DEV_MODE && (
        <div className="app-shell mb-4">
          <div className="glass-panel rounded-full px-4 py-2 text-xs text-amber-200">
            Dev mode is active. Auth bypass is enabled for local editing.
          </div>
        </div>
      )}

      <div className="app-shell">
        <div className="glass-panel-strong overflow-hidden rounded-[34px]">
          <div className="grid min-h-[calc(100vh-3rem)] lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border-b border-white/8 bg-black/10 p-5 lg:border-b-0 lg:border-r lg:border-white/8">
              <AppLogo href="/dashboard" />

              <div className="mt-8">
                <DashboardNav />
              </div>

              <div className="mt-8 rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
                <p className="section-label">Workspace</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Structure pages, generate wireframes, and keep the planning layer visible while you ship.
                </p>
              </div>

              {projects && projects.length > 0 && (
                <div className="mt-6 rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="section-label">Recent</p>
                  <div className="mt-3 space-y-1">
                    {projects.map((project: { id: string; name: string }) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}/sitemap`}
                        className="block rounded-2xl px-3 py-2 text-sm text-slate-400 hover:bg-white/[0.04] hover:text-white"
                      >
                        {project.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            <div className="min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]">
              <header className="flex flex-col gap-4 border-b border-white/8 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="section-label">Dashboard</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Human-friendly planning surfaces with direct API and MCP access.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {user ? (
                    <>
                      <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
                        {user.email}
                      </div>
                      <CreditsDisplay initialCredits={profile?.credits ?? 0} />
                      <SignOutButton />
                    </>
                  ) : (
                    <Link href="/auth/login" className="button-secondary">
                      Sign in
                    </Link>
                  )}
                </div>
              </header>

              <main className="px-5 py-6 sm:px-8 sm:py-8">{children}</main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
