// enrich_domain — firmographics for the target account.
// sample: read the fixture. live: provider-specific (deferred; throws if a key
// is set but no provider is wired — honest about what's implemented).

import type { Tool, ToolImpl } from "./types";
import { ToolError } from "./types";
import { loadFixture } from "@/lib/sample/load";

const sampleImpl: ToolImpl = async (_input, ctx) => {
  const fx = loadFixture(ctx.domain);
  const f = fx.firmographics;
  const source = `https://${f.domain}`;
  const sizeBits = [
    f.industry && `${f.industry}`,
    f.employeeCount && `~${f.employeeCount} employees`,
    f.hqLocation && `HQ ${f.hqLocation}`,
    f.fundingStage && `${f.fundingStage}`,
  ]
    .filter(Boolean)
    .join(", ");

  const summary = `${f.name} (${f.domain}): ${sizeBits}. ${f.description ?? ""}`.trim();

  return {
    summary,
    data: { firmographics: f },
    evidence: [
      {
        claim: `${f.name} is a ${f.industry ?? "company"} with approximately ${
          f.employeeCount ?? "an unknown number of"
        } employees, headquartered in ${f.hqLocation ?? "an undisclosed location"}.`,
        sourceUrl: source,
        provider: "enrichment",
        snippet: f.description ?? sizeBits,
      },
      ...(f.fundingStage
        ? [
            {
              claim: `${f.name} is at the ${f.fundingStage} funding stage.`,
              sourceUrl: source,
              provider: "enrichment" as const,
              snippet: `${f.name} — ${f.fundingStage}`,
            },
          ]
        : []),
    ],
  };
};

const liveImpl: ToolImpl = async () => {
  throw new ToolError(
    "Live enrichment provider not wired. Set ENRICHMENT_API_KEY and implement the provider call in enrichDomain.ts, or unset it to use sample data."
  );
};

export const enrichDomainTool: Tool = {
  name: "enrich_domain",
  description:
    "Look up firmographics for a company domain: industry, employee count, HQ location, and funding stage. Call this first to ground the account.",
  provider: "enrichment",
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "Company domain, e.g. acme.io" },
    },
    required: ["domain"],
  },
  sampleImpl,
  liveImpl,
};
