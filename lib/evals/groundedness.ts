// Deterministic citation verification — the anti-hallucination core. The model
// PROPOSES citations; this code VERIFIES them against the append-only ledger.
// Nothing here trusts the model: an evidenceId that isn't in the ledger is
// treated as a fabrication and dropped, and a claim left with no valid citation
// is reported as uncited (and blocks enrollment at the approval gate).

import type { Claim, GroundednessReport, Sequence } from "@/lib/types";

/** A claim is grounded iff it cites ≥1 id and every id it cites is real. */
export function isGrounded(claim: Claim, validIds: Set<string>): boolean {
  return claim.evidenceIds.length > 0 && claim.evidenceIds.every((id) => validIds.has(id));
}

/** Drop fabricated ids from each claim (keep only ids present in the ledger). */
export function sanitizeClaims(claims: Claim[], validIds: Set<string>): Claim[] {
  return claims.map((c) => ({
    text: c.text,
    evidenceIds: c.evidenceIds.filter((id) => validIds.has(id)),
  }));
}

/** Return a copy of the sequence with every touch's claims sanitized. */
export function sanitizeSequence(sequence: Sequence, validIds: Set<string>): Sequence {
  return {
    name: sequence.name,
    touches: sequence.touches.map((t) => ({
      ...t,
      claims: sanitizeClaims(t.claims, validIds),
    })),
  };
}

/** Score a sequence: fraction of claims that are grounded, plus the offenders. */
export function scoreGroundedness(sequence: Sequence, validIds: Set<string>): GroundednessReport {
  const claims = sequence.touches.flatMap((t) => t.claims);
  const cited = claims.filter((c) => isGrounded(c, validIds));
  const uncited = claims.filter((c) => !isGrounded(c, validIds));
  return {
    score: claims.length ? cited.length / claims.length : 1,
    total: claims.length,
    citedCount: cited.length,
    uncited: uncited.map((c) => c.text),
  };
}
