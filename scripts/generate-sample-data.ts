// Regenerates the curated offline account fixtures in data/sample/accounts/.
// Deterministic by construction (no Math.random / Date.now) so sample runs and
// tests are reproducible. Run: `npm run generate-sample`.
//
// Run via Node's native TypeScript stripping (Node >= 22.6 with
// --experimental-strip-types). Type-only imports below are erased at runtime,
// so no module resolution happens for them.

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { Fixture } from "../lib/sample/types.ts";

// Mirror of constants.ts SAMPLE_ACCOUNTS_DIR (kept inline so this script has no
// runtime imports from lib/).
const OUT_DIR = join(process.cwd(), "data", "sample", "accounts");

function slug(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const ACCOUNTS: Fixture[] = [
  {
    domain: "acme-cloud.io",
    firmographics: {
      name: "Acme Cloud",
      domain: "acme-cloud.io",
      industry: "Developer Tools",
      employeeCount: 620,
      hqLocation: "San Francisco, CA (remote-first)",
      fundingStage: "Series B",
      description:
        "Managed cloud platform that lets engineering teams ship and scale services without operating Kubernetes themselves.",
    },
    documents: [
      {
        url: "https://acme-cloud.io/about",
        title: "About Acme Cloud",
        snippet:
          "Acme Cloud is a remote-first company of 620 employees whose managed platform is used by more than 4,000 engineering teams.",
        body: "Acme Cloud is a remote-first company of 620 employees. Our managed cloud platform is used by more than 4,000 engineering teams to ship and scale services without operating Kubernetes directly. We are headquartered in San Francisco with employees across North America and Europe.",
        topics: ["company", "customers"],
      },
      {
        url: "https://techcrunch.com/2026/03/14/acme-cloud-series-b",
        title: "Acme Cloud raises $55M Series B to expand go-to-market",
        snippet:
          "Acme Cloud raised a $55M Series B led by Lightspeed in March 2026, earmarking the round to expand its go-to-market and data teams.",
        body: "Acme Cloud announced a $55M Series B led by Lightspeed Venture Partners in March 2026. CEO statements indicate the capital will fund expansion of the company's go-to-market organization and a new central data team tasked with unifying product and revenue analytics.",
        topics: ["funding", "growth"],
      },
      {
        url: "https://acme-cloud.io/careers",
        title: "Careers — Acme Cloud",
        snippet:
          "Acme Cloud is hiring a Head of Revenue Operations plus three RevOps analysts to unify its go-to-market data stack.",
        body: "Open roles at Acme Cloud include Head of Revenue Operations, three Revenue Operations Analysts, and two data engineers. The Head of RevOps job description calls out 'unifying our fragmented go-to-market data stack' and 'building a single source of truth for pipeline and usage' as priorities.",
        topics: ["hiring", "revops"],
      },
      {
        url: "https://acme-cloud.io/blog/usage-based-billing",
        title: "Introducing usage-based billing",
        snippet:
          "Acme Cloud launched usage-based billing in February 2026, citing strong customer demand for consumption pricing.",
        body: "In February 2026 Acme Cloud rolled out usage-based billing. The post notes that consumption pricing makes product-usage data central to how the company forecasts revenue and identifies expansion opportunities.",
        topics: ["launch", "product"],
      },
      {
        url: "https://acme-cloud.io/blog/analytics-on-snowflake",
        title: "How we centralized analytics on Snowflake",
        snippet:
          "Acme Cloud migrated its analytics to Snowflake in late 2025 to centralize product and revenue data in one warehouse.",
        body: "Acme Cloud's data team describes migrating analytics to Snowflake in late 2025. A stated goal was to bring product-usage events and CRM data into one warehouse so go-to-market teams could act on the same numbers.",
        topics: ["data", "warehouse"],
      },
    ],
    contacts: [
      {
        name: "David Kim",
        title: "Chief Revenue Officer",
        email: "david.kim@acme-cloud.io",
        linkedinUrl: "https://www.linkedin.com/in/davidkim-cro",
      },
      {
        name: "Sam Whitfield",
        title: "Director of Revenue Operations",
        email: "sam.whitfield@acme-cloud.io",
        linkedinUrl: "https://www.linkedin.com/in/samwhitfield-revops",
      },
      {
        name: "Priya Nair",
        title: "VP Product",
        email: "priya.nair@acme-cloud.io",
        linkedinUrl: "https://www.linkedin.com/in/priyanair-product",
      },
      {
        name: "Elena Ruiz",
        title: "VP of Sales",
        email: "elena.ruiz@acme-cloud.io",
        linkedinUrl: "https://www.linkedin.com/in/elenaruiz-sales",
      },
    ],
    crm: {
      owner: "Julian Ross",
      lifecycleStage: "Marketing Qualified Lead",
      lastContacted: "2026-01-15",
      priorTouches: [
        {
          date: "2025-11-20",
          type: "webinar",
          note: "Sam Whitfield attended the 'Usage data in the CRM' webinar.",
        },
        {
          date: "2026-01-15",
          type: "email",
          note: "Cold email opened twice, no reply.",
        },
      ],
    },
  },
  {
    domain: "nimbus-health.com",
    firmographics: {
      name: "Nimbus Health",
      domain: "nimbus-health.com",
      industry: "Healthtech",
      employeeCount: 880,
      hqLocation: "Boston, MA",
      fundingStage: "Series C",
      description:
        "Virtual care platform connecting patients with clinicians across all 50 states.",
    },
    documents: [
      {
        url: "https://nimbus-health.com/company",
        title: "Company — Nimbus Health",
        snippet:
          "Nimbus Health employs 880 people and serves patients across all 50 states through its virtual care platform.",
        body: "Nimbus Health is a virtual care platform headquartered in Boston. The company employs 880 people and connects patients with licensed clinicians across all 50 states.",
        topics: ["company"],
      },
      {
        url: "https://www.businesswire.com/news/nimbus-health-series-c",
        title: "Nimbus Health closes $120M Series C",
        snippet:
          "Nimbus Health closed a $120M Series C in April 2026 to scale its commercial organization.",
        body: "Nimbus Health announced a $120M Series C in April 2026. The company said the round will fund scaling its commercial and revenue organization as it moves upmarket toward enterprise health systems.",
        topics: ["funding", "growth"],
      },
      {
        url: "https://nimbus-health.com/newsroom/new-cro",
        title: "Nimbus Health names new Chief Revenue Officer",
        snippet:
          "Nimbus Health appointed former Veeva executive Rachel Adler as Chief Revenue Officer in April 2026.",
        body: "Nimbus Health appointed Rachel Adler, previously a commercial leader at Veeva, as Chief Revenue Officer in April 2026. Adler is tasked with building a repeatable enterprise go-to-market motion.",
        topics: ["leadership", "hiring"],
      },
      {
        url: "https://nimbus-health.com/newsroom/2025-results",
        title: "2025 in review",
        snippet:
          "Nimbus Health reported 130% net revenue retention in 2025, driven by expansion within enterprise health systems.",
        body: "Nimbus Health reported 130% net revenue retention for 2025. The company attributes the result to expansion within existing enterprise health-system accounts and notes growing reliance on product-usage signals to time those expansions.",
        topics: ["product", "retention"],
      },
    ],
    contacts: [
      {
        name: "Rachel Adler",
        title: "Chief Revenue Officer",
        email: "rachel.adler@nimbus-health.com",
        linkedinUrl: "https://www.linkedin.com/in/racheladler-cro",
      },
      {
        name: "Tomás Vega",
        title: "VP Revenue Operations",
        email: "tomas.vega@nimbus-health.com",
        linkedinUrl: "https://www.linkedin.com/in/tomasvega-revops",
      },
      {
        name: "Hannah Brooks",
        title: "VP Product",
        email: "hannah.brooks@nimbus-health.com",
        linkedinUrl: "https://www.linkedin.com/in/hannahbrooks-product",
      },
    ],
    crm: null,
  },
  {
    domain: "ledgerflow.io",
    firmographics: {
      name: "Ledgerflow",
      domain: "ledgerflow.io",
      industry: "Fintech",
      employeeCount: 340,
      hqLocation: "New York, NY (hybrid)",
      fundingStage: "Series B",
      description:
        "Embedded payments and double-entry ledger APIs for vertical SaaS platforms.",
    },
    documents: [
      {
        url: "https://ledgerflow.io/about",
        title: "About Ledgerflow",
        snippet:
          "Ledgerflow is a 340-person fintech providing embedded payments and double-entry ledger APIs to vertical SaaS platforms.",
        body: "Ledgerflow provides embedded payments and double-entry ledger APIs that vertical SaaS platforms use to move and reconcile money. The company employs 340 people and is based in New York with a hybrid work model.",
        topics: ["company"],
      },
      {
        url: "https://ledgerflow.io/blog/series-b",
        title: "Ledgerflow raises $48M Series B",
        snippet:
          "Ledgerflow raised a $48M Series B led by Andreessen Horowitz in January 2026.",
        body: "Ledgerflow announced a $48M Series B led by Andreessen Horowitz in January 2026, to be used for product expansion and growing its revenue team.",
        topics: ["funding", "growth"],
      },
      {
        url: "https://ledgerflow.io/blog/real-time-reconciliation",
        title: "Launching real-time reconciliation",
        snippet:
          "Ledgerflow launched a real-time reconciliation product in May 2026 aimed at customer finance teams.",
        body: "In May 2026 Ledgerflow launched a real-time reconciliation product. The launch broadens the buyer set beyond engineering to include finance and operations leaders at customer companies.",
        topics: ["launch", "product"],
      },
      {
        url: "https://ledgerflow.io/careers",
        title: "Careers — Ledgerflow",
        snippet:
          "Ledgerflow recently hired its first VP of Revenue Operations and is expanding its revenue team.",
        body: "Ledgerflow recently hired its first VP of Revenue Operations and lists multiple open roles across sales and customer success, signaling a build-out of its go-to-market function.",
        topics: ["hiring", "revops"],
      },
      {
        url: "https://ledgerflow.io/blog/data-stack",
        title: "Our data stack",
        snippet:
          "Ledgerflow runs its data stack on BigQuery and dbt.",
        body: "Ledgerflow's engineering team details running analytics on BigQuery with dbt for transformations, consolidating product and billing data for internal reporting.",
        topics: ["data", "warehouse"],
      },
    ],
    contacts: [
      {
        name: "Marcus Lee",
        title: "VP Revenue Operations",
        email: "marcus.lee@ledgerflow.io",
        linkedinUrl: "https://www.linkedin.com/in/marcuslee-revops",
      },
      {
        name: "Dana Foster",
        title: "Chief Revenue Officer",
        email: "dana.foster@ledgerflow.io",
        linkedinUrl: "https://www.linkedin.com/in/danafoster-cro",
      },
      {
        name: "Arjun Patel",
        title: "VP Product",
        email: "arjun.patel@ledgerflow.io",
        linkedinUrl: "https://www.linkedin.com/in/arjunpatel-product",
      },
    ],
    crm: {
      owner: "Julian Ross",
      lifecycleStage: "Subscriber",
      lastContacted: "2026-04-02",
      priorTouches: [
        {
          date: "2026-04-02",
          type: "newsletter",
          note: "Marcus Lee subscribed to the RevOps newsletter.",
        },
      ],
    },
  },
];

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const account of ACCOUNTS) {
    const file = join(OUT_DIR, `${slug(account.domain)}.json`);
    writeFileSync(file, JSON.stringify(account, null, 2) + "\n", "utf-8");
    console.log(`wrote ${file}`);
  }
  console.log(`\n${ACCOUNTS.length} sample accounts generated.`);
}

main();
