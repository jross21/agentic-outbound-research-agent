import { describe, it, expect } from "vitest";
import { POST } from "../route";
import type { ProgressEvent } from "@/lib/agent/events";

function req(body: unknown): Request {
  return new Request("http://localhost/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readNdjson(res: Response): Promise<ProgressEvent[]> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const events: ProgressEvent[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const l of lines) if (l.trim()) events.push(JSON.parse(l));
  }
  if (buf.trim()) events.push(JSON.parse(buf));
  return events;
}

describe("POST /api/research — keyless scripted pipeline", () => {
  it("returns 400 without a domain", async () => {
    const r = await POST(req({ personaId: "rev-ops" }));
    expect(r.status).toBe(400);
  });

  it("returns 400 for an unknown persona", async () => {
    const r = await POST(req({ domain: "acme-cloud.io", personaId: "nope" }));
    expect(r.status).toBe(400);
  });

  it("returns 400 for a non-demo domain in sample mode (no fabrication)", async () => {
    const r = await POST(req({ domain: "totally-real-co.example", personaId: "rev-ops" }));
    expect(r.status).toBe(400);
    const j = await r.json();
    expect(j.error).toMatch(/demo account/i);
  });

  it("streams a grounded run ending in a done event", async () => {
    const r = await POST(req({ domain: "acme-cloud.io", personaId: "rev-ops" }));
    expect(r.status).toBe(200);
    const events = await readNdjson(r);

    expect(events.some((e) => e.type === "tool_call")).toBe(true);
    expect(events.some((e) => e.type === "evidence_added")).toBe(true);
    expect(events.some((e) => e.type === "fit_scored")).toBe(true);
    expect(events.some((e) => e.type === "synthesis_start")).toBe(true);

    const done = events.find((e) => e.type === "done");
    expect(done).toBeDefined();
    if (done?.type === "done") {
      expect(done.research.groundedness?.score).toBe(1);
      expect(done.research.sequence?.touches.length).toBeGreaterThanOrEqual(3);
      expect(done.research.firmographics?.name).toBe("Acme Cloud");
      // ICP fit is scored as part of the run; Acme is a sweet-spot account.
      expect(done.research.fit?.tier).toBe("strong");
    }
  });
});
