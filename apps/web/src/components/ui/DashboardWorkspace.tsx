"use client";

import { useEffect, useState } from "react";
import CreateProjectButton from "./CreateProjectButton";
import ProjectCard from "./ProjectCard";
import { listGuestProjects, type GuestProject } from "@/lib/guest-storage";

interface AccountProject {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
}

interface Props {
  authenticated: boolean;
  initialProjects: AccountProject[];
}

export default function DashboardWorkspace({ authenticated, initialProjects }: Props) {
  const [guestProjects, setGuestProjects] = useState<GuestProject[]>([]);

  const refreshGuestProjects = () => setGuestProjects(listGuestProjects());

  useEffect(() => {
    if (!authenticated) refreshGuestProjects();
  }, [authenticated]);

  const projects = authenticated ? initialProjects : guestProjects;
  const projectCount = projects.length;

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-label">{authenticated ? "Projects" : "Guest workspace"}</p>
            <h1 className="headline-lg mt-4 text-white">Plan the product layer before the code layer.</h1>
            <p className="body-lg mt-4">
              {authenticated
                ? "Keep site maps, wireframes, and API-ready structure in one workspace so agents and humans are looking at the same system."
                : "Continue without an account and keep planning locally on this device. AI, credits, API keys, and MCP access unlock after sign-in."}
            </p>
          </div>
          <CreateProjectButton mode={authenticated ? "account" : "guest"} onCreated={refreshGuestProjects} />
        </div>
      </section>

      {!projectCount ? (
        <section className="glass-panel surface-grid rounded-[34px] p-8 sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-brand-300/20 bg-brand-400/10">
              <svg className="h-7 w-7 text-brand-200" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h7v5H4zM13 6h7v5h-7zM4 13h16v3H4zM4 18h10v2H4z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">
              {authenticated ? "Create your first workspace" : "Start your first guest workspace"}
            </h2>
            <p className="body-lg mt-3">
              {authenticated
                ? "Start with a sitemap, scaffold sections, and move straight into wireframing without rebuilding the same context somewhere else."
                : "Build a sitemap and wireframe flow locally first, then create an account when you want AI, credits, API access, and MCP tools."}
            </p>
            <div className="mt-8 flex justify-center">
              <CreateProjectButton mode={authenticated ? "account" : "guest"} onCreated={refreshGuestProjects} />
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="section-label">{projectCount} active project{projectCount === 1 ? "" : "s"}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                mode={authenticated ? "account" : "guest"}
                onChanged={refreshGuestProjects}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
