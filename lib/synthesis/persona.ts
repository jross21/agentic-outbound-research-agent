// Contact selection — deterministic in both live and scripted modes. Ranks the
// discovered contacts by fit for the requested persona and attaches a rationale.

import type { AccountResearch, SelectedContact } from "@/lib/types";
import { getPersona } from "@/lib/config";

function fitScore(title: string, matches: string[]): number {
  const t = title.toLowerCase();
  // Exact-ish phrase match scores highest; otherwise count token overlaps.
  if (matches.some((m) => t.includes(m))) return 2;
  return 0;
}

/** Pick the best contact(s) for the persona. Returns up to `limit` contacts. */
export function selectContacts(research: AccountResearch, limit = 1): SelectedContact[] {
  const persona = getPersona(research.input.personaId);
  const matches = persona?.titleMatches ?? [];
  const company = research.firmographics?.name ?? research.input.domain;

  const ranked = [...research.contacts].sort(
    (a, b) => fitScore(b.title, matches) - fitScore(a.title, matches)
  );

  return ranked.slice(0, limit).map((c) => {
    const onTarget = fitScore(c.title, matches) > 0;
    const rationale = onTarget
      ? `${c.title} maps directly to the ${persona?.label ?? "target"} persona — the buyer who owns ${
          persona?.priorities[0] ?? "this initiative"
        } at ${company}.`
      : `Closest available contact to the ${persona?.label ?? "target"} persona at ${company}; confirm ownership before outreach.`;
    return { ...c, rationale };
  });
}
