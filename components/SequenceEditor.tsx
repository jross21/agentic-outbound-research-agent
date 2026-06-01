"use client";

import type { EvidenceEntry, Sequence, Touch } from "@/lib/types";

type Props = {
  sequence: Sequence;
  ledger: EvidenceEntry[];
  onChange: (sequence: Sequence) => void;
  disabled?: boolean;
  highlightedEvidenceId?: string | null;
  onHighlightEvidence?: (id: string | null) => void;
};

export function SequenceEditor({
  sequence,
  ledger,
  onChange,
  disabled,
  highlightedEvidenceId,
  onHighlightEvidence,
}: Props) {
  const byId = new Map(ledger.map((e) => [e.id, e]));

  function updateTouch(i: number, patch: Partial<Touch>) {
    const touches = sequence.touches.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onChange({ ...sequence, touches });
  }

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
        className={`rounded px-1.5 py-0.5 font-mono text-[11px] hover:underline ${
          highlightedEvidenceId === id ? "bg-accent text-background" : "bg-surface text-ok"
        }`}
      >
        {id}
      </a>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Outbound sequence
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Editable. Each personalization point links to the research it cites — hover a citation to
        trace it in the evidence ledger. The approval gate re-checks grounding before enrollment.
      </p>

      <div className="flex flex-col gap-4">
        {sequence.touches.map((t, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface-muted p-4">
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="rounded bg-accent-soft px-2 py-0.5 font-medium text-accent">
                {t.channel}
              </span>
              <span className="text-muted-foreground">Day {t.day}</span>
            </div>

            {t.channel === "email" && (
              <input
                type="text"
                value={t.subject ?? ""}
                disabled={disabled}
                onChange={(e) => updateTouch(i, { subject: e.target.value })}
                placeholder="Subject"
                className="mb-2 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm font-medium outline-none focus:border-accent disabled:opacity-60"
              />
            )}

            <textarea
              value={t.body}
              disabled={disabled}
              onChange={(e) => updateTouch(i, { body: e.target.value })}
              rows={Math.max(4, t.body.split("\n").length)}
              className="w-full resize-y rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm leading-relaxed outline-none focus:border-accent disabled:opacity-60"
            />

            {/* Personalization → research: each cited point with its evidence */}
            <div className="mt-3 border-t border-border pt-2">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Personalization &amp; sources
              </p>
              {t.claims.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No personalization claims on this touch.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {t.claims.map((c, ci) => (
                    <li key={ci} className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">{c.text}</span>
                      {c.evidenceIds.length > 0 ? (
                        c.evidenceIds.map((id) => <Chip key={id} id={id} />)
                      ) : (
                        <span className="text-bad">⚠ no citation — will be blocked</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
