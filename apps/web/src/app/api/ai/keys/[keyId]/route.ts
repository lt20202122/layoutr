import { NextRequest } from "next/server";
import { authenticate, ok, err } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ keyId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const { keyId } = await params;
  const supabase = createServiceClient();

  // Verify ownership
  const { data: key } = await supabase
    .from("llm_api_keys")
    .select("id")
    .eq("id", keyId)
    .eq("user_id", auth.userId)
    .single();

  if (!key) return err("API key not found", 404);

  const { error } = await supabase.from("llm_api_keys").delete().eq("id", keyId);
  if (error) return err(error.message, 500);

  return ok({ deleted: true });
}
