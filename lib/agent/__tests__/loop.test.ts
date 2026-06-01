import { describe, it, expect } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { runAgent } from "../loop";
import type { CreateMessage, RunAgentOptions } from "../loop";
import type { ProgressEvent } from "../events";
import { makeScriptedModel } from "../scripted";
import { TOOLS } from "../registry";
import { MAX_STEPS } from "@/lib/constants";
import type { AccountResearch } from "@/lib/types";

const NOW = () => "2026-05-31T00:00:00.000Z";
const SYSTEM = "You are a research agent.";

type Resp = { content: unknown[]; stop_reason: string };

/** Build a CreateMessage that returns a scripted list of responses (last repeats). */
function scriptModel(responses: Resp[]): { fn: CreateMessage; calls: () => number } {
  let i = 0;
  let calls = 0;
  const fn: CreateMessage = async () => {
    calls++;
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    return { id: "m", type: "message", role: "assistant", model: "test", ...r } as unknown as Anthropic.Message;
  };
  return { fn, calls: () => calls };
}

async function collect(
  gen: AsyncGenerator<ProgressEvent, AccountResearch>
): Promise<{ events: ProgressEvent[]; result: AccountResearch }> {
  const events: ProgressEvent[] = [];
  let next = await gen.next();
  while (!next.done) {
    events.push(next.value);
    next = await gen.next();
  }
  return { events, result: next.value };
}

const opts = (createMessage: CreateMessage): RunAgentOptions => ({
  input: { domain: "acme-cloud.io", personaId: "rev-ops" },
  createMessage,
  system: SYSTEM,
  now: NOW,
});

describe("runAgent — hand-rolled tool-use loop", () => {
  it("dispatches a requested tool, ledgers its evidence, and finishes", async () => {
    const { fn } = scriptModel([
      {
        content: [{ type: "tool_use", id: "t1", name: "enrich_domain", input: { domain: "acme-cloud.io" } }],
        stop_reason: "tool_use",
      },
      { content: [{ type: "text", text: "Done.", citations: null }], stop_reason: "end_turn" },
    ]);

    const { events, result } = await collect(runAgent(opts(fn)));

    expect(events.some((e) => e.type === "tool_call" && e.name === "enrich_domain")).toBe(true);
    expect(events.some((e) => e.type === "evidence_added")).toBe(true);
    expect(events.some((e) => e.type === "final_text")).toBe(true);
    expect(result.firmographics?.name).toBe("Acme Cloud");
    expect(result.ledger.length).toBeGreaterThan(0);
    expect(result.completedAt).toBe("2026-05-31T00:00:00.000Z");
  });

  it("respects the step budget when the model never stops calling tools", async () => {
    const { fn, calls } = scriptModel([
      {
        content: [{ type: "tool_use", id: "t", name: "web_search", input: { query: "news" } }],
        stop_reason: "tool_use",
      },
    ]);

    const { events, result } = await collect(runAgent(opts(fn)));

    expect(calls()).toBe(MAX_STEPS);
    expect(events.some((e) => e.type === "budget_exhausted")).toBe(true);
    expect(result).toBeDefined();
  });

  it("surfaces a tool_error for an unknown tool without crashing", async () => {
    const { fn } = scriptModel([
      {
        content: [{ type: "tool_use", id: "t1", name: "does_not_exist", input: {} }],
        stop_reason: "tool_use",
      },
      { content: [{ type: "text", text: "Done.", citations: null }], stop_reason: "end_turn" },
    ]);

    const { events } = await collect(runAgent(opts(fn)));
    expect(events.some((e) => e.type === "tool_error" && e.name === "does_not_exist")).toBe(true);
  });

  it("runs end-to-end with the scripted keyless model and real sample tools", async () => {
    const input = { domain: "acme-cloud.io", personaId: "rev-ops" };
    const { events, result } = await collect(
      runAgent({ input, createMessage: makeScriptedModel(input), system: SYSTEM, tools: TOOLS, now: NOW })
    );

    // enrich(2) + web_search(0) + fetch_page(4) + find_contacts(4) + crm(1) = 11.
    expect(result.ledger.length).toBe(11);
    expect(result.firmographics?.name).toBe("Acme Cloud");
    expect(result.contacts.length).toBe(4);
    // RevOps persona ⇒ the RevOps contact ranks first.
    expect(result.contacts[0].title.toLowerCase()).toContain("revenue operations");
    expect(events.some((e) => e.type === "final_text")).toBe(true);

    // Every ledger entry is well-formed and citable.
    for (const e of result.ledger) {
      expect(e.id).toMatch(/^ev_\d{3}$/);
      expect(e.sourceUrl.length).toBeGreaterThan(0);
      expect(e.claim.length).toBeGreaterThan(0);
    }
  });
});
