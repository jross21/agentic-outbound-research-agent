// Default sequencer: writes the exact enrollment payload it WOULD send to a live
// sequencer into data/out/, and returns it. Keyless reviewers see precisely what
// the live push would do, with nothing sent. This is the safe default.

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { OUT_DIR } from "@/lib/constants";
import { slugDomain } from "@/lib/sample/load";
import type { ContactUpsert, EnrollmentPayload, EnrollmentResult, Sequencer } from "./base";

export class DryRunSequencer implements Sequencer {
  readonly name = "dryrun" as const;

  // outDir is injectable so tests can write to a temp dir (default: data/out).
  constructor(private readonly outDir: string = OUT_DIR) {}

  async upsertContacts(contacts: ContactUpsert[]): Promise<{ ids: string[] }> {
    // Synthetic, stable ids so the payload is self-consistent.
    return { ids: contacts.map((c, i) => `dryrun_contact_${i + 1}`) };
  }

  async enrollInSequence(
    payload: EnrollmentPayload,
    contactIds: string[]
  ): Promise<EnrollmentResult> {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = join(this.outDir, `enroll-${slugDomain(payload.account.domain)}-${stamp}.json`);
    const record = {
      sequencer: "dryrun",
      enrolledAt: new Date().toISOString(),
      contactIds,
      payload,
    };
    mkdirSync(this.outDir, { recursive: true });
    writeFileSync(file, JSON.stringify(record, null, 2) + "\n", "utf-8");

    return {
      sequencer: "dryrun",
      ref: `dryrun:${slugDomain(payload.account.domain)}`,
      enrolledContactIds: contactIds,
      writtenTo: file,
    };
  }
}
