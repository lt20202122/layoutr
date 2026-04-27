import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, err, authenticate } from "@/lib/api";

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return err("Unauthorized", 401);

  const supabase = createServiceClient();

  // Get the user's email from auth
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
    auth.userId
  );
  if (userError || !userData?.user?.email) {
    return err("Could not fetch user email", 500);
  }

  // Upsert into waitlist — silently succeed if already joined
  const { error: insertError } = await supabase
    .from("waitlist")
    .upsert(
      { user_id: auth.userId, email: userData.user.email },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

  if (insertError) {
    return err("Failed to join waitlist", 500);
  }

  return ok({ joined: true });
}
