"use client";

import type { GroundednessReport } from "@/lib/types";

export function GroundednessBadge({ report }: { report: GroundednessReport }) {
  const pct = Math.round(report.score * 100);
  const perfect = report.score >= 1;
  const color = perfect ? "var(--ok)" : pct >= 80 ? "var(--warn)" : "var(--bad)";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
      style={{ borderColor: color, color }}
      title={
        perfect
          ? "Every claim in the sequence is backed by a cited source."
          : `${report.uncited.length} claim(s) are not backed by a citation and are blocked from enrollment.`
      }
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {pct}% grounded
      <span className="text-muted-foreground">
        ({report.citedCount}/{report.total} claims cited)
      </span>
    </div>
  );
}
