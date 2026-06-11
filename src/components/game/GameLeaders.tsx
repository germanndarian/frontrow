"use client";

import type { GameLeader, GameSide } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Headshot } from "@/components/ui/Headshot";

export function GameLeaders({
  leaders,
  home,
  away,
}: {
  leaders: GameLeader[];
  home: GameSide;
  away: GameSide;
}) {
  if (leaders.length === 0) return null;

  const colorFor = (abbr: string) =>
    abbr === home.abbreviation ? home.color : abbr === away.abbreviation ? away.color : "#64748b";

  return (
    <Card>
      <CardHeader title="Game Leaders" eyebrow="Top performers" />
      <div className="grid gap-px overflow-hidden rounded-b-lg bg-line-soft/40 sm:grid-cols-2 lg:grid-cols-3">
        {leaders.map((l, i) => (
          <div key={`${l.teamAbbr}-${l.category}-${i}`} className="flex items-center gap-3 bg-surface px-4 py-3">
            <Headshot src={l.headshot} name={l.playerName} color={colorFor(l.teamAbbr)} size={44} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-faint">
                {l.teamAbbr} · {l.category}
              </div>
              <div className="truncate font-display text-[14px] font-bold text-ink">
                {l.playerName}
              </div>
              <div className="truncate text-[12px] text-muted">{l.detail ?? l.statValue}</div>
            </div>
            <div className="tnum shrink-0 text-right font-mono text-[20px] font-semibold text-ink">
              {l.statValue}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
