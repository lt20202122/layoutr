"use client";

import { useState, useRef } from "react";
import type { SitemapNode } from "./sitemapUtils";

type Model = "claude-haiku-3-5" | "claude-sonnet-3-7" | "gpt-4o-mini" | "gemini-2-0-flash";

const MODEL_LABELS: Record<Model, string> = {
  "claude-haiku-3-5":   "Haiku 3.5  · 5 cr",
  "claude-sonnet-3-7":  "Sonnet 3.7 · 15 cr",
  "gpt-4o-mini":        "GPT-4o mini · 5 cr",
  "gemini-2-0-flash":   "Gemini Flash · 5 cr",
};

const MODEL_PROVIDERS: Record<Model, string> = {
  "claude-haiku-3-5":  "anthropic",
  "claude-sonnet-3-7": "anthropic",
  "gpt-4o-mini":       "openai",
  "gemini-2-0-flash":  "google",
};

const MODEL_COST: Record<Model, number> = {
  "claude-haiku-3-5":   5,
  "claude-sonnet-3-7":  15,
  "gpt-4o-mini":        5,
  "gemini-2-0-flash":   5,
};

interface Props {
  projectId: string;
  onNodesUpdated: (nodes: SitemapNode[]) => void;
  onGenerating: (loading: boolean) => void;
}

export default function AiPanel({ projectId, onNodesUpdated, onGenerating }: Props) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<Model>("claude-haiku-3-5");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    credits_used: number;
    credits_remaining: number | null;
    operations_applied: number;
    byok: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          model,
          provider: MODEL_PROVIDERS[model],
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
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Model</label>
        <select
          id="ai-model-picker"
          value={model}
          onChange={(e) => setModel(e.target.value as Model)}
          className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {(Object.keys(MODEL_LABELS) as Model[]).map((m) => (
            <option key={m} value={m}>{MODEL_LABELS[m]}</option>
          ))}
        </select>
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
                id={`ai-suggestion-${suggestion.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
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
        <form id="ai-generate-form" onSubmit={handleSubmit} className="space-y-2">
          <textarea
            ref={textareaRef}
            id="ai-prompt-input"
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
            <span className="text-[10px] text-gray-600">⌘↵ to send · costs {MODEL_COST[model]} credits</span>
            <button
              id="ai-generate-btn"
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
