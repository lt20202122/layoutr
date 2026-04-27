"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "waitlist_joined";

export default function WaitlistButton() {
  const [state, setState] = useState<"idle" | "loading" | "joined">("idle");

  // Restore persisted state on mount
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setState("joined");
    }
  }, []);

  async function handleClick() {
    if (state !== "idle") return;
    setState("loading");

    try {
      const res = await fetch("/api/waitlist", { method: "POST" });
      if (res.ok) {
        setState("joined");
        localStorage.setItem(STORAGE_KEY, "true");
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  if (state === "joined") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-400 font-medium">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        You&rsquo;re on the list &mdash; we&rsquo;ll email you
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
    >
      {state === "loading" ? (
        <>
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Joining&hellip;
        </>
      ) : (
        "Get notified when plans launch →"
      )}
    </button>
  );
}
