import { NextRequest } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";

const CreateKeySchema = z.object({
  name: z.string().min(1).max(100),
  expires_at: z.string().datetime().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, expires_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return err(error.message, 500);
  return ok(data);
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = CreateKeySchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const rawKey = "ltr_" + randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: auth.userId,
      name: parsed.data.name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      expires_at: parsed.data.expires_at ?? null,
    })
    .select("id, name, key_prefix, created_at, expires_at")
    .single();

  if (error) return err(error.message, 500);

  // Return the raw key ONCE — never stored again
  return ok({ ...data, key: rawKey }, 201);
}
