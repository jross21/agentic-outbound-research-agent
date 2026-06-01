// Runtime loader for offline account fixtures. Reads a curated JSON fixture from
// data/sample/accounts/ (read via fs at runtime, not import, so the generator
// can rewrite fixtures without a rebuild — mirrors how the ICP tool loads
// RUBRIC.md). Server-only by convention; only the tool sample impls call this.
//
// IMPORTANT: there is intentionally NO fabrication fallback for unknown domains.
// Sample mode supports only the curated, clearly-fictional demo accounts (see
// registry.ts). An earlier "generic fixture" generator invented plausible-looking
// but fake people and dead LinkedIn URLs for any domain — which is exactly the
// kind of hallucination this tool exists to prevent. Unknown domain ⇒ throw.

import { readFileSync } from "fs";
import { join } from "path";
import { SAMPLE_ACCOUNTS_DIR } from "@/lib/constants";
import type { Fixture } from "@/lib/sample/types";

export class SampleAccountNotFoundError extends Error {}

export function slugDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Load the curated fixture for a demo domain. Throws for any non-demo domain. */
export function loadFixture(domain: string): Fixture {
  const file = join(SAMPLE_ACCOUNTS_DIR, `${slugDomain(domain)}.json`);
  try {
    return JSON.parse(readFileSync(file, "utf-8")) as Fixture;
  } catch {
    throw new SampleAccountNotFoundError(
      `No sample fixture for "${domain}". Sample mode supports only the built-in demo accounts.`
    );
  }
}
