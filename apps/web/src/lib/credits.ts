export type ModelId = "deepseek-chat" | "claude-sonnet-4-5" | "gpt-5.5";

// 1 credit = $0.0001 (1/100th of a cent). 2000 free credits = $0.20.
export const CREDIT_VALUE_USD = 0.0001;
export const MIN_CREDITS = 5;

// Credits charged per 1M tokens — 2× markup over real API cost.
// Tracking input/output separately is what keeps billing linear across models.
const RATES: Record<ModelId, { input: number; output: number }> = {
  "deepseek-chat":     { input:   540, output:  2_200 }, // $0.27/$1.10 per 1M
  "claude-sonnet-4-5": { input: 6_000, output: 30_000 }, // $3/$15 per 1M
  "gpt-5.5":           { input: 30_000, output: 150_000 }, // $15/$75 per 1M
};

// Called after the LLM returns — uses actual token counts from usage
export function computeCredits(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const r = RATES[model as ModelId] ?? RATES["deepseek-chat"];
  return Math.max(1, Math.ceil(
    (promptTokens * r.input + completionTokens * r.output) / 1_000_000
  ));
}

// Called by the UI to show an estimate — assumes typical sitemap call sizes
export function estimateCredits(model: ModelId): { label: string; min: number; max: number } {
  const typical = computeCredits(model, 800, 600);
  const heavy   = computeCredits(model, 2000, 1500);
  return {
    label: typical === heavy ? `~${typical}` : `${typical}–${heavy}`,
    min: typical,
    max: heavy,
  };
}
