"use client";

import { useSyncExternalStore } from "react";
import { isUpstreamStale, subscribeUpstream } from "@/lib/upstream";

/** Shown when ESPN is refusing us and the API is serving the last good payload.
    Scores stay on screen — this just stops them reading as live. */
export function StaleNotice() {
  const stale = useSyncExternalStore(
    subscribeUpstream,
    isUpstreamStale,
    () => false,
  );
  if (!stale) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-center gap-2.5 rounded-md border border-line/70 bg-bg-2/60 px-3.5 py-2.5 text-[13px] text-muted"
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
        style={{ boxShadow: "0 0 0 3px color-mix(in oklch, var(--color-gold) 22%, transparent)" }}
      />
      <span>
        <span className="font-semibold text-ink">Live data is temporarily unavailable.</span>{" "}
        Showing the most recent scores we have — they may be behind.
      </span>
    </div>
  );
}
