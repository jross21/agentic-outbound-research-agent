// ICP fit-scoring — grades the researched ACCOUNT against an ICP definition and
// surfaces the research points that support or weaken fit, each cited to the
// evidence ledger. Mirrors the synthesis live/scripted split and the groundedness
// "model proposes → code verifies citations" discipline. Informational only — it
// does NOT gate enrollment (groundedness does).

import type { AccountResearch, EvidenceEntry, FitReport, FitSignal, FitTier } from "@/lib/types";
import { SELLER, resolveModelMode } from "@/lib/config";
import { SYNTHESIS_MODEL, MAX_FIT_TOKENS } from "@/lib/constants";
import { buildCachedSystem } from "@/lib/anthropic/cache";
import { loadPrompt, loadIcp } from "@/lib/anthropic/prompts";
import { completeJson } from "@/lib/anthropic/complete";

const TIERS: readonly FitTier[] = ["strong", "moderate", "weak", "no-fit"];

function tierFor(score: number): FitTier {
  if (score >= 0.85) return "strong";
  if (score >= 0.6) return "moderate";
  if (score >= 0.35) return "weak";
  return "no-fit";
}

// US-state abbreviations or an explicit US mention.
const US_GEO =
  /\b(A[LKZR]|C[AOT]|DE|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY])\b|united states|\bu\.?s\.?a?\b/i;
const WAREHOUSE = /snowflake|bigquery|databricks|warehouse|data stack|usage-based|product-led|\bplg\b/i;

function firmoEvidenceId(ledger: EvidenceEntry[]): string | undefined {
  return (
    ledger.find((e) => e.provider === "enrichment" && /employee/i.test(e.claim)) ??
    ledger.find((e) => e.provider === "enrichment")
  )?.id;
}
function techEvidenceId(ledger: EvidenceEntry[]): string | undefined {
  return ledger.find((e) => WAREHOUSE.test(e.claim) || WAREHOUSE.test(e.snippet))?.id;
}

/** Deterministic fit scoring against SELLER.icp (keyless / sample mode). */
export function scriptedFit(research: AccountResearch): FitReport {
  const f = research.firmographics;
  const icp = SELLER.icp;
  const ledger = research.ledger;
  const firmoId = firmoEvidenceId(ledger);
  const firmoCite = firmoId ? [firmoId] : [];
  const techId = techEvidenceId(ledger);

  const industryMatch =
    !!f?.industry && icp.industries.some((i) => i.toLowerCase() === f.industry!.toLowerCase());
  const n = f?.employeeCount;
  const sizeMatch = typeof n === "number" && n >= icp.employeeRange[0] && n <= icp.employeeRange[1];
  const geoMatch = !!f?.hqLocation && US_GEO.test(f.hqLocation);
  const techMatch = !!techId;

  const signals: FitSignal[] = [
    {
      text: industryMatch
        ? `${f?.industry} is a target vertical for ${SELLER.product}.`
        : `Industry "${f?.industry ?? "unknown"}" is outside the target verticals (${icp.industries.join(", ")}).`,
      polarity: industryMatch ? "supports" : "against",
      evidenceIds: firmoCite,
    },
    {
      text: sizeMatch
        ? `~${n} employees sits in the ${icp.employeeRange[0]}–${icp.employeeRange[1]} sweet spot.`
        : `Headcount (${n ?? "unknown"}) is outside the ${icp.employeeRange[0]}–${icp.employeeRange[1]} sweet spot.`,
      polarity: sizeMatch ? "supports" : "against",
      evidenceIds: firmoCite,
    },
    {
      text: geoMatch
        ? `US-headquartered (${f?.hqLocation}).`
        : `HQ (${f?.hqLocation ?? "unknown"}) is outside the target geo (${icp.geos.join(", ")}).`,
      polarity: geoMatch ? "supports" : "against",
      evidenceIds: firmoCite,
    },
    {
      text: techMatch
        ? `Runs a modern data warehouse / product-led motion — the technographic ${SELLER.product} plugs into.`
        : `No public signal of a modern data warehouse or product-led motion.`,
      polarity: techMatch ? "supports" : "against",
      evidenceIds: techId ? [techId] : [],
    },
  ];

  const supports = signals.filter((s) => s.polarity === "supports").length;
  const score = signals.length ? supports / signals.length : 0;
  const tier = tierFor(score);
  const name = f?.name ?? research.input.domain;
  const rationale = `${name} matches ${supports}/${signals.length} ICP dimensions (industry, size, geo, technographics) — a ${tier.replace("-", " ")} fit for ${SELLER.product}.`;

  return { score, tier, rationale, signals, icpSource: research.input.icpDefinition ? "custom" : "sample" };
}

type RawFit = {
  score?: number;
  tier?: string;
  rationale?: string;
  signals?: { text?: string; polarity?: string; evidenceIds?: unknown }[];
};

/** Claude-powered fit scoring against a (possibly pasted) ICP definition. */
export async function liveFit(research: AccountResearch, icpText: string): Promise<FitReport> {
  const f = research.firmographics;
  const system = buildCachedSystem(loadPrompt("icp_fit"));
  const user = [
    `# ICP definition`,
    icpText,
    ``,
    `# Account`,
    `${f?.name ?? research.input.domain} (${research.input.domain})`,
    f ? `Firmographics: ${f.industry ?? "?"}, ~${f.employeeCount ?? "?"} employees, ${f.hqLocation ?? "?"}, ${f.fundingStage ?? "?"}` : "",
    ``,
    `# Evidence ledger (cite ONLY these ids in evidenceIds)`,
    research.ledger.map((e) => `- ${e.id} | ${e.claim} (source: ${e.sourceUrl})`).join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await completeJson<RawFit>({ system, user, model: SYNTHESIS_MODEL, maxTokens: MAX_FIT_TOKENS });
  const score = typeof raw.score === "number" ? Math.max(0, Math.min(1, raw.score)) : 0;
  const tier: FitTier = TIERS.includes(raw.tier as FitTier) ? (raw.tier as FitTier) : tierFor(score);
  const signals: FitSignal[] = (raw.signals ?? []).map((s) => ({
    text: String(s.text ?? ""),
    polarity: s.polarity === "against" ? "against" : "supports",
    evidenceIds: Array.isArray(s.evidenceIds) ? s.evidenceIds.filter((x): x is string => typeof x === "string") : [],
  }));

  return {
    score,
    tier,
    rationale: String(raw.rationale ?? ""),
    signals,
    icpSource: research.input.icpDefinition ? "custom" : "sample",
  };
}

/** Drop fabricated citations (signals may still be uncited — that's legitimate). */
export function sanitizeFitSignals(signals: FitSignal[], validIds: Set<string>): FitSignal[] {
  return signals.map((s) => ({ ...s, evidenceIds: s.evidenceIds.filter((id) => validIds.has(id)) }));
}

/** Score the account and attach a verified FitReport. Picks live vs scripted. */
export async function scoreFit(research: AccountResearch): Promise<AccountResearch> {
  const validIds = new Set(research.ledger.map((e) => e.id));
  const fit =
    resolveModelMode() === "live"
      ? await liveFit(research, research.input.icpDefinition ?? loadIcp())
      : scriptedFit(research);
  return { ...research, fit: { ...fit, signals: sanitizeFitSignals(fit.signals, validIds) } };
}
