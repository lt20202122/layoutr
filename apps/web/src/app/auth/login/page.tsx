"use client";

import Link from "next/link";
import { ArrowLeft, Chrome } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLogo from "@/components/ui/AppLogo";
import { createClientOrNull } from "@/lib/supabase/client";
import { getAuthCallbackUrl, getAuthErrorMessageFromUrl } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const nextError = getAuthErrorMessageFromUrl(window.location.search, window.location.hash);
    if (nextError) {
      setError(nextError);
    }
  }, []);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const supabase = createClientOrNull();
    if (!supabase) {
      setError("Supabase auth is not configured in this environment.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthCallbackUrl(window.location.origin) },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClientOrNull();
    if (!supabase) {
      setError("Supabase auth is not configured in this environment.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.92fr_0.78fr]">
        <section className="glass-panel hidden rounded-[34px] p-8 lg:flex lg:flex-col lg:justify-between">
          <AppLogo />
          <div className="max-w-xl">
            <p className="section-label">Welcome back</p>
            <h1 className="headline-lg mt-4 text-white">Return to your planning layer.</h1>
            <p className="body-lg mt-4">
              Open the workspace where sitemap structure, wireframe intent, and agent-readable context stay in sync.
            </p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </section>

        <section className="glass-panel-strong rounded-[34px] p-6 sm:p-8">
          <div className="lg:hidden">
            <AppLogo />
          </div>
          <div className="mt-6 lg:mt-0">
            <p className="section-label">Sign in</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Access your Layoutr workspace</h2>
            <p className="mt-3 text-sm text-slate-400">
              Want to explore first?{" "}
              <Link href="/dashboard" className="font-medium text-brand-200 hover:text-white">
                Continue without an account
              </Link>
              . Guest work stays in local storage with no AI, credits, API, or MCP access.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-white/12 bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            <Chrome className="h-4 w-4" />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-[0.24em] text-slate-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="section-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field mt-2"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="section-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field mt-2"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="button-primary mt-2 w-full disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            No account yet?{" "}
            <Link href="/auth/signup" className="font-medium text-brand-200 hover:text-white">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
