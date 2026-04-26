"use client";

import { useEffect, useState } from "react";

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
    <span className="text-xs text-gray-500 font-mono">
      ⚡ {credits} credits
    </span>
  );
}
