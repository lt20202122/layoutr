"use client";

import Link from "next/link";
import { ArrowLeft, Chrome, Check } from "lucide-react";
import { useEffect, useState } from "react";
import AppLogo from "@/components/ui/AppLogo";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl, getAuthErrorMessageFromUrl } from "@/lib/supabase/auth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
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
    const supabase = createClient();
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

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center py-10">
        <div className="glass-panel-strong w-full max-w-2xl rounded-[34px] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-300/20 bg-emerald-400/10">
            <Check className="h-7 w-7 text-emerald-100" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-white">Check your inbox</h1>
          <p className="body-lg mt-4">
            We sent a confirmation link to <span className="font-medium text-white">{email}</span>. Open it to activate your account.
          </p>
          <Link href="/auth/login" className="button-secondary mt-8">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.92fr_0.78fr]">
        <section className="glass-panel hidden rounded-[34px] p-8 lg:flex lg:flex-col lg:justify-between">
          <AppLogo />
          <div className="max-w-xl">
            <p className="section-label">New workspace</p>
            <h1 className="headline-lg mt-4 text-white">Create an account for structure-first product work.</h1>
            <p className="body-lg mt-4">
              Start with a project, scaffold the sitemap, and build the wireframe system before implementation begins.
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
            <p className="section-label">Create account</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Start using Layoutr</h2>
            <p className="mt-3 text-sm text-slate-400">
              Prefer not to sign up yet?{" "}
              <Link href="/dashboard" className="font-medium text-brand-200 hover:text-white">
                Continue without an account
              </Link>
              . Guest projects stay on this device and do not include AI, credits, API access, or MCP tools.
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
                minLength={8}
                className="field mt-2"
                placeholder="At least 8 characters"
              />
            </div>
            <button type="submit" disabled={loading} className="button-primary mt-2 w-full disabled:opacity-50">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-brand-200 hover:text-white">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
