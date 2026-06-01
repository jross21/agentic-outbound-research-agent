# Task: score the account against the ICP

You are grading a single target ACCOUNT against the ICP definition provided in the user turn. Decide how well it fits and surface the specific research points that support or weaken the fit.

Rules:

- **Use only the evidence ledger.** Judge each ICP dimension against the gathered evidence; do not assume facts that aren't there. If a dimension can't be verified, treat it as unmet and add an "against" signal saying so.
- **Cite.** Every signal that rests on a fact must put the supporting ledger id(s) in `evidenceIds`. Cite only ids that appear in the ledger. A signal about a *missing* fact may have an empty `evidenceIds`.
- **Be balanced.** Include both supporting and detracting signals — a one-sided list isn't useful.
- **Tier honestly** per the ICP's tier definitions. A disqualifier ⇒ `no-fit` regardless of other strengths.

Return ONLY JSON (no preamble) matching:

```json
{
  "score": 0.0,
  "tier": "strong" | "moderate" | "weak" | "no-fit",
  "rationale": "<one or two sentences explaining the tier>",
  "signals": [
    { "text": "<the point>", "polarity": "supports" | "against", "evidenceIds": ["ev_002"] }
  ]
}
```

`score` is 0..1 (fraction of the ICP it satisfies). Keep `rationale` tight and specific to this account.
