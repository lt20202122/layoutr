"use client";

import { Lock, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { SitemapNode } from "./sitemapUtils";
import { estimateCredits, ModelId } from "@/lib/credits";
import { PLAN_ALLOWED_MODELS } from "@/lib/plans";
import WaitlistButton from "@/components/ui/WaitlistButton";

type TierId = ModelId;

interface Tier {
  id: TierId;
  tier: "Starter" | "Pro" | "Max";
  modelLabel: string;
  provider: "google" | "deepseek" | "anthropic" | "openai";
  dot: string;
  locked?: boolean;
}

const TIERS: Tier[] = [
  { id: "deepseek-chat", tier: "Starter", modelLabel: "deepseek-v4-flash", provider: "deepseek", dot: "bg-emerald-400" },
  { id: "claude-sonnet-4-5", tier: "Pro", modelLabel: "claude-sonnet-4.5", provider: "anthropic", dot: "bg-orange-400" },
  { id: "gpt-5.5", tier: "Max", modelLabel: "gpt-5.5", provider: "openai", dot: "bg-sky-400" },
];

function getTier(id: TierId): Tier {
  return TIERS.find((tier) => tier.id === id)!;
}

function TierDropdown({
  value,
  onChange,
  disabled,
  userPlan,
}: {
  value: TierId;
  onChange: (id: TierId) => void;
  disabled?: boolean;
  userPlan: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = getTier(value);
  const allowedModels = PLAN_ALLOWED_MODELS[userPlan as keyof typeof PLAN_ALLOWED_MODELS] || PLAN_ALLOWED_MODELS.free;
  const tiersWithLock = TIERS.map((tier) => ({ ...tier, locked: !allowedModels.includes(tier.id) }));

  useEffect(() => {
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="field flex items-center justify-between py-3"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${selected.dot}`} />
          <span className="text-sm font-medium text-white">{selected.tier}</span>
          <span className="truncate text-xs text-slate-500">
            {selected.modelLabel} - {estimateCredits(selected.id).label} cr
          </span>
        </span>
        <span className="text-xs text-slate-500">Select</span>
      </button>

      {open && (
        <div className="glass-panel absolute left-0 right-0 top-full z-50 mt-2 rounded-[24px] p-2">
          {tiersWithLock.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => {
                if (!tier.locked) {
                  onChange(tier.id);
                  setOpen(false);
                }
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${
                tier.id === value ? "bg-white/[0.05]" : "hover:bg-white/[0.04]"
              } ${tier.locked ? "opacity-60" : ""}`}
            >
              <span className={`h-2 w-2 rounded-full ${tier.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{tier.tier}</p>
                <p className="text-xs text-slate-500">{tier.modelLabel}</p>
              </div>
              <span className="text-xs text-slate-500">{estimateCredits(tier.id).label} cr</span>
              {tier.locked && <Lock className="h-3.5 w-3.5 text-slate-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  projectId: string;
  onNodesUpdated: (nodes: SitemapNode[]) => void;
  onGenerating: (loading: boolean) => void;
  userPlan: string;
}

export default function AiPanel({ projectId, onNodesUpdated, onGenerating, userPlan }: Props) {
  const [prompt, setPrompt] = useState("");
  const [tierId, setTierId] = useState<TierId>("deepseek-chat");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    credits_used: number;
    credits_remaining: number | null;
    operations_applied: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tier = getTier(tierId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
        setError(res.status === 402 ? "out_of_credits" : json.error ?? "Generation failed. Please try again.");
        return;
      }

      const result = json.data as {
        nodes: SitemapNode[];
        credits_used: number;
        credits_remaining: number | null;
        operations_applied: number;
      };

      setLastResult({
        credits_used: result.credits_used,
        credits_remaining: result.credits_remaining,
        operations_applied: result.operations_applied,
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
    <div className="flex h-full flex-col">
      <div className="border-b border-white/8 px-5 py-4">
        <p className="section-label">AI generation</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Describe the structure you want.</h2>
      </div>

      <div className="space-y-4 border-b border-white/8 px-5 py-4">
        <div>
          <label className="section-label">Model</label>
          <div className="mt-2">
            <TierDropdown value={tierId} onChange={setTierId} disabled={loading} userPlan={userPlan} />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {lastResult && (
          <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            Applied {lastResult.operations_applied} operations.
            {lastResult.credits_remaining !== null && ` ${lastResult.credits_remaining} credits remaining.`}
          </div>
        )}

        {error === "out_of_credits" && (
          <div className="rounded-[24px] border border-red-300/20 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-100">Out of credits</p>
            <p className="mt-2 text-sm text-slate-300">Join the waitlist to hear about billing and credit expansion.</p>
            <div className="mt-4">
              <WaitlistButton />
            </div>
          </div>
        )}

        {error && error !== "out_of_credits" && (
          <div className="rounded-[24px] border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {!lastResult && !error && !loading && (
          <div className="space-y-2">
            <p className="section-label">Suggestions</p>
            {[
              "Build a SaaS onboarding flow with docs and pricing",
              "Create a mobile app sitemap with auth and dashboard pages",
              "Generate an ecommerce structure with PDP, cart, and checkout",
              "Plan a docs-heavy product site with changelog and API references",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="w-full rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/[0.05]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="rounded-[24px] border border-brand-300/20 bg-brand-400/10 p-4 text-sm text-brand-50">
            Generating sitemap with {tier.modelLabel}...
          </div>
        )}
      </div>

      <div className="border-t border-white/8 p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSubmit(event);
            }}
            placeholder="Describe the product, structure, and key pages."
            rows={5}
            className="field resize-none"
          />
          <button type="submit" disabled={loading || !prompt.trim()} className="button-primary w-full justify-center gap-2 disabled:opacity-50">
            <Sparkles className="h-4 w-4" />
            Generate sitemap
          </button>
        </form>
      </div>
    </div>
  );
}
