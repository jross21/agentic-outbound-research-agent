// A simple specificity heuristic — the complement to groundedness. Groundedness
// asks "is every claim cited?"; specificity asks "does this read like it was
// written for one account, or blasted to a thousand?" It flags the filler
// phrases the playbook says get a message deleted, and penalizes uncited touches.

import type { Sequence } from "@/lib/types";

const GENERIC_PHRASES = [
  "i hope this finds you well",
  "i hope you're doing well",
  "i hope you are doing well",
  "reaching out",
  "touch base",
  "circle back",
  "synergy",
  "leading provider",
  "best-in-class",
  "best in class",
  "just following up",
  "just checking in",
  "to whom it may concern",
  "game-changer",
  "game changer",
  "revolutionary",
  "cutting-edge",
];

export type SpecificityReport = {
  score: number; // 0..1
  flaggedPhrases: string[];
  uncitedTouches: number;
};

export function scoreSpecificity(sequence: Sequence): SpecificityReport {
  const flagged: string[] = [];
  let penalty = 0;

  for (const t of sequence.touches) {
    const body = `${t.subject ?? ""} ${t.body}`.toLowerCase();
    for (const p of GENERIC_PHRASES) {
      if (body.includes(p)) {
        flagged.push(p);
        penalty += 0.15;
      }
    }
  }

  const uncitedTouches = sequence.touches.filter(
    (t) => t.claims.length === 0 || t.claims.every((c) => c.evidenceIds.length === 0)
  ).length;
  penalty += uncitedTouches * 0.1;

  return {
    score: Math.max(0, Math.min(1, 1 - penalty)),
    flaggedPhrases: [...new Set(flagged)],
    uncitedTouches,
  };
}
