// The approval gate. The agent never reaches a sequencer; this route is the only
// path to enrollment, and it enforces two checks the client cannot bypass:
//   1. explicit human approval (approved === true), and
//   2. a server-side groundedness re-verification against the payload's own
//      ledger — if any claim is uncited, enrollment is blocked (422).
// Only then does it upsert contacts and enroll via the configured sequencer.

import { getSequencer } from "@/lib/sequencer";
import type { EnrollmentPayload } from "@/lib/sequencer/base";
import { scoreGroundedness } from "@/lib/evals/groundedness";
import { GROUNDEDNESS_MIN } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { approved, payload } = body as { approved?: unknown; payload?: EnrollmentPayload };

  if (approved !== true) {
    return Response.json(
      { error: "Enrollment requires explicit human approval (approved must be true)." },
      { status: 403 }
    );
  }
  if (!payload?.sequence || !Array.isArray(payload.ledger) || !Array.isArray(payload.contacts)) {
    return Response.json({ error: "Malformed enrollment payload" }, { status: 400 });
  }

  // Re-verify grounding against the payload's own ledger — never trust the client.
  const validIds = new Set(payload.ledger.map((e) => e.id));
  const groundedness = scoreGroundedness(payload.sequence, validIds);
  if (groundedness.score < GROUNDEDNESS_MIN) {
    return Response.json(
      { error: "Blocked: the sequence contains uncited claims.", groundedness },
      { status: 422 }
    );
  }

  try {
    const seq = getSequencer();
    const { ids } = await seq.upsertContacts(payload.contacts);
    const result = await seq.enrollInSequence(payload, ids);
    return Response.json({ ok: true, result, groundedness });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
