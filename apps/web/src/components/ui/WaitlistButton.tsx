"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useState, useEffect } from "react";

const STORAGE_KEY = "waitlist_joined";

export default function WaitlistButton() {
  const [state, setState] = useState<"idle" | "loading" | "joined">("idle");

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") setState("joined");
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
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100">
        <Check className="h-4 w-4" />
        You are on the list
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
    >
      {state === "loading" ? (
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Joining...
        </span>
      ) : (
        "Join waitlist"
      )}
    </button>
  );
}
