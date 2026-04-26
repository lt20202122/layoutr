import { NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";

const UpdateBlockSchema = z.object({
  type: z
    .enum(["Hero", "Navbar", "Cards", "CTA", "Form", "Footer", "Text", "Image", "Table"])
    .optional(),
  order_index: z.number().int().min(0).optional(),
  props: z.record(z.unknown()).optional(),
});

type Params = { params: Promise<{ projectId: string; nodeId: string; blockId: string }> };

async function assertBlockOwner(
  supabase: ReturnType<typeof createServiceClient>,
  blockId: string,
  nodeId: string,
  projectId: string,
  userId: string
) {
  const { data } = await supabase
    .from("wireframe_blocks")
    .select("id, sitemap_nodes!inner(project_id, projects!inner(user_id))")
    .eq("id", blockId)
    .eq("node_id", nodeId)
    .eq("sitemap_nodes.project_id", projectId)
    .eq("sitemap_nodes.projects.user_id", userId)
    .single();
  return !!data;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId, nodeId, blockId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateBlockSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const supabase = createServiceClient();
  const owns = await assertBlockOwner(supabase, blockId, nodeId, projectId, auth.userId);
  if (!owns) return err("Block not found", 404);

  const { data, error } = await supabase
    .from("wireframe_blocks")
    .update(parsed.data)
    .eq("id", blockId)
    .select()
    .single();

  if (error) return err(error.message, 500);
  return ok(data);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId, nodeId, blockId } = await params;
  const supabase = createServiceClient();
  const owns = await assertBlockOwner(supabase, blockId, nodeId, projectId, auth.userId);
  if (!owns) return err("Block not found", 404);

  const { error } = await supabase.from("wireframe_blocks").delete().eq("id", blockId);
  if (error) return err(error.message, 500);

  return ok({ deleted: true });
}
