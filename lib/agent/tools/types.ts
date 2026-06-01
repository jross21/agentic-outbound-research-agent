// The single interface every research tool implements: a live path and a sample
// path behind one shape, plus a JSON-Schema the model sees. The registry picks
// live vs sample per call based on provider connectivity (lib/config.isConnected).
//
// Tools are pure input→output: they do NOT touch the ledger. They return the
// evidence they gathered and the loop appends it (single writer = the loop).

import type { EvidenceDraft } from "@/lib/types";
import type { Provider } from "@/lib/config";

/** Minimal JSON-Schema shape for a tool's input (cast to the SDK type at the
 *  messages.create boundary so we don't couple to an exact SDK type path). */
export type JSONSchema = {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  [k: string]: unknown;
};

/** Everything a tool needs about the current run. No ledger — the loop owns it. */
export type ToolContext = {
  domain: string;
  accountName?: string;
  personaId: string;
  signal?: AbortSignal;
};

export type ToolOutput = {
  /** Text returned to the model as the tool_result content. */
  summary: string;
  /** Facts gathered this call; the loop appends them to the evidence ledger. */
  evidence: EvidenceDraft[];
  /** Optional structured payload the loop folds into the AccountResearch result
   *  (recognized keys: `firmographics`, `contacts`). Not shown to the model. */
  data?: {
    firmographics?: import("@/lib/types").Firmographics;
    contacts?: import("@/lib/types").Contact[];
  };
};

export type ToolImpl = (
  input: Record<string, unknown>,
  ctx: ToolContext
) => Promise<ToolOutput>;

export type Tool = {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  /** Provider key that gates the live impl. Omitted ⇒ always sample. */
  provider?: Provider;
  liveImpl: ToolImpl;
  sampleImpl: ToolImpl;
};

/** Thrown by live impls that aren't configured/implemented; surfaced as a
 *  tool_error in the loop rather than crashing the run. */
export class ToolError extends Error {}
