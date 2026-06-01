import { describe, it, expect } from "vitest";
import { evidenceRoles } from "../roles";
import type { AccountResearch } from "@/lib/types";

const base: AccountResearch = {
  input: { domain: "x", personaId: "rev-ops" },
  contacts: [],
  ledger: [],
  completedAt: "t",
  fit: {
    score: 1,
    tier: "strong",
    rationale: "",
    icpSource: "sample",
    signals: [
      { text: "a", polarity: "supports", evidenceIds: ["ev_001", "ev_002"] },
      { text: "b", polarity: "against", evidenceIds: [] },
    ],
  },
  sequence: {
    name: "s",
    touches: [{ channel: "email", day: 0, body: "hi", claims: [{ text: "c", evidenceIds: ["ev_002", "ev_003"] }] }],
  },
};

describe("evidenceRoles", () => {
  it("collects the fit ids and the used-in-outreach ids", () => {
    const { fit, used } = evidenceRoles(base);
    expect(fit).toEqual(new Set(["ev_001", "ev_002"]));
    expect(used).toEqual(new Set(["ev_002", "ev_003"]));
  });

  it("returns empty sets when there is no fit or sequence", () => {
    const { fit, used } = evidenceRoles({ ...base, fit: undefined, sequence: undefined });
    expect(fit.size).toBe(0);
    expect(used.size).toBe(0);
  });
});
