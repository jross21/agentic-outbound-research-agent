// Append-only local feedback store (mirrors deal-triage/feedback.py). Thumbs +
// optional note per run, persisted as JSON for later prompt tuning. Server-only.

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { FEEDBACK_PATH } from "@/lib/constants";

export type FeedbackEntry = {
  account: string;
  persona: string;
  rating: "up" | "down";
  groundedness?: number;
  note?: string;
  at: string; // ISO; stamped by the route
};

// `path` is injectable so tests can target a temp file (default: data/feedback.json).
export function readFeedback(path: string = FEEDBACK_PATH): FeedbackEntry[] {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as FeedbackEntry[];
  } catch {
    return [];
  }
}

export function recordFeedback(entry: FeedbackEntry, path: string = FEEDBACK_PATH): void {
  const all = readFeedback(path);
  all.push(entry);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(all, null, 2) + "\n", "utf-8");
}
