import { NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";

const NodeTypeEnum = z.enum(["page", "section", "folder", "link", "modal", "component"]);
const NodeStatusEnum = z.enum(["draft", "review", "approved", "live"]);

const CreateNodeSchema = z.object({
  label: z.string().min(1).max(200),
  type: NodeTypeEnum.default("page"),
  status: NodeStatusEnum.default("draft"),
  parent_id: z.string().uuid().nullable().optional(),
  url_path: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  order_index: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

type Params = { params: Promise<{ projectId: string }> };

async function assertProjectOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  userId: string
) {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId } = await params;
  const supabase = await createServiceClient();

  const owns = await assertProjectOwner(supabase, projectId, auth.userId);
  if (!owns) return err("Project not found", 404);

  const { data, error } = await supabase
    .from("sitemap_nodes")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error) return err(error.message, 500);
  return ok(data);
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = CreateNodeSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const supabase = await createServiceClient();
  const owns = await assertProjectOwner(supabase, projectId, auth.userId);
  if (!owns) return err("Project not found", 404);

  // Auto-assign order_index if not provided
  let orderIndex = parsed.data.order_index;
  if (orderIndex === undefined) {
    const { count } = await supabase
      .from("sitemap_nodes")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("parent_id", parsed.data.parent_id ?? null);
    orderIndex = count ?? 0;
  }

  const { data, error } = await supabase
    .from("sitemap_nodes")
    .insert({
      project_id: projectId,
      label: parsed.data.label,
      type: parsed.data.type,
      status: parsed.data.status,
      parent_id: parsed.data.parent_id ?? null,
      url_path: parsed.data.url_path ?? null,
      notes: parsed.data.notes ?? null,
      order_index: orderIndex,
      metadata: parsed.data.metadata ?? {},
    })
    .select()
    .single();

  if (error) return err(error.message, 500);
  return ok(data, 201);
}
