// Which evidence ledger entries drive ICP fit vs. are used in the outreach
// sequence. Lets the UI call out the research points that matter — the ones that
// decided fit and the ones that became personalization — instead of treating
// every ledger entry the same. Pure; derived from research.fit + research.sequence.

import type { AccountResearch } from "@/lib/types";

export type EvidenceRoles = { fit: Set<string>; used: Set<string> };

export function evidenceRoles(research: AccountResearch): EvidenceRoles {
  const fit = new Set<string>();
  for (const s of research.fit?.signals ?? []) {
    for (const id of s.evidenceIds) fit.add(id);
  }
  const used = new Set<string>();
  for (const t of research.sequence?.touches ?? []) {
    for (const c of t.claims) {
      for (const id of c.evidenceIds) used.add(id);
    }
  }
  return { fit, used };
}
