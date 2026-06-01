// Tells the client whether the app is running in keyless "sample" mode or "live"
// mode, and (for sample mode) which fictional demo accounts are available. The
// UI uses this to show the sample-mode banner and render the demo-account picker
// instead of a free-text box that would invite real domains.

import { researchMode } from "@/lib/config";
import { DEMO_ACCOUNTS } from "@/lib/sample/registry";
import { loadIcp } from "@/lib/anthropic/prompts";

export const runtime = "nodejs";

export async function GET() {
  // `icp` is the default ICP definition — the form prefills it (live) or shows
  // it read-only (sample), so reviewers see exactly what fit is scored against.
  return Response.json({ mode: researchMode(), demoAccounts: DEMO_ACCOUNTS, icp: loadIcp() });
}
