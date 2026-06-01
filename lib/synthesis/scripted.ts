// Deterministic, citation-bound synthesis for keyless runs (and tests). Builds a
// POV + multi-touch sequence directly from the evidence ledger, citing only real
// ledger ids. The copy references the cited facts so the citations are
// meaningful — this is the keyless equivalent of the Claude synthesis path.

import type {
  AccountResearch,
  EvidenceEntry,
  Pov,
  Sequence,
  SelectedContact,
  Touch,
} from "@/lib/types";
import { SELLER, getPersona } from "@/lib/config";

const PERSONA_VP: Record<string, string> = {
  "rev-ops": "kill-tool-sprawl",
  "vp-revenue": "forecast-trust",
  "vp-product": "unify-signals",
};

function vpFor(personaId: string) {
  const id = PERSONA_VP[personaId] ?? SELLER.valueProps[0].id;
  return SELLER.valueProps.find((v) => v.id === id) ?? SELLER.valueProps[0];
}

// Ordered so the strongest "why now" signal is preferred as the primary hook.
const SIGNAL_PATTERNS: RegExp[] = [
  /\braised\b|series\s+[a-e]\b|\$\s?\d|financing|funding round/i,
  /appointed|named .*(chief|cro)|chief revenue officer|new chief revenue/i,
  /hiring|\bhired\b|expanding its|head of revenue|vp of revenue|first vp|revops|revenue operations/i,
  /launch|introduc|rolled out|real-time/i,
  /net revenue retention|retention|churn|expansion/i,
  /snowflake|bigquery|databricks|warehouse|data stack/i,
];

function find(ledger: EvidenceEntry[], re: RegExp): EvidenceEntry | undefined {
  return ledger.find((e) => re.test(e.claim) || re.test(e.snippet));
}

function distinctSignals(ledger: EvidenceEntry[]): EvidenceEntry[] {
  const found: EvidenceEntry[] = [];
  const seen = new Set<string>();
  for (const re of SIGNAL_PATTERNS) {
    const e = find(ledger, re);
    if (e && !seen.has(e.id)) {
      seen.add(e.id);
      found.push(e);
    }
  }
  return found;
}

function firmoEntry(ledger: EvidenceEntry[]): EvidenceEntry | undefined {
  return (
    ledger.find((e) => e.provider === "enrichment" && /employee/i.test(e.claim)) ??
    ledger.find((e) => e.provider === "enrichment")
  );
}

function shorten(s: string, n = 150): string {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}
function lower1(s: string): string {
  return s.length ? s[0].toLowerCase() + s.slice(1) : s;
}

function subjectFor(e: EvidenceEntry | undefined, company: string): string {
  if (!e) return `a thought for ${company}`;
  if (/raised|series|\$|financing/i.test(e.claim)) return `congrats on the raise — one idea for ${company}`;
  if (/appointed|chief revenue/i.test(e.claim)) return `for the new GTM chapter at ${company}`;
  if (/hiring|head of|vp of revenue|first vp|revenue operations/i.test(e.claim))
    return `building out RevOps at ${company}?`;
  if (/launch|introduc|real-time/i.test(e.claim)) return `on the new launch at ${company}`;
  return `a thought for ${company}`;
}

export function scriptedSynthesis(
  research: AccountResearch,
  contact: SelectedContact | undefined
): { pov: Pov; sequence: Sequence } {
  const ledger = research.ledger;
  const company = research.firmographics?.name ?? research.input.domain;
  const persona = getPersona(research.input.personaId);
  const personaLabel = persona?.label ?? research.input.personaId;
  const vp = vpFor(research.input.personaId);

  const signals = distinctSignals(ledger);
  const firmo = firmoEntry(ledger);
  const primary = signals[0];
  const secondary = signals.find((s) => s.id !== primary?.id);
  const dataE = find(ledger, /snowflake|bigquery|databricks|warehouse|data stack/i) ?? firmo;
  const firstName = contact?.name?.split(" ")[0] ?? "there";

  const povClaims = [
    ...(primary ? [{ text: primary.claim, evidenceIds: [primary.id] }] : []),
    ...(firmo ? [{ text: firmo.claim, evidenceIds: [firmo.id] }] : []),
  ];

  const pov: Pov = {
    whyYou: `${SELLER.product} is ${SELLER.oneLiner}. For a ${personaLabel} at ${company}, the concrete payoff: ${vp.detail}`,
    whyNow: primary
      ? `${shorten(primary.claim)} That makes now the moment to ${vp.headline.toLowerCase()} — before the team scales on a fragmented data stack.`
      : `${company} fits the profile of teams that get value from ${SELLER.product}; worth a timely conversation.`,
    claims: povClaims,
  };

  const touches: Touch[] = [
    {
      channel: "email",
      day: 0,
      subject: subjectFor(primary, company),
      body: [
        `Hi ${firstName},`,
        ``,
        primary
          ? `Saw that ${lower1(shorten(primary.claim))} Teams at that inflection usually feel the pain of product usage and CRM data living in separate places.`
          : `${company} looks like exactly the kind of team that benefits from one shared signal layer across product and revenue.`,
        ``,
        `${SELLER.product} ${lower1(vp.detail)} Worth a 20-minute look at how that maps to your priorities as ${personaLabel}?`,
      ].join("\n"),
      claims: primary
        ? [{ text: primary.claim, evidenceIds: [primary.id] }]
        : firmo
          ? [{ text: firmo.claim, evidenceIds: [firmo.id] }]
          : [],
    },
    {
      channel: "linkedin",
      day: 2,
      body: dataE
        ? `Hi ${firstName} — noticed ${lower1(shorten(dataE.claim, 110))} ${SELLER.product} sits on top of that to put product usage right next to pipeline in the CRM. Open to a quick note?`
        : `Hi ${firstName} — building toward one signal layer for GTM + product at ${company}? Happy to share how ${SELLER.product} approaches it.`,
      claims: dataE ? [{ text: dataE.claim, evidenceIds: [dataE.id] }] : [],
    },
    {
      channel: "email",
      day: 5,
      subject: `Re: ${company} + ${SELLER.product}`,
      body: [
        `Hi ${firstName},`,
        ``,
        secondary
          ? `One more reason this feels timely: ${lower1(shorten(secondary.claim))}`
          : `Circling back in case this got buried.`,
        ``,
        `If ${lower1(vp.headline)} is on your roadmap this quarter, I can show how similar ${
          research.firmographics?.industry ?? "B2B"
        } teams got there in weeks — not a multi-quarter data-engineering project.`,
      ].join("\n"),
      claims: secondary ? [{ text: secondary.claim, evidenceIds: [secondary.id] }] : [],
    },
  ];

  return { pov, sequence: { name: `${company} — ${personaLabel} (${SELLER.product})`, touches } };
}
