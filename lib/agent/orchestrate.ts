// End-to-end run: research loop → synthesis → done. Yields the full ProgressEvent
// stream so the route can pipe it straight to the client as NDJSON. Picks the
// real model + cached system in live mode, or the scripted model in keyless mode.
// Server-only (imports the Anthropic client + reads prompt files).

import type { AccountResearch, RunInput } from "@/lib/types";
import type { ProgressEvent } from "./events";
import { runAgent } from "./loop";
import { EvidenceLedger } from "./evidence";
import { makeScriptedModel } from "./scripted";
import { synthesize } from "@/lib/synthesis/synthesize";
import { resolveModelMode } from "@/lib/config";
import { createMessage } from "@/lib/anthropic/client";
import { buildCachedSystem } from "@/lib/anthropic/cache";
import { loadPrompt, loadPlaybook } from "@/lib/anthropic/prompts";

export async function* runResearch(
  input: RunInput,
  signal?: AbortSignal
): AsyncGenerator<ProgressEvent, AccountResearch> {
  const live = resolveModelMode() === "live";

  const cm = live ? createMessage : makeScriptedModel(input);
  const system = live
    ? buildCachedSystem(loadPrompt("research_agent"), loadPlaybook())
    : "Scripted keyless research agent.";

  const ledger = new EvidenceLedger();

  // Re-yield every loop event and capture the grounded research it returns.
  const research = yield* runAgent({ input, createMessage: cm, system, ledger, signal });

  yield { type: "synthesis_start" };
  const synthesized = await synthesize(research);

  yield { type: "done", research: synthesized };
  return synthesized;
}
