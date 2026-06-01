import { describe, it, expect } from "vitest";
import { isGrounded, sanitizeClaims, sanitizeSequence, scoreGroundedness } from "../groundedness";
import type { Sequence } from "@/lib/types";

const valid = new Set(["ev_001", "ev_002"]);

const seq: Sequence = {
  name: "s",
  touches: [
    { channel: "email", day: 0, body: "a", claims: [{ text: "real", evidenceIds: ["ev_001"] }] },
    { channel: "email", day: 1, body: "b", claims: [{ text: "fabricated", evidenceIds: ["ev_999"] }] },
    { channel: "linkedin", day: 2, body: "c", claims: [{ text: "uncited", evidenceIds: [] }] },
  ],
};

describe("groundedness", () => {
  it("flags fabricated and uncited claims", () => {
    const r = scoreGroundedness(seq, valid);
    expect(r.total).toBe(3);
    expect(r.citedCount).toBe(1);
    expect(r.score).toBeCloseTo(1 / 3);
    expect(r.uncited).toContain("fabricated");
    expect(r.uncited).toContain("uncited");
  });

  it("sanitize drops fabricated ids but keeps real ones", () => {
    const clean = sanitizeSequence(seq, valid);
    expect(clean.touches[1].claims[0].evidenceIds).toEqual([]);
    expect(clean.touches[0].claims[0].evidenceIds).toEqual(["ev_001"]);
  });

  it("sanitizeClaims drops a mixed claim's fabricated id", () => {
    const [c] = sanitizeClaims([{ text: "x", evidenceIds: ["ev_001", "ev_999"] }], valid);
    expect(c.evidenceIds).toEqual(["ev_001"]);
  });

  it("an empty sequence scores 1.0", () => {
    expect(scoreGroundedness({ name: "x", touches: [] }, valid).score).toBe(1);
  });

  it("isGrounded requires ≥1 id and all ids valid", () => {
    expect(isGrounded({ text: "x", evidenceIds: ["ev_001", "ev_999"] }, valid)).toBe(false);
    expect(isGrounded({ text: "x", evidenceIds: ["ev_001"] }, valid)).toBe(true);
    expect(isGrounded({ text: "x", evidenceIds: [] }, valid)).toBe(false);
  });
});
