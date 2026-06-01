// The sequencer interface: one shape, multiple adapters (dry-run, HubSpot,
// Apollo). The agent NEVER calls these — only the approval route does, after the
// human-approved payload passes a server-side groundedness re-check. "Auto-load"
// means the push to the sequencer is automated on approval, not that outreach is
// sent without a human in the loop.

import type { EvidenceEntry, Sequence, SelectedContact } from "@/lib/types";
import type { SequencerName } from "@/lib/config";

export type ContactUpsert = {
  name: string;
  title: string;
  company: string;
  email?: string;
  linkedinUrl?: string;
};

/** What the client POSTs to /api/approve. Carries the ledger so the server can
 *  re-verify grounding independently — the client cannot bypass the gate. */
export type EnrollmentPayload = {
  account: { domain: string; name?: string };
  persona: string;
  contacts: ContactUpsert[];
  sequence: Sequence;
  ledger: EvidenceEntry[];
};

export type EnrollmentResult = {
  sequencer: SequencerName;
  ref: string;
  enrolledContactIds: string[];
  /** Where the dry-run payload was written, if applicable. */
  writtenTo?: string;
};

export interface Sequencer {
  readonly name: SequencerName;
  upsertContacts(contacts: ContactUpsert[]): Promise<{ ids: string[] }>;
  enrollInSequence(payload: EnrollmentPayload, contactIds: string[]): Promise<EnrollmentResult>;
}

/** Build the upsert list from the selected contacts + account. */
export function contactsFromSelection(
  selected: SelectedContact[],
  company: string
): ContactUpsert[] {
  return selected.map((c) => ({
    name: c.name,
    title: c.title,
    company,
    email: c.email,
    linkedinUrl: c.linkedinUrl,
  }));
}
