// Runtime loader for offline account fixtures. Reads a curated JSON fixture from
// data/sample/accounts/ when one exists for the domain; otherwise synthesizes a
// deterministic generic fixture. Read via fs at runtime (not import) so the
// generator can rewrite fixtures without a rebuild — mirrors how the ICP tool
// loads RUBRIC.md. (Server-only by convention; only tool sample impls call this.)

import { readFileSync } from "fs";
import { join } from "path";
import { SAMPLE_ACCOUNTS_DIR } from "@/lib/constants";
import type { Fixture } from "@/lib/sample/types";
import { makeGenericFixture } from "@/lib/sample/generic";

export function slugDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Load the fixture for a domain — curated if present, else deterministic generic. */
export function loadFixture(domain: string): Fixture {
  const file = join(SAMPLE_ACCOUNTS_DIR, `${slugDomain(domain)}.json`);
  try {
    const raw = readFileSync(file, "utf-8");
    return JSON.parse(raw) as Fixture;
  } catch {
    return makeGenericFixture(domain);
  }
}
