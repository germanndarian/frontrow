"use client";

import type { FollowedPlayer, PlayerSeasonStat } from "@/lib/types";
import { usePlayer } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Headshot } from "@/components/ui/Headshot";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { BarSparkline } from "@/components/ui/Sparkline";

function StatTile({ stat }: { stat: PlayerSeasonStat }) {
  const lead = stat.rank === 1;
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
          {stat.abbr}
        </span>
        {stat.rank && stat.rank <= 5 && (
          <span
            className={cn(
              "tnum text-[9.5px] font-bold leading-none",
              lead ? "text-gold" : "text-faint",
            )}
            title={`League rank: ${stat.rankDisplay ?? stat.rank}`}
          >
            {lead ? "★ 1st" : stat.rankDisplay}
          </span>
        )}
      </div>
      <span
        className={cn(
          "tnum font-mono text-[19px] font-semibold leading-none",
          lead ? "text-gold" : "text-ink",
        )}
      >
        {stat.value}
      </span>
    </div>
  );
}

export function PlayerCardView({ follow }: { follow: FollowedPlayer }) {
  const { data, isPending, isError, refetch } = usePlayer(follow.league, follow.id);

  if (isPending) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} message={`Couldn't load ${follow.fullName}.`} />
      </Card>
    );
  }

  // Entries are newest-first; the sparkline reads oldest→newest so the
  // highlighted final bar is the most recent game.
  const primaries = [...data.recent.entries].reverse().map((e) => e.primary);
  const recentSlice = data.recent.entries.slice(0, 4);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4">
        <Headshot src={data.headshot} name={data.fullName} color={data.color} size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[17px] font-extrabold leading-tight tracking-tight text-ink">
            {data.fullName}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
            <TeamLogo src={data.teamLogo} name={data.teamAbbr} abbr={data.teamAbbr} color={data.color} size={15} />
            <span className="font-medium">{data.teamAbbr}</span>
            <span className="text-faint">·</span>
            <span>{data.position} · #{data.jersey}</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-line/70 bg-bg-2/60 px-2.5 py-1 text-[11px] font-semibold text-faint">
          {data.seasonLabel}
        </span>
      </div>

      {data.placeholder ? (
        <EmptyState
          className="!py-7"
          title="You're following them"
          body="Season stats and recent games appear here once the live ESPN feed is connected."
        />
      ) : (
        <>
      {/* Season stat grid */}
      <div className="mx-4 mt-3.5 grid grid-cols-3 divide-x divide-y divide-line-soft/70 overflow-hidden rounded-md border border-line-soft/70 bg-bg-2/30 [&>*:nth-child(-n+3)]:border-t-0 [&>*:nth-child(3n+1)]:border-l-0">
        {data.stats.slice(0, 6).map((s) => (
          <StatTile key={s.name} stat={s} />
        ))}
      </div>

      {/* Recent performance */}
      <div className="mt-4 px-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
            Last {primaries.length} · {data.recent.label}
          </span>
          <BarSparkline
            values={primaries}
            color={data.color === "#0c2340" ? "var(--color-primary-bright)" : data.color}
            height={22}
            className="w-24"
          />
        </div>
        <div className="grid gap-1">
          {recentSlice.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-2 rounded-[7px] px-1.5 py-1 text-[12.5px] hover:bg-bg-2/50"
            >
              <span
                className={cn(
                  "tnum w-4 text-center text-[11px] font-bold",
                  g.result === "W" ? "text-win" : g.result === "L" ? "text-loss" : "text-muted",
                )}
              >
                {g.result}
              </span>
              <TeamLogo src={g.opponentLogo} name={g.opponentAbbr} abbr={g.opponentAbbr} size={16} />
              <span className="w-14 text-faint">
                {g.atVs === "@" ? "@" : "vs"} {g.opponentAbbr}
              </span>
              <span className="ml-auto flex items-center gap-2.5 text-[11.5px] text-muted">
                {Object.entries(g.stats).slice(0, 3).map(([k, v]) => (
                  <span key={k} className="tnum">
                    <span className="text-ink">{v}</span>{" "}
                    <span className="text-faint">{k}</span>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </Card>
  );
}
