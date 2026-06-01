import { describe, it, expect } from "vitest";
import { scoreSpecificity } from "../specificity";
import type { Sequence } from "@/lib/types";

const cited = (text: string): { text: string; evidenceIds: string[] } => ({ text, evidenceIds: ["ev_001"] });

describe("scoreSpecificity", () => {
  it("scores a cited, filler-free sequence at 1.0", () => {
    const seq: Sequence = {
      name: "s",
      touches: [
        { channel: "email", day: 0, subject: "congrats on the raise", body: "Saw you closed a $55M Series B.", claims: [cited("raise")] },
      ],
    };
    const r = scoreSpecificity(seq);
    expect(r.score).toBe(1);
    expect(r.flaggedPhrases).toEqual([]);
  });

  it("flags generic filler phrases and lowers the score", () => {
    const seq: Sequence = {
      name: "s",
      touches: [
        { channel: "email", day: 0, body: "I hope this finds you well. Just following up to touch base.", claims: [cited("x")] },
      ],
    };
    const r = scoreSpecificity(seq);
    expect(r.flaggedPhrases).toContain("i hope this finds you well");
    expect(r.flaggedPhrases).toContain("just following up");
    expect(r.score).toBeLessThan(1);
  });

  it("penalizes uncited touches", () => {
    const seq: Sequence = {
      name: "s",
      touches: [{ channel: "email", day: 0, body: "plain text", claims: [] }],
    };
    const r = scoreSpecificity(seq);
    expect(r.uncitedTouches).toBe(1);
    expect(r.score).toBeLessThan(1);
  });
});
