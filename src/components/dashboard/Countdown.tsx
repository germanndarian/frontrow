"use client";

import { useEffect, useState } from "react";
import { now } from "@/lib/clock";
import { countdownText } from "@/lib/game-detail";

/** Time until the start, ticking down once a second, with the full date
    underneath. A game with no time yet says so. */
export function Countdown({ startsAt }: { startsAt: string }) {
  const start = Date.parse(startsAt);
  const [at, setAt] = useState(now);

  useEffect(() => {
    const tick = window.setInterval(() => setAt(now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  return (
    <div className="rounded-[16px] border border-line bg-surface px-4 py-6 text-center">
      <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint">
        Starts in
      </div>
      {Number.isFinite(start) ? (
        <>
          <div role="timer" className="tnum mt-2 font-mono text-[38px] font-bold leading-none tracking-[-0.01em] text-ink">
            {countdownText(start, at)}
          </div>
          <div className="mt-2.5 text-[12.5px] text-faint">
            {new Date(start).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
          </div>
        </>
      ) : (
        <div className="mt-2 text-[15px] font-semibold text-muted">Not scheduled yet</div>
      )}
    </div>
  );
}
