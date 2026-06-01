// Streaming research endpoint. Runs the full agent pipeline and streams every
// progress event to the client as NDJSON (one JSON object per line) over a
// ReadableStream. This is what makes the agent's reasoning visible live — the
// showpiece. NDJSON (not SSE/EventSource) because this is a POST with a JSON
// body and our events are already structured objects.

import { runResearch } from "@/lib/agent/orchestrate";
import type { RunInput } from "@/lib/types";
import { getPersona } from "@/lib/config";

export const runtime = "nodejs"; // need fs (prompts/playbook) + a long-ish run
export const maxDuration = 300; // extend the serverless budget for live runs

function parseInput(body: unknown): RunInput | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const domain = typeof b.domain === "string" ? b.domain.trim() : "";
  if (!domain) return { error: "A target account domain is required" };
  const personaId = typeof b.personaId === "string" ? b.personaId : "";
  if (!getPersona(personaId)) return { error: "Unknown persona" };
  return {
    domain,
    accountName: typeof b.accountName === "string" && b.accountName.trim() ? b.accountName.trim() : undefined,
    trigger: typeof b.trigger === "string" && b.trigger.trim() ? b.trigger.trim() : undefined,
    personaId,
  };
}

export async function POST(request: Request) {
  const parsed = parseInput(await request.json().catch(() => null));
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        for await (const ev of runResearch(parsed, request.signal)) {
          send(ev);
        }
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
