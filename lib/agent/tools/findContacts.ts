// find_contacts — decision-makers at the account, ranked for the target persona.
// sample: fixture contacts ranked by the persona's titleMatches. live: deferred.

import type { Tool, ToolImpl } from "./types";
import { ToolError } from "./types";
import { loadFixture } from "@/lib/sample/load";
import { getPersona } from "@/lib/config";

function personaScore(title: string, matches: string[]): number {
  const t = title.toLowerCase();
  return matches.some((m) => t.includes(m)) ? 1 : 0;
}

const sampleImpl: ToolImpl = async (_input, ctx) => {
  const fx = loadFixture(ctx.domain);
  const persona = getPersona(ctx.personaId);
  const matches = persona?.titleMatches ?? [];

  const ranked = [...fx.contacts].sort(
    (a, b) => personaScore(b.title, matches) - personaScore(a.title, matches)
  );

  const company = fx.firmographics.name;
  const summary =
    ranked.length === 0
      ? "No contacts found."
      : `Contacts at ${company} (best persona fit first):\n` +
        ranked.map((c) => `- ${c.name}, ${c.title}${c.email ? ` <${c.email}>` : ""}`).join("\n");

  return {
    summary,
    data: {
      contacts: ranked.map((c) => ({
        name: c.name,
        title: c.title,
        email: c.email,
        linkedinUrl: c.linkedinUrl,
      })),
    },
    evidence: ranked.map((c) => ({
      claim: `${c.name} is ${c.title} at ${company}.`,
      sourceUrl: c.linkedinUrl ?? `https://${fx.firmographics.domain}`,
      provider: "enrichment" as const,
      snippet: `${c.name} — ${c.title}, ${company}`,
    })),
  };
};

const liveImpl: ToolImpl = async () => {
  throw new ToolError(
    "Live people-search provider not wired. Set ENRICHMENT_API_KEY and implement the provider call in findContacts.ts, or unset it to use sample data."
  );
};

export const findContactsTool: Tool = {
  name: "find_contacts",
  description:
    "Find decision-makers at the account, ranked by fit for the target persona. Returns names, titles, and emails. Each contact becomes citable evidence.",
  provider: "enrichment",
  inputSchema: {
    type: "object",
    properties: {
      persona: {
        type: "string",
        description: "Optional persona/title hint to prioritize (e.g. 'RevOps leader')",
      },
    },
  },
  sampleImpl,
  liveImpl,
};
