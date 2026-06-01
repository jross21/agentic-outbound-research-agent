// crm_read — prior-touch context so outreach doesn't repeat what's been said.
// sample: fixture CRM record (may be null). live: HubSpot search (deferred).

import type { Tool, ToolImpl } from "./types";
import { ToolError } from "./types";
import { loadFixture } from "@/lib/sample/load";

const sampleImpl: ToolImpl = async (_input, ctx) => {
  const fx = loadFixture(ctx.domain);
  const crm = fx.crm;
  const company = fx.firmographics.name;

  if (!crm) {
    return {
      summary: `No prior CRM activity on record for ${company}. This is a net-new account.`,
      evidence: [],
    };
  }

  const touches = crm.priorTouches
    .map((t) => `  • ${t.date} (${t.type}): ${t.note}`)
    .join("\n");
  const summary =
    `CRM record for ${company} — owner ${crm.owner}, lifecycle stage "${crm.lifecycleStage}", ` +
    `last contacted ${crm.lastContacted}.\nPrior touches:\n${touches}`;

  return {
    summary,
    evidence: [
      {
        claim: `${company} is an existing CRM record (stage: ${crm.lifecycleStage}); last contacted ${crm.lastContacted}.`,
        sourceUrl: `crm://hubspot/${fx.firmographics.domain}`,
        provider: "crm",
        snippet: crm.priorTouches.map((t) => `${t.date} ${t.type}: ${t.note}`).join(" | "),
      },
    ],
  };
};

const liveImpl: ToolImpl = async () => {
  throw new ToolError(
    "Live CRM read not wired. Set HUBSPOT_ACCESS_TOKEN and implement the HubSpot search in crmRead.ts, or unset it to use sample data."
  );
};

export const crmReadTool: Tool = {
  name: "crm_read",
  description:
    "Read prior CRM activity for the account (owner, lifecycle stage, past touches) so outreach references — and does not repeat — earlier contact. Returns 'net-new' if there is no record.",
  provider: "crm",
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "Company domain" },
    },
  },
  sampleImpl,
  liveImpl,
};
