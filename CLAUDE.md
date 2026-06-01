# Outbound Research Agent

Standalone TypeScript + Next.js (App Router, React 19, Tailwind 4, Vitest) portfolio project. A GTM agent that researches a target account via a **hand-rolled Anthropic tool-use loop**, maintains a cited **evidence ledger**, drafts a personalized multi-touch outbound sequence, and enrolls it via a pluggable sequencer **only after human approval**.

## Non-negotiable design principles
- **Hand-rolled tool-use loop** on the raw `@anthropic-ai/sdk` (`lib/agent/loop.ts`). NOT the Agent SDK, NOT LangGraph. The transparent loop is the headline artifact.
- **Keyless end-to-end.** With no API keys, every tool falls back to deterministic sample fixtures (`data/sample/`), the loop runs via a scripted model, and the sequencer is dry-run. See env gating in `lib/config.ts` (`isConnected`, `resolveModelMode`, `isForceSample`). `FORCE_SAMPLE=1` forces this everywhere.
- **Evidence ledger + citation enforcement.** Append-only `lib/agent/evidence.ts`. Synthesis may only cite ledger ids; `lib/evals/groundedness.ts` deterministically verifies and the enroll route re-checks server-side. Uncited claims are blocked — anti-hallucination is the point.
- **Human approval gate.** The loop NEVER calls the sequencer. Only `app/api/approve/route.ts` does, and only with an `approved:true`, human-edited payload that passes the groundedness re-check.
- **Prompt caching** of the static prefix (agent system prompt + `playbook/OUTBOUND_PLAYBOOK.md`) via `cache_control: ephemeral`.
- Pure logic in `lib/**` is server-only by convention — never import a tool live-impl or the Anthropic client into a `"use client"` component. The client↔server contract is the API routes only.

## Conventions
- All `.ts`/`.tsx`. Path alias `@/*` → repo root.
- Markdown context (`prompts/*.md`, `playbook/*.md`) and fixtures (`data/sample/*.json`) are read at runtime via `fs.readFileSync(process.cwd()...)`; any new such file must be added to `outputFileTracingIncludes` in `next.config.ts`.
- Determinism: timestamps are stamped in routes, not deep in pure lib; the sample generator uses a seeded PRNG (no `Math.random()`).

## Commands
- `npm run dev` — keyless demo (Load sample account → watch the loop → approve → dry-run payload in `data/out/`).
- `npm test` — Vitest. `npm run typecheck` — tsc.
- `npm run generate-sample` — regenerate `data/sample/` fixtures (seeded; deterministic).

## Reuse provenance
Lifted/adapted from siblings in `/Users/julian/dev/RevOps_Portfolio/`: the Anthropic route + markdown-loading + Vitest mock harness from `lead-scoring-against-ICP`; the cached-system-block + brace-JSON-extraction + `is_connected()` gating from `deal-triage`.
