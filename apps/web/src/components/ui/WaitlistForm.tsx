"use client";

import { FormEvent, useMemo, useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

const teamSizes = ["solo", "2-5", "6-20", "21-50", "50+"] as const;

export default function WaitlistForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const trackingContext = useMemo(() => {
    if (typeof window === "undefined") return null;

    const params = new URLSearchParams(window.location.search);
    return {
      signupPath: window.location.pathname,
      landingPath: window.location.pathname,
      referrer: document.referrer,
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      utmContent: params.get("utm_content") ?? "",
      utmTerm: params.get("utm_term") ?? "",
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "loading") return;

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? "").trim(),
      name: String(form.get("name") ?? "").trim(),
      company: String(form.get("company") ?? "").trim(),
      role: String(form.get("role") ?? "").trim(),
      useCase: String(form.get("use_case") ?? "").trim(),
      teamSize: String(form.get("team_size") ?? "").trim(),
      ...trackingContext,
    };

    setState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error ?? "Could not join waitlist");
      }

      event.currentTarget.reset();
      setState("success");
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not join waitlist");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-300">
          <span>Email</span>
          <input
            required
            type="email"
            name="email"
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
            placeholder="you@company.com"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          <span>Name</span>
          <input
            type="text"
            name="name"
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
            placeholder="Your name"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          <span>Company</span>
          <input
            type="text"
            name="company"
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
            placeholder="Company or project"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          <span>Role</span>
          <input
            type="text"
            name="role"
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
            placeholder="Founder, PM, engineer"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-slate-300">
        <span>Primary use case</span>
        <textarea
          name="use_case"
          rows={3}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
          placeholder="What will you use Layoutr for?"
        />
      </label>

      <label className="grid gap-2 text-sm text-slate-300">
        <span>Team size</span>
        <select
          name="team_size"
          defaultValue=""
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
        >
          <option value="" disabled>
            Select team size
          </option>
          {teamSizes.map((teamSize) => (
            <option key={teamSize} value={teamSize}>
              {teamSize}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={state === "loading"}
          className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "loading" ? "Joining..." : "Join waitlist"}
        </button>

        {state === "success" ? (
          <p className="text-sm text-emerald-200">Tracked and added to the waitlist.</p>
        ) : state === "error" ? (
          <p className="text-sm text-rose-200">{errorMessage}</p>
        ) : (
          <p className="text-sm text-slate-400">Source, landing page, referrer, country, device, browser, and campaign tags are captured automatically.</p>
        )}
      </div>
    </form>
  );
}
