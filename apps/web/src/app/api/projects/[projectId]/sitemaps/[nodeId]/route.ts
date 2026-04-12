import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";

const NodeTypeEnum = z.enum(["page", "section", "folder", "link", "modal", "component"]);
const NodeStatusEnum = z.enum(["draft", "review", "approved", "live"]);

const UpdateNodeSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  type: NodeTypeEnum.optional(),
  status: NodeStatusEnum.optional(),
  parent_id: z.string().uuid().nullable().optional(),
  url_path: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  order_index: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

type Params = { params: Promise<{ projectId: string; nodeId: string }> };

async function assertNodeOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nodeId: string,
  projectId: string,
  userId: string
) {
  const { data } = await supabase
    .from("sitemap_nodes")
    .select("id, projects!inner(user_id)")
    .eq("id", nodeId)
    .eq("project_id", projectId)
    .eq("projects.user_id", userId)
    .single();
  return !!data;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId, nodeId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sitemap_nodes")
    .select("*, projects!inner(user_id)")
    .eq("id", nodeId)
    .eq("project_id", projectId)
    .eq("projects.user_id", auth.userId)
    .single();

  if (error || !data) return err("Node not found", 404);
  return ok(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId, nodeId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateNodeSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const supabase = await createClient();
  const owns = await assertNodeOwner(supabase, nodeId, projectId, auth.userId);
  if (!owns) return err("Node not found", 404);

  const { data, error } = await supabase
    .from("sitemap_nodes")
    .update(parsed.data)
    .eq("id", nodeId)
    .select()
    .single();

  if (error) return err(error.message, 500);
  return ok(data);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId, nodeId } = await params;
  const supabase = await createClient();
  const owns = await assertNodeOwner(supabase, nodeId, projectId, auth.userId);
  if (!owns) return err("Node not found", 404);

  const { error } = await supabase.from("sitemap_nodes").delete().eq("id", nodeId);
  if (error) return err(error.message, 500);

  return ok({ deleted: true });
}
