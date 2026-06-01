// The curated, fictional demo accounts available in sample (keyless) mode. This
// is the single source of truth for the demo-account picker and for the
// sample-mode gate in /api/research. Sample mode supports ONLY these accounts —
// there is intentionally no fabrication of data for arbitrary real domains.

import { slugDomain } from "@/lib/sample/load";

export type DemoAccount = {
  domain: string;
  name: string;
  industry: string;
  blurb: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    domain: "acme-cloud.io",
    name: "Acme Cloud",
    industry: "Developer Tools",
    blurb:
      "Series B dev-tools platform (~620 ppl) hiring a Head of RevOps; just moved to usage-based billing.",
  },
  {
    domain: "nimbus-health.com",
    name: "Nimbus Health",
    industry: "Healthtech",
    blurb:
      "Series C virtual-care platform (~880 ppl) with a brand-new CRO and 130% net revenue retention.",
  },
  {
    domain: "ledgerflow.io",
    name: "Ledgerflow",
    industry: "Fintech",
    blurb:
      "Series B embedded-payments API (~340 ppl); just hired its first VP RevOps and launched real-time reconciliation.",
  },
];

const DEMO_SLUGS = new Set(DEMO_ACCOUNTS.map((a) => slugDomain(a.domain)));

/** True if the domain matches one of the built-in fictional demo accounts. */
export function isDemoAccount(domain: string): boolean {
  return DEMO_SLUGS.has(slugDomain(domain));
}
