import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ok, err, authenticate, slugify } from "@/lib/api";

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return err(error.message, 500);
  return ok(data);
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const { name, description } = parsed.data;
  const slug = slugify(name);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: auth.userId, name, description, slug })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return err("A project with this name already exists");
    return err(error.message, 500);
  }

  return ok(data, 201);
}
