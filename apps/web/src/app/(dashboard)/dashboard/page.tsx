import { createClient } from "@/lib/supabase/server";
import DashboardWorkspace from "@/components/ui/DashboardWorkspace";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase.from("projects").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })
    : { data: [] };

  return <DashboardWorkspace authenticated={!!user} initialProjects={data ?? []} />;
}
