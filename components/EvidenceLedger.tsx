"use client";

import type { EvidenceEntry } from "@/lib/types";
import type { EvidenceRoles } from "@/lib/evals/roles";

const PROVIDER_COLOR: Record<string, string> = {
  enrichment: "var(--accent)",
  web: "var(--muted-foreground)",
  fetch: "var(--ok)",
  crm: "var(--warn)",
  sample: "var(--muted-foreground)",
};

type Props = {
  ledger: EvidenceEntry[];
  /** Which ids drove ICP fit / were used in outreach — surfaced as badges. */
  roles?: EvidenceRoles;
  highlightedEvidenceId?: string | null;
  onHighlightEvidence?: (id: string | null) => void;
};

export function EvidenceLedger({ ledger, roles, highlightedEvidenceId, onHighlightEvidence }: Props) {
  if (ledger.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Evidence ledger
        </h2>
        <span className="text-xs text-muted-foreground">{ledger.length} cited facts</span>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {ledger.map((e) => {
          const isFit = roles?.fit.has(e.id);
          const isUsed = roles?.used.has(e.id);
          const hot = highlightedEvidenceId === e.id;
          return (
            <li
              key={e.id}
              id={e.id}
              onMouseEnter={() => onHighlightEvidence?.(e.id)}
              onMouseLeave={() => onHighlightEvidence?.(null)}
              className={`-mx-2 flex gap-3 rounded-md px-2 py-2.5 text-sm transition-colors ${
                hot ? "bg-accent/10 ring-1 ring-accent/40" : ""
              }`}
            >
              <span
                className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]"
                style={{ background: "var(--surface-muted)", color: PROVIDER_COLOR[e.provider] }}
                title={e.provider}
              >
                {e.id}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground">{e.claim}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className="shrink-0 text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: PROVIDER_COLOR[e.provider] }}
                  >
                    {e.provider}
                  </span>
                  {isFit && (
                    <span
                      className="rounded px-1 text-[10px] font-medium text-warn"
                      style={{ border: "1px solid var(--warn)" }}
                      title="Drove the ICP fit score"
                    >
                      ★ fit
                    </span>
                  )}
                  {isUsed && (
                    <span
                      className="rounded px-1 text-[10px] font-medium text-ok"
                      style={{ border: "1px solid var(--ok)" }}
                      title="Cited in the outbound sequence"
                    >
                      ✉ in outreach
                    </span>
                  )}
                  <a
                    href={e.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-accent hover:underline"
                  >
                    {e.sourceUrl}
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
