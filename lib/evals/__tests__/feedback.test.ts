import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { recordFeedback, readFeedback } from "../feedback";

const dir = mkdtempSync(join(tmpdir(), "fb-"));
const file = join(dir, "feedback.json");
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("feedback store", () => {
  it("readFeedback returns [] when the file is missing", () => {
    expect(readFeedback(file)).toEqual([]);
  });

  it("recordFeedback appends and round-trips through readFeedback", () => {
    recordFeedback({ account: "Acme Cloud", persona: "rev-ops", rating: "up", groundedness: 1, at: "2026-05-31T00:00:00.000Z" }, file);
    recordFeedback({ account: "Acme Cloud", persona: "rev-ops", rating: "down", at: "2026-05-31T01:00:00.000Z" }, file);

    const all = readFeedback(file);
    expect(all).toHaveLength(2);
    expect(all[0].account).toBe("Acme Cloud");
    expect(all[0].rating).toBe("up");
    expect(all[0].groundedness).toBe(1);
    expect(all[1].rating).toBe("down");
  });
});
