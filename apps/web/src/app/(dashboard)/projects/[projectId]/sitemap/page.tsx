import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SitemapEditor from "@/components/sitemap/SitemapEditor";
import type { Database } from "@/types/database";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type SitemapNode = Database["public"]["Tables"]["sitemap_nodes"]["Row"];
type Params = { params: Promise<{ projectId: string }> };

export default async function SitemapPage({ params }: Params) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single() as { data: Project | null };

  if (!project) notFound();

  const { data: nodes } = await supabase
    .from("sitemap_nodes")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true }) as unknown as { data: SitemapNode[] | null };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-gray-400 text-sm mt-1">{project.description}</p>
          )}
        </div>
      </div>

      <SitemapEditor projectId={projectId} initialNodes={nodes ?? []} />
    </div>
  );
}
