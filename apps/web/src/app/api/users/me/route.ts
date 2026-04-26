import { NextRequest } from "next/server";
import { authenticate, ok, err } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const supabase = createServiceClient();

  // Delete the user via Admin API
  const { error } = await supabase.auth.admin.deleteUser(auth.userId);

  if (error) return err(error.message, 500);
  return ok({ deleted: true });
}
