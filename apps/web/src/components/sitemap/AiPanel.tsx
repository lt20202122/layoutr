"use client";

import { useState, useRef, useEffect } from "react";
import type { SitemapNode } from "./sitemapUtils";

// ─── Three-tier model config ──────────────────────────────────────────────────

type TierId = "gemini-2-0-flash" | "deepseek-chat" | "claude-sonnet-4-5" | "claude-opus-4-7";

interface Tier {
  id: TierId;
  tier: "Low" | "Medium" | "High" | "Max";
  modelLabel: string;
  credits: number;
  provider: "google" | "deepseek" | "anthropic";
  dot: string; // tailwind bg color class
  locked?: boolean;
}

const TIERS: Tier[] = [
  {
    id: "gemini-2-0-flash",
    tier: "Low",
    modelLabel: "gemini-2.0-flash",
    credits: 5,
    provider: "google",
    dot: "bg-green-400",
  },
  {
    id: "deepseek-chat",
    tier: "Medium",
    modelLabel: "deepseek-v3",
    credits: 10,
    provider: "deepseek",
    dot: "bg-yellow-400",
  },
  {
    id: "claude-sonnet-4-5",
    tier: "High",
    modelLabel: "claude-sonnet-4.5",
    credits: 40,
    provider: "anthropic",
    dot: "bg-red-400",
  },
  {
    id: "claude-opus-4-7",
    tier: "Max",
    modelLabel: "claude-opus-4.7",
    credits: 60,
    provider: "anthropic",
    dot: "bg-purple-400",
    locked: true,
  },
];

function getTier(id: TierId): Tier {
  return TIERS.find((t) => t.id === id)!;
}

// ─── Custom tier dropdown ─────────────────────────────────────────────────────

function TierDropdown({
  value,
  onChange,
  disabled,
}: {
  value: TierId;
  onChange: (id: TierId) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = getTier(value);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-xs bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot}`} />
          <span className="font-medium">{selected.tier}</span>
          <span className="text-gray-500 truncate">{selected.modelLabel} · ~{selected.credits} credits</span>
        </span>
        <svg
          className={`w-3 h-3 text-gray-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (!t.locked) {
                  onChange(t.id);
                  setOpen(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-gray-800 transition-colors text-left group relative ${
                t.id === value ? "bg-gray-800/60" : ""
              } ${t.locked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
              <span className="font-medium text-white w-12 shrink-0 flex items-center gap-1.5">
                {t.tier}
                {t.locked && (
                  <svg className="w-2.5 h-2.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                )}
              </span>
              <span className="text-gray-400">{t.modelLabel}</span>
              <span className="ml-auto text-gray-500 shrink-0">~{t.credits} credits</span>

              {t.locked && (
                <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 w-48 p-2.5 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-[60]">
                  <p className="text-[10px] leading-relaxed text-gray-300">
                    Avaidable at Pro Plan.{" "}
                    <span className="text-brand-400 underline decoration-brand-400/30">View plans --&gt;</span>
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  onNodesUpdated: (nodes: SitemapNode[]) => void;
  onGenerating: (loading: boolean) => void;
}

export default function AiPanel({ projectId, onNodesUpdated, onGenerating }: Props) {
  const [prompt, setPrompt] = useState("");
  const [tierId, setTierId] = useState<TierId>("gemini-2-0-flash");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    credits_used: number;
    credits_remaining: number | null;
    operations_applied: number;
    byok: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tier = getTier(tierId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setLastResult(null);
    onGenerating(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          project_id: projectId,
          target: "sitemap",
          model: tier.id,
          provider: tier.provider,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError("out_of_credits");
        } else {
          setError(json.error ?? "Generation failed. Please try again.");
        }
        return;
      }

      const result = json.data as {
        nodes: SitemapNode[];
        credits_used: number;
        credits_remaining: number | null;
        operations_applied: number;
        byok: boolean;
      };

      setLastResult({
        credits_used: result.credits_used,
        credits_remaining: result.credits_remaining,
        operations_applied: result.operations_applied,
        byok: result.byok,
      });
      setPrompt("");
      onNodesUpdated(result.nodes);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      onGenerating(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">AI Generate</span>
          <span className="text-[10px] bg-brand-900/50 text-brand-300 border border-brand-700/40 px-1.5 py-0.5 rounded font-medium">
            BETA
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Describe what you want to build</p>
      </div>

      {/* Model picker */}
      <div className="px-4 py-2 border-b border-gray-800">
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
          Model
        </label>
        <TierDropdown value={tierId} onChange={setTierId} disabled={loading} />
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Last result */}
        {lastResult && (
          <div className="p-3 bg-green-900/20 border border-green-800/40 rounded-xl text-xs space-y-1">
            <p className="text-green-300 font-medium">
              ✓ {lastResult.operations_applied} operation{lastResult.operations_applied !== 1 ? "s" : ""} applied
            </p>
            {lastResult.byok ? (
              <p className="text-gray-400">Using your own API key — no credits deducted</p>
            ) : (
              <p className="text-gray-400">
                Used <span className="text-white font-medium">{lastResult.credits_used} credits</span>
                {lastResult.credits_remaining !== null && (
                  <> · <span className="text-white font-medium">{lastResult.credits_remaining}</span> remaining</>
                )}
              </p>
            )}
          </div>
        )}

        {/* Error states */}
        {error === "out_of_credits" && (
          <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-xs space-y-2">
            <p className="text-red-300 font-medium">⚡ Out of credits</p>
            <p className="text-gray-400">You need more credits to use AI generation.</p>
            <a
              href="/settings"
              className="inline-block text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors"
            >
              Top up credits →
            </a>
          </div>
        )}
        {error && error !== "out_of_credits" && (
          <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-xs">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Prompt suggestions */}
        {!lastResult && !error && !loading && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Try asking…</p>
            {[
              "Build a SaaS onboarding flow",
              "E-commerce site with checkout",
              "Blog with admin dashboard",
              "Mobile app with auth screens",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="block w-full text-left text-xs text-gray-400 hover:text-white px-2.5 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-gray-800/40 border border-gray-700/40 rounded-xl">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">Generating sitemap…</span>
          </div>
        )}
      </div>

      {/* Input form */}
      <div className="px-4 pb-4 pt-3 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
            }}
            placeholder="Describe what you want to build…"
            rows={3}
            disabled={loading}
            className="w-full text-xs bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none disabled:opacity-50 transition-opacity"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600">⌘↵ to send · min {tier.credits} credits</span>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="text-xs px-3 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
            >
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
