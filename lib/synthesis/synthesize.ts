// Synthesis orchestrator: pick live vs scripted by model mode, then ALWAYS run
// the deterministic citation-enforcement pass before returning. The model
// proposes; this code disposes — fabricated citations are dropped and the result
// is scored. This is the seam where anti-hallucination is guaranteed regardless
// of which synthesizer ran.

import type { AccountResearch } from "@/lib/types";
import { resolveModelMode } from "@/lib/config";
import { selectContacts } from "./persona";
import { scriptedSynthesis } from "./scripted";
import { liveSynthesis } from "./live";
import { sanitizeClaims, sanitizeSequence, scoreGroundedness } from "@/lib/evals/groundedness";

/** Produce POV + selected contacts + sequence + groundedness for a research run. */
export async function synthesize(research: AccountResearch): Promise<AccountResearch> {
  const selectedContacts = selectContacts(research, 1);
  const validIds = new Set(research.ledger.map((e) => e.id));

  const { pov, sequence } =
    resolveModelMode() === "live"
      ? await liveSynthesis(research, selectedContacts[0])
      : scriptedSynthesis(research, selectedContacts[0]);

  // Enforce: strip any fabricated ids, then score what remains against the ledger.
  const cleanSequence = sanitizeSequence(sequence, validIds);
  const cleanPov = { ...pov, claims: sanitizeClaims(pov.claims, validIds) };
  const groundedness = scoreGroundedness(cleanSequence, validIds);

  return {
    ...research,
    pov: cleanPov,
    selectedContacts,
    sequence: cleanSequence,
    groundedness,
  };
}
