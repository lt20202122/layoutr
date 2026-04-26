# Layoutr Credit System — Architecture & Pricing

This document defines the linear, token-based credit system used by Layoutr.

## 1. The Core Exchange Rate

Layoutr uses a fixed mapping between credits and real-world value:

- **1 Credit = $0.0001** (0.01 cents)
- **10,000 Credits = $1.00**

All calculations are performed using this rate as the anchor.

## 2. Calculation Formula

Credits are deducted **after** each AI call based on actual token usage returned by the provider (Anthropic, Google, DeepSeek, etc.).

```
cost_usd = (input_tokens / 1M * input_price) + (output_tokens / 1M * output_price)
credits_used = ceil((cost_usd / 0.0001) * markup)
```

- **Input/Output Price**: The raw API price from the provider.
- **Markup**: A multiplier (1.5x to 2.0x) to cover overhead and business margin.
- **Minimum Charge**: 3 credits ($0.0003).

## 3. Tiers & Models (as of April 2026)

| Tier | Model | Provider | Markup | Real Cost ($/1M) | Est. Cost (Credits) |
|---|---|---|---|---|---|
| **Starter** | DeepSeek V4 Flash | DeepSeek | 1.5x | $0.14 / $0.28 | **3 (Fixed Min)** |
| **Pro** | Claude Sonnet 4.5 | Anthropic | 2.0x | $3.00 / $15.00 | **~300** |
| **Max** | GPT-5.5 | OpenAI | 2.0x | $15.00 / $75.00 | **~1,500** |

## 4. Why this system?

1.  **Linearity**: 100 credits of Sonnet work is the same value as 100 credits of DeepSeek work ($0.01).
2.  **Fairness**: Users are charged for exactly what they use. A tiny sitemap costs less than a massive one.
3.  **Transparency**: The UI shows both credits and USD cost (e.g., `Used 42 credits ($0.0042)`).
4.  **Flexibility**: Adding new models only requires adding their per-million token rates to `apps/web/src/lib/credits.ts`.

## 5. BYOK (Bring Your Own Key)

If a user has configured their own API key (via Settings), the system **bypasses credit deduction entirely**.
- **Credits Used**: 0
- **Cost**: Charged directly to the user's provider account (Anthropic/DeepSeek).

## 6. Implementation Files

- **Logic**: `apps/web/src/lib/credits.ts`
- **Backend**: `apps/web/src/app/api/ai/generate/route.ts`
- **UI (Sitemap)**: `apps/web/src/components/sitemap/AiPanel.tsx`
- **UI (Wireframe)**: `apps/web/src/components/wireframe/WireframeEditor.tsx`
- **UI (Header)**: `apps/web/src/components/ui/CreditsDisplay.tsx`
