import { NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, err, authenticate, slugify } from "@/lib/api";

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

type Params = { params: Promise<{ projectId: string }> };

async function getProject(supabase: Awaited<ReturnType<typeof createServiceClient>>, projectId: string, userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId } = await params;
  const supabase = createServiceClient();
  const project = await getProject(supabase, projectId, auth.userId);
  if (!project) return err("Project not found", 404);

  return ok(project);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateProjectSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const supabase = createServiceClient();
  const project = await getProject(supabase, projectId, auth.userId);
  if (!project) return err("Project not found", 404);

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.name) updates.slug = slugify(parsed.data.name);

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();

  if (error) return err(error.message, 500);
  return ok(data);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { projectId } = await params;
  const supabase = createServiceClient();
  const project = await getProject(supabase, projectId, auth.userId);
  if (!project) return err("Project not found", 404);

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return err(error.message, 500);

  return ok({ deleted: true });
}
