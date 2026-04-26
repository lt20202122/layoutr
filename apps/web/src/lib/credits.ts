/**
 * Layoutr Credit System — Single Source of Truth
 *
 * 1 credit = $0.0001 (0.01 cents)
 * $1.00 = 10,000 credits
 */

export const CREDIT_VALUE_USD = 0.0001;
export const MIN_CREDITS = 3;

export type ModelId = "deepseek-chat" | "claude-sonnet-4-5" | "gpt-5.5";

export interface ModelPricing {
  input: number;  // $/1M tokens
  output: number; // $/1M tokens
  markup: number; // multiplier over cost
}

export const MODEL_PRICING: Record<ModelId, ModelPricing> = {
  "deepseek-chat": {
    input: 0.14,
    output: 0.28,
    markup: 1.5, // 50% margin for the starter tier
  },
  "claude-sonnet-4-5": {
    input: 3.00,
    output: 15.00,
    markup: 2.0, // 100% margin for pro
  },
  "gpt-5.5": {
    input: 15.00,
    output: 75.00,
    markup: 2.0, // 100% margin for prestige max tier
  },
};

/**
 * Compute credits from actual token usage
 */
export function computeCredits(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model as ModelId];
  if (!pricing) return MIN_CREDITS;

  const costUsd =
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output;

  const credits = Math.ceil((costUsd / CREDIT_VALUE_USD) * pricing.markup);
  return Math.max(MIN_CREDITS, credits);
}

/**
 * Convert credits to USD display string
 */
export function formatCreditsUsd(credits: number): string {
  const usd = credits * CREDIT_VALUE_USD;
  if (usd < 0.001) return `<$0.001`;
  return `$${usd.toFixed(4)}`;
}

/**
 * Estimate credits for UI (before call)
 */
export function estimateCredits(model: ModelId): {
  min: number;
  typical: number;
  label: string;
} {
  // Typical sitemap call: ~300 in, ~800 out
  const typical = computeCredits(model, 300, 800);

  if (model === "deepseek-chat") {
    return { min: MIN_CREDITS, typical: MIN_CREDITS, label: `${MIN_CREDITS}` };
  }

  return {
    min: Math.floor(typical * 0.7),
    typical,
    label: `~${typical}`,
  };
}
