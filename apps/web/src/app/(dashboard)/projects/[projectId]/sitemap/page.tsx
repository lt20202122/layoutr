import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SitemapEditor from "@/components/sitemap/SitemapEditor";
import type { SitemapNode } from "@/components/sitemap/sitemapUtils";

type Params = { params: Promise<{ projectId: string }> };

export default async function SitemapPage({ params }: Params) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const projectQuery = supabase
    .from("projects")
    .select("*")
    .eq("id", projectId);

  if (user) projectQuery.eq("user_id", user.id);

  const { data: project } = await projectQuery.single();

  if (!project) notFound();

  // Fetch plan
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user?.id)
    .single();

  const userPlan = profile?.plan ?? "free";

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

        {/* Wireframe link */}
        <Link
          href={`/projects/${projectId}/wireframe`}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-70">
            <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="3" y="3" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.5"/>
            <rect x="3" y="6.5" width="8" height="1" rx="0.5" fill="currentColor" opacity="0.3"/>
            <rect x="3" y="8.5" width="5" height="1" rx="0.5" fill="currentColor" opacity="0.3"/>
          </svg>
          Wireframe
        </Link>
      </div>

      <SitemapEditor projectId={projectId} initialNodes={nodes} userPlan={userPlan} />
    </div>
  );
}
