"use client";

import type { GameSide, ScoringPlay } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function ScoringTimeline({
  plays,
  home,
  away,
}: {
  plays: ScoringPlay[];
  home: GameSide;
  away: GameSide;
}) {
  // Newest first, to match the play-by-play feed beside it.
  const ordered = [...plays].reverse();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader title="Scoring" eyebrow={`${ordered.length} plays`} />
      {ordered.length === 0 ? (
        <EmptyState title="No scoring yet" body="Scoring plays land here as they happen." />
      ) : (
        <ol className="no-scrollbar max-h-[480px] divide-y divide-line-soft/60 overflow-y-auto px-2 py-1">
          {ordered.map((p) => {
            const isHome = p.teamAbbr === home.abbreviation;
            const logo = isHome ? home.logo : away.logo;
            const color = isHome ? home.color : away.color;
            return (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-12 shrink-0 text-center">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint">
                    {p.periodLabel}
                  </div>
                  <div className="tnum font-mono text-[11px] text-muted">{p.clock}</div>
                </div>
                <TeamLogo src={logo} name={p.teamAbbr} abbr={p.teamAbbr} color={color} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] leading-snug text-ink">{p.text}</p>
                  {p.scoreType && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                      {p.scoreType}
                    </span>
                  )}
                </div>
                <div className="tnum shrink-0 font-mono text-[13px] font-semibold text-ink">
                  <span className={isHome ? "text-primary-bright" : "text-muted"}>{p.homeScore}</span>
                  <span className="px-1 text-faint">–</span>
                  <span className={!isHome ? "text-primary-bright" : "text-muted"}>{p.awayScore}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
