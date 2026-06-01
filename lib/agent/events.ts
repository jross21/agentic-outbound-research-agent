// Structured progress events emitted by the agent loop. These are what the
// streaming route serializes (one JSON object per NDJSON line) and what the UI
// renders as the live agent trace. A discriminated union keeps the client
// reducer exhaustive.

import type { AccountResearch, EvidenceEntry } from "@/lib/types";

export type ProgressEvent =
  | { type: "plan"; text: string }
  | { type: "assistant_text"; step: number; text: string }
  | { type: "tool_call"; step: number; name: string; input: unknown }
  | { type: "tool_result"; step: number; name: string; summary: string }
  | { type: "evidence_added"; entry: EvidenceEntry }
  | { type: "tool_error"; step: number; name: string; error: string }
  | { type: "budget_exhausted"; steps: number }
  | { type: "synthesis_start" }
  | { type: "synthesis_progress"; label: string }
  | { type: "final_text"; text: string }
  | { type: "done"; research: AccountResearch }
  | { type: "error"; message: string };
