"use client";

import Link from "next/link";
import { ArrowLeft, LayoutTemplate } from "lucide-react";
import { useEffect, useState } from "react";
import WireframeEditor from "@/components/wireframe/WireframeEditor";
import type { Block } from "@/components/wireframe/WireframeEditor";
import type { Section } from "@/components/sitemap/sitemapUtils";
import { getGuestProject, listGuestSitemapNodes, listGuestWireframeBlocks, type GuestProject } from "@/lib/guest-storage";

export default function GuestWireframePage({
  projectId,
  nodeId,
}: {
  projectId: string;
  nodeId?: string;
}) {
  const [project, setProject] = useState<GuestProject | null>(null);
  const [nodes, setNodes] = useState<Array<{ id: string; label: string; type: string; metadata?: { sections?: Section[] } | null }>>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [initialBlocks, setInitialBlocks] = useState<Block[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const nextProject = getGuestProject(projectId);
    const nextNodes = listGuestSitemapNodes(projectId).map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      metadata: node.metadata as { sections?: Section[] } | null,
    }));
    const nextSelectedNodeId = nextNodes.find((node) => node.id === nodeId)?.id ?? nextNodes[0]?.id ?? null;

    setProject(nextProject);
    setNodes(nextNodes);
    setSelectedNodeId(nextSelectedNodeId);
    setInitialBlocks(nextSelectedNodeId ? (listGuestWireframeBlocks(nextSelectedNodeId) as Block[]) : []);
    setReady(true);
  }, [projectId, nodeId]);

  if (!ready) return null;

  if (!project) {
    return (
      <section className="glass-panel rounded-[30px] p-8">
        <p className="section-label">Guest project</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Project not found</h1>
        <p className="body-lg mt-4">This local guest project is not available on this device anymore.</p>
        <div className="mt-6">
          <Link href="/dashboard" className="button-secondary">Back to dashboard</Link>
        </div>
      </section>
    );
  }

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

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
              Guest mode keeps this wireframe locally on your device. Sign in to unlock AI layout assignment, credits, API access, and MCP tools.
            </p>
          </div>

          <div className="status-pill self-start">
            <LayoutTemplate className="h-4 w-4 text-brand-300" />
            Connected to local sitemap nodes
          </div>
        </div>
      </section>

      <WireframeEditor
        projectId={projectId}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        initialBlocks={initialBlocks}
        userPlan="free"
        guestMode
      />
    </div>
  );
}
