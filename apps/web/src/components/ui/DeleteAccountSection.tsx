"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function DeleteAccountSection() {
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

    window.location.href = "/";
  }

  return (
    <>
      <div className="rounded-[28px] border border-red-300/16 bg-red-500/8 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-100">
              <AlertTriangle className="h-4 w-4" />
              <h2 className="text-lg font-semibold">Danger zone</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-red-100/70">
              Permanently remove your account, projects, and all associated data.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Delete account
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="glass-panel-strong w-full max-w-xl rounded-[32px] p-6 sm:p-8">
            <h3 className="text-2xl font-semibold text-red-100">Delete account</h3>
            <p className="body-lg mt-4">
              This is permanent. Type <span className="font-mono font-semibold text-white">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="field mt-5 font-mono"
              autoFocus
            />
            {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setConfirmText("");
                  setError(null);
                }}
                className="button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || confirmText !== "DELETE"}
                className="inline-flex items-center justify-center rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
