// ─────────────────────────────────────────────────────────────────────────────
// The hand-rolled tool-use loop — the headline artifact.
//
// This is a transparent implementation of the Anthropic tool-use cycle on the
// raw SDK message shapes: send (system + tools + messages) → if the model wants
// a tool, run it and feed the result back as a user turn → repeat until the
// model stops asking for tools or the step budget is hit. No Agent SDK, no
// framework. The model is injected as `createMessage` so the same loop runs
// against the real API (live) or a deterministic scripted stand-in (keyless).
//
// Synthesis (POV + sequence) is layered on by the caller in M3; this loop's job
// is to produce a grounded AccountResearch: firmographics, contacts, and a fully
// cited evidence ledger.
// ─────────────────────────────────────────────────────────────────────────────

import type Anthropic from "@anthropic-ai/sdk";
import type {
  AccountResearch,
  Contact,
  Firmographics,
  RunInput,
} from "@/lib/types";
import { EvidenceLedger } from "./evidence";
import type { ProgressEvent } from "./events";
import { TOOLS, TOOL_BY_NAME, toAnthropicTools, dispatch } from "./registry";
import type { Tool, ToolContext } from "./tools/types";
import { AGENT_MODEL, MAX_LOOP_TOKENS, MAX_STEPS } from "@/lib/constants";
import { getPersona } from "@/lib/config";

/** The single dependency on a model: a function shaped like messages.create.
 *  Live mode passes the real SDK; keyless mode passes the scripted stand-in. */
export type CreateMessage = (
  params: Anthropic.MessageCreateParamsNonStreaming
) => Promise<Anthropic.Message>;

export type RunAgentOptions = {
  input: RunInput;
  createMessage: CreateMessage;
  /** Static cached system prefix (agent prompt + playbook). */
  system: string | Anthropic.TextBlockParam[];
  tools?: Tool[];
  ledger?: EvidenceLedger;
  signal?: AbortSignal;
  /** Injectable clock for deterministic timestamps in tests. */
  now?: () => string;
};

function buildKickoff(input: RunInput): string {
  const persona = getPersona(input.personaId);
  const lines = [
    `Target account: ${input.accountName ?? input.domain} (${input.domain})`,
    `Target persona: ${persona?.label ?? input.personaId}`,
  ];
  if (input.trigger) lines.push(`Trigger signal the user flagged: ${input.trigger}`);
  lines.push(
    "",
    "Research this account using the tools available. Ground the firmographics, " +
      "hunt for recent timing signals (funding, hiring, product launches, leadership " +
      "changes), identify the best decision-makers for the persona, and check CRM " +
      "history. When you have enough cited evidence, stop and summarize."
  );
  return lines.join("\n");
}

export async function* runAgent(
  opts: RunAgentOptions
): AsyncGenerator<ProgressEvent, AccountResearch> {
  const { input, createMessage, system, signal } = opts;
  const tools = opts.tools ?? TOOLS;
  const ledger = opts.ledger ?? new EvidenceLedger();
  const now = opts.now ?? (() => new Date().toISOString());
  const byName = tools === TOOLS ? TOOL_BY_NAME : new Map(tools.map((t) => [t.name, t]));
  const anthropicTools = toAnthropicTools(tools);

  const ctx: ToolContext = {
    domain: input.domain,
    accountName: input.accountName,
    personaId: input.personaId,
    signal,
  };

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildKickoff(input) },
  ];

  let firmographics: Firmographics | undefined;
  let contacts: Contact[] = [];
  let finalText = "";

  yield {
    type: "plan",
    text: `Researching ${input.accountName ?? input.domain} for ${
      getPersona(input.personaId)?.label ?? input.personaId
    }.`,
  };

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await createMessage({
      model: AGENT_MODEL,
      max_tokens: MAX_LOOP_TOKENS,
      system,
      tools: anthropicTools,
      messages,
    });

    messages.push({ role: "assistant", content: res.content });

    for (const block of res.content) {
      if (block.type === "text" && block.text.trim()) {
        yield { type: "assistant_text", step, text: block.text.trim() };
      }
    }

    if (res.stop_reason !== "tool_use") {
      finalText = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (finalText) yield { type: "final_text", text: finalText };
      break;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      yield { type: "tool_call", step, name: block.name, input: block.input };

      const tool = byName.get(block.name);
      if (!tool) {
        const error = `Unknown tool: ${block.name}`;
        yield { type: "tool_error", step, name: block.name, error };
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          is_error: true,
          content: error,
        });
        continue;
      }

      try {
        const out = await dispatch(
          tool,
          (block.input ?? {}) as Record<string, unknown>,
          ctx
        );
        if (out.data?.firmographics) firmographics = out.data.firmographics;
        if (out.data?.contacts) contacts = out.data.contacts;
        for (const draft of out.evidence) {
          const entry = ledger.append(draft, now());
          yield { type: "evidence_added", entry };
        }
        yield { type: "tool_result", step, name: block.name, summary: out.summary };
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: out.summary,
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        yield { type: "tool_error", step, name: block.name, error };
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          is_error: true,
          content: error,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });

    if (step === MAX_STEPS - 1) {
      yield { type: "budget_exhausted", steps: MAX_STEPS };
    }
  }

  const research: AccountResearch = {
    input,
    firmographics,
    contacts,
    ledger: ledger.entries(),
    completedAt: now(),
  };

  return research;
}
