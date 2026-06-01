// Deterministic fallback fixture for any domain not in data/sample/accounts/.
// Seeded from the domain string so the same domain always yields the same
// fixture — keyless mode therefore works for ANY domain a reviewer types, not
// just the three curated demo accounts. No Math.random (would break determinism).

import type { Fixture, SampleDocument, SampleContact } from "@/lib/sample/types";

/** mulberry32 — tiny seedable PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function titleCase(s: string): string {
  return s
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

const INDUSTRIES = ["B2B SaaS", "Developer Tools", "Fintech", "Healthtech"];
const STAGES = ["Series A", "Series B", "Series C"];
const WAREHOUSES = ["Snowflake", "BigQuery", "Databricks"];
const HQS = [
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX (remote-first)",
  "Boston, MA",
  "Denver, CO (hybrid)",
];

const CONTACT_TEMPLATES: { name: string; title: string; slug: string }[] = [
  { name: "Jordan Avery", title: "Chief Revenue Officer", slug: "jordanavery-cro" },
  { name: "Riley Chen", title: "VP Revenue Operations", slug: "rileychen-revops" },
  { name: "Morgan Diaz", title: "VP Product", slug: "morgandiaz-product" },
  { name: "Casey Nolan", title: "Director of Sales Operations", slug: "caseynolan-salesops" },
];

/** Build a plausible, deterministic fixture for an arbitrary domain. */
export function makeGenericFixture(domain: string): Fixture {
  const clean = domain.trim().toLowerCase();
  const rand = mulberry32(hashString(clean));
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  const baseName = clean.replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0];
  const name = titleCase(baseName.replace(/[^a-z0-9]+/g, " "));
  const industry = pick(INDUSTRIES);
  const stage = pick(STAGES);
  const warehouse = pick(WAREHOUSES);
  const hq = pick(HQS);
  const employeeCount = 150 + Math.floor(rand() * 1600);
  const raise = 20 + Math.floor(rand() * 100);

  const documents: SampleDocument[] = [
    {
      url: `https://${clean}/about`,
      title: `About ${name}`,
      snippet: `${name} is a ${industry} company of roughly ${employeeCount} employees based in ${hq}.`,
      body: `${name} is a ${industry} company headquartered in ${hq} with about ${employeeCount} employees. It sells software to other businesses.`,
      topics: ["company"],
    },
    {
      url: `https://${clean}/blog/funding`,
      title: `${name} raises $${raise}M ${stage}`,
      snippet: `${name} announced a $${raise}M ${stage} to expand its go-to-market organization.`,
      body: `${name} announced a $${raise}M ${stage} financing round, earmarked for expanding its sales, marketing, and revenue-operations functions.`,
      topics: ["funding", "growth"],
    },
    {
      url: `https://${clean}/careers`,
      title: `Careers — ${name}`,
      snippet: `${name} is expanding its revenue team, including revenue-operations and sales roles.`,
      body: `${name} lists multiple open go-to-market roles, including revenue operations and sales positions, indicating active commercial expansion.`,
      topics: ["hiring", "revops"],
    },
    {
      url: `https://${clean}/blog/data-stack`,
      title: `${name} on its data stack`,
      snippet: `${name} runs its analytics on ${warehouse}.`,
      body: `${name}'s engineering team runs analytics on ${warehouse}, consolidating product and business data for reporting.`,
      topics: ["data", "warehouse"],
    },
  ];

  const nContacts = 2 + Math.floor(rand() * 2); // 2–3
  const contacts: SampleContact[] = CONTACT_TEMPLATES.slice(0, nContacts).map((c) => ({
    name: c.name,
    title: c.title,
    email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@${clean}`,
    linkedinUrl: `https://www.linkedin.com/in/${c.slug}`,
  }));

  return {
    domain: clean,
    firmographics: {
      name,
      domain: clean,
      industry,
      employeeCount,
      hqLocation: hq,
      fundingStage: stage,
      description: `${name} builds ${industry} software for other businesses.`,
    },
    documents,
    contacts,
    crm: null,
  };
}
