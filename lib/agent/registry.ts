// Tool registry + dispatch. The loop calls dispatch(); dispatch chooses the live
// or sample impl per call based on provider connectivity (env-gated, FORCE_SAMPLE
// aware). toAnthropicTools() projects the registry to the SDK's tool schema.

import { isConnected } from "@/lib/config";
import type { Tool, ToolContext, ToolOutput } from "./tools/types";
import { enrichDomainTool } from "./tools/enrichDomain";
import { webSearchTool } from "./tools/webSearch";
import { fetchPageTool } from "./tools/fetchPage";
import { findContactsTool } from "./tools/findContacts";
import { crmReadTool } from "./tools/crmRead";

export const TOOLS: Tool[] = [
  enrichDomainTool,
  webSearchTool,
  fetchPageTool,
  findContactsTool,
  crmReadTool,
];

export const TOOL_BY_NAME: Map<string, Tool> = new Map(TOOLS.map((t) => [t.name, t]));

/** Anthropic tool schema (input_schema cast at this single boundary). */
export function toAnthropicTools(tools: Tool[] = TOOLS) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input_schema: t.inputSchema as any,
  }));
}

/** Is this tool going to run live on this machine right now? */
export function isLive(tool: Tool): boolean {
  return tool.provider ? isConnected(tool.provider) : false;
}

/** Run a tool, choosing live vs sample. */
export async function dispatch(
  tool: Tool,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolOutput> {
  return (isLive(tool) ? tool.liveImpl : tool.sampleImpl)(input, ctx);
}
