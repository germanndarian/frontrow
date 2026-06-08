"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PlayoffBracket } from "@/lib/types";
import { layoutBracket } from "@/lib/bracket-layout";
import { MatchupCard } from "./MatchupCard";

export function Bracket({
  bracket,
  followedTeamId,
}: {
  bracket: PlayoffBracket;
  followedTeamId?: string;
}) {
  const layout = useMemo(
    () => layoutBracket(bracket, followedTeamId),
    [bracket, followedTeamId],
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Bring the followed team's earliest matchup into view on open.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const first = layout.cards.find((c) => c.onPath);
    if (first) el.scrollLeft = Math.max(0, first.x - 24);
  }, [layout]);

  return (
    <div ref={scrollRef} className="no-scrollbar overflow-x-auto px-4 pb-4 pt-2">
      <div className="relative" style={{ width: layout.width, height: layout.height }}>
        {/* round labels */}
        {layout.rounds.map((r) => (
          <div
            key={r.x}
            className="absolute top-0 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ left: r.x }}
          >
            <span className={r.live ? "text-live" : "text-faint"}>
              {r.live && <span className="live-dot mr-1 !h-1.5 !w-1.5 align-middle" />}
              {r.name}
            </span>
          </div>
        ))}

        {/* connectors */}
        <svg
          width={layout.width}
          height={layout.height}
          className="pointer-events-none absolute inset-0"
          fill="none"
          strokeLinecap="round"
        >
          {layout.connectors
            .filter((c) => !c.onPath)
            .map((c, i) => (
              <path key={`f${i}`} d={c.d} stroke="var(--color-line)" strokeWidth={2} />
            ))}
          {layout.connectors
            .filter((c) => c.onPath)
            .map((c, i) => (
              <path key={`p${i}`} d={c.d} stroke="var(--color-primary)" strokeWidth={2.5} />
            ))}
        </svg>

        {/* matchup cards */}
        {layout.cards.map((c) => (
          <MatchupCard key={c.matchup.id} card={c} style={{ left: c.x, top: c.y }} />
        ))}
      </div>
    </div>
  );
}
