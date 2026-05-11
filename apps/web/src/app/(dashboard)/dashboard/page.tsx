import { createClientOrNull } from "@/lib/supabase/server";
import DashboardWorkspace from "@/components/ui/DashboardWorkspace";

export default async function DashboardPage() {
  const supabase = await createClientOrNull();
  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  const { data } = user
    ? await supabase!.from("projects").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })
    : { data: [] };

  return <DashboardWorkspace authenticated={!!user} initialProjects={data ?? []} />;
}
