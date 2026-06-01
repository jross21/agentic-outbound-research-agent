"use client";

import type { EvidenceEntry, Sequence, Touch } from "@/lib/types";

type Props = {
  sequence: Sequence;
  ledger: EvidenceEntry[];
  onChange: (sequence: Sequence) => void;
  disabled?: boolean;
};

export function SequenceEditor({ sequence, ledger, onChange, disabled }: Props) {
  const byId = new Map(ledger.map((e) => [e.id, e]));

  function updateTouch(i: number, patch: Partial<Touch>) {
    const touches = sequence.touches.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onChange({ ...sequence, touches });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Outbound sequence
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Editable. Each touch lists the cited evidence it leans on — edit freely; the
        approval gate re-checks grounding before anything is enrolled.
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

            {t.claims.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.claims.flatMap((c) =>
                  c.evidenceIds.map((id) => {
                    const e = byId.get(id);
                    return (
                      <a
                        key={`${id}-${c.text.slice(0, 8)}`}
                        href={e?.sourceUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        title={e?.claim ?? id}
                        className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ok hover:underline"
                      >
                        {id}
                      </a>
                    );
                  })
                )}
                {t.claims.every((c) => c.evidenceIds.length === 0) && (
                  <span className="text-[11px] text-bad">⚠ no citation — will be blocked</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
