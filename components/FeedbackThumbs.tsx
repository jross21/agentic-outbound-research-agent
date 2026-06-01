"use client";

import { useState } from "react";
import type { AccountResearch } from "@/lib/types";

export function FeedbackThumbs({ research }: { research: AccountResearch }) {
  const [sent, setSent] = useState<"up" | "down" | null>(null);

  async function send(rating: "up" | "down") {
    setSent(rating);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: research.firmographics?.name ?? research.input.domain,
          persona: research.input.personaId,
          rating,
          groundedness: research.groundedness?.score,
        }),
      });
    } catch {
      // best-effort; UI already acknowledged
    }
  }

  if (sent) {
    return <p className="text-xs text-muted-foreground">Thanks for the feedback.</p>;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xs text-muted-foreground">Was this useful?</span>
      <button
        onClick={() => send("up")}
        className="rounded-md border border-border px-2 py-1 text-xs hover:border-ok hover:text-ok"
        aria-label="thumbs up"
      >
        👍
      </button>
      <button
        onClick={() => send("down")}
        className="rounded-md border border-border px-2 py-1 text-xs hover:border-bad hover:text-bad"
        aria-label="thumbs down"
      >
        👎
      </button>
    </div>
  );
}
