// The evidence ledger: an append-only record of every fact the agent gathered.
// There is intentionally NO update or delete API — a claim, once ledgered, is
// immutable. Synthesized outreach may cite only ids that live here, and the
// groundedness check (lib/evals/groundedness.ts) verifies that against this set.

import type { EvidenceDraft, EvidenceEntry } from "@/lib/types";

export class EvidenceLedger {
  private _entries: EvidenceEntry[] = [];
  private seq = 0;

  /** Append a draft. Returns the ledgered entry (with id + timestamp). */
  append(draft: EvidenceDraft, fetchedAt?: string): EvidenceEntry {
    const entry: EvidenceEntry = {
      ...draft,
      id: `ev_${String(++this.seq).padStart(3, "0")}`,
      fetchedAt: fetchedAt ?? new Date().toISOString(),
    };
    this._entries.push(entry);
    return entry;
  }

  has(id: string): boolean {
    return this._entries.some((e) => e.id === id);
  }

  ids(): Set<string> {
    return new Set(this._entries.map((e) => e.id));
  }

  get(id: string): EvidenceEntry | undefined {
    return this._entries.find((e) => e.id === id);
  }

  /** A defensive copy — callers cannot mutate the ledger through this. */
  entries(): EvidenceEntry[] {
    return [...this._entries];
  }

  get size(): number {
    return this._entries.length;
  }

  /** Rebuild a ledger from already-ledgered entries (used to re-verify a payload
   *  server-side at the approval gate). Preserves ids/timestamps. */
  static from(entries: EvidenceEntry[]): EvidenceLedger {
    const ledger = new EvidenceLedger();
    ledger._entries = [...entries];
    ledger.seq = entries.length;
    return ledger;
  }
}
