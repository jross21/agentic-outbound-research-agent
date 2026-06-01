// Shape of an offline account fixture. One JSON file per curated demo account
// lives in data/sample/accounts/; unknown domains get a deterministic fixture
// synthesized at runtime (see generic.ts). The sample tool impls read slices of
// this to return the same ToolOutput shape the live impls would.

import type { Firmographics } from "@/lib/types";

/** A "web page" / source the agent can search and fetch. */
export type SampleDocument = {
  url: string;
  title: string;
  /** A clean, self-contained factual statement — becomes a citable claim. */
  snippet: string;
  /** Longer page text returned by fetch_page. */
  body: string;
  /** Tags used by the sample web_search to match a query. */
  topics: string[];
};

export type SampleContact = {
  name: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
};

export type SampleCrmTouch = {
  date: string; // ISO date
  type: string; // "email" | "call" | "meeting" | ...
  note: string;
};

export type SampleCrm = {
  owner: string;
  lifecycleStage: string;
  lastContacted: string; // ISO date
  priorTouches: SampleCrmTouch[];
};

export type Fixture = {
  domain: string;
  firmographics: Firmographics;
  documents: SampleDocument[];
  contacts: SampleContact[];
  crm: SampleCrm | null;
};
