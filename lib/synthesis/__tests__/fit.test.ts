import { describe, it, expect } from "vitest";
import { runAgent } from "@/lib/agent/loop";
import { makeScriptedModel } from "@/lib/agent/scripted";
import { TOOLS } from "@/lib/agent/registry";
import { scriptedFit, sanitizeFitSignals } from "../fit";
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

describe("scriptedFit", () => {
  it("rates a sweet-spot account (Acme) a strong fit, every signal cited to the ledger", async () => {
    const r = await research("acme-cloud.io");
    const fit = scriptedFit(r);

    expect(fit.tier).toBe("strong");
    expect(fit.score).toBeGreaterThanOrEqual(0.85);
    expect(fit.signals).toHaveLength(4); // industry, size, geo, technographics
    expect(fit.icpSource).toBe("sample");

    const validIds = new Set(r.ledger.map((e) => e.id));
    for (const s of fit.signals) {
      for (const id of s.evidenceIds) expect(validIds.has(id)).toBe(true);
    }
    // At least one supporting signal is backed by a real ledger id.
    expect(fit.signals.some((s) => s.polarity === "supports" && s.evidenceIds.length > 0)).toBe(true);
  });

  it("rates Nimbus (no warehouse/PLG signal) a moderate fit with an 'against' signal", async () => {
    const r = await research("nimbus-health.com", "vp-revenue");
    const fit = scriptedFit(r);
    expect(fit.tier).toBe("moderate");
    expect(fit.signals.some((s) => s.polarity === "against")).toBe(true);
  });
});

describe("sanitizeFitSignals", () => {
  it("drops fabricated evidence ids and keeps real ones", () => {
    const out = sanitizeFitSignals(
      [{ text: "x", polarity: "supports", evidenceIds: ["ev_001", "ev_999"] }],
      new Set(["ev_001"])
    );
    expect(out[0].evidenceIds).toEqual(["ev_001"]);
  });
});
