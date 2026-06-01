"use client";

import { useState } from "react";
import { PERSONAS } from "@/lib/config";
import type { RunInput } from "@/lib/types";
import type { DemoAccount } from "@/lib/sample/registry";

type Props = {
  onRun: (input: RunInput) => void;
  disabled?: boolean;
  /** "sample" → demo-account picker (keyless); "live" → free-text domain. */
  mode: "sample" | "live";
  demoAccounts: DemoAccount[];
  /** Default ICP definition the account is scored against. */
  icp: string;
};

const inputCls =
  "rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-accent";

export function ResearchForm({ onRun, disabled, mode, demoAccounts, icp }: Props) {
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);

  // Sample mode: pick a fictional demo account.
  const [demoDomain, setDemoDomain] = useState(demoAccounts[0]?.domain ?? "");
  const selected = demoAccounts.find((a) => a.domain === demoDomain);

  // Live mode: free-text + a pasteable ICP (prefilled with the default).
  const [domain, setDomain] = useState("");
  const [accountName, setAccountName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [icpDefinition, setIcpDefinition] = useState(icp);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "sample") {
      const acct = demoAccounts.find((a) => a.domain === demoDomain) ?? demoAccounts[0];
      if (!acct) return;
      onRun({ domain: acct.domain, accountName: acct.name, personaId });
    } else {
      const d = domain.trim();
      if (!d) return;
      onRun({
        domain: d,
        accountName: accountName.trim() || undefined,
        trigger: trigger.trim() || undefined,
        personaId,
        icpDefinition: icpDefinition.trim() || undefined,
      });
    }
  }

  const canSubmit = mode === "sample" ? Boolean(demoDomain) : Boolean(domain.trim());

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-black/20"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {mode === "sample" ? (
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Demo account <span className="text-muted-foreground">(fictional — sample mode)</span>
            </span>
            <select
              value={demoDomain}
              onChange={(e) => setDemoDomain(e.target.value)}
              className={inputCls}
            >
              {demoAccounts.map((a) => (
                <option key={a.domain} value={a.domain}>
                  {a.name} — {a.industry}
                </option>
              ))}
            </select>
            {selected && (
              <span className="text-xs leading-relaxed text-muted-foreground">{selected.blurb}</span>
            )}
          </label>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Target account domain <span className="text-bad">*</span>
              </span>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="acme.io"
                className={inputCls}
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
                placeholder="Acme"
                className={inputCls}
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
                className={inputCls}
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                ICP definition <span className="text-muted-foreground">(scored against — edit or paste your own)</span>
              </span>
              <textarea
                value={icpDefinition}
                onChange={(e) => setIcpDefinition(e.target.value)}
                rows={6}
                className={`${inputCls} resize-y font-mono text-xs`}
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Target persona</span>
          <select
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            className={inputCls}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {mode === "sample" && icp && (
        <details className="mt-4 rounded-lg border border-border bg-surface-muted p-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Scored against this sample ICP (read-only in demo mode)
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
            {icp}
          </pre>
        </details>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={disabled || !canSubmit}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Research &amp; score account
        </button>
      </div>
    </form>
  );
}
