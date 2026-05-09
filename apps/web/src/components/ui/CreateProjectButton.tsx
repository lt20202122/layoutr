"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGuestProject } from "@/lib/guest-storage";

type Mode = "account" | "guest";

export default function CreateProjectButton({
  mode = "account",
  onCreated,
}: {
  mode?: Mode;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "guest") {
      const project = createGuestProject({ name, description });
      setOpen(false);
      setName("");
      setDescription("");
      setLoading(false);
      onCreated?.();
      router.push(`/projects/${project.id}/sitemap`);
      return;
    }

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    setOpen(false);
    setName("");
    setDescription("");
    onCreated?.();
    router.refresh();
    router.push(`/projects/${json.data.id}/sitemap`);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="button-primary gap-2">
        <Plus className="h-4 w-4" />
        New project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
          <div className="glass-panel-strong w-full max-w-xl rounded-[32px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">Create workspace</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {mode === "guest" ? "Start a local guest project" : "Start a new Layoutr project"}
                </h2>
                {mode === "guest" && (
                  <p className="mt-3 text-sm text-slate-400">
                    This project will stay on this device in local storage until you create an account.
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-400 hover:text-white"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-8 space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="section-label">Project name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="field"
                  placeholder="Mobile onboarding revamp"
                />
              </div>

              <div className="space-y-2">
                <label className="section-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="field resize-none"
                  placeholder="A short note about the product, audience, or workstream."
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpen(false)} className="button-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="button-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
