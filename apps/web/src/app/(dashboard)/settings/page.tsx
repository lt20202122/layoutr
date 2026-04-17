import { createClient } from "@/lib/supabase/server";
import ApiKeysManager from "@/components/ui/ApiKeysManager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const keysQuery = supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, expires_at")
    .order("created_at", { ascending: false });

  if (user) keysQuery.eq("user_id", user.id);

  const { data: keys } = await keysQuery;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and API access</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-gray-400 text-sm mt-1">
            Use API keys to access Layoutr programmatically or via the MCP server.
            Keys are prefixed with <code className="text-brand-400 font-mono text-xs">ltr_</code>.
          </p>
        </div>

        <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-sm space-y-1">
          <p className="text-gray-400">MCP server connection</p>
          <p className="font-mono text-xs text-gray-300 break-all">
            npx @layoutr/mcp-server --api-key ltr_your_key_here
          </p>
        </div>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ApiKeysManager initialKeys={(keys ?? []) as any} />
      </section>

      <section className="space-y-4 pt-4 border-t border-gray-800">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-gray-400 text-sm">Logged in as <strong>{user?.email}</strong></p>
      </section>
    </div>
  );
}
