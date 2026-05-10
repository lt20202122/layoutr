"use client";

import { useEffect } from "react";

export default function LaunchVisitorTracker() {
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const payload: Record<string, unknown> = {
      path: window.location.pathname,
      referrer: document.referrer,
      utmSource: search.get("utm_source") ?? "",
      utmMedium: search.get("utm_medium") ?? "",
      utmCampaign: search.get("utm_campaign") ?? "",
      utmContent: search.get("utm_content") ?? "",
      utmTerm: search.get("utm_term") ?? "",
    };

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  }, []);

  return null;
}
