"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useState } from "react";

export default function WaitlistButton() {
  const [state, setState] = useState<"idle" | "loading" | "joined">("idle");

  async function handleClick() {
    if (state !== "idle") return;
    setState("loading");

    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          signupPath: window.location.pathname,
          landingPath: window.location.pathname,
          referrer: document.referrer,
          utmSource: params.get("utm_source") ?? "",
          utmMedium: params.get("utm_medium") ?? "",
          utmCampaign: params.get("utm_campaign") ?? "",
          utmContent: params.get("utm_content") ?? "",
          utmTerm: params.get("utm_term") ?? "",
        }),
      });
      if (res.ok) {
        setState("joined");
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
