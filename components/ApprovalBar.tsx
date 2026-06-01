"use client";

import { useState } from "react";
import type { AccountResearch, Sequence } from "@/lib/types";
import type { EnrollmentPayload, EnrollmentResult } from "@/lib/sequencer/base";
import { scoreGroundedness } from "@/lib/evals/groundedness";

type Props = { research: AccountResearch; sequence: Sequence; sampleMode?: boolean };

export function ApprovalBar({ research, sequence, sampleMode }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [result, setResult] = useState<EnrollmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validIds = new Set(research.ledger.map((e) => e.id));
  const grounded = scoreGroundedness(sequence, validIds);
  const blocked = grounded.score < 1;

  const company = research.firmographics?.name ?? research.input.domain;
  const payload: EnrollmentPayload = {
    account: { domain: research.input.domain, name: research.firmographics?.name },
    persona: research.input.personaId,
    contacts: (research.selectedContacts ?? []).map((c) => ({
      name: c.name,
      title: c.title,
      company,
      email: c.email,
      linkedinUrl: c.linkedinUrl,
    })),
    sequence,
    ledger: research.ledger,
  };

  async function approve() {
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, payload }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Enrollment failed: ${res.status}`);
      setResult(j.result as EnrollmentResult);
      setStatus("done");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  if (status === "done" && result) {
    return (
      <div className="rounded-xl border border-ok/40 bg-surface p-5 text-sm">
        <p className="font-semibold text-ok">✓ Enrolled via {result.sequencer}</p>
        <p className="mt-1 text-muted-foreground">
          {result.enrolledContactIds.length} contact(s) · ref {result.ref}
        </p>
        {result.writtenTo && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Dry-run payload written to {result.writtenTo}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Approve &amp; activate
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Nothing is enrolled until you approve. The server re-checks that every claim is
        cited before pushing to the sequencer.
      </p>

      {sampleMode && (
        <p className="mt-2 rounded-md border border-warn/30 bg-surface-muted p-2 text-xs text-warn">
          Sample mode: these are fictional contacts and this is a dry-run — nothing is
          contacted. The payload is written to <code className="font-mono">data/out/</code> so you
          can inspect exactly what a live push would send.
        </p>
      )}

      {blocked && (
        <p className="mt-3 rounded-md border border-bad/40 bg-surface-muted p-2 text-xs text-bad">
          {grounded.uncited.length} uncited claim(s) detected — fix or remove them before enrolling.
        </p>
      )}

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        I&apos;ve reviewed the sequence and approve enrollment.
      </label>

      {error && <p className="mt-2 text-sm text-bad">{error}</p>}

      <button
        onClick={approve}
        disabled={!confirmed || blocked || status === "submitting"}
        className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "submitting"
          ? "Enrolling…"
          : sampleMode
            ? "Approve & enroll (dry-run)"
            : "Approve & enroll"}
      </button>
    </div>
  );
}
