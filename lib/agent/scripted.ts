// Deterministic scripted "model" for fully keyless runs (and tests). It does NOT
// reason — it replays a fixed, sensible research plan against the sample tools so
// the entire UX (streaming trace, evidence ledger, synthesis, approval, dry-run
// enroll) works with ZERO API keys. With a real ANTHROPIC_API_KEY the genuine
// hand-rolled loop runs instead (see lib/anthropic/client.ts, wired in M3).
//
// It returns objects shaped like Anthropic.Message so the loop code is identical
// in both modes — the loop cannot tell a scripted model from the real one.

import type Anthropic from "@anthropic-ai/sdk";
import type { RunInput } from "@/lib/types";
import type { CreateMessage } from "./loop";
import { loadFixture } from "@/lib/sample/load";

type Block =
  | { type: "text"; text: string; citations: null }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

export function makeScriptedModel(input: RunInput): CreateMessage {
  const fx = loadFixture(input.domain);
  let counter = 0;
  const tu = (name: string, args: Record<string, unknown>): Block => ({
    type: "tool_use",
    id: `tu_${++counter}`,
    name,
    input: args,
  });

  // A fixed, realistic research plan. Parallel fetch_page calls in one turn
  // exercise the loop's multi-tool-per-turn handling.
  const turns: Block[][] = [
    [tu("enrich_domain", { domain: input.domain })],
    [
      { type: "text", text: `Scanning for recent signals about ${fx.firmographics.name}.`, citations: null },
      tu("web_search", { query: "funding hiring product launch leadership data warehouse" }),
    ],
    fx.documents.slice(0, 4).map((d) => tu("fetch_page", { url: d.url })),
    [tu("find_contacts", { persona: input.personaId })],
    [tu("crm_read", { domain: input.domain })],
  ];

  let step = 0;

  return async (_params) => {
    const isFinal = step >= turns.length;
    const content: Block[] = isFinal
      ? [
          {
            type: "text",
            text: `Research complete for ${fx.firmographics.name}: firmographics confirmed, recent signals gathered, decision-makers identified, and CRM history checked.`,
            citations: null,
          },
        ]
      : turns[step];
    step++;

    // Shaped like an Anthropic.Message; the loop only reads `content` and
    // `stop_reason`. Cast through unknown to avoid hand-constructing Usage.
    return {
      id: `msg_scripted_${step}`,
      type: "message",
      role: "assistant",
      model: "scripted-keyless",
      content,
      stop_reason: isFinal ? "end_turn" : "tool_use",
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    } as unknown as Anthropic.Message;
  };
}
