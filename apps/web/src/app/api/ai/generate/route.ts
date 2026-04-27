import { NextRequest } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";
import { decryptKey } from "@/lib/crypto";
import { computeCredits, MIN_CREDITS, CREDIT_VALUE_USD } from "@/lib/credits";
import { GoogleGenAI } from "@google/genai";

// Singleton default providers (use env-var API keys when no BYOK)
const defaultAnthropic = createAnthropic();
const defaultOpenAI = createOpenAI();
const defaultGoogle = createGoogleGenerativeAI();
const defaultGroq = createGroq();
const defaultDeepSeek = createDeepSeek();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const GenerateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  project_id: z.string().uuid(),
  target: z.enum(["sitemap", "wireframe"]),
  // 2026 Tiers
  model: z
    .enum(["deepseek-chat", "claude-sonnet-4-5", "gpt-5.5"])
    .default("deepseek-chat"),
  provider: z.enum(["anthropic", "openai", "google", "groq", "deepseek"]).default("deepseek"),
  node_id: z.string().uuid().optional(), // Required for wireframe target
});

// ─── Minimum balance required to start a call (pre-flight check) ─────────────

function minBalanceRequired(model: string): number {
  if (model === "deepseek-chat") return MIN_CREDITS;
  if (model === "claude-sonnet-4-5") return 50;
  return 300; // Safe pre-flight for GPT-5.5
}

// ─── Provider factory ─────────────────────────────────────────────────────────

type ProviderKey = "anthropic" | "openai" | "google" | "groq" | "deepseek";

// Internal enum IDs use dashes; map to actual API model IDs where they differ
const MODEL_ID_MAP: Record<string, string> = {
  "claude-sonnet-4-5": "claude-sonnet-4-5",
  "gpt-5.5":           "gpt-5.5",
};

function resolveModelId(model: string): string {
  return MODEL_ID_MAP[model] ?? model;
}

function buildModel(provider: ProviderKey, model: string, byokKey?: string) {
  const resolvedModel = resolveModelId(model);
  switch (provider) {
    case "anthropic":
      return byokKey
        ? createAnthropic({ apiKey: byokKey })(resolvedModel)
        : defaultAnthropic(resolvedModel);
    case "openai":
      return byokKey
        ? createOpenAI({ apiKey: byokKey })(resolvedModel)
        : defaultOpenAI(resolvedModel);
    case "google":
      return byokKey
        ? createGoogleGenerativeAI({ apiKey: byokKey })(resolvedModel)
        : defaultGoogle(resolvedModel);
    case "groq":
      return byokKey
        ? createGroq({ apiKey: byokKey })(resolvedModel)
        : defaultGroq(resolvedModel);
    case "deepseek":
      return byokKey
        ? createDeepSeek({ apiKey: byokKey })(resolvedModel)
        : defaultDeepSeek(resolvedModel);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ─── System prompts ───────────────────────────────────────────────────────────

function buildSitemapSystemPrompt(existingNodes: unknown[]): string {
  return `You are a sitemap and wireframe architect. Given the user's request, return a JSON array of sitemap node operations to create or update.
Each operation must follow this exact shape:
{ "action": "create" | "update" | "delete", "node": { "label": string, "type": "page"|"section"|"folder"|"link"|"modal"|"component", "parent_label"?: string, "url_path"?: string, "notes"?: string, "metadata"?: { "sections": Array<{ "label": string, "color": "teal"|"blue"|"navy"|"purple"|"slate"|"indigo" }> } }, "blocks"?: [{ "type": "Navbar"|"Hero"|"Cards"|"CTA"|"Form"|"Footer"|"Text"|"Image"|"Table", "order_index": number, "props"?: object }] }

For "create" operations on pages, you should:
1. Include a "metadata" object with a "sections" array describing the visual structure of the page card.
2. Use a professional baseline: "Header" -> "Hero" -> 1-3 content sections (be creative! e.g., "Features", "Pricing", "Team", "CTA") -> "Footer".
3. You have full creative freedom: while a Hero section is recommended for premium pages, you can add any number of sections and name them whatever best fits the page purpose.
4. Avoid using just a generic "Content" label if you can be more descriptive.
5. Also include a "blocks" array with the wireframe sections for that page. A typical page has Navbar (order 0), Hero (order 1), one or more main sections, and Footer (last).

Current sitemap state (${existingNodes.length} nodes):
${JSON.stringify(existingNodes, null, 2)}

Respond ONLY with a valid JSON array — no markdown, no explanation.`;
}

function buildWireframeSystemPrompt(existingBlocks: unknown[]): string {
  return `You are a wireframe designer. Given the user's request, return a JSON array of wireframe block operations.
Each operation: { "action": "create" | "update" | "delete", "block": { "type": "Hero"|"Navbar"|"Cards"|"CTA"|"Form"|"Footer"|"Text"|"Image"|"Table", "order_index"?: number, "props"?: object } }

Current blocks (${existingBlocks.length} blocks):
${JSON.stringify(existingBlocks, null, 2)}

Respond ONLY with a valid JSON array — no markdown, no explanation.`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const { prompt, project_id, target, model, provider, node_id } = parsed.data;
  const supabase = createServiceClient();

  // ── Verify project ownership ──────────────────────────────────────────────
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("user_id", auth.userId)
    .single();

  if (!project) return err("Project not found", 404);

  // ── BYOK check ────────────────────────────────────────────────────────────
  let byokKey: string | undefined;
  const { data: llmKey } = await supabase
    .from("llm_api_keys")
    .select("key_ciphertext, key_iv")
    .eq("user_id", auth.userId)
    .eq("provider", provider)
    .single();

  if (llmKey) {
    try {
      byokKey = decryptKey(llmKey.key_ciphertext, llmKey.key_iv);
    } catch {
      return err("Failed to decrypt BYOK key — check LLM_ENCRYPTION_KEY env var", 500);
    }
  }

  // ── Credit pre-flight check (skip if BYOK) ───────────────────────────────
  const minRequired = minBalanceRequired(model);
  let currentCredits = 0;
  let creditsRemaining = 0;

  if (!byokKey) {
    // Ensure a profile row exists (handles users created before the signup trigger)
    await supabase
      .from("user_profiles")
      .upsert({ id: auth.userId, credits: 2000 }, { onConflict: "id", ignoreDuplicates: true });

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", auth.userId)
      .single();

    currentCredits = profile?.credits ?? 0;
    if (currentCredits < minRequired) {
      return err(`Insufficient credits. Need at least ${minRequired}, have ${currentCredits}.`, 402);
    }
  }

  // ── Fetch current state ───────────────────────────────────────────────────
  let existingItems: unknown[] = [];

  if (target === "sitemap") {
    const { data: nodes } = await supabase
      .from("sitemap_nodes")
      .select("id, label, type, parent_id, url_path, notes, order_index")
      .eq("project_id", project_id)
      .order("order_index");
    existingItems = nodes ?? [];
  } else if (target === "wireframe") {
    if (!node_id) return err("node_id is required for wireframe target");
    const { data: blocks } = await supabase
      .from("wireframe_blocks")
      .select("id, type, order_index, props")
      .eq("node_id", node_id)
      .order("order_index");
    existingItems = blocks ?? [];
  }

  // ── Call LLM ──────────────────────────────────────────────────────────────
  let llmResult: string;
  let actualCost = minRequired;

  try {
    const systemPrompt =
      target === "sitemap"
        ? buildSitemapSystemPrompt(existingItems)
        : buildWireframeSystemPrompt(existingItems);

    if (provider === "google") {
      const resolvedModel = resolveModelId(model);
      const ai = new GoogleGenAI({
        apiKey: byokKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
      });

      const response = await ai.models.generateContent({
        model: resolvedModel,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      llmResult = response.text || "";
      if (!byokKey) {
        const usage = (response as any).usageMetadata;
        actualCost = computeCredits(
          model,
          usage?.promptTokenCount ?? 1000,
          usage?.candidatesTokenCount ?? 1000
        );
      }
    } else {
      const llmModel = buildModel(provider as ProviderKey, model, byokKey);
      const { text, usage } = await generateText({
        model: llmModel,
        system: systemPrompt,
        prompt,
      });
      llmResult = text;
      if (!byokKey) {
        actualCost = computeCredits(
          model,
          (usage as any).promptTokens ?? 0,
          (usage as any).completionTokens ?? 0
        );
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM call failed";
    return err(`LLM error: ${msg}`, 502);
  }

  if (!byokKey) {
    creditsRemaining = Math.max(0, currentCredits - actualCost);
  }

  // ── Parse LLM response ────────────────────────────────────────────────────
  let operations: Array<{
    action: "create" | "update" | "delete";
    node?: {
      label: string;
      type?: string;
      parent_label?: string;
      url_path?: string;
      notes?: string;
    };
    blocks?: Array<{
      type: string;
      order_index?: number;
      props?: Record<string, unknown>;
    }>;
    block?: {
      type: string;
      order_index?: number;
      props?: Record<string, unknown>;
    };
  }>;

  try {
    // Strip markdown code fences if the LLM wrapped the JSON
    // More robust regex: find the first '[' or '{' and the last ']' or '}'
    let cleaned = llmResult.trim();
    const firstBracket = Math.min(
      cleaned.indexOf("[") === -1 ? Infinity : cleaned.indexOf("["),
      cleaned.indexOf("{") === -1 ? Infinity : cleaned.indexOf("{")
    );
    const lastBracket = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));

    if (firstBracket !== Infinity && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    operations = JSON.parse(cleaned) as typeof operations;
    if (!Array.isArray(operations)) throw new Error("Expected array");
  } catch {
    return err("LLM returned invalid JSON. Please try again.", 502);
  }

  // ── Apply operations ──────────────────────────────────────────────────────
  const labelToId = new Map<string, string>();
  (existingItems as Array<{ id: string; label: string }>).forEach((n) =>
    labelToId.set(n.label, n.id)
  );

  const results: unknown[] = [];

  for (const op of operations) {
    if (target === "sitemap" && op.node) {
      const n = op.node;

      if (op.action === "create") {
        const siblings = (existingItems as Array<{ parent_id: string | null }>).filter(
          (x) => x.parent_id === (n.parent_label ? (labelToId.get(n.parent_label) ?? null) : null)
        );
        const { data } = await supabase
          .from("sitemap_nodes")
          .insert({
            project_id,
            label: n.label,
            type:
              (n.type as "page" | "section" | "folder" | "link" | "modal" | "component") ?? "page",
            parent_id: n.parent_label ? (labelToId.get(n.parent_label) ?? null) : null,
            url_path: n.url_path ?? null,
            notes: n.notes ?? null,
            metadata: n.metadata ?? null,
            order_index: siblings.length,
          })
          .select()
          .single();
        if (data) {
          labelToId.set(n.label, data.id);
          results.push(data);

          // Also create wireframe blocks for this node if provided
          if (op.blocks && op.blocks.length > 0) {
            const blockRows = op.blocks.map((b, i) => ({
              project_id,
              node_id: data.id,
              type: b.type,
              order_index: b.order_index ?? i,
              props: b.props ?? {},
            }));
            await supabase.from("wireframe_blocks").insert(blockRows);
          }
        }
      } else if (op.action === "update") {
        const nodeId = labelToId.get(n.label);
        if (nodeId) {
          const { data } = await supabase
            .from("sitemap_nodes")
            .update({
              ...(n.type && {
                type: n.type as "page" | "section" | "folder" | "link" | "modal" | "component",
              }),
              ...(n.url_path !== undefined && { url_path: n.url_path }),
              ...(n.notes !== undefined && { notes: n.notes }),
            })
            .eq("id", nodeId)
            .select()
            .single();
          if (data) results.push(data);
        }
      } else if (op.action === "delete") {
        const nodeId = labelToId.get(n.label);
        if (nodeId) {
          await supabase.from("sitemap_nodes").delete().eq("id", nodeId);
          results.push({ deleted: true, label: n.label });
        }
      }
    } else if (target === "wireframe" && node_id && op.block) {
      const b = op.block;
      if (op.action === "create") {
        const { data } = await supabase
          .from("wireframe_blocks")
          .insert({
            project_id,
            node_id,
            type: b.type,
            order_index: b.order_index ?? existingItems.length + results.length,
            props: b.props ?? {},
          })
          .select()
          .single();
        if (data) results.push(data);
      } else if (op.action === "update") {
        // For wireframes, we match by type if no ID, or just take the first of type
        // Better: LLM should ideally provide ID or order_index, but for now we match by type in existing
        const existing = (existingItems as Array<{ id: string; type: string }>).find(
          (x) => x.type === b.type
        );
        if (existing) {
          const { data } = await supabase
            .from("wireframe_blocks")
            .update({
              ...(b.props && { props: b.props }),
              ...(b.order_index !== undefined && { order_index: b.order_index }),
            })
            .eq("id", existing.id)
            .select()
            .single();
          if (data) results.push(data);
        }
      } else if (op.action === "delete") {
        const existing = (existingItems as Array<{ id: string; type: string }>).find(
          (x) => x.type === b.type
        );
        if (existing) {
          await supabase.from("wireframe_blocks").delete().eq("id", existing.id);
          results.push({ deleted: true, type: b.type });
        }
      }
    }
  }

  // ── Deduct credits based on actual token usage (only if not BYOK) ────────
  if (!byokKey) {
    await supabase
      .from("user_profiles")
      .update({ credits: creditsRemaining })
      .eq("id", auth.userId);
  }

  // ── Fetch updated state ──────────────────────────────────────────────────
  let finalNodes: unknown[] = [];
  if (target === "sitemap") {
    const { data: updatedNodes } = await supabase
      .from("sitemap_nodes")
      .select("*")
      .eq("project_id", project_id)
      .order("order_index");
    finalNodes = updatedNodes ?? [];
  } else {
    const { data: updatedBlocks } = await supabase
      .from("wireframe_blocks")
      .select("*")
      .eq("node_id", node_id)
      .order("order_index");
    finalNodes = updatedBlocks ?? [];
  }

  return ok({
    nodes: target === "sitemap" ? finalNodes : [],
    blocks: target === "wireframe" ? finalNodes : [],
    operations_applied: results.length,
    credits_used: byokKey ? 0 : actualCost,
    credits_cost_usd: byokKey ? 0 : actualCost * CREDIT_VALUE_USD,
    credits_remaining: byokKey ? null : creditsRemaining,
    byok: !!byokKey,
  });
}
