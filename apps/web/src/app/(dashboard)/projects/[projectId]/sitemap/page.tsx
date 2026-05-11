import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { notFound } from "next/navigation";
import { createClientOrNull } from "@/lib/supabase/server";
import SitemapEditor from "@/components/sitemap/SitemapEditor";
import GuestSitemapPage from "@/components/guest/GuestSitemapPage";
import type { SitemapNode } from "@/components/sitemap/sitemapUtils";

type Params = { params: Promise<{ projectId: string }> };

export default async function SitemapPage({ params }: Params) {
  const { projectId } = await params;
  const supabase = await createClientOrNull();
  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  if (!user) {
    return <GuestSitemapPage projectId={projectId} />;
  }

  const projectQuery = supabase!.from("projects").select("*").eq("id", projectId);
  projectQuery.eq("user_id", user.id);

  const { data: project } = await projectQuery.single();
  if (!project) notFound();

  const { data: profile } = await supabase!.from("user_profiles").select("plan").eq("id", user.id).single();
  const userPlan = profile?.plan ?? "free";

  const { data: rawNodes } = await supabase!
    .from("sitemap_nodes")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  const nodes = (rawNodes ?? []) as unknown as SitemapNode[];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Sitemap editor</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">{project.name}</h1>
            <p className="body-lg mt-4">
              {project.description || "Define the product structure, section system, and page relationships before moving into wireframes."}
            </p>
          </div>

          <Link href={`/projects/${projectId}/wireframe`} className="button-secondary gap-2 self-start">
            <Layers3 className="h-4 w-4" />
            Open wireframe editor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SitemapEditor projectId={projectId} initialNodes={nodes} userPlan={userPlan} />
    </div>
  );
}
