import { describe, it, expect } from "vitest";
import type { ToolContext } from "../types";
import { enrichDomainTool } from "../enrichDomain";
import { webSearchTool } from "../webSearch";
import { fetchPageTool } from "../fetchPage";
import { findContactsTool } from "../findContacts";
import { crmReadTool } from "../crmRead";
import { dispatch, isLive, TOOLS } from "../../registry";

const ctx = (domain: string, personaId = "rev-ops"): ToolContext => ({
  domain,
  personaId,
});

function assertWellFormedEvidence(ev: {
  claim: string;
  sourceUrl: string;
  snippet: string;
  provider: string;
}) {
  expect(ev.claim.length).toBeGreaterThan(0);
  expect(ev.sourceUrl.length).toBeGreaterThan(0);
  expect(ev.snippet.length).toBeGreaterThan(0);
  expect(ev.provider.length).toBeGreaterThan(0);
}

describe("enrich_domain (sample)", () => {
  it("returns firmographic evidence for a curated account", async () => {
    const out = await enrichDomainTool.sampleImpl({ domain: "acme-cloud.io" }, ctx("acme-cloud.io"));
    expect(out.summary).toMatch(/Acme Cloud/);
    expect(out.evidence.length).toBeGreaterThan(0);
    out.evidence.forEach(assertWellFormedEvidence);
    expect(out.evidence.every((e) => e.provider === "enrichment")).toBe(true);
  });

  it("throws for an unknown (non-demo) domain — no fabrication fallback", async () => {
    await expect(
      enrichDomainTool.sampleImpl({ domain: "totallyunknown.example" }, ctx("totallyunknown.example"))
    ).rejects.toThrow();
  });
});

describe("web_search (sample)", () => {
  it("ranks funding pages for a funding query and adds no evidence (discovery)", async () => {
    const out = await webSearchTool.sampleImpl({ query: "funding series b" }, ctx("acme-cloud.io"));
    expect(out.summary.toLowerCase()).toContain("series b");
    expect(out.evidence).toHaveLength(0);
  });
});

describe("fetch_page (sample)", () => {
  it("returns body + exactly one citable evidence entry for a known url", async () => {
    const url = "https://techcrunch.com/2026/03/14/acme-cloud-series-b";
    const out = await fetchPageTool.sampleImpl({ url }, ctx("acme-cloud.io"));
    expect(out.summary.length).toBeGreaterThan(0);
    expect(out.evidence).toHaveLength(1);
    expect(out.evidence[0].sourceUrl).toBe(url);
    expect(out.evidence[0].provider).toBe("fetch");
    assertWellFormedEvidence(out.evidence[0]);
  });

  it("returns no evidence for an unknown url", async () => {
    const out = await fetchPageTool.sampleImpl({ url: "https://nope.example/x" }, ctx("acme-cloud.io"));
    expect(out.evidence).toHaveLength(0);
  });
});

describe("find_contacts (sample)", () => {
  it("ranks the RevOps contact first for the rev-ops persona at Acme", async () => {
    const out = await findContactsTool.sampleImpl({}, ctx("acme-cloud.io", "rev-ops"));
    expect(out.evidence.length).toBeGreaterThan(0);
    expect(out.evidence[0].claim.toLowerCase()).toContain("revenue operations");
    out.evidence.forEach(assertWellFormedEvidence);
  });

  it("ranks the product contact first for the vp-product persona", async () => {
    const out = await findContactsTool.sampleImpl({}, ctx("acme-cloud.io", "vp-product"));
    expect(out.evidence[0].claim.toLowerCase()).toContain("product");
  });
});

describe("crm_read (sample)", () => {
  it("returns prior-touch evidence when a CRM record exists", async () => {
    const out = await crmReadTool.sampleImpl({}, ctx("acme-cloud.io"));
    expect(out.evidence).toHaveLength(1);
    expect(out.evidence[0].provider).toBe("crm");
    assertWellFormedEvidence(out.evidence[0]);
  });

  it("returns net-new (no evidence) when there is no CRM record", async () => {
    const out = await crmReadTool.sampleImpl({}, ctx("nimbus-health.com"));
    expect(out.summary.toLowerCase()).toContain("net-new");
    expect(out.evidence).toHaveLength(0);
  });
});

describe("registry / dispatch", () => {
  it("registers all five tools", () => {
    expect(TOOLS.map((t) => t.name).sort()).toEqual(
      ["crm_read", "enrich_domain", "fetch_page", "find_contacts", "web_search"].sort()
    );
  });

  it("dispatch falls back to sample when no provider keys are set", async () => {
    // No env keys in the test environment ⇒ nothing is live.
    expect(TOOLS.every((t) => isLive(t) === false)).toBe(true);
    const out = await dispatch(enrichDomainTool, { domain: "acme-cloud.io" }, ctx("acme-cloud.io"));
    expect(out.summary).toMatch(/Acme Cloud/);
  });
});
