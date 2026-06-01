"use client";

import type { ProgressEvent } from "@/lib/agent/events";
import type { RunStatus } from "@/lib/useAgentRun";

const TOOL_LABEL: Record<string, string> = {
  enrich_domain: "Enriching firmographics",
  web_search: "Searching the web",
  fetch_page: "Fetching page",
  find_contacts: "Finding decision-makers",
  crm_read: "Checking CRM history",
};

function Dot({ color }: { color: string }) {
  return <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />;
}

function Row({ event }: { event: ProgressEvent }) {
  switch (event.type) {
    case "plan":
      return (
        <Line color="var(--accent)">
          <span className="font-medium text-foreground">{event.text}</span>
        </Line>
      );
    case "assistant_text":
      return (
        <Line color="var(--muted-foreground)">
          <span className="italic text-muted-foreground">{event.text}</span>
        </Line>
      );
    case "tool_call":
      return (
        <Line color="var(--accent)">
          <span className="text-foreground">
            {TOOL_LABEL[event.name] ?? event.name}
          </span>
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            {summarizeInput(event.input)}
          </span>
        </Line>
      );
    case "tool_result":
      return (
        <Line color="var(--ok)">
          <span className="text-muted-foreground">{firstLine(event.summary)}</span>
        </Line>
      );
    case "evidence_added":
      return (
        <Line color="var(--ok)">
          <span className="font-mono text-xs text-ok">{event.entry.id}</span>
          <span className="ml-2 text-muted-foreground">{event.entry.claim}</span>
        </Line>
      );
    case "tool_error":
      return (
        <Line color="var(--bad)">
          <span className="text-bad">{event.name}: {event.error}</span>
        </Line>
      );
    case "budget_exhausted":
      return (
        <Line color="var(--warn)">
          <span className="text-warn">Step budget reached ({event.steps}).</span>
        </Line>
      );
    case "synthesis_start":
      return (
        <Line color="var(--accent)">
          <span className="font-medium text-foreground">Synthesizing POV + sequence…</span>
        </Line>
      );
    case "final_text":
      return (
        <Line color="var(--muted-foreground)">
          <span className="text-muted-foreground">{event.text}</span>
        </Line>
      );
    case "error":
      return (
        <Line color="var(--bad)">
          <span className="text-bad">{event.message}</span>
        </Line>
      );
    default:
      return null;
  }
}

function Line({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm animate-fade-in-up">
      <Dot color={color} />
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
}

function summarizeInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const o = input as Record<string, unknown>;
  if (typeof o.url === "string") return o.url;
  if (typeof o.query === "string") return `"${o.query}"`;
  if (typeof o.domain === "string") return o.domain;
  if (typeof o.persona === "string") return o.persona;
  return "";
}

function firstLine(s: string): string {
  const line = s.split("\n")[0];
  return line.length > 120 ? line.slice(0, 120) + "…" : line;
}

export function AgentTrace({ trace, status }: { trace: ProgressEvent[]; status: RunStatus }) {
  const working = status === "researching" || status === "synthesizing";
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Agent trace
        </h2>
        {working && (
          <span className="flex items-center gap-1.5 text-xs text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
            {status === "synthesizing" ? "synthesizing" : "researching"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {trace.map((e, i) => (
          <Row key={i} event={e} />
        ))}
        {trace.length === 0 && working && (
          <p className="text-sm text-muted-foreground">Starting…</p>
        )}
      </div>
    </div>
  );
}
