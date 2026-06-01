// Pick the sequencer by config. Defaults to dry-run, and falls back to dry-run if
// the requested live adapter has no credentials (resolveSequencer handles that).

import { resolveSequencer } from "@/lib/config";
import type { Sequencer } from "./base";
import { DryRunSequencer } from "./dryrun";
import { HubSpotSequencer } from "./hubspot";
import { ApolloSequencer } from "./apollo";

export function getSequencer(): Sequencer {
  switch (resolveSequencer()) {
    case "hubspot":
      return new HubSpotSequencer();
    case "apollo":
      return new ApolloSequencer();
    default:
      return new DryRunSequencer();
  }
}

export type { Sequencer } from "./base";
