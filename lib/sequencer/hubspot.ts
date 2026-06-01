// Live HubSpot adapter (gated by HUBSPOT_ACCESS_TOKEN). Does a REAL authenticated
// contact upsert via the CRM v3 batch API; sequence enrollment is wired to the
// sequences API and requires HUBSPOT_SEQUENCE_ID (a sales seat is needed for the
// sequences product). Mirrors deal-triage/hubspot_client.py's auth + error style.

import { TOOL_HTTP_TIMEOUT_MS } from "@/lib/constants";
import type { ContactUpsert, EnrollmentPayload, EnrollmentResult, Sequencer } from "./base";

const BASE = "https://api.hubapi.com";

function authHeaders() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN not set");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function splitName(name: string): { firstname: string; lastname: string } {
  const parts = name.trim().split(/\s+/);
  return { firstname: parts[0] ?? "", lastname: parts.slice(1).join(" ") };
}

export class HubSpotSequencer implements Sequencer {
  readonly name = "hubspot" as const;

  async upsertContacts(contacts: ContactUpsert[]): Promise<{ ids: string[] }> {
    const withEmail = contacts.filter((c) => c.email);
    if (withEmail.length === 0) return { ids: [] };

    const res = await fetch(`${BASE}/crm/v3/objects/contacts/batch/upsert`, {
      method: "POST",
      headers: authHeaders(),
      signal: AbortSignal.timeout(TOOL_HTTP_TIMEOUT_MS),
      body: JSON.stringify({
        inputs: withEmail.map((c) => {
          const { firstname, lastname } = splitName(c.name);
          return {
            idProperty: "email",
            id: c.email,
            properties: { email: c.email, firstname, lastname, jobtitle: c.title, company: c.company },
          };
        }),
      }),
    });
    if (!res.ok) throw new Error(`HubSpot upsert failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { results?: { id: string }[] };
    return { ids: (data.results ?? []).map((r) => r.id) };
  }

  async enrollInSequence(
    payload: EnrollmentPayload,
    contactIds: string[]
  ): Promise<EnrollmentResult> {
    const sequenceId = process.env.HUBSPOT_SEQUENCE_ID;
    if (!sequenceId) {
      throw new Error(
        "HUBSPOT_SEQUENCE_ID not set — contacts were upserted, but set a sequence id to enroll them."
      );
    }
    // HubSpot sequence enrollment (sales product). One enrollment per contact.
    const enrolled: string[] = [];
    for (const contactId of contactIds) {
      const res = await fetch(`${BASE}/automation/v4/sequences/${sequenceId}/enrollments`, {
        method: "POST",
        headers: authHeaders(),
        signal: AbortSignal.timeout(TOOL_HTTP_TIMEOUT_MS),
        body: JSON.stringify({ contactId }),
      });
      if (res.ok) enrolled.push(contactId);
    }
    return {
      sequencer: "hubspot",
      ref: `hubspot:sequence:${sequenceId}`,
      enrolledContactIds: enrolled,
    };
  }
}
