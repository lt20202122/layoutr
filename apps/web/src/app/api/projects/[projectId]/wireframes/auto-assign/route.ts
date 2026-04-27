import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";
import { mapSectionToBlock } from "@/components/sitemap/sitemapUtils";

function getDefaultBlocksForPage(label: string, metadata?: any) {
  const sections = metadata?.sections;
  if (Array.isArray(sections) && sections.length > 0) {
    return sections.map((s: any) => mapSectionToBlock(s.label));
  }
  const l = label.toLowerCase();
  const is = (kw: string[]) => kw.some((k) => l.includes(k));

  if (is(["login", "sign in", "signin", "register", "auth", "signup", "sign up"])) {
    return [
      { type: "Navbar", layout: "minimal" },
      { type: "Form", layout: "card" },
      { type: "Footer", layout: "centered" },
    ];
  }
  if (is(["contact", "support", "help"])) {
    return [
      { type: "Navbar", layout: "default" },
      { type: "Hero", layout: "minimal" },
      { type: "Form", layout: "card" },
      { type: "Footer", layout: "simple" },
    ];
  }
  if (is(["pricing", "plans", "billing"])) {
    return [
      { type: "Navbar", layout: "default" },
      { type: "Hero", layout: "minimal" },
      { type: "Cards", layout: "grid-3" },
      { type: "CTA", layout: "banner" },
      { type: "Footer", layout: "columns" },
    ];
  }
  if (is(["about", "team", "company", "mission"])) {
    return [
      { type: "Navbar", layout: "default" },
      { type: "Hero", layout: "split" },
      { type: "Text", layout: "two-column" },
      { type: "Cards", layout: "grid-2" },
      { type: "Footer", layout: "columns" },
    ];
  }
  if (is(["blog", "article", "post", "news", "press"])) {
    return [
      { type: "Navbar", layout: "default" },
      { type: "Hero", layout: "minimal" },
      { type: "Text", layout: "body" },
      { type: "Cards", layout: "grid-2" },
      { type: "Footer", layout: "simple" },
    ];
  }
  if (is(["dashboard", "admin", "analytics", "overview", "app"])) {
    return [
      { type: "Navbar", layout: "default" },
      { type: "Cards", layout: "grid-2" },
      { type: "Table", layout: "basic" },
      { type: "Footer", layout: "simple" },
    ];
  }
  return [
    { type: "Navbar", layout: "default" },
    { type: "Hero", layout: "centered" },
    { type: "Cards", layout: "grid-3" },
    { type: "CTA", layout: "banner" },
    { type: "Footer", layout: "columns" },
  ];
}

const BLOCK_DEFAULTS: Record<string, Record<string, unknown>> = {
  Navbar: { title: "My App", links: ["Home", "About", "Contact"] },
  Hero: { headline: "Welcome", subheadline: "Start building something great", cta: "Get Started" },
  Cards: { count: 3, title: "Features" },
  CTA: { headline: "Ready to start?", cta: "Sign Up Free" },
  Form: { fields: ["Name", "Email", "Message"], submitLabel: "Send" },
  Footer: { columns: 3, copyright: "© 2024" },
  Text: { content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  Image: { alt: "Image placeholder", caption: "" },
  Table: { columns: ["Name", "Status", "Date"], rows: 5 },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const supabase = createServiceClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", auth.userId)
    .single();
  if (!project) return err("Project not found", 404);

  const { data: nodes } = await supabase
    .from("sitemap_nodes")
    .select("id, label, metadata")
    .eq("project_id", projectId)
    .eq("type", "page")
    .order("order_index");

  const pageNodes = nodes ?? [];
  if (pageNodes.length === 0) return err("No page nodes found in sitemap. Add pages first.", 400);

  let pagesUpdated = 0;
  for (const node of pageNodes) {
    const blocks = getDefaultBlocksForPage(node.label, node.metadata);
    if (blocks.length === 0) continue;

    await supabase.from("wireframe_blocks").delete().eq("node_id", node.id);

    const toInsert = blocks.map((b, i) => ({
      node_id: node.id,
      type: b.type,
      order_index: i,
      props: {
        ...(BLOCK_DEFAULTS[b.type] ?? {}),
        layout: b.layout,
      },
    }));

    await supabase.from("wireframe_blocks").insert(toInsert);
    pagesUpdated++;
  }

  return ok({ pages_updated: pagesUpdated });
}
