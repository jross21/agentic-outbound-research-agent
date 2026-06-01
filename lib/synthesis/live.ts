// Claude-powered synthesis (live mode). The static instructions + playbook are
// the cached system prefix; the per-account context (ledger, firmographics,
// contact) is the dynamic user turn. The model must cite only ledger ids; any
// fabricated id is dropped downstream by the deterministic enforcement pass.

import type { AccountResearch, Pov, Sequence, SelectedContact } from "@/lib/types";
import { SELLER, getPersona } from "@/lib/config";
import { SYNTHESIS_MODEL, MAX_SYNTHESIS_TOKENS } from "@/lib/constants";
import { buildCachedSystem } from "@/lib/anthropic/cache";
import { loadPrompt, loadPlaybook } from "@/lib/anthropic/prompts";
import { completeJson } from "@/lib/anthropic/complete";

function renderLedger(research: AccountResearch): string {
  return research.ledger
    .map((e) => `- ${e.id} | ${e.claim} (source: ${e.sourceUrl})`)
    .join("\n");
}

export async function liveSynthesis(
  research: AccountResearch,
  contact: SelectedContact | undefined
): Promise<{ pov: Pov; sequence: Sequence }> {
  const persona = getPersona(research.input.personaId);
  const f = research.firmographics;

  const system = buildCachedSystem(
    loadPrompt("pov_synthesis"),
    loadPrompt("sequence_generation"),
    loadPlaybook()
  );

  const user = [
    `# What we sell`,
    `${SELLER.product}: ${SELLER.oneLiner}`,
    `Value propositions:`,
    ...SELLER.valueProps.map((v) => `- ${v.headline}: ${v.detail}`),
    ``,
    `# Target`,
    `Account: ${f?.name ?? research.input.domain} (${research.input.domain})`,
    f ? `Firmographics: ${f.industry ?? "?"}, ~${f.employeeCount ?? "?"} employees, ${f.hqLocation ?? "?"}, ${f.fundingStage ?? "?"}` : "",
    `Persona: ${persona?.label ?? research.input.personaId} — cares about ${persona?.priorities.join("; ") ?? ""}`,
    contact ? `Selected contact: ${contact.name}, ${contact.title}` : "",
    research.input.trigger ? `User-flagged trigger: ${research.input.trigger}` : "",
    ``,
    `# Evidence ledger (cite ONLY these ids in evidenceIds)`,
    renderLedger(research),
    ``,
    `# Output`,
    `Return ONLY JSON matching this schema (no preamble):`,
    `{`,
    `  "pov": { "whyYou": string, "whyNow": string, "claims": [{ "text": string, "evidenceIds": [string] }] },`,
    `  "sequence": { "name": string, "touches": [{ "channel": "email"|"linkedin", "day": number, "subject"?: string, "body": string, "claims": [{ "text": string, "evidenceIds": [string] }] }] }`,
    `}`,
    `Every claim's evidenceIds MUST reference ids from the ledger above. Do not invent facts or ids. Aim for 3 touches across email + linkedin.`,
  ]
    .filter(Boolean)
    .join("\n");

  return completeJson<{ pov: Pov; sequence: Sequence }>({
    system,
    user,
    model: SYNTHESIS_MODEL,
    maxTokens: MAX_SYNTHESIS_TOKENS,
  });
}
