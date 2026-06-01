// ─────────────────────────────────────────────────────────────────────────────
// Tunable constants: models, loop budget, thresholds, and filesystem paths.
// Single source of truth (mirrors deal-triage/constants.py centralization).
// ─────────────────────────────────────────────────────────────────────────────

import path from "path";

/** Model used to drive the hand-rolled research loop (tool use). */
export const AGENT_MODEL = "claude-sonnet-4-6";

/** Model used for POV + sequence synthesis. */
export const SYNTHESIS_MODEL = "claude-sonnet-4-6";

/** Hard cap on agent loop iterations (model call → tool batch). The step budget
 *  bounds cost and latency and is a visible part of the loop's mechanics. */
export const MAX_STEPS = 10;

/** max_tokens for each loop turn (room for several tool_use blocks + reasoning). */
export const MAX_LOOP_TOKENS = 2048;

/** max_tokens for synthesis calls (POV / sequence are larger structured JSON). */
export const MAX_SYNTHESIS_TOKENS = 2048;

/** Per-request timeout (ms) for live tool HTTP calls (search / fetch / enrich). */
export const TOOL_HTTP_TIMEOUT_MS = 12_000;

/** Groundedness gate: a sequence below this fraction of cited claims is blocked
 *  from enrollment. By design synthesis targets ~1.0; this catches regressions. */
export const GROUNDEDNESS_MIN = 1.0;

// ── Filesystem paths (resolved from the project root at runtime) ─────────────
export const PROJECT_ROOT = process.cwd();
export const PROMPTS_DIR = path.join(PROJECT_ROOT, "prompts");
export const PLAYBOOK_PATH = path.join(PROJECT_ROOT, "playbook", "OUTBOUND_PLAYBOOK.md");
export const SAMPLE_DIR = path.join(PROJECT_ROOT, "data", "sample");
export const SAMPLE_ACCOUNTS_DIR = path.join(SAMPLE_DIR, "accounts");
export const OUT_DIR = path.join(PROJECT_ROOT, "data", "out");
export const FEEDBACK_PATH = path.join(PROJECT_ROOT, "data", "feedback.json");
