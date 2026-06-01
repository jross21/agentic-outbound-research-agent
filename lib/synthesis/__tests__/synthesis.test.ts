import { describe, it, expect } from "vitest";
import { runAgent } from "@/lib/agent/loop";
import { makeScriptedModel } from "@/lib/agent/scripted";
import { TOOLS } from "@/lib/agent/registry";
import { synthesize } from "../synthesize";
import type { AccountResearch } from "@/lib/types";

const NOW = () => "2026-05-31T00:00:00.000Z";

async function research(domain: string, personaId = "rev-ops"): Promise<AccountResearch> {
  const input = { domain, personaId };
  const gen = runAgent({
    input,
    createMessage: makeScriptedModel(input),
    system: "research agent",
    tools: TOOLS,
    now: NOW,
  });
  let n = await gen.next();
  while (!n.done) n = await gen.next();
  return n.value;
}

describe("synthesize — scripted, keyless", () => {
  it("produces a fully grounded POV + sequence citing only real ledger ids", async () => {
    const r = await research("acme-cloud.io", "rev-ops");
    const out = await synthesize(r);

    expect(out.selectedContacts).toHaveLength(1);
    expect(out.selectedContacts![0].title.toLowerCase()).toContain("revenue operations");
    expect(out.pov?.whyYou.length).toBeGreaterThan(0);
    expect(out.pov?.whyNow.length).toBeGreaterThan(0);
    expect(out.sequence?.touches.length).toBeGreaterThanOrEqual(3);

    // Groundedness is 100% by construction; nothing uncited slips through.
    expect(out.groundedness?.score).toBe(1);
    expect(out.groundedness?.uncited).toEqual([]);

    const validIds = new Set(r.ledger.map((e) => e.id));
    for (const t of out.sequence!.touches) {
      for (const c of t.claims) {
        expect(c.evidenceIds.length).toBeGreaterThan(0);
        for (const id of c.evidenceIds) expect(validIds.has(id)).toBe(true);
      }
    }
  });

  it("works across the curated demo accounts (e.g. Nimbus Health)", async () => {
    const r = await research("nimbus-health.com", "vp-revenue");
    const out = await synthesize(r);
    expect(out.groundedness?.score).toBe(1);
    expect(out.sequence?.touches.length).toBeGreaterThanOrEqual(3);
  });

  it("uses the persona's value proposition framing", async () => {
    const r = await research("ledgerflow.io", "vp-product");
    const out = await synthesize(r);
    // vp-product → "unify-signals" value prop headline mentions GTM + Product.
    expect(out.pov?.whyYou).toMatch(/GTM \+ Product|signal layer|usage/i);
  });
});
