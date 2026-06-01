import { describe, it, expect } from "vitest";
import { EvidenceLedger } from "../evidence";
import type { EvidenceDraft } from "@/lib/types";

const draft = (claim: string): EvidenceDraft => ({
  claim,
  sourceUrl: "https://example.com",
  provider: "web",
  snippet: claim,
});

describe("EvidenceLedger", () => {
  it("assigns sequential, zero-padded ids and a timestamp", () => {
    const l = new EvidenceLedger();
    const a = l.append(draft("a"), "2026-01-01T00:00:00.000Z");
    const b = l.append(draft("b"), "2026-01-01T00:00:00.000Z");
    expect(a.id).toBe("ev_001");
    expect(b.id).toBe("ev_002");
    expect(a.fetchedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(l.size).toBe(2);
  });

  it("supports has() / get() / ids()", () => {
    const l = new EvidenceLedger();
    l.append(draft("a"));
    expect(l.has("ev_001")).toBe(true);
    expect(l.has("ev_999")).toBe(false);
    expect(l.get("ev_001")?.claim).toBe("a");
    expect(l.ids()).toEqual(new Set(["ev_001"]));
  });

  it("is append-only: entries() returns a copy that cannot mutate the ledger", () => {
    const l = new EvidenceLedger();
    l.append(draft("a"));
    const copy = l.entries();
    copy.push({ ...draft("hacked"), id: "ev_x", fetchedAt: "x" });
    expect(l.size).toBe(1);
  });

  it("rebuilds from existing entries (approval-gate re-verification)", () => {
    const l = new EvidenceLedger();
    l.append(draft("a"));
    const rebuilt = EvidenceLedger.from(l.entries());
    expect(rebuilt.has("ev_001")).toBe(true);
    expect(rebuilt.size).toBe(1);
  });
});
