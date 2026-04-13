import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SitemapEditor from "@/components/sitemap/SitemapEditor";
import type { Database } from "@/types/database";
import type { SitemapNode } from "@/components/sitemap/sitemapUtils";

type Project = Database["public"]["Tables"]["projects"]["Row"];
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawNodes } = await supabase
    .from("sitemap_nodes")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  const nodes = (rawNodes ?? []) as unknown as SitemapNode[];

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

      <SitemapEditor projectId={projectId} initialNodes={nodes} />
    </div>
  );
}
