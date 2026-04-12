"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
};

type Props = { initialKeys: ApiKey[] };

export default function ApiKeysManager({ initialKeys }: Props) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) return;

    setNewKey(json.data.key);
    setKeys((prev) => [json.data, ...prev]);
    setNewName("");
    setCreating(false);
  }

  async function deleteKey(id: string) {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
    router.refresh();
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* New key revealed */}
      {newKey && (
        <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl space-y-3">
          <p className="text-sm font-medium text-green-300">New API key created — copy it now, it won&apos;t be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-gray-900 px-3 py-2 rounded-lg break-all text-gray-200">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            I&apos;ve saved it, dismiss
          </button>
        </div>
      )}

      {/* Key list */}
      {keys.length > 0 && (
        <div className="divide-y divide-gray-800 border border-gray-800 rounded-xl overflow-hidden">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-4 py-3 bg-gray-900">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{key.name}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  {key.key_prefix}••••••••••••
                  {key.last_used_at && ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => { if (confirm(`Revoke key "${key.name}"?`)) deleteKey(key.id); }}
                className="ml-4 text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {creating ? (
        <form onSubmit={createKey} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            autoFocus
            placeholder="Key name (e.g. MCP Server)"
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="text-sm text-brand-400 hover:underline"
        >
          + Create new API key
        </button>
      )}
    </div>
  );
}
