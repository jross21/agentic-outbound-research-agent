"use client";

// Persistent, unmistakable banner shown whenever the app is in keyless "sample"
// mode. The whole point: a reviewer must never mistake the fictional demo data
// for real research — which would undercut the tool's anti-hallucination thesis.

export function SampleModeBanner() {
  return (
    <div className="mb-6 rounded-xl border border-warn/40 bg-surface p-4 text-sm">
      <p className="font-semibold text-warn">🧪 Sample mode — synthetic demo data</p>
      <p className="mt-1 leading-relaxed text-muted-foreground">
        Running keyless, so the agent does <span className="text-foreground">not</span> do real
        research. It replays a scripted plan over a few <span className="text-foreground">fictional</span>{" "}
        demo accounts — the companies, people, and LinkedIn URLs are illustrative and won&apos;t
        resolve. Nothing is ever sent; enrollment is a dry-run. Set{" "}
        <code className="rounded bg-surface-muted px-1 font-mono text-foreground">ANTHROPIC_API_KEY</code>{" "}
        (and provider keys) to run live research on real domains.
      </p>
    </div>
  );
}
