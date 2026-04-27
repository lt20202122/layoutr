import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import WireframeEditor from "@/components/wireframe/WireframeEditor";

type Params = { params: Promise<{ projectId: string }>; searchParams: Promise<{ nodeId?: string }> };

export default async function WireframePage({ params, searchParams }: Params) {
  const { projectId } = await params;
  const { nodeId } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const projectQuery = supabase.from("projects").select("*").eq("id", projectId);
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

  // Fetch sitemap nodes for node picker
  const { data: nodes } = await supabase
    .from("sitemap_nodes")
    .select("id, label, type, metadata")
    .eq("project_id", projectId)
    .order("order_index");

  // Fetch initial blocks if a nodeId is provided
  const selectedNode = nodes?.find((n) => n.id === nodeId) ?? nodes?.[0] ?? null;

  const { data: initialBlocks } = selectedNode
    ? await supabase
        .from("wireframe_blocks")
        .select("*")
        .eq("node_id", selectedNode.id)
        .order("order_index")
    : { data: [] };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href={`/projects/${projectId}/sitemap`} className="hover:text-white transition-colors">
          {project.name}
        </Link>
        <span className="text-gray-600">/</span>
        {selectedNode ? (
          <>
            <span className="text-white font-medium">{selectedNode.label}</span>
            <span className="text-gray-600">/</span>
          </>
        ) : null}
        <span className="text-white font-medium">Wireframe</span>
      </nav>

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
