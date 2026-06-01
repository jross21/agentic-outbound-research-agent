// ─────────────────────────────────────────────────────────────────────────────
// Configuration: WHO we are selling (ICP + value props) and WHO we target
// (personas), plus runtime mode/provider gating.
//
// The SELLER block is the equivalent of deal-triage's METHODOLOGY constants and
// the ICP tool's RUBRIC — it makes the generated outreach specific to a product.
// Swap this block to retarget the agent at a different offering.
//
// Pure data (SELLER, PERSONAS) is safe to import from client components. The env
// helpers at the bottom read process.env and are only meaningful server-side;
// they return booleans (never key values), so an accidental client call is
// harmless — it simply reports "not connected".
// ─────────────────────────────────────────────────────────────────────────────

import type { Persona } from "@/lib/types";

export type ValueProp = {
  id: string;
  headline: string;
  detail: string;
};

export type Seller = {
  product: string;
  oneLiner: string;
  icp: {
    industries: string[];
    employeeRange: [number, number];
    geos: string[];
    technographics: string[];
  };
  valueProps: ValueProp[];
};

/** The (fictional) product the agent does outbound for. */
export const SELLER: Seller = {
  product: "Signalform",
  oneLiner:
    "a product-signal platform that unifies product-usage data and CRM records so revenue teams act on the same buying signals instead of arguing about them",
  icp: {
    industries: ["B2B SaaS", "Developer Tools", "Fintech", "Healthtech"],
    employeeRange: [150, 2000],
    geos: ["United States"],
    technographics: [
      "operates a product-led or hybrid sales motion",
      "runs a modern cloud data warehouse (Snowflake / BigQuery / Databricks)",
    ],
  },
  valueProps: [
    {
      id: "unify-signals",
      headline: "One signal layer for GTM + Product",
      detail:
        "Joins product usage to CRM so AEs, CS, and PMs see the same account health and act before renewals or expansion slip.",
    },
    {
      id: "kill-tool-sprawl",
      headline: "Replace the reverse-ETL + spreadsheet stack",
      detail:
        "Consolidates the brittle reverse-ETL jobs and manual usage exports RevOps teams maintain to get usage into the CRM.",
    },
    {
      id: "forecast-trust",
      headline: "Forecasts grounded in usage, not vibes",
      detail:
        "Surfaces leading usage indicators so forecast calls are defensible and pipeline reviews stop relying on rep optimism.",
    },
  ],
};

/** Buyer personas the agent can target. titleMatches drive contact ranking. */
export const PERSONAS: Persona[] = [
  {
    id: "rev-ops",
    label: "Head of Revenue Operations",
    titleMatches: [
      "revenue operations",
      "revops",
      "rev ops",
      "sales operations",
      "gtm operations",
      "head of operations",
    ],
    priorities: [
      "eliminating tool sprawl and brittle data pipelines",
      "trustworthy pipeline and forecast data",
      "fast time-to-value without a long data-engineering project",
    ],
  },
  {
    id: "vp-revenue",
    label: "VP Revenue / CRO",
    titleMatches: [
      "chief revenue officer",
      "cro",
      "vp revenue",
      "vp of sales",
      "vp sales",
      "head of sales",
    ],
    priorities: [
      "forecast accuracy and predictable pipeline",
      "net revenue retention and expansion",
      "rep productivity and shorter cycles",
    ],
  },
  {
    id: "vp-product",
    label: "VP Product",
    titleMatches: [
      "vp product",
      "vp of product",
      "head of product",
      "chief product officer",
      "cpo",
      "director of product",
    ],
    priorities: [
      "turning product usage into activation and expansion",
      "closing the loop between product analytics and the GTM team",
      "reducing churn through earlier usage signals",
    ],
  },
];

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

// ── Runtime env gating (server-side meaning) ─────────────────────────────────

/** Global override: force every external capability into sample/dry-run mode. */
export function isForceSample(): boolean {
  const v = process.env.FORCE_SAMPLE;
  return v === "1" || v === "true";
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Whether to drive the loop with a real model ("live") or the deterministic
 * scripted model used for fully keyless demos + tests ("scripted").
 */
export function resolveModelMode(): "live" | "scripted" {
  return hasAnthropicKey() && !isForceSample() ? "live" : "scripted";
}

export type Provider = "search" | "enrichment" | "crm" | "apollo";

const PROVIDER_ENV: Record<Provider, string> = {
  search: "SEARCH_API_KEY",
  enrichment: "ENRICHMENT_API_KEY",
  crm: "HUBSPOT_ACCESS_TOKEN",
  apollo: "APOLLO_API_KEY",
};

/** Is a given external provider configured (and not globally forced off)? */
export function isConnected(provider: Provider): boolean {
  if (isForceSample()) return false;
  return Boolean(process.env[PROVIDER_ENV[provider]]);
}

/** Per-tool mode: live only when its provider is connected. */
export function resolveToolMode(provider: Provider): "live" | "sample" {
  return isConnected(provider) ? "live" : "sample";
}

export type SequencerName = "dryrun" | "hubspot" | "apollo";

/**
 * Which sequencer to enroll into on approval. Falls back to dry-run if the
 * requested live adapter has no credentials.
 */
export function resolveSequencer(): SequencerName {
  const requested = (process.env.SEQUENCER || "dryrun") as SequencerName;
  if (requested === "hubspot" && isConnected("crm")) return "hubspot";
  if (requested === "apollo" && isConnected("apollo")) return "apollo";
  return "dryrun";
}
