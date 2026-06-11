"use client";

import type { DriveSummary, GameSide } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { TeamLogo } from "@/components/ui/TeamLogo";

/** Football-only. Renders nothing for sports without drives, so callers can
    drop it in unconditionally and it degrades gracefully. */
export function DrivesPanel({
  drives,
  possession,
  home,
  away,
}: {
  drives: DriveSummary[];
  possession: string | null;
  home: GameSide;
  away: GameSide;
}) {
  if (drives.length === 0) return null;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Drives"
        eyebrow="Possession"
        action={
          possession ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.06em] text-primary">
              <span aria-hidden>🏈</span>
              {possession} ball
            </span>
          ) : undefined
        }
      />
      <ol className="no-scrollbar max-h-[440px] divide-y divide-line-soft/60 overflow-y-auto px-2 py-1">
        {drives.map((d) => {
          const isHome = d.teamAbbr === home.abbreviation;
          const color = isHome ? home.color : away.color;
          const hasBall = possession != null && d.teamAbbr === possession;
          return (
            <li
              key={d.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5",
                hasBall && "rounded-md bg-primary/[0.06]",
              )}
            >
              <TeamLogo src={d.teamLogo} name={d.teamAbbr} abbr={d.teamAbbr} color={color} size={26} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-ink">{d.teamAbbr}</span>
                  <span
                    className={cn(
                      "truncate text-[12px] font-semibold",
                      d.isScore ? "text-win" : "text-muted",
                    )}
                  >
                    {d.result}
                  </span>
                </div>
                {d.description && (
                  <p className="truncate text-[11px] text-faint">{d.description}</p>
                )}
              </div>
              {hasBall && (
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  On the ball
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
