"use client";

import { useEffect, useState } from "react";
import { ResearchForm } from "@/components/ResearchForm";
import { AgentTrace } from "@/components/AgentTrace";
import { EvidenceLedger } from "@/components/EvidenceLedger";
import { SequenceEditor } from "@/components/SequenceEditor";
import { GroundednessBadge } from "@/components/GroundednessBadge";
import { ApprovalBar } from "@/components/ApprovalBar";
import { FeedbackThumbs } from "@/components/FeedbackThumbs";
import { useAgentRun } from "@/lib/useAgentRun";
import { SELLER, getPersona } from "@/lib/config";
import type { Sequence } from "@/lib/types";

export default function Home() {
  const { status, trace, ledger, research, error, start, reset } = useAgentRun();
  const [editable, setEditable] = useState<Sequence | null>(null);

  // Sync the editable sequence whenever a fresh research result lands.
  useEffect(() => {
    if (research?.sequence) setEditable(research.sequence);
  }, [research]);

  const persona = research ? getPersona(research.input.personaId) : undefined;
  const f = research?.firmographics;
  const contact = research?.selectedContacts?.[0];
  const showForm = status === "idle" || status === "error";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Outbound Research Agent
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Research an account → grounded, personalized outbound
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          A transparent tool-use loop researches a target account, builds a{" "}
          <span className="text-foreground">cited evidence ledger</span>, and drafts a
          multi-touch sequence where every claim links to a source. Selling{" "}
          <span className="text-foreground">{SELLER.product}</span> — {SELLER.oneLiner}.
        </p>
      </header>

      {showForm && (
        <ResearchForm
          onRun={start}
          onLoadSample={() => start({ domain: "acme-cloud.io", personaId: "rev-ops" })}
        />
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-bad/40 bg-surface p-4 text-sm text-bad">
          {error}
        </div>
      )}

      {!showForm && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {research
              ? `Researched ${f?.name ?? research.input.domain} for ${persona?.label}`
              : "Running…"}
          </p>
          <button
            onClick={reset}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-accent hover:text-foreground"
          >
            New run
          </button>
        </div>
      )}

      {trace.length > 0 && (
        <div className="mb-6">
          <AgentTrace trace={trace} status={status} />
        </div>
      )}

      {research && status === "done" && (
        <div className="flex flex-col gap-6">
          {/* Firmographics + POV */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{f?.name ?? research.input.domain}</h2>
              {research.groundedness && <GroundednessBadge report={research.groundedness} />}
            </div>
            {f && (
              <p className="mb-4 text-sm text-muted-foreground">
                {[f.industry, f.employeeCount && `${f.employeeCount} employees`, f.hqLocation, f.fundingStage]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {research.pov && (
              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">Why you</p>
                  <p className="mt-1 text-foreground">{research.pov.whyYou}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">Why now</p>
                  <p className="mt-1 text-foreground">{research.pov.whyNow}</p>
                </div>
              </div>
            )}
          </div>

          {/* Selected contact */}
          {contact && (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Selected contact
              </h2>
              <p className="text-foreground">
                <span className="font-medium">{contact.name}</span> — {contact.title}
                {contact.email && <span className="text-muted-foreground"> · {contact.email}</span>}
              </p>
              <p className="mt-1 text-muted-foreground">{contact.rationale}</p>
            </div>
          )}

          <EvidenceLedger ledger={ledger} />

          {editable && (
            <SequenceEditor sequence={editable} ledger={ledger} onChange={setEditable} />
          )}

          {research && editable && (
            <ApprovalBar research={research} sequence={editable} />
          )}

          <div className="flex justify-end">
            <FeedbackThumbs research={research} />
          </div>
        </div>
      )}
    </main>
  );
}
