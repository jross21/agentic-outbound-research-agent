"use client";

import { useCallback, useRef, useState } from "react";
import type { ProgressEvent } from "@/lib/agent/events";
import type { AccountResearch, EvidenceEntry, RunInput } from "@/lib/types";

export type RunStatus = "idle" | "researching" | "synthesizing" | "done" | "error";

export function useAgentRun() {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [trace, setTrace] = useState<ProgressEvent[]>([]);
  const [ledger, setLedger] = useState<EvidenceEntry[]>([]);
  const [research, setResearch] = useState<AccountResearch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setTrace([]);
    setLedger([]);
    setResearch(null);
    setError(null);
  }, []);

  const start = useCallback(async (input: RunInput) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStatus("researching");
    setTrace([]);
    setLedger([]);
    setResearch(null);
    setError(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? ""; // keep the partial trailing line
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as ProgressEvent;
          setTrace((t) => [...t, ev]);
          if (ev.type === "evidence_added") {
            setLedger((l) => [...l, ev.entry]);
          } else if (ev.type === "synthesis_start") {
            setStatus("synthesizing");
          } else if (ev.type === "done") {
            setResearch(ev.research);
            setLedger(ev.research.ledger);
            setStatus("done");
          } else if (ev.type === "error") {
            setError(ev.message);
            setStatus("error");
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message);
        setStatus("error");
      }
    }
  }, []);

  return { status, trace, ledger, research, error, start, reset, setResearch };
}
