import Link from "next/link";
import { ArrowLeft, LayoutTemplate } from "lucide-react";
import { notFound } from "next/navigation";
import { createClientOrNull } from "@/lib/supabase/server";
import GuestWireframePage from "@/components/guest/GuestWireframePage";
import WireframeEditor from "@/components/wireframe/WireframeEditor";

type Params = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ nodeId?: string }>;
};

export default async function WireframePage({ params, searchParams }: Params) {
  const { projectId } = await params;
  const { nodeId } = await searchParams;

  const supabase = await createClientOrNull();
  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  if (!user) {
    return <GuestWireframePage projectId={projectId} nodeId={nodeId} />;
  }

  const projectQuery = supabase!.from("projects").select("*").eq("id", projectId);
  projectQuery.eq("user_id", user.id);
  const { data: project } = await projectQuery.single();
  if (!project) notFound();

  const { data: profile } = await supabase!.from("user_profiles").select("plan").eq("id", user.id).single();
  const userPlan = profile?.plan ?? "free";

  const { data: nodes } = await supabase!
    .from("sitemap_nodes")
    .select("id, label, type, metadata")
    .eq("project_id", projectId)
    .order("order_index");

  const selectedNode = nodes?.find((n) => n.id === nodeId) ?? nodes?.[0] ?? null;

  const { data: initialBlocks } = selectedNode
    ? await supabase!
        .from("wireframe_blocks")
        .select("*")
        .eq("node_id", selectedNode.id)
        .order("order_index")
    : { data: [] };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <Link href={`/projects/${projectId}/sitemap`} className="inline-flex items-center gap-2 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Back to sitemap
              </Link>
              {selectedNode && (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                  {selectedNode.label}
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-white">{project.name} wireframes</h1>
            <p className="body-lg mt-4">
              Move from structure to layout using reusable blocks, auto-assignment, and page-specific scaffolding.
            </p>
          </div>

          <div className="status-pill self-start">
            <LayoutTemplate className="h-4 w-4 text-brand-300" />
            Connected to sitemap nodes
          </div>
        </div>
      </section>

      <WireframeEditor
        projectId={projectId}
        nodes={(nodes ?? []) as Array<{ id: string; label: string; type: string }>}
        selectedNodeId={selectedNode?.id ?? null}
        initialBlocks={(initialBlocks ?? []) as Array<{
          id: string;
          node_id: string;
          type: string;
          order_index: number;
          props: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        }>}
        userPlan={userPlan}
      />
    </div>
  );
}
