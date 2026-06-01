// Thumbs feedback persistence. Stamps the timestamp server-side (determinism
// stays out of the pure store) and appends to the local JSON feedback log.

import { recordFeedback, type FeedbackEntry } from "@/lib/evals/feedback";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const rating = b.rating === "up" || b.rating === "down" ? b.rating : null;
  if (!rating || typeof b.account !== "string" || typeof b.persona !== "string") {
    return Response.json({ error: "rating ('up'|'down'), account, and persona are required" }, { status: 400 });
  }

  const entry: FeedbackEntry = {
    account: b.account,
    persona: b.persona,
    rating,
    groundedness: typeof b.groundedness === "number" ? b.groundedness : undefined,
    note: typeof b.note === "string" && b.note.trim() ? b.note.trim() : undefined,
    at: new Date().toISOString(),
  };
  recordFeedback(entry);
  return Response.json({ ok: true });
}
