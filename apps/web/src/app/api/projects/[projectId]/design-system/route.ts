import { NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";

const UpdateDesignSystemSchema = z.object({
  tokens: z.record(z.unknown()),
});

type Params = { params: Promise<{ projectId: string }> };

async function assertProjectOwner(
  supabase: ReturnType<typeof createServiceClient>,
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
  const supabase = createServiceClient();

  const owns = await assertProjectOwner(supabase, projectId, auth.userId);
  if (!owns) return err("Project not found", 404);

  const { data, error } = await supabase
    .from("design_system")
    .select("*")
    .eq("project_id", projectId)
    .single();

  // If no design system exists yet, return an empty one
  if (error?.code === "PGRST116") return ok({ project_id: projectId, tokens: {} });
  if (error) return err(error.message, 500);
  return ok(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateDesignSystemSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const supabase = createServiceClient();
  const owns = await assertProjectOwner(supabase, projectId, auth.userId);
  if (!owns) return err("Project not found", 404);

  // Upsert design system
  const { data, error } = await supabase
    .from("design_system")
    .upsert(
      { project_id: projectId, tokens: parsed.data.tokens, updated_at: new Date().toISOString() },
      { onConflict: "project_id" }
    )
    .select()
    .single();

  if (error) return err(error.message, 500);
  return ok(data);
}
