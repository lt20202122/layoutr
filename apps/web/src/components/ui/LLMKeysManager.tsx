"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type LlmKey = {
  id: string;
  provider: string;
  key_prefix: string;
  created_at: string;
};

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic", prefix: "sk-ant-", tier: "High",   dot: "bg-red-400" },
  { id: "deepseek",  name: "DeepSeek",  prefix: "sk-",     tier: "Medium", dot: "bg-yellow-400" },
  { id: "google",    name: "Google",    prefix: "",         tier: "Low",    dot: "bg-green-400" },
  { id: "openai",    name: "OpenAI",    prefix: "sk-",      tier: "",       dot: "bg-gray-500" },
  { id: "groq",      name: "Groq",      prefix: "gsk_",    tier: "",       dot: "bg-gray-500" },
];

export default function LLMKeysManager() {
  const router = useRouter();
  const [keys, setKeys] = useState<LlmKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingProvider, setAddingProvider] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    const res = await fetch("/api/ai/keys");
    const json = await res.json();
    if (res.ok) setKeys(json.data);
    setLoading(false);
  }

  async function addKey(provider: string) {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/ai/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key: keyValue }),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error || "Failed to save key");
      return;
    }

    setKeys((prev) => {
      const others = prev.filter((k) => k.provider !== provider);
      return [json.data, ...others];
    });
    setKeyValue("");
    setAddingProvider(null);
    router.refresh();
  }

  async function removeKey(id: string) {
    await fetch(`/api/ai/keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
    router.refresh();
  }

  function getKeyForProvider(provider: string) {
    return keys.find((k) => k.provider === provider);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-800 border border-gray-800 rounded-xl overflow-hidden">
        {PROVIDERS.map((provider) => {
          const existingKey = getKeyForProvider(provider.id);
          const isAdding = addingProvider === provider.id;

          return (
            <div key={provider.id} className="flex items-center justify-between px-4 py-3 bg-gray-900">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${provider.dot}`} />
                  <p className="font-medium text-sm">{provider.name}</p>
                  {provider.tier && (
                    <span className="text-[10px] text-gray-500">{provider.tier}</span>
                  )}
                </div>
                {existingKey ? (
                  <p className="text-xs text-gray-500 font-mono mt-0.5 ml-3.5">
                    {provider.prefix}{existingKey.key_prefix.slice(provider.prefix.length)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 mt-0.5">No key configured</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isAdding ? (
                  <>
                    <input
                      type="password"
                      value={keyValue}
                      onChange={(e) => setKeyValue(e.target.value)}
                      placeholder={`Enter ${provider.name} API key`}
                      className="w-48 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                      autoFocus
                    />
                    <button
                      onClick={() => addKey(provider.id)}
                      disabled={saving || !keyValue.trim()}
                      className="px-3 py-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded text-xs font-semibold transition-colors"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => { setAddingProvider(null); setKeyValue(""); setError(null); }}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : existingKey ? (
                  <button
                    onClick={() => removeKey(existingKey.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => setAddingProvider(provider.id)}
                    className="text-xs text-brand-400 hover:underline transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        Your API keys are encrypted at rest (AES-256-GCM) and never shown after saving.
      </p>
    </div>
  );
}
