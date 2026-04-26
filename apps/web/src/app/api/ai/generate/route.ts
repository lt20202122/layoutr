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
  // Three tiers: low / medium / high
  model: z
    .enum(["gemini-2-0-flash", "deepseek-chat", "claude-sonnet-3-7"])
    .default("gemini-2-0-flash"),
  provider: z.enum(["anthropic", "openai", "google", "groq", "deepseek"]).default("google"),
});

// ─── Credit cost per tier (low=5, medium=10, high=25) ────────────────────────

const MODEL_CREDITS: Record<string, number> = {
  "gemini-2-0-flash":  5,   // low
  "deepseek-chat":     10,  // medium
  "claude-sonnet-3-7": 25,  // high
};

function creditCost(model: string): number {
  return MODEL_CREDITS[model] ?? 10;
}

// ─── Provider factory ─────────────────────────────────────────────────────────

type ProviderKey = "anthropic" | "openai" | "google" | "groq" | "deepseek";

// Internal enum IDs use dashes; map to actual API model IDs where they differ
const MODEL_ID_MAP: Record<string, string> = {
  "gemini-2-0-flash": "gemini-2.0-flash-001",
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
  return `You are a sitemap architect. Given the user's request, return a JSON array of sitemap node operations to create or update.
Each operation must follow this exact shape:
{ "action": "create" | "update" | "delete", "node": { "label": string, "type": "page"|"section"|"folder"|"link"|"modal"|"component", "parent_label"?: string, "url_path"?: string, "notes"?: string } }

For "update" and "delete", include the node label to match existing nodes.
Keep the sitemap practical, well-structured, and logical.

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

  const { prompt, project_id, target, model, provider } = parsed.data;
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

  // ── Credit check (skip if BYOK) ───────────────────────────────────────────
  const cost = creditCost(model);
  let creditsRemaining = 0;

  if (!byokKey) {
    // Ensure a profile row exists (handles users created before the signup trigger)
    await supabase
      .from("user_profiles")
      .upsert({ id: auth.userId, credits: 100 }, { onConflict: "id", ignoreDuplicates: true });

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", auth.userId)
      .single();

    const credits = profile?.credits ?? 0;
    if (credits < cost) {
      return err(`Insufficient credits. Need ${cost}, have ${credits}.`, 402);
    }
    creditsRemaining = credits - cost;
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
  }

  // ── Call LLM ──────────────────────────────────────────────────────────────
  let llmResult: string;
  try {
    const llmModel = buildModel(provider as ProviderKey, model, byokKey);
    const systemPrompt =
      target === "sitemap"
        ? buildSitemapSystemPrompt(existingItems)
        : buildWireframeSystemPrompt(existingItems);

    const { text } = await generateText({
      model: llmModel,
      system: systemPrompt,
      prompt,
    });
    llmResult = text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM call failed";
    return err(`LLM error: ${msg}`, 502);
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
    block?: {
      type: string;
      order_index?: number;
      props?: Record<string, unknown>;
    };
  }>;

  try {
    // Strip markdown code fences if the LLM wrapped the JSON
    const cleaned = llmResult.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
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
            order_index: siblings.length,
          })
          .select()
          .single();
        if (data) {
          labelToId.set(n.label, data.id);
          results.push(data);
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
    }
  }

  // ── Deduct credits (only if not BYOK) ────────────────────────────────────
  if (!byokKey) {
    await supabase
      .from("user_profiles")
      .update({ credits: creditsRemaining })
      .eq("id", auth.userId);
  }

  // ── Fetch updated sitemap ─────────────────────────────────────────────────
  const { data: updatedNodes } = await supabase
    .from("sitemap_nodes")
    .select("*")
    .eq("project_id", project_id)
    .order("order_index");

  return ok({
    nodes: updatedNodes ?? [],
    operations_applied: results.length,
    credits_used: byokKey ? 0 : cost,
    credits_remaining: byokKey ? null : creditsRemaining,
    byok: !!byokKey,
  });
}
