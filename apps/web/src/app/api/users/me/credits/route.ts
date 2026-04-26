import { authenticate, ok, err } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("credits")
    .eq("id", auth.userId)
    .single();

  if (error) return err(error.message, 500);
  return ok({ credits: data?.credits ?? 0 });
}
