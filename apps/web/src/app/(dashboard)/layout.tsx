import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/ui/SignOutButton";

const DEV_MODE = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEV_BYPASS === "true";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch credit balance
  const { data: profile } = user
    ? await supabase.from("user_profiles").select("credits").eq("id", user.id).single()
    : { data: null };

  // Fetch projects for dev banner quick links
  const { data: projects } = DEV_MODE
    ? await supabase.from("projects").select("id, name").order("updated_at", { ascending: false }).limit(5)
    : { data: null };

  return (
    <div className="min-h-screen flex flex-col">
      {/* DEV MODE BANNER */}
      {DEV_MODE && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs px-4 py-2 flex items-center gap-4 flex-wrap sticky top-0 z-[60]">
          <span className="font-bold uppercase tracking-wider text-amber-400">⚠ Dev Mode</span>
          <span className="text-amber-500/70">Auth disabled</span>
          <span className="text-amber-500/40">|</span>
          <Link href="/dashboard" className="hover:text-amber-100 transition-colors font-medium">Dashboard</Link>
          <Link href="/settings" className="hover:text-amber-100 transition-colors font-medium">Settings</Link>
          <Link href="/auth/login" className="hover:text-amber-100 transition-colors font-medium">Login</Link>
          {projects && projects.length > 0 && (
            <>
              <span className="text-amber-500/40">|</span>
              <span className="text-amber-500/70">Projects:</span>
              {projects.map((p: { id: string; name: string }) => (
                <Link key={p.id} href={`/projects/${p.id}/sitemap`} className="hover:text-amber-100 transition-colors font-medium underline underline-offset-2">
                  {p.name}
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-lg tracking-tight">
              Layoutr
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-400">
              <Link href="/dashboard" className="hover:text-white transition-colors">Projects</Link>
              <Link href="/settings" className="hover:text-white transition-colors">Settings</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-400">{user.email}</span>
                <span className="text-xs text-gray-500 font-mono">⚡ {profile?.credits ?? 0} credits</span>
                <SignOutButton />
              </>
            ) : (
              <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
