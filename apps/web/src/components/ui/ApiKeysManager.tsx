"use client";

import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
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
      {newKey && (
        <div className="rounded-[28px] border border-emerald-300/20 bg-emerald-400/10 p-5">
          <p className="text-sm font-medium text-emerald-100">
            New key created. Copy it now, it will not be shown again.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <code className="flex-1 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 font-mono text-xs text-slate-100">
              {newKey}
            </code>
            <button onClick={copyKey} className="button-secondary gap-2">
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {keys.length > 0 && (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key.id} className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-brand-300" />
                    <p className="text-sm font-medium text-white">{key.name}</p>
                  </div>
                  <p className="mt-2 font-mono text-xs text-slate-400">
                    {key.key_prefix}****************
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Created {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Revoke key "${key.name}"?`)) deleteKey(key.id);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating ? (
        <form onSubmit={createKey} className="rounded-[28px] border border-white/8 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
              placeholder="Key name"
              className="field flex-1"
            />
            <button type="submit" disabled={loading || !newName.trim()} className="button-primary disabled:opacity-50">
              {loading ? "Creating..." : "Create"}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="button-secondary">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setCreating(true)} className="button-secondary gap-2">
          <Plus className="h-4 w-4" />
          Create API key
        </button>
      )}
    </div>
  );
}
