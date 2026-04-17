import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Authenticate via Bearer API key (for MCP/REST access) or Supabase session */
export async function authenticate(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ltr_")) {
    const rawKey = authHeader.slice(7);
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const supabase = await createClient();
    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("user_id, expires_at")
      .eq("key_hash", keyHash)
      .single();

    if (!apiKey) return null;
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return null;

    // Update last_used_at (fire and forget)
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", keyHash)
      .then(() => {});

    return { userId: apiKey.user_id };
  }

  // Fall back to Supabase session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { userId: user.id };

  // Dev bypass — use pre-created dev user when auth is disabled
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === "true" && process.env.DEV_USER_ID) {
    return { userId: process.env.DEV_USER_ID };
  }

  return null;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
