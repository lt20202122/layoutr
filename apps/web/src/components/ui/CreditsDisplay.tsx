"use client";

import { useState, useEffect } from "react";

export default function CreditsDisplay({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);

  useEffect(() => {
    // Fetch credits immediately
    fetch("/api/users/me/credits")
      .then((res) => res.json())
      .then((data) => {
        if (data.credits !== undefined) setCredits(data.credits);
      })
      .catch(() => {});

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetch("/api/users/me/credits")
        .then((res) => res.json())
        .then((data) => {
          if (data.credits !== undefined) setCredits(data.credits);
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-900/20 border border-brand-800/40 rounded-full text-xs font-semibold text-brand-300">
      ⚡ {credits} credits
    </div>
  );
}
