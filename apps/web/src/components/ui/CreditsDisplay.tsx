"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export default function CreditsDisplay({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);

  useEffect(() => {
    const refreshCredits = () => {
      fetch("/api/users/me/credits")
        .then((res) => res.json())
        .then((data) => {
          if (data.credits !== undefined) setCredits(data.credits);
        })
        .catch(() => {});
    };

    refreshCredits();
    const interval = setInterval(refreshCredits, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/20 bg-brand-400/10 px-4 py-2 text-sm font-medium text-brand-100">
      <Zap className="h-3.5 w-3.5 text-brand-300" />
      {credits} credits
    </div>
  );
}
