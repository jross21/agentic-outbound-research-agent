// ─────────────────────────────────────────────────────────────────────────────
// Shared domain types for the Outbound Research Agent.
//
// These are intentionally pure (no I/O, no Anthropic imports) so they can be
// shared across the agent loop, synthesis, evals, the API routes, and the client
// UI. Module-local types (Tool, ProgressEvent, ...) live next to their modules.
// ─────────────────────────────────────────────────────────────────────────────

/** How an external capability is being fulfilled. */
export type Mode = "live" | "sample";

/** A buyer persona the agent can target. Drawn from config.ts. */
export type Persona = {
  id: string;
  label: string; // e.g. "Head of Revenue Operations"
  /** Lowercased title fragments used to rank candidate contacts. */
  titleMatches: string[];
  /** What this persona cares about — feeds POV + sequence framing. */
  priorities: string[];
};

/** The user-provided inputs that kick off a run. */
export type RunInput = {
  domain: string; // "acme.io"
  accountName?: string; // optional display name override
  trigger?: string; // optional signal hint from the user ("just raised a Series B")
  personaId: string;
};

/** Where a piece of evidence came from. */
export type EvidenceProvider = "enrichment" | "web" | "fetch" | "crm" | "sample";

/** A fact the agent wants to use, before it enters the ledger. */
export type EvidenceDraft = {
  claim: string;
  sourceUrl: string;
  provider: EvidenceProvider;
  snippet: string;
};

/** A ledgered fact: append-only, citable by id. */
export type EvidenceEntry = EvidenceDraft & {
  id: string; // "ev_001"
  fetchedAt: string; // ISO timestamp
};

export type Firmographics = {
  name: string;
  domain: string;
  industry?: string;
  employeeCount?: number;
  hqLocation?: string;
  fundingStage?: string;
  description?: string;
};

export type Contact = {
  name: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
};

/** An assertion bound to the evidence that supports it. */
export type Claim = {
  text: string;
  evidenceIds: string[];
};

/** The "why-you / why-now" thesis. Every supporting claim is cited. */
export type Pov = {
  whyYou: string;
  whyNow: string;
  claims: Claim[];
};

export type SelectedContact = Contact & {
  rationale: string; // why this contact for the requested persona
};

export type TouchChannel = "email" | "linkedin";

export type Touch = {
  channel: TouchChannel;
  day: number; // relative day in the cadence (0, 3, 7, ...)
  subject?: string; // email only
  body: string;
  /** The cited assertions this touch leans on (anti-hallucination unit). */
  claims: Claim[];
};

export type Sequence = {
  name: string;
  touches: Touch[];
};

/** Output of the deterministic citation check. */
export type GroundednessReport = {
  score: number; // 0..1 — fraction of claims with a valid citation
  total: number;
  citedCount: number;
  uncited: string[]; // claim texts lacking a valid ledger citation
};

/** The full artifact a run produces. */
export type AccountResearch = {
  input: RunInput;
  firmographics?: Firmographics;
  contacts: Contact[];
  ledger: EvidenceEntry[];
  pov?: Pov;
  selectedContacts?: SelectedContact[];
  sequence?: Sequence;
  groundedness?: GroundednessReport;
  completedAt: string;
};
