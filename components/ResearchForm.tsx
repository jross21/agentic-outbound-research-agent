"use client";

import { useState } from "react";
import { PERSONAS } from "@/lib/config";
import type { RunInput } from "@/lib/types";

type Props = {
  onRun: (input: RunInput) => void;
  disabled?: boolean;
  /** Prefill the form with a known sample account for the keyless demo. */
  onLoadSample?: () => void;
};

const SAMPLE_HINT = "acme-cloud.io";

export function ResearchForm({ onRun, disabled, onLoadSample }: Props) {
  const [domain, setDomain] = useState("");
  const [accountName, setAccountName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const d = domain.trim();
    if (!d) return;
    onRun({
      domain: d,
      accountName: accountName.trim() || undefined,
      trigger: trigger.trim() || undefined,
      personaId,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-black/20"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Target account domain <span className="text-bad">*</span>
          </span>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={SAMPLE_HINT}
            className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-accent"
            autoComplete="off"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Account name <span className="text-muted-foreground">(optional)</span>
          </span>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Acme Cloud"
            className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-accent"
            autoComplete="off"
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">
            Trigger signal <span className="text-muted-foreground">(optional)</span>
          </span>
          <input
            type="text"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="e.g. just announced a Series B, or hiring a Head of RevOps"
            className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-accent"
            autoComplete="off"
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Target persona</span>
          <select
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={disabled || !domain.trim()}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Research account
        </button>
        {onLoadSample && (
          <button
            type="button"
            onClick={onLoadSample}
            disabled={disabled}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-40"
          >
            Load sample account
          </button>
        )}
      </div>
    </form>
  );
}
