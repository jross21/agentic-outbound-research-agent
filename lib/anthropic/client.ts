// Lazy Anthropic client singleton (mirrors deal-triage's _client()) and the
// real createMessage the loop uses in live mode. Server-only by convention.

import Anthropic from "@anthropic-ai/sdk";
import type { CreateMessage } from "@/lib/agent/loop";

let _client: Anthropic | null = null;

export function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

/** The live model for the loop: a thin pass-through to messages.create. */
export const createMessage: CreateMessage = (params) => client().messages.create(params);
