"use client";

import type { EvidenceEntry } from "@/lib/types";

const PROVIDER_COLOR: Record<string, string> = {
  enrichment: "var(--accent)",
  web: "var(--muted-foreground)",
  fetch: "var(--ok)",
  crm: "var(--warn)",
  sample: "var(--muted-foreground)",
};

export function EvidenceLedger({ ledger }: { ledger: EvidenceEntry[] }) {
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
        {ledger.map((e) => (
          <li key={e.id} className="flex gap-3 py-2.5 text-sm">
            <span
              className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]"
              style={{ background: "var(--surface-muted)", color: PROVIDER_COLOR[e.provider] }}
              title={e.provider}
            >
              {e.id}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-foreground">{e.claim}</p>
              <a
                href={e.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-block truncate text-xs text-accent hover:underline"
              >
                {e.sourceUrl}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
