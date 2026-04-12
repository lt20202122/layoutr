import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CreateProjectButton from "@/components/ui/CreateProjectButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

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
            <Link
              key={project.id}
              href={`/projects/${project.id}/sitemap`}
              className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="font-semibold truncate group-hover:text-brand-400 transition-colors">
                    {project.name}
                  </h2>
                  {project.description && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{project.description}</p>
                  )}
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-0.5 ml-2">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Updated {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
