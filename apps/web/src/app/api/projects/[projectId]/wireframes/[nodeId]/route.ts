import { NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";

const CreateBlockSchema = z.object({
  type: z.string(),
  label: z.string().optional(),
  composition: z.array(z.any()).optional(),
  order_index: z.number().int().min(0).optional(),
  props: z.record(z.unknown()).optional(),
});

type Params = { params: Promise<{ projectId: string; nodeId: string }> };

async function assertNodeOwner(
  supabase: ReturnType<typeof createServiceClient>,
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
  const supabase = createServiceClient();

  const owns = await assertNodeOwner(supabase, nodeId, projectId, auth.userId);
  if (!owns) return err("Node not found", 404);

  const { data, error } = await supabase
    .from("wireframe_blocks")
    .select("*")
    .eq("node_id", nodeId)
    .order("order_index", { ascending: true });

  if (error) return err(error.message, 500);
  return ok(data);
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId, nodeId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = CreateBlockSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const supabase = createServiceClient();
  const owns = await assertNodeOwner(supabase, nodeId, projectId, auth.userId);
  if (!owns) return err("Node not found", 404);

  // Auto-assign order_index if not provided
  let orderIndex = parsed.data.order_index;
  if (orderIndex === undefined) {
    const { count } = await supabase
      .from("wireframe_blocks")
      .select("*", { count: "exact", head: true })
      .eq("node_id", nodeId);
    orderIndex = count ?? 0;
  }

  const { data, error } = await supabase
    .from("wireframe_blocks")
    .insert({
      node_id: nodeId,
      type: parsed.data.type,
      label: parsed.data.label ?? parsed.data.type,
      composition: parsed.data.composition ?? null,
      order_index: orderIndex,
      props: parsed.data.props ?? {},
    })
    .select()
    .single();

  if (error) return err(error.message, 500);
  return ok(data, 201);
}
