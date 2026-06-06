# Outbound Research Agent

[![CI](https://github.com/jross21/agentic-outbound-research-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/jross21/agentic-outbound-research-agent/actions/workflows/ci.yml)

An autonomous GTM agent that researches a target account through a **transparent, hand-rolled tool-use loop**, builds a **cited evidence ledger**, and drafts a personalized multi-touch outbound sequence where **every claim links to a source** — then waits for **human approval** before anything is enrolled.

Built to demonstrate agentic systems for a GTM-engineering portfolio: a real plan → act → evaluate loop (not a single-shot LLM call), an anti-hallucination citation layer, and a production-shaped approval workflow. Runs **fully keyless** for reviewers — in that mode it operates on a small set of **clearly-labeled fictional demo accounts** (a real demo, not real research). **Add keys (i.e. BYOK) for live research on real domains.**

> Selling a (fictional) product, **Signalform** — *a product-signal platform that unifies product-usage data and CRM records so revenue teams act on the same buying signals.* Retarget the agent by editing `SELLER` in `lib/config.ts`.

## Quickstart (keyless — no API keys needed)

```bash
npm install
npm run generate-sample   # writes deterministic fixtures to data/sample/
npm run dev               # http://localhost:3000
```

Then **pick one of the fictional demo accounts** (Acme Cloud, Nimbus Health, or Ledgerflow) and watch:

1. the **agent trace** stream live as it enriches firmographics, searches, fetches pages, finds contacts, and checks CRM history;
2. an **ICP fit score** — the account graded *strong / moderate / weak / no-fit* against the ICP, with the research points that support or weaken fit, each cited;
3. the **evidence ledger** fill with cited facts (each with a clickable source), badged `★ fit` / `✉ in outreach`;
4. a **why-you / why-now POV**, a selected contact, and an **editable multi-touch sequence** whose personalization points link back to the research — hover a citation to highlight the exact evidence row (and vice-versa);
5. a **groundedness score** (% of claims cited);
6. **Approve & enroll** → the dry-run sequencer writes the exact enrollment payload to `data/out/`.

### Sample mode vs. live mode

With no `ANTHROPIC_API_KEY` the app is in **sample mode**: a deterministic **scripted model** replays a realistic research plan against canned fixtures, so the entire experience (streaming, ledger, synthesis, approval, dry-run enroll) works with zero keys. The catch — and the reason the UI says so loudly with a banner and a `SAMPLE` badge — is that the companies, people, and LinkedIn URLs are **fictional and illustrative only**; they won't resolve. Sample mode deliberately supports **only the three curated demo accounts** and refuses arbitrary domains, rather than fabricating plausible-but-fake data for a real company (that would be exactly the hallucination this tool exists to prevent).

Set `ANTHROPIC_API_KEY` (+ provider keys) for **live mode**: the real Claude loop runs and can research any domain. See the table below for what's wired today.

## Deploy on Railway

The app deploys to [Railway](https://railway.com) with no code changes — Nixpacks
auto-detects Next.js and runs `npm run build` then `npm run start` (which binds to
Railway's injected `$PORT`). Build/deploy config is version-controlled in `railway.json`.

1. **Connect** the GitHub repo as a new Railway service (Railway redeploys on every push to `main`).
2. **Generate a public URL**: service → **Settings → Networking → Generate Domain** — a deployed Railway service is private until you do this.
3. **Set the run mode**: service → **Variables** → add `FORCE_SAMPLE=1` to pin the free, deterministic **keyless sample demo** (the safe default for a public link — no secrets, no per-run cost). To run live Claude instead, set `ANTHROPIC_API_KEY` and omit `FORCE_SAMPLE`.

Open the generated `*.up.railway.app` URL and run the keyless flow above. Note: the dry-run
sequencer writes to Railway's **ephemeral** disk (`data/out/`), so those payload files don't
persist across redeploys — the payload is shown in the UI regardless.

## How it works

```
ResearchForm ─POST /api/research─▶ orchestrate.runResearch ──▶ NDJSON stream ──▶ live UI
                                        │
                          runAgent (hand-rolled tool-use loop)
                            model ⇄ tool_use ⇄ tool_result ⇄ …      (lib/agent/loop.ts)
                                        │  every tool result → evidence ledger
                                        ▼
                                   synthesize  (POV + sequence, citation-bound)
                                        │  deterministic groundedness enforcement
                                        ▼
                         review + edit ─POST /api/approve─▶ approval gate ──▶ sequencer
                                          (approved:true + grounded)        (dryrun│hubspot│apollo)
```

- **The loop** (`lib/agent/loop.ts`) is a plain implementation of the Anthropic tool-use cycle on the raw SDK message shapes — no Agent SDK, no framework. The model is injected as a `createMessage` function, so the *same loop* runs against the real API or the scripted stand-in.
- **The evidence ledger** (`lib/agent/evidence.ts`) is append-only. Tools return the facts they gather; the loop ledgers them. Synthesized outreach may cite only ledger ids.
- **Citation enforcement** (`lib/evals/groundedness.ts`) is deterministic and runs *after* synthesis and *again* at the approval gate. The model proposes citations; this code verifies them against the ledger and drops fabrications. Uncited claims are flagged and **block enrollment**.
- **The approval gate** (`app/api/approve/route.ts`) is the only path to a sequencer. It requires `approved: true` and re-checks groundedness server-side — the client cannot bypass it.

## ICP fit & traceability

The evidence ledger is the hub that ties **research → fit → personalization** together:

- **ICP fit-scoring** (`lib/synthesis/fit.ts`) grades the account against an ICP definition — pasted into the form in live mode, or the bundled `icp/ICP.md` in sample mode. It returns a tier + score + supporting/weakening signals, each **cited to the ledger**. It follows the same "model proposes → code verifies citations" discipline as groundedness, and runs deterministically in keyless mode (scored against the structured `SELLER.icp`). Fit is informational — it does not gate enrollment.
- **Traceability** — every sequence touch's personalization is bound to the evidence it cites (`Touch.claims[].evidenceIds`). In the review UI, hovering a citation highlights the exact research point in the ledger and vice-versa, and ledger rows are badged `★ fit` (drove the fit score) / `✉ in outreach` (used in the sequence). So you can see precisely which research justified each line of the email and the qualification.

## Live mode (optional)

Every external capability sits behind one interface with a live impl and a sample impl, gated by an env var (see `.env.example`).

| Capability | Live provider | Env var | Status |
|---|---|---|---|
| Model / agent loop | Anthropic (Claude) | `ANTHROPIC_API_KEY` | ✅ wired |
| `web_search` | Serper | `SEARCH_API_KEY` | ✅ wired |
| `fetch_page` | real HTTP + HTML→text | (enabled by `SEARCH_API_KEY`) | ✅ wired |
| `enrich_domain`, `find_contacts` | your provider (Apollo/Clay/…) | `ENRICHMENT_API_KEY` | ⛔ **stub** — throws until you wire the provider call |
| `crm_read` | HubSpot | `HUBSPOT_ACCESS_TOKEN` | ⛔ **stub** — not implemented yet |
| Sequencer | dry-run (default) / HubSpot / Apollo | `SEQUENCER`, `HUBSPOT_ACCESS_TOKEN`, `APOLLO_API_KEY` | dry-run wired; HubSpot/Apollo best-effort |

**Honest status:** live mode today does real web research (`web_search` + `fetch_page`) but **not** real people-enrichment — `enrich_domain`/`find_contacts`/`crm_read` are stubs to be wired to a provider. That's the main thing to build next.

`FORCE_SAMPLE=1` forces sample mode regardless of which keys are set (used in tests and demos).

Prompt caching: the static system prefix (agent prompt + `playbook/OUTBOUND_PLAYBOOK.md`) is sent as a `cache_control: ephemeral` block, so it's cached across every loop turn and synthesis call.

## The playbook

`playbook/OUTBOUND_PLAYBOOK.md` encodes the AE judgment that separates outbound that earns a reply from outbound that earns a block (relevance over volume, the why-you/why-now test, which timing signals matter, what gets deleted). It's both documentation and the cached system context the agent reasons against.

## Project structure

```
app/
  api/research/route.ts   NDJSON streaming run (the showpiece)
  api/approve/route.ts    human-approval gate → sequencer
  api/feedback/route.ts   thumbs persistence
  page.tsx                form → live trace → review → approve
lib/
  agent/loop.ts           hand-rolled tool-use loop (headline)
  agent/evidence.ts       append-only evidence ledger
  agent/scripted.ts       deterministic keyless model
  agent/tools/*           enrich / web_search / fetch_page / find_contacts / crm_read (live + sample)
  synthesis/*             POV + persona + sequence (citation-bound), live + scripted
  evals/*                 groundedness, specificity, feedback
  sequencer/*             base + dryrun + hubspot + apollo
  anthropic/*             client singleton, cached system, prompt loader, completeJson
  config.ts / constants.ts
prompts/*.md              research + synthesis prompts
playbook/OUTBOUND_PLAYBOOK.md
data/sample/              deterministic fixtures (generated)
scripts/generate-sample-data.ts
```

## Testing

```bash
npm test          # Vitest — loop dispatch, ledger grounding, citation enforcement,
                  # groundedness/specificity math, sequencer dry-run, approval-gate 422,
                  # and the keyless research stream end-to-end
npm run typecheck
```

Tests run with `FORCE_SAMPLE=1` so they never touch live APIs.

## Design decisions

- **Hand-rolled loop, not a framework** — the goal is to demonstrate that I understand agent mechanics, and to keep the dependency surface minimal.
- **Keyless by default** — a reviewer can run the whole thing offline; live integration is proven but optional.
- **Citations as a hard constraint, not a vibe** — grounding is verified by deterministic code at two points, and uncited claims are blocked from enrollment. This is the trust story.
- **Human approval before outbound** — the agent never sends; "auto-load" means the push to the sequencer is automated *on approval*.

Standalone project; patterns lifted/adapted from sibling portfolio repos (`lead-scoring-against-ICP`, `deal-triage`).
