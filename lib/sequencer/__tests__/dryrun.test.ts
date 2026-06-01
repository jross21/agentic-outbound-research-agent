import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { DryRunSequencer } from "../dryrun";
import type { EnrollmentPayload } from "../base";

const tmp = mkdtempSync(join(tmpdir(), "seq-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const payload: EnrollmentPayload = {
  account: { domain: "acme-cloud.io", name: "Acme Cloud" },
  persona: "rev-ops",
  contacts: [{ name: "Sam Whitfield", title: "Director of RevOps", company: "Acme Cloud", email: "sam@acme-cloud.io" }],
  sequence: {
    name: "seq",
    touches: [{ channel: "email", day: 0, body: "hi", claims: [{ text: "x", evidenceIds: ["ev_001"] }] }],
  },
  ledger: [{ id: "ev_001", claim: "x", sourceUrl: "https://x", provider: "fetch", snippet: "x", fetchedAt: "t" }],
};

describe("DryRunSequencer", () => {
  it("returns synthetic contact ids", async () => {
    const { ids } = await new DryRunSequencer(tmp).upsertContacts(payload.contacts);
    expect(ids).toHaveLength(1);
  });

  it("writes the full enrollment payload to disk and returns where", async () => {
    const s = new DryRunSequencer(tmp);
    const { ids } = await s.upsertContacts(payload.contacts);
    const res = await s.enrollInSequence(payload, ids);

    expect(res.sequencer).toBe("dryrun");
    expect(res.writtenTo).toMatch(/enroll-acme-cloud-io-.*\.json$/);
    expect(res.enrolledContactIds).toEqual(ids);

    const written = readFileSync(res.writtenTo!, "utf-8");
    expect(written).toContain("ev_001");
    expect(written).toContain("Acme Cloud");
  });
});
