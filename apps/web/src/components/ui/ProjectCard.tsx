"use client";

import { Clock3, Ellipsis, FilePenLine, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteGuestProject, updateGuestProject } from "@/lib/guest-storage";

interface Project {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
}

function formatLastEdited(updatedAt: string) {
  const date = new Date(updatedAt);
  return `Last edited ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function ProjectCard({
  project,
  mode = "account",
  onChanged,
}: {
  project: Project;
  mode?: "account" | "guest";
  onChanged?: () => void;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState(project.name);
  const [newDescription, setNewDescription] = useState(project.description ?? "");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openMenu(x: number, y: number) {
    setMenuPos({ x, y });
    setMenuOpen(true);
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError(null);

    if (mode === "guest") {
      updateGuestProject(project.id, { name: newName.trim() });
      setLoading(false);
      setRenameOpen(false);
      setMenuOpen(false);
      onChanged?.();
      return;
    }

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Failed to rename");
      return;
    }
    setRenameOpen(false);
    setMenuOpen(false);
    onChanged?.();
    router.refresh();
  }

  async function handleDescription(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "guest") {
      updateGuestProject(project.id, { description: newDescription.trim() || null });
      setLoading(false);
      setDescOpen(false);
      setMenuOpen(false);
      onChanged?.();
      return;
    }

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newDescription.trim() || null }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Failed to update description");
      return;
    }
    setDescOpen(false);
    setMenuOpen(false);
    onChanged?.();
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);

    if (mode === "guest") {
      deleteGuestProject(project.id);
      setLoading(false);
      setDeleteOpen(false);
      setMenuOpen(false);
      onChanged?.();
      return;
    }

    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Failed to delete");
      return;
    }
    setDeleteOpen(false);
    setMenuOpen(false);
    onChanged?.();
    router.refresh();
  }

  const modalBase =
    "glass-panel-strong w-full max-w-xl rounded-[32px] p-6 sm:p-8";

  return (
    <>
      <div className="relative">
        <Link
          href={`/projects/${project.id}/sitemap`}
          className="glass-panel group block rounded-[28px] p-6 hover:-translate-y-0.5 hover:border-white/20"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="section-label">Project</p>
              <h2 className="mt-3 truncate text-xl font-semibold text-white group-hover:text-brand-100">
                {project.name}
              </h2>
              <p className="body-sm mt-3 min-h-12 line-clamp-2">
                {project.description || "No description yet. Open the project to define the structure and layout flow."}
              </p>
              {mode === "guest" && (
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">Stored locally on this device</p>
              )}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                openMenu(rect.right - 170, rect.bottom + 8);
              }}
              className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-500 hover:text-white"
              aria-label="Project options"
            >
              <Ellipsis className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-brand-300" />
              {formatLastEdited(project.updated_at)}
            </div>
            <span className="text-white">Open</span>
          </div>
        </Link>

        {menuOpen && menuPos && (
          <div
            ref={menuRef}
            className="glass-panel fixed z-50 w-48 rounded-[24px] p-2"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                setNewName(project.name);
                setError(null);
                setRenameOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] hover:text-white"
            >
              <FilePenLine className="h-4 w-4" />
              Rename
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setNewDescription(project.description ?? "");
                setError(null);
                setDescOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] hover:text-white"
            >
              <FilePenLine className="h-4 w-4" />
              Edit description
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setError(null);
                setDeleteOpen(true);
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {renameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
          <div className={modalBase}>
            <h2 className="text-2xl font-semibold text-white">Rename project</h2>
            <form onSubmit={handleRename} className="mt-6 space-y-4">
              {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
              <input className="field" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus required />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setRenameOpen(false)} className="button-secondary">Cancel</button>
                <button type="submit" disabled={loading || !newName.trim()} className="button-primary disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {descOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
          <div className={modalBase}>
            <h2 className="text-2xl font-semibold text-white">Edit description</h2>
            <form onSubmit={handleDescription} className="mt-6 space-y-4">
              {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
              <textarea
                className="field resize-none"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={5}
                autoFocus
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setDescOpen(false)} className="button-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="button-primary disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
          <div className={modalBase}>
            <h2 className="text-2xl font-semibold text-red-100">Delete project</h2>
            <p className="body-lg mt-4">
              Delete <span className="font-semibold text-white">{project.name}</span> and all associated sitemap and wireframe data.
            </p>
            {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setDeleteOpen(false)} className="button-secondary">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
