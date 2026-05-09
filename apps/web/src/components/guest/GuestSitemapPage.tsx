"use client";

import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { useEffect, useState } from "react";
import SitemapEditor from "@/components/sitemap/SitemapEditor";
import type { SitemapNode } from "@/components/sitemap/sitemapUtils";
import { getGuestProject, listGuestSitemapNodes, type GuestProject } from "@/lib/guest-storage";

export default function GuestSitemapPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<GuestProject | null>(null);
  const [nodes, setNodes] = useState<SitemapNode[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProject(getGuestProject(projectId));
    setNodes(listGuestSitemapNodes(projectId));
    setReady(true);
  }, [projectId]);

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

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Guest sitemap editor</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">{project.name}</h1>
            <p className="body-lg mt-4">
              {project.description || "Define the product structure, section system, and page relationships before moving into wireframes."}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Saved locally on this device. Create an account to unlock AI generation, credits, API access, and MCP tools.
            </p>
          </div>

          <Link href={`/projects/${projectId}/wireframe`} className="button-secondary gap-2 self-start">
            <Layers3 className="h-4 w-4" />
            Open wireframe editor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SitemapEditor projectId={projectId} initialNodes={nodes} userPlan="free" guestMode />
    </div>
  );
}
