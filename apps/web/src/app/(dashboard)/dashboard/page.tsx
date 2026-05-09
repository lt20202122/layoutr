import { createClient } from "@/lib/supabase/server";
import CreateProjectButton from "@/components/ui/CreateProjectButton";
import ProjectCard from "@/components/ui/ProjectCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const projectsQuery = supabase.from("projects").select("*").order("updated_at", { ascending: false });

  if (user) projectsQuery.eq("user_id", user.id);

  const { data } = await projectsQuery;
  const projects = data ?? [];
  const projectCount = projects.length;

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-label">Projects</p>
            <h1 className="headline-lg mt-4 text-white">Plan the product layer before the code layer.</h1>
            <p className="body-lg mt-4">
              Keep site maps, wireframes, and API-ready structure in one workspace so agents and humans are looking at the same system.
            </p>
          </div>
          <CreateProjectButton />
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
            <h2 className="mt-6 text-2xl font-semibold text-white">Create your first workspace</h2>
            <p className="body-lg mt-3">
              Start with a sitemap, scaffold sections, and move straight into wireframing without rebuilding the same context somewhere else.
            </p>
            <div className="mt-8 flex justify-center">
              <CreateProjectButton />
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="section-label">{projectCount} active project{projectCount === 1 ? "" : "s"}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {(projects ?? []).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
