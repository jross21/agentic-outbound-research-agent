# Signalform — Ideal Customer Profile

The definition the agent grades a target account against. It mirrors the structured ICP in `lib/config.ts` (`SELLER.icp`) in prose, and doubles as the cached context the live fit-scorer reasons with. In the live tool this can be replaced by pasting your own ICP; the demo scores against this one.

**Who we sell to:** US-based B2B software companies, ~150–2,000 employees, running a product-led or hybrid sales motion on a modern cloud data warehouse — the teams that feel the pain of product usage and CRM data living in separate places.

## Must-haves (strong fit requires all)

- **Vertical** — B2B SaaS, Developer Tools, Fintech, or Healthtech. These teams instrument product usage and sell into other businesses.
- **Size** — roughly 150–2,000 employees. Big enough to have a real RevOps/GTM data problem, small enough to buy without a 12-month procurement cycle.
- **Geography** — headquartered in the United States (the only geo currently supported).
- **Technographics** — operates a product-led or hybrid motion **and** runs a modern cloud data warehouse (Snowflake / BigQuery / Databricks). This is the substrate Signalform plugs into.

## Strengtheners (raise confidence within a tier)

- Recent funding (Series A–C) — fresh budget for GTM tooling and a mandate to scale.
- A new revenue leader (CRO / VP RevOps) or active RevOps hiring — someone owns the problem now.
- A move to usage-based or consumption pricing — makes product-usage data strategic to forecasting.
- Public mention of reverse-ETL, manual usage exports, or "getting usage into the CRM" — the exact pain we remove.

## Disqualifiers (any one ⇒ no-fit)

- Fewer than ~80 or more than ~3,000 employees.
- Outside the United States.
- Not B2B software (consumer, services, hardware-only, government).
- No product to instrument (pure services / agencies).

## Fit tiers

- **Strong** — meets all must-haves; usually multiple strengtheners present.
- **Moderate** — meets most must-haves but missing one (e.g. no visible warehouse/PLG signal, or slightly outside the size band).
- **Weak** — adjacent but a real gap on vertical, size, or technographics.
- **No-fit** — a disqualifier applies.

## How to score

Judge the account against the must-haves using only the gathered evidence. Cite the specific research point (evidence id) behind each supporting or detracting signal. If a dimension can't be verified from the evidence, treat it as unmet and say so — do not assume.
