import { NextRequest } from "next/server";
import { z } from "zod";
import { authenticate, ok, err } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { encryptKey } from "@/lib/crypto";

const CreateKeySchema = z.object({
  provider: z.enum(["anthropic", "openai", "google", "groq"]),
  key: z.string().min(1),
});

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("llm_api_keys")
    .select("id, provider, key_prefix, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return err(error.message, 500);
  return ok(data);
}

export async function POST(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = CreateKeySchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const { ciphertext, iv } = encryptKey(parsed.data.key);
  const keyPrefix = parsed.data.key.slice(0, 8) + "••••";

  const supabase = createServiceClient();

  // Upsert — one key per provider per user (unique constraint in DB)
  const { data, error } = await supabase
    .from("llm_api_keys")
    .upsert(
      {
        user_id: auth.userId,
        provider: parsed.data.provider,
        key_ciphertext: ciphertext,
        key_iv: iv,
        key_prefix: keyPrefix,
      },
      { onConflict: "user_id,provider" }
    )
    .select("id, provider, key_prefix, created_at")
    .single();

  if (error) return err(error.message, 500);
  return ok(data);
}
