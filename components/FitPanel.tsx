"use client";

import type { EvidenceEntry, FitReport, FitSignal } from "@/lib/types";

const TIER: Record<string, { label: string; color: string }> = {
  strong: { label: "Strong fit", color: "var(--ok)" },
  moderate: { label: "Moderate fit", color: "var(--warn)" },
  weak: { label: "Weak fit", color: "var(--muted-foreground)" },
  "no-fit": { label: "Not a fit", color: "var(--bad)" },
};

type Props = {
  fit: FitReport;
  ledger: EvidenceEntry[];
  highlightedEvidenceId?: string | null;
  onHighlightEvidence?: (id: string | null) => void;
};

export function FitPanel({ fit, ledger, highlightedEvidenceId, onHighlightEvidence }: Props) {
  const byId = new Map(ledger.map((e) => [e.id, e]));
  const t = TIER[fit.tier] ?? TIER.weak;
  const supports = fit.signals.filter((s) => s.polarity === "supports");
  const against = fit.signals.filter((s) => s.polarity === "against");

  function Chip({ id }: { id: string }) {
    const e = byId.get(id);
    return (
      <a
        href={e?.sourceUrl ?? "#"}
        target="_blank"
        rel="noreferrer"
        title={e?.claim ?? id}
        onMouseEnter={() => onHighlightEvidence?.(id)}
        onMouseLeave={() => onHighlightEvidence?.(null)}
        className={`ml-1 rounded px-1 font-mono text-[10px] hover:underline ${
          highlightedEvidenceId === id ? "bg-accent text-background" : "text-ok"
        }`}
      >
        {id}
      </a>
    );
  }

  function SignalList({ signals, mark, color }: { signals: FitSignal[]; mark: string; color: string }) {
    if (signals.length === 0) return <p className="text-xs text-muted-foreground">—</p>;
    return (
      <ul className="flex flex-col gap-1.5">
        {signals.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span style={{ color }}>{mark}</span>
            <span className="text-muted-foreground">
              {s.text}
              {s.evidenceIds.map((id) => (
                <Chip key={id} id={id} />
              ))}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">ICP fit</h2>
        <span className="text-[11px] text-muted-foreground">
          {fit.icpSource === "custom" ? "scored vs. your ICP" : "scored vs. sample ICP"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold tabular-nums" style={{ color: t.color }}>
          {Math.round(fit.score * 100)}%
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: t.color }}>
            {t.label}
          </p>
          <p className="text-sm text-muted-foreground">{fit.rationale}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ok">Supports fit</p>
          <SignalList signals={supports} mark="✓" color="var(--ok)" />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-bad">Weakens fit</p>
          <SignalList signals={against} mark="✗" color="var(--bad)" />
        </div>
      </div>
    </div>
  );
}
