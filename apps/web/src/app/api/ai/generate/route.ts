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
import { computeCredits, MIN_CREDITS, CREDIT_VALUE_USD, ModelId } from "@/lib/credits";
import { PLAN_ALLOWED_MODELS, PlanId } from "@/lib/plans";

const defaultAnthropic = createAnthropic();
const defaultOpenAI = createOpenAI();
const defaultGoogle = createGoogleGenerativeAI();
const defaultGroq = createGroq();
const defaultDeepSeek = createDeepSeek();

const GenerateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  project_id: z.string().uuid(),
  target: z.enum(["sitemap", "wireframe"]),
  model: z
    .enum(["deepseek-chat", "claude-sonnet-4-5", "gpt-5.5"])
    .default("deepseek-chat"),
  provider: z.enum(["anthropic", "openai", "google", "groq", "deepseek"]).default("deepseek"),
  node_id: z.string().uuid().optional(),
});

function minBalanceRequired(model: string): number {
  if (model === "deepseek-chat") return MIN_CREDITS;
  if (model === "claude-sonnet-4-5") return 50;
  return 300;
}

type ProviderKey = "anthropic" | "openai" | "google" | "groq" | "deepseek";

const MODEL_ID_MAP: Record<string, string> = {
  "claude-sonnet-4-5": "claude-sonnet-4-5",
  "gpt-5.5": "gpt-5.5",
};

function resolveModelId(model: string): string {
  return MODEL_ID_MAP[model] ?? model;
}

function buildModel(provider: ProviderKey, model: string) {
  const resolvedModel = resolveModelId(model);
  switch (provider) {
    case "anthropic":
      return defaultAnthropic(resolvedModel);
    case "openai":
      return defaultOpenAI(resolvedModel);
    case "google":
      return defaultGoogle(resolvedModel);
    case "groq":
      return defaultGroq(resolvedModel);
    case "deepseek":
      return defaultDeepSeek(resolvedModel);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function buildSitemapSystemPrompt(existingNodes: unknown[]): string {
  const nodeList = existingNodes as Array<{ id: string; label: string; parent_id: string | null }>;
  const idToLabel = new Map<string, string>();
  for (const node of nodeList) idToLabel.set(node.id, node.label);

  const childrenByParent = new Map<string, string[]>();
  const roots: string[] = [];
  for (const node of nodeList) {
    if (node.parent_id && idToLabel.has(node.parent_id)) {
      const parentLabel = idToLabel.get(node.parent_id)!;
      if (!childrenByParent.has(parentLabel)) childrenByParent.set(parentLabel, []);
      childrenByParent.get(parentLabel)!.push(node.label);
    } else {
      roots.push(node.label);
    }
  }

  function renderTree(entries: string[], depth: number): string {
    let out = "";
    for (const label of entries) {
      out += "  ".repeat(depth) + "- " + label + (depth === 0 ? " [HOMEPAGE]" : "") + "\n";
      const kids = childrenByParent.get(label);
      if (kids) out += renderTree(kids, depth + 1);
    }
    return out;
  }

  const treeView = renderTree(roots, 0);

  return `You are a sitemap and wireframe architect. Given the user's request, return a JSON array of sitemap node operations to create or update.
Each operation must follow this exact shape:
{ "action": "create" | "update" | "delete", "node": { "label": string, "type": "page"|"section"|"folder"|"link"|"modal"|"component", "parent_label"?: string, "url_path"?: string, "notes"?: string, "metadata"?: { "sections": Array<{ "label": string, "color": "teal"|"blue"|"navy"|"purple"|"slate"|"indigo" }> } }, "blocks"?: [{ "type": "Navbar"|"Hero"|"Cards"|"CTA"|"Form"|"Footer"|"Text"|"Image"|"Table", "order_index": number, "props"?: object }] }

=== PARENT_LABEL RULES (CRITICAL) ===
- The homepage (tree root, labeled [HOMEPAGE] in the tree below) has NO parent_label.
- EVERY other page MUST have a parent_label matching its parent node's label exactly.
- All top-level pages must be children of the homepage. Example: if homepage is "Home", set parent_label: "Home" on every top-level page.
- Sub-pages must link to their direct parent (e.g., a "Team" page under "About" -> parent_label: "About").
- If no homepage exists yet, create one first. Then link all other pages under it.

Current sitemap tree (labels, [HOMEPAGE] = root node):
${treeView}

Current sitemap state (${existingNodes.length} nodes):
${JSON.stringify(existingNodes, null, 2)}

For "create" operations on pages, include a "metadata" object with a "sections" array. Use a professional baseline: "Header" -> "Hero" -> 1-3 content sections (be creative: "Features", "Pricing", "Team", "CTA", etc.) -> "Footer". Also include a "blocks" array with wireframe blocks for that page (Navbar at order 0, Hero at order 1, content sections, Footer last).

Respond ONLY with a valid JSON array - no markdown, no explanation.`;
}

function buildWireframeSystemPrompt(existingBlocks: unknown[]): string {
  return `You are a wireframe designer. Given the user's request, return a JSON array of wireframe block operations.
Each operation: { "action": "create" | "update" | "delete", "block": { "type": "Hero"|"Navbar"|"Cards"|"CTA"|"Form"|"Footer"|"Text"|"Image"|"Table", "order_index"?: number, "props"?: object } }

Current blocks (${existingBlocks.length} blocks):
${JSON.stringify(existingBlocks, null, 2)}

Respond ONLY with a valid JSON array - no markdown, no explanation.`;
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const { prompt, project_id, target, model, provider, node_id } = parsed.data;
  const supabase = createServiceClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("user_id", auth.userId)
    .single();
  if (!project) return err("Project not found", 404);

  const minRequired = minBalanceRequired(model);
  let currentCredits = 0;
  let creditsRemaining = 0;

  await supabase
    .from("user_profiles")
    .upsert({ id: auth.userId, credits: 100 }, { onConflict: "id", ignoreDuplicates: true });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("credits, plan")
    .eq("id", auth.userId)
    .single();

  currentCredits = profile?.credits ?? 0;
  const userPlan = (profile?.plan as PlanId) ?? "free";

  if (!PLAN_ALLOWED_MODELS[userPlan].includes(model as ModelId)) {
    return err(`The ${model} model is not available on the ${userPlan} plan. Please upgrade to use it.`, 403);
  }

  if (currentCredits < minRequired) {
    return err(`Insufficient credits. Need at least ${minRequired}, have ${currentCredits}.`, 402);
  }

  let existingItems: unknown[] = [];
  if (target === "sitemap") {
    const { data: nodes } = await supabase
      .from("sitemap_nodes")
      .select("id, label, type, parent_id, url_path, notes, order_index")
      .eq("project_id", project_id)
      .order("order_index");
    existingItems = nodes ?? [];
  } else {
    if (!node_id) return err("node_id is required for wireframe target");
    const { data: blocks } = await supabase
      .from("wireframe_blocks")
      .select("id, type, order_index, props")
      .eq("node_id", node_id)
      .order("order_index");
    existingItems = blocks ?? [];
  }

  let llmResult: string;
  let actualCost = minRequired;

  try {
    const systemPrompt =
      target === "sitemap"
        ? buildSitemapSystemPrompt(existingItems)
        : buildWireframeSystemPrompt(existingItems);

    const llmModel = buildModel(provider as ProviderKey, model);
    const { text, usage } = await generateText({
      model: llmModel,
      system: systemPrompt,
      prompt,
    });

    llmResult = text;
    actualCost = computeCredits(
      model,
      (usage as any).promptTokens ?? 0,
      (usage as any).completionTokens ?? 0
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "LLM call failed";
    return err(`LLM error: ${message}`, 502);
  }

  creditsRemaining = Math.max(0, currentCredits - actualCost);

  let operations: Array<{
    action: "create" | "update" | "delete";
    node?: {
      label: string;
      type?: string;
      parent_label?: string;
      url_path?: string;
      notes?: string;
      metadata?: Record<string, unknown>;
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

  const labelToId = new Map<string, string>();
  (existingItems as Array<{ id: string; label: string }>).forEach((node) => {
    labelToId.set(node.label, node.id);
  });

  const results: unknown[] = [];

  for (const op of operations) {
    if (target === "sitemap" && op.node) {
      const node = op.node;

      if (op.action === "create") {
        const siblings = (existingItems as Array<{ parent_id: string | null }>).filter(
          (item) => item.parent_id === (node.parent_label ? (labelToId.get(node.parent_label) ?? null) : null)
        );
        const { data } = await supabase
          .from("sitemap_nodes")
          .insert({
            project_id,
            label: node.label,
            type: (node.type as "page" | "section" | "folder" | "link" | "modal" | "component") ?? "page",
            parent_id: node.parent_label ? (labelToId.get(node.parent_label) ?? null) : null,
            url_path: node.url_path ?? null,
            notes: node.notes ?? null,
            metadata: node.metadata ?? null,
            order_index: siblings.length,
          })
          .select()
          .single();

        if (data) {
          labelToId.set(node.label, data.id);
          results.push(data);

          if (op.blocks && op.blocks.length > 0) {
            const blockRows = op.blocks.map((block, index) => ({
              project_id,
              node_id: data.id,
              type: block.type,
              order_index: block.order_index ?? index,
              props: block.props ?? {},
            }));
            await supabase.from("wireframe_blocks").insert(blockRows);
          }
        }
      } else if (op.action === "update") {
        const nodeId = labelToId.get(node.label);
        if (nodeId) {
          const { data } = await supabase
            .from("sitemap_nodes")
            .update({
              ...(node.type && {
                type: node.type as "page" | "section" | "folder" | "link" | "modal" | "component",
              }),
              ...(node.url_path !== undefined && { url_path: node.url_path }),
              ...(node.notes !== undefined && { notes: node.notes }),
            })
            .eq("id", nodeId)
            .select()
            .single();
          if (data) results.push(data);
        }
      } else if (op.action === "delete") {
        const nodeId = labelToId.get(node.label);
        if (nodeId) {
          await supabase.from("sitemap_nodes").delete().eq("id", nodeId);
          results.push({ deleted: true, label: node.label });
        }
      }
    } else if (target === "wireframe" && node_id && op.block) {
      const block = op.block;
      if (op.action === "create") {
        const { data } = await supabase
          .from("wireframe_blocks")
          .insert({
            project_id,
            node_id,
            type: block.type,
            order_index: block.order_index ?? existingItems.length + results.length,
            props: block.props ?? {},
          })
          .select()
          .single();
        if (data) results.push(data);
      } else if (op.action === "update") {
        const existing = (existingItems as Array<{ id: string; type: string }>).find(
          (item) => item.type === block.type
        );
        if (existing) {
          const { data } = await supabase
            .from("wireframe_blocks")
            .update({
              ...(block.props && { props: block.props }),
              ...(block.order_index !== undefined && { order_index: block.order_index }),
            })
            .eq("id", existing.id)
            .select()
            .single();
          if (data) results.push(data);
        }
      } else if (op.action === "delete") {
        const existing = (existingItems as Array<{ id: string; type: string }>).find(
          (item) => item.type === block.type
        );
        if (existing) {
          await supabase.from("wireframe_blocks").delete().eq("id", existing.id);
          results.push({ deleted: true, type: block.type });
        }
      }
    }
  }

  await supabase
    .from("user_profiles")
    .update({ credits: creditsRemaining })
    .eq("id", auth.userId);

  let finalItems: unknown[] = [];
  if (target === "sitemap") {
    const { data: updatedNodes } = await supabase
      .from("sitemap_nodes")
      .select("*")
      .eq("project_id", project_id)
      .order("order_index");
    finalItems = updatedNodes ?? [];
  } else {
    const { data: updatedBlocks } = await supabase
      .from("wireframe_blocks")
      .select("*")
      .eq("node_id", node_id)
      .order("order_index");
    finalItems = updatedBlocks ?? [];
  }

  return ok({
    nodes: target === "sitemap" ? finalItems : [],
    blocks: target === "wireframe" ? finalItems : [],
    operations_applied: results.length,
    credits_used: actualCost,
    credits_cost_usd: actualCost * CREDIT_VALUE_USD,
    credits_remaining: creditsRemaining,
  });
}
