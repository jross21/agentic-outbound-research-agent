// fetch_page — grounding. Fetches one URL, returns its text, and emits ONE
// evidence entry (the page's citable fact). This is where facts enter the
// ledger. sample: return the fixture document body. live: real HTTP GET + a
// minimal HTML→text reduction (no extra deps; readability lib is a v2 upgrade).

import type { Tool, ToolImpl } from "./types";
import { ToolError } from "./types";
import { loadFixture } from "@/lib/sample/load";
import { TOOL_HTTP_TIMEOUT_MS } from "@/lib/constants";

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

const sampleImpl: ToolImpl = async (input, ctx) => {
  const url = String(input.url ?? "");
  const fx = loadFixture(ctx.domain);
  const doc =
    fx.documents.find((d) => d.url === url) ??
    fx.documents.find((d) => url && d.url.includes(url)) ??
    fx.documents.find((d) => url.includes(d.url));

  if (!doc) {
    return { summary: `Could not fetch ${url} (no content found).`, evidence: [] };
  }

  return {
    summary: `${doc.title}\n\n${doc.body}`,
    evidence: [
      {
        claim: doc.snippet,
        sourceUrl: doc.url,
        provider: "fetch",
        snippet: truncate(doc.body, 300),
      },
    ],
  };
};

const liveImpl: ToolImpl = async (input, ctx) => {
  const url = String(input.url ?? "");
  if (!/^https?:\/\//i.test(url)) throw new ToolError(`Invalid URL: ${url}`);

  const res = await fetch(url, {
    headers: { "User-Agent": "outreach-agent/0.1 (+research)" },
    signal: ctx.signal ?? AbortSignal.timeout(TOOL_HTTP_TIMEOUT_MS),
  });
  if (!res.ok) throw new ToolError(`fetch_page failed: ${res.status} for ${url}`);
  const html = await res.text();

  // Minimal, dependency-free HTML → text.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : url;
  const body = truncate(text, 2000);

  return {
    summary: `${title}\n\n${body}`,
    evidence: [
      {
        claim: truncate(text, 200),
        sourceUrl: url,
        provider: "fetch",
        snippet: truncate(text, 300),
      },
    ],
  };
};

export const fetchPageTool: Tool = {
  name: "fetch_page",
  description:
    "Fetch a single web page by URL and return its text. Emits a citable evidence entry for the page. Use after web_search to extract and ground specific facts.",
  provider: "search",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Absolute URL to fetch" },
    },
    required: ["url"],
  },
  sampleImpl,
  liveImpl,
};
