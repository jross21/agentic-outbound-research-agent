import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("GET /api/mode", () => {
  it("reports sample mode and the fictional demo accounts (keyless)", async () => {
    const res = await GET();
    const j = await res.json();
    // vitest runs with FORCE_SAMPLE=1, so the app is always in sample mode here.
    expect(j.mode).toBe("sample");
    expect(Array.isArray(j.demoAccounts)).toBe(true);
    expect(j.demoAccounts.length).toBe(3);
    const domains = j.demoAccounts.map((a: { domain: string }) => a.domain);
    expect(domains).toContain("acme-cloud.io");
    expect(domains).toContain("nimbus-health.com");
    expect(domains).toContain("ledgerflow.io");
  });
});
