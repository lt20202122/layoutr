"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccountSection() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmText !== "DELETE") return;

    setDeleting(true);
    setError(null);

    const res = await fetch("/api/users/me", { method: "DELETE" });
    const json = await res.json();

    setDeleting(false);

    if (!res.ok) {
      setError(json.error || "Failed to delete account");
      return;
    }

    // Redirect to home
    window.location.href = "/";
  }

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        <p className="text-gray-400 text-sm mt-1">
          Irreversible actions for your account.
        </p>
      </div>

      <div className="p-4 bg-red-900/10 border border-red-800/30 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-red-300">Delete account</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-400">Delete Account</h3>
            <p className="text-sm text-gray-400">
              This action is permanent and cannot be undone. All your projects, data, and settings will be deleted.
            </p>
            <p className="text-sm text-gray-400">
              Type <strong className="text-red-400 font-mono">DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDelete}
                disabled={deleting || confirmText !== "DELETE"}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                onClick={() => { setShowModal(false); setConfirmText(""); setError(null); }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
