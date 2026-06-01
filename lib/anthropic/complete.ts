// Single-shot completion helpers for synthesis. completeJson extracts the
// outermost {...} from the response (deal-triage's tolerant brace extraction)
// so a stray preamble doesn't break parsing.

import type Anthropic from "@anthropic-ai/sdk";
import { createMessage } from "./client";

type CompleteArgs = {
  system: string | Anthropic.TextBlockParam[];
  user: string;
  model: string;
  maxTokens: number;
};

export async function complete(args: CompleteArgs): Promise<string> {
  const res = await createMessage({
    model: args.model,
    max_tokens: args.maxTokens,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

export function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

export async function completeJson<T>(args: CompleteArgs): Promise<T> {
  return extractJson<T>(await complete(args));
}
