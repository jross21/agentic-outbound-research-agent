// Build the static, cacheable system prefix. Concatenates the static parts
// (agent/synthesis instructions + the OUTBOUND_PLAYBOOK) into one text block
// tagged with cache_control: ephemeral. This prefix is identical across every
// loop turn and every synthesis call in a run, so prompt caching pays off here
// in a way it never did for deal-triage's tiny prefix.
//
// IMPORTANT: only STATIC content belongs here. All per-account data goes in the
// user turn, or the cache key changes every call and the cache never hits.

import type Anthropic from "@anthropic-ai/sdk";

export function buildCachedSystem(...parts: string[]): Anthropic.TextBlockParam[] {
  const text = parts.filter(Boolean).join("\n\n---\n\n");
  return [
    {
      type: "text",
      text,
      cache_control: { type: "ephemeral" },
    },
  ];
}
