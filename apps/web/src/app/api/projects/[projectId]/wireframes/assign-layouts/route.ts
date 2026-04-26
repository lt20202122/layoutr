import { NextRequest } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";
import { decryptKey } from "@/lib/crypto";

const defaultAnthropic = createAnthropic();
const defaultOpenAI = createOpenAI();
const defaultGoogle = createGoogleGenerativeAI();
const defaultDeepSeek = createDeepSeek();

// ─── Schema ───────────────────────────────────────────────────────────────────

const Schema = z.object({
  model: z
    .enum(["gemini-2-0-flash", "deepseek-chat", "claude-sonnet-3-7"])
    .default("gemini-2-0-flash"),
  provider: z
    .enum(["anthropic", "openai", "google", "deepseek"])
    .default("google"),
});

const MODEL_CREDITS: Record<string, number> = {
  "gemini-2-0-flash":  5,
  "deepseek-chat":     10,
  "claude-sonnet-3-7": 25,
};

// ─── Default props per block type ─────────────────────────────────────────────

const BLOCK_DEFAULTS: Record<string, Record<string, unknown>> = {
  Navbar:  { title: "My App", links: ["Home", "About", "Contact"] },
  Hero:    { headline: "Welcome", subheadline: "Start building something great", cta: "Get Started" },
  Cards:   { count: 3, title: "Features" },
  CTA:     { headline: "Ready to start?", cta: "Sign Up Free" },
  Form:    { fields: ["Name", "Email", "Message"], submitLabel: "Send" },
  Footer:  { columns: 3, copyright: "© 2024" },
  Text:    { content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  Image:   { alt: "Image placeholder", caption: "" },
  Table:   { columns: ["Name", "Status", "Date"], rows: 5 },
};

// ─── Provider factory ──────────────────────────────────────────────────────────

type ProviderKey = "anthropic" | "openai" | "google" | "deepseek";

function buildModel(provider: ProviderKey, model: string, byokKey?: string) {
  switch (provider) {
    case "anthropic":
      return byokKey ? createAnthropic({ apiKey: byokKey })(model) : defaultAnthropic(model);
    case "openai":
      return byokKey ? createOpenAI({ apiKey: byokKey })(model) : defaultOpenAI(model);
    case "google":
      return byokKey ? createGoogleGenerativeAI({ apiKey: byokKey })(model) : defaultGoogle(model);
    case "deepseek":
      return byokKey ? createDeepSeek({ apiKey: byokKey })(model) : defaultDeepSeek(model);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  nodes: Array<{ id: string; label: string; notes?: string | null }>
): string {
  return `You are a wireframe layout designer. Given a website sitemap, assign the optimal wireframe blocks and layout variants for each page.

Available block types and their layout variants:
- Navbar: "default" (logo left + nav links + CTA), "centered" (centered logo and links), "minimal" (logo + hamburger)
- Hero: "centered" (large centered heading + CTAs), "split" (text left, image right), "minimal" (heading + subtitle only), "fullscreen" (full-height with background overlay)
- Cards: "grid-3" (3-column cards), "grid-2" (2-column cards), "list" (vertical icon+text list), "horizontal" (horizontal cards, image left)
- CTA: "banner" (full-width colored band + button), "split" (text left + form right), "minimal" (centered text + button inline)
- Form: "stacked" (fields stacked vertically), "inline" (2-column field grid), "card" (centered card form)
- Footer: "columns" (4-column link groups), "simple" (logo + links in one row), "centered" (centered logo + links)
- Text: "body" (standard body text), "two-column" (2-column layout), "highlight" (text + side callout box)
- Image: "full-width" (edge-to-edge), "contained" (centered with padding + caption), "gallery" (3x2 image grid)
- Table: "basic" (header + rows), "striped" (accent header + alternating rows), "compact" (dense rows)

Rules:
- Every page MUST start with Navbar and end with Footer
- Choose blocks and layouts that match the page purpose (inferred from label and notes)
- Home / Landing pages: Hero (centered or fullscreen) → Cards (grid-3) → CTA (banner)
- About / Team pages: Hero (split) → Text (two-column) → Cards (grid-2 for team)
- Contact / Support pages: Hero (minimal) → Form (card)
- Pricing pages: Hero (minimal) → Cards (grid-3) → CTA (banner)
- Blog / Article / News pages: Hero (minimal) → Text (body) → Cards (grid-2 for related)
- Dashboard / Admin / Analytics pages: Cards (grid-2) → Table (basic)
- Login / Sign-in / Register / Auth pages: Form (card) only (skip Hero), Footer (centered)

Sitemap pages to assign layouts for:
${JSON.stringify(nodes, null, 2)}

Return a JSON array ONLY — no markdown, no explanation:
[{"node_id":"...","blocks":[{"type":"Navbar","layout":"default","order_index":0},{"type":"Hero","layout":"centered","order_index":1}]}]`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const { model, provider } = parsed.data;
  const supabase = createServiceClient();

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", auth.userId)
    .single();
  if (!project) return err("Project not found", 404);

  // BYOK check
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

  // Credit check
  const cost = MODEL_CREDITS[model] ?? 10;
  let creditsRemaining = 0;
  if (!byokKey) {
    await supabase
      .from("user_profiles")
      .upsert({ id: auth.userId, credits: 100 }, { onConflict: "id", ignoreDuplicates: true });

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", auth.userId)
      .single();

    const credits = profile?.credits ?? 0;
    if (credits < cost) return err(`Insufficient credits. Need ${cost}, have ${credits}.`, 402);
    creditsRemaining = credits - cost;
  }

  // Fetch page-type sitemap nodes
  const { data: nodes } = await supabase
    .from("sitemap_nodes")
    .select("id, label, type, notes")
    .eq("project_id", projectId)
    .eq("type", "page")
    .order("order_index");

  const pageNodes = nodes ?? [];
  if (pageNodes.length === 0) return err("No page nodes found in sitemap. Add pages first.", 400);

  // Call LLM
  let llmResult: string;
  try {
    const llmModel = buildModel(provider as ProviderKey, model, byokKey);
    const { text } = await generateText({
      model: llmModel,
      system: buildSystemPrompt(pageNodes.map((n) => ({ id: n.id, label: n.label, notes: n.notes }))),
      prompt: `Assign optimal wireframe layouts for all ${pageNodes.length} pages listed above.`,
    });
    llmResult = text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM call failed";
    return err(`LLM error: ${msg}`, 502);
  }

  // Parse LLM response
  let assignments: Array<{
    node_id: string;
    blocks: Array<{ type: string; layout: string; order_index: number }>;
  }>;
  try {
    const cleaned = llmResult
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    assignments = JSON.parse(cleaned);
    if (!Array.isArray(assignments)) throw new Error("Expected array");
  } catch {
    return err("LLM returned invalid JSON. Please try again.", 502);
  }

  // Apply: delete existing blocks, insert new ones for each assigned page
  const validNodeIds = new Set(pageNodes.map((n) => n.id));
  let pagesUpdated = 0;

  for (const assignment of assignments) {
    if (!validNodeIds.has(assignment.node_id)) continue;
    if (!Array.isArray(assignment.blocks) || assignment.blocks.length === 0) continue;

    await supabase.from("wireframe_blocks").delete().eq("node_id", assignment.node_id);

    const toInsert = assignment.blocks.map((b) => ({
      node_id: assignment.node_id,
      type: b.type,
      order_index: b.order_index ?? 0,
      props: {
        ...(BLOCK_DEFAULTS[b.type] ?? {}),
        layout: b.layout ?? "default",
      },
    }));

    await supabase.from("wireframe_blocks").insert(toInsert);
    pagesUpdated++;
  }

  // Deduct credits
  if (!byokKey) {
    await supabase
      .from("user_profiles")
      .update({ credits: creditsRemaining })
      .eq("id", auth.userId);
  }

  return ok({
    pages_updated: pagesUpdated,
    credits_used: byokKey ? 0 : cost,
    credits_remaining: byokKey ? null : creditsRemaining,
    byok: !!byokKey,
  });
}
