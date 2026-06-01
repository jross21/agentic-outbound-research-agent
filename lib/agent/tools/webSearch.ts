// web_search — discovery. Returns candidate sources (title + url + snippet) for
// the model to choose from. Adds NO evidence: searching finds pages, fetching
// grounds facts (see fetchPage). sample: rank fixture documents against the
// query. live: Serper (https://google.serper.dev/search).

import type { Tool, ToolImpl } from "./types";
import { ToolError } from "./types";
import { loadFixture } from "@/lib/sample/load";
import { TOOL_HTTP_TIMEOUT_MS } from "@/lib/constants";

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

const sampleImpl: ToolImpl = async (input, ctx) => {
  const query = String(input.query ?? "");
  const fx = loadFixture(ctx.domain);
  const qTokens = new Set(tokenize(query));

  const ranked = fx.documents
    .map((doc) => {
      const hay = new Set(tokenize(`${doc.title} ${doc.snippet} ${doc.topics.join(" ")}`));
      let score = 0;
      for (const t of qTokens) if (hay.has(t)) score++;
      return { doc, score };
    })
    .sort((a, b) => b.score - a.score);

  // If the query matched nothing, fall back to all docs (still useful discovery).
  const anyMatch = ranked.some((r) => r.score > 0);
  const chosen = (anyMatch ? ranked.filter((r) => r.score > 0) : ranked).slice(0, 5);

  const summary =
    chosen.length === 0
      ? `No results for "${query}".`
      : `Results for "${query}":\n` +
        chosen
          .map((r, i) => `${i + 1}. ${r.doc.title}\n   ${r.doc.url}\n   ${r.doc.snippet}`)
          .join("\n");

  return { summary, evidence: [] };
};

type SerperResult = { title?: string; link?: string; snippet?: string };

const liveImpl: ToolImpl = async (input, ctx) => {
  const key = process.env.SEARCH_API_KEY;
  if (!key) throw new ToolError("SEARCH_API_KEY not set");
  const query = String(input.query ?? "");

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query }),
    signal: ctx.signal ?? AbortSignal.timeout(TOOL_HTTP_TIMEOUT_MS),
  });
  if (!res.ok) throw new ToolError(`Serper search failed: ${res.status}`);
  const data = (await res.json()) as { organic?: SerperResult[] };
  const organic = (data.organic ?? []).slice(0, 5);

  const summary =
    organic.length === 0
      ? `No results for "${query}".`
      : `Results for "${query}":\n` +
        organic
          .map((r, i) => `${i + 1}. ${r.title ?? ""}\n   ${r.link ?? ""}\n   ${r.snippet ?? ""}`)
          .join("\n");

  return { summary, evidence: [] };
};

export const webSearchTool: Tool = {
  name: "web_search",
  description:
    "Search the web for pages about the account: funding, hiring, product launches, leadership changes, customers. Returns titles + URLs + snippets. Use fetch_page on a promising URL to extract and cite facts.",
  provider: "search",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
    },
    required: ["query"],
  },
  sampleImpl,
  liveImpl,
};
