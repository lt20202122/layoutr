import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";

type Params = { params: Promise<{ keyId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { keyId } = await params;
  const supabase = await createClient();

  const { data: key } = await supabase
    .from("api_keys")
    .select("id")
    .eq("id", keyId)
    .eq("user_id", auth.userId)
    .single();

  if (!key) return err("API key not found", 404);

  const { error } = await supabase.from("api_keys").delete().eq("id", keyId);
  if (error) return err(error.message, 500);

  return ok({ deleted: true });
}
