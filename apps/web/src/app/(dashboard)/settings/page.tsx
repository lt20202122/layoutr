import { createClient, createServiceClient } from "@/lib/supabase/server";
import ApiKeysManager from "@/components/ui/ApiKeysManager";
import DeleteAccountSection from "@/components/ui/DeleteAccountSection";
import WaitlistButton from "@/components/ui/WaitlistButton";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="glass-panel rounded-[30px] p-6 sm:p-8">
          <p className="section-label">Settings</p>
          <h1 className="headline-lg mt-4 text-white">Account features unlock after sign-in.</h1>
          <p className="body-lg mt-4 max-w-2xl">
            Guest mode keeps your work in local storage with zero credits. Create an account to manage API keys, use MCP access, and spend credits on integrated AI.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auth/signup" className="button-primary">
              Create account
            </Link>
            <Link href="/auth/login" className="button-secondary">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("user_profiles")
    .select("credits")
    .eq("id", user?.id)
    .single();

  const keysQuery = supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, expires_at")
    .order("created_at", { ascending: false });

  if (user) keysQuery.eq("user_id", user.id);
  const { data: keys } = await keysQuery;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="glass-panel rounded-[30px] p-6 sm:p-8">
        <p className="section-label">Settings</p>
        <h1 className="headline-lg mt-4 text-white">Account, credits, and API access.</h1>
        <p className="body-lg mt-4 max-w-2xl">
          Keep programmatic access tidy and track the credit balance tied to integrated AI generation.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-[30px] p-6">
          <p className="section-label">Credits</p>
          <div className="mt-6 rounded-[28px] border border-brand-300/20 bg-brand-400/10 p-5">
            <p className="text-4xl font-semibold text-white">{profile?.credits ?? 0}</p>
            <p className="mt-2 text-sm text-brand-50/80">
              Approx. ${(((profile?.credits ?? 0) * 0.0001).toFixed(2))} in current balance
            </p>
          </div>
          <p className="body-sm mt-4">
            Credit top-ups and richer billing controls are still rolling out. Join the waitlist to get notified when purchasing opens.
          </p>
          <div className="mt-5">
            <WaitlistButton />
          </div>
        </div>

        <div className="glass-panel rounded-[30px] p-6">
          <p className="section-label">Account</p>
          <div className="mt-6 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Signed in as</p>
            <p className="mt-2 text-lg font-medium text-white">{user?.email}</p>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[30px] p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="section-label">API keys</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Secure access for REST and MCP clients.</h2>
          <p className="body-lg mt-4">
            BYOK and LLM key settings are intentionally removed from this page. This section only manages Layoutr API keys.
          </p>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/8 bg-black/12 p-5">
          <p className="section-label">MCP server command</p>
          <code className="mt-3 block overflow-x-auto font-mono text-sm text-slate-200">
            npx @layoutr/mcp-server --api-key ltr_your_key_here
          </code>
        </div>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <div className="mt-6">
          <ApiKeysManager initialKeys={(keys ?? []) as any} />
        </div>
      </section>

      <DeleteAccountSection />
    </div>
  );
}
