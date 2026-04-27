import { createClient } from "@/lib/supabase/server";
import CreateProjectButton from "@/components/ui/CreateProjectButton";
import ProjectCard from "@/components/ui/ProjectCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const projectsQuery = supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (user) projectsQuery.eq("user_id", user.id);

  const { data: projects } = await projectsQuery;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">
            {projects?.length ?? 0} project{projects?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateProjectButton />
      </div>

      {!projects?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 border border-dashed border-gray-700 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="5" rx="1.5" fill="#6172f3" />
              <rect x="11" y="2" width="7" height="5" rx="1.5" fill="#6172f3" opacity="0.5" />
              <rect x="2" y="9" width="16" height="3" rx="1.5" fill="#6172f3" opacity="0.3" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">No projects yet</p>
            <p className="text-gray-400 text-sm">Create a project to start building your sitemap</p>
          </div>
          <CreateProjectButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
