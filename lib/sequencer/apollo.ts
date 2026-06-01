// Optional live Apollo adapter (gated by APOLLO_API_KEY). Creates contacts and
// adds them to an Apollo sequence (emailer campaign). Requires APOLLO_SEQUENCE_ID.

import { TOOL_HTTP_TIMEOUT_MS } from "@/lib/constants";
import type { ContactUpsert, EnrollmentPayload, EnrollmentResult, Sequencer } from "./base";

const BASE = "https://api.apollo.io/v1";

function apiKey(): string {
  const key = process.env.APOLLO_API_KEY;
  if (!key) throw new Error("APOLLO_API_KEY not set");
  return key;
}

export class ApolloSequencer implements Sequencer {
  readonly name = "apollo" as const;

  async upsertContacts(contacts: ContactUpsert[]): Promise<{ ids: string[] }> {
    const ids: string[] = [];
    for (const c of contacts) {
      const [first, ...rest] = c.name.trim().split(/\s+/);
      const res = await fetch(`${BASE}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(TOOL_HTTP_TIMEOUT_MS),
        body: JSON.stringify({
          api_key: apiKey(),
          first_name: first,
          last_name: rest.join(" "),
          title: c.title,
          organization_name: c.company,
          email: c.email,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { contact?: { id: string } };
        if (data.contact?.id) ids.push(data.contact.id);
      }
    }
    return { ids };
  }

  async enrollInSequence(
    _payload: EnrollmentPayload,
    contactIds: string[]
  ): Promise<EnrollmentResult> {
    const sequenceId = process.env.APOLLO_SEQUENCE_ID;
    if (!sequenceId) {
      throw new Error("APOLLO_SEQUENCE_ID not set — set an emailer campaign id to enroll.");
    }
    const res = await fetch(`${BASE}/emailer_campaigns/${sequenceId}/add_contact_ids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(TOOL_HTTP_TIMEOUT_MS),
      body: JSON.stringify({ api_key: apiKey(), contact_ids: contactIds, send_email_from_email_account_id: null }),
    });
    if (!res.ok) throw new Error(`Apollo enroll failed: ${res.status} ${await res.text()}`);
    return {
      sequencer: "apollo",
      ref: `apollo:campaign:${sequenceId}`,
      enrolledContactIds: contactIds,
    };
  }
}
