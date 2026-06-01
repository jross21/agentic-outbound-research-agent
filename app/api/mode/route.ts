// Tells the client whether the app is running in keyless "sample" mode or "live"
// mode, and (for sample mode) which fictional demo accounts are available. The
// UI uses this to show the sample-mode banner and render the demo-account picker
// instead of a free-text box that would invite real domains.

import { researchMode } from "@/lib/config";
import { DEMO_ACCOUNTS } from "@/lib/sample/registry";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ mode: researchMode(), demoAccounts: DEMO_ACCOUNTS });
}
