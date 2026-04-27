"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
}

export default function ProjectCard({ project }: { project: Project }) {
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openMenu(x: number, y: number) {
    setMenuPos({ x, y });
    setMenuOpen(true);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  }

  function handleThreeDots(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openMenu(rect.right - 160, rect.bottom + 4);
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError(null);
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
    router.refresh();
  }

  async function handleDescription(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Failed to delete");
      return;
    }
    setDeleteOpen(false);
    setMenuOpen(false);
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
    setMenuPos(null);
  }

  return (
    <>
      <div
        className="relative"
        onContextMenu={handleContextMenu}
      >
        <Link
          href={`/projects/${project.id}/sitemap`}
          className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors group block"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 mr-2">
              <h2 className="font-semibold truncate group-hover:text-brand-400 transition-colors">
                {project.name}
              </h2>
              {project.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{project.description}</p>
              )}
            </div>
            <button
              onClick={handleThreeDots}
              className="shrink-0 mt-0.5 p-1 rounded-md hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors -mr-1"
              aria-label="Project options"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1.5" fill="currentColor" />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                <circle cx="8" cy="13" r="1.5" fill="currentColor" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Updated {new Date(project.updated_at).toLocaleDateString()}
          </p>
        </Link>

        {menuOpen && menuPos && (
          <div
            ref={menuRef}
            className="fixed z-50 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); closeMenu(); setNewName(project.name); setError(null); setRenameOpen(true); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors text-left"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                <path d="M10.5 1.5l2 2L5 11H3V9l7.5-7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); closeMenu(); setNewDescription(project.description ?? ""); setError(null); setDescOpen(true); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors text-left"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                <path d="M4 10l6-6M3 11l.5-2L9.5 3l1.5 1.5-6 6-2 .5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Change description
            </button>
            <div className="border-t border-gray-800 my-1" />
            <button
              onClick={(e) => { e.stopPropagation(); closeMenu(); setError(null); setDeleteOpen(true); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors text-left"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                <path d="M2 3.5h10M5 3.5V2a1 1 0 011-1h2a1 1 0 011 1v1.5M11 3.5v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {renameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Rename project</h2>
              <button onClick={() => setRenameOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRename} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-900/40 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setRenameOpen(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={loading || !newName.trim()} className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors">{loading ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {descOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Change description</h2>
              <button onClick={() => setDescOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleDescription} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-900/40 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  autoFocus
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setDescOpen(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors">{loading ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-red-400">Delete project</h2>
              <button onClick={() => setDeleteOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Are you sure you want to delete <strong className="text-white">{project.name}</strong>? This action cannot be undone. All sitemaps and wireframes will be permanently removed.
              </p>
              {error && (
                <div className="p-3 bg-red-900/40 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setDeleteOpen(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors">{loading ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
