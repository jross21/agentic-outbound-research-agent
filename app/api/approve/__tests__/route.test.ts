import { describe, it, expect, afterAll } from "vitest";
import { unlinkSync } from "fs";
import { POST } from "../route";

// FORCE_SAMPLE=1 (vitest env) ⇒ getSequencer() resolves to the dry-run adapter,
// which writes to data/out. We clean up any files the happy-path test creates.
const written: string[] = [];
afterAll(() => written.forEach((f) => { try { unlinkSync(f); } catch { /* already gone */ } }));

function req(body: unknown): Request {
  return new Request("http://localhost/api/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ledger = [{ id: "ev_001", claim: "x", sourceUrl: "https://x", provider: "fetch", snippet: "x", fetchedAt: "t" }];
const base = {
  account: { domain: "acme-cloud.io", name: "Acme Cloud" },
  persona: "rev-ops",
  contacts: [{ name: "Sam", title: "Director RevOps", company: "Acme Cloud", email: "sam@acme-cloud.io" }],
  ledger,
};
const grounded = { ...base, sequence: { name: "s", touches: [{ channel: "email", day: 0, body: "hi", claims: [{ text: "x", evidenceIds: ["ev_001"] }] }] } };
const ungrounded = { ...base, sequence: { name: "s", touches: [{ channel: "email", day: 0, body: "hi", claims: [{ text: "y", evidenceIds: ["ev_999"] }] }] } };

describe("POST /api/approve — the approval gate", () => {
  it("403 without explicit approval", async () => {
    const r = await POST(req({ approved: false, payload: grounded }));
    expect(r.status).toBe(403);
  });

  it("400 on a malformed payload", async () => {
    const r = await POST(req({ approved: true, payload: {} }));
    expect(r.status).toBe(400);
  });

  it("422 when the sequence contains an uncited claim", async () => {
    const r = await POST(req({ approved: true, payload: ungrounded }));
    expect(r.status).toBe(422);
    const j = await r.json();
    expect(j.groundedness.uncited.length).toBeGreaterThan(0);
  });

  it("200 and dry-run enrolls when grounded + approved", async () => {
    const r = await POST(req({ approved: true, payload: grounded }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.result.sequencer).toBe("dryrun");
    expect(j.groundedness.score).toBe(1);
    if (j.result.writtenTo) written.push(j.result.writtenTo);
  });
});
