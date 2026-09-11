"use client";

import { useMemo, useState } from "react";
import { usePreferences } from "@/lib/store";
import { useScoreboard, useTeamSlate } from "@/lib/queries";
import { LEAGUES, LEAGUE_ORDER } from "@/lib/leagues";
import type { Game, GameSide, LeagueId } from "@/lib/types";
import { filterLeague, followKey, gameFoot, groupGames, isFollowed, leagueLine, mergeSlate } from "@/lib/mobile-scores";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Chip, ChipRow, Mark, Rule } from "./primitives";
import { cn } from "@/lib/utils";

/* Scores tab: league chips, then games bucketed LIVE NOW / UPCOMING / RESULTS.
   Followed teams' games come from the cross-league slate (so a fixture days
   out still shows), the rest from today's board. */

function Side({ s, state, lead }: { s: GameSide; state: Game["state"]; lead: boolean }) {
  const dim = state === "post" && !lead;
  return (
    <div className="flex items-center gap-3">
      <Mark abbr={s.abbreviation} color={s.color} />
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate font-display text-[16px] font-bold", dim ? "text-faint" : "text-ink")}>{s.shortName || s.displayName}</span>
        <span className="block text-[11.5px] text-faint">{s.record ?? ""}</span>
      </span>
      <span className={cn("font-mono text-[27px] font-semibold", state === "in" && lead ? "text-primary" : dim ? "text-faint" : "text-ink")}>
        {s.score ?? "–"}
      </span>
    </div>
  );
}

export function GameRow({ g, followed }: { g: Game; followed: boolean }) {
  const foot = gameFoot(g);
  const homeLead = (g.home.score ?? 0) >= (g.away.score ?? 0);
  const status = g.state === "in" ? "● LIVE" : g.state === "pre" ? "SCHEDULED" : "FINAL";
  return (
    <article className={cn("rise rounded-[20px] border bg-surface p-4 shadow-[0_10px_26px_-22px_rgba(0,0,0,.5)]", followed ? "border-primary/40" : "border-line")}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="font-mono text-[10.5px] font-bold tracking-[0.14em] text-faint">{leagueLine(g)}</span>
        <span className={cn("text-[11px] font-bold tracking-[0.08em]", g.state === "in" ? "text-live" : g.state === "pre" ? "text-muted" : "text-faint")}>{status}</span>
      </div>
      <div className="flex flex-col gap-[11px]">
        <Side s={g.away} state={g.state} lead={!homeLead || g.away.winner} />
        <Side s={g.home} state={g.state} lead={homeLead || g.home.winner} />
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-line-soft pt-3">
        <span className={cn("text-[12.5px] font-semibold", g.state === "in" ? "text-live" : "text-ink")}>{foot.left}</span>
        <span className="truncate text-right text-[12px] text-faint">{foot.right}</span>
      </div>
    </article>
  );
}

export function ScoresTab() {
  const { teams, leagues } = usePreferences();
  const [league, setLeague] = useState<LeagueId | "all">("all");
  const slate = useTeamSlate(teams);
  const board = useScoreboard(leagues);

  const followed = useMemo(() => new Set(teams.map((t) => followKey(t.league, t.teamId))), [teams]);
  const chipLeagues = LEAGUE_ORDER.filter((l) => leagues.includes(l));
  const games = useMemo(() => filterLeague(mergeSlate(slate.games, board.data ?? []), league), [slate.games, board.data, league]);
  const groups = groupGames(games);
  const liveCount = games.filter((g) => g.state === "in").length;

  return (
    <div className="pb-6">
      <ChipRow>
        <Chip label="All" on={league === "all"} onClick={() => setLeague("all")} />
        {chipLeagues.map((l) => (
          <Chip key={l} label={LEAGUES[l].name} on={league === l} onClick={() => setLeague(l)} />
        ))}
      </ChipRow>

      {board.isPending && games.length === 0 ? (
        <div className="flex flex-col gap-3 px-[18px] pt-5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[150px] w-full rounded-[20px]" />)}
        </div>
      ) : board.isError && games.length === 0 ? (
        <ErrorState onRetry={() => board.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState title="Nothing on the slate" body={leagues.length ? "No games in the leagues you follow right now." : "Follow a league or two in Settings to see games here."} />
      ) : (
        groups.map((grp) => (
          <section key={grp.key} className="px-[18px] pt-[22px]">
            <Rule title={grp.title} count={String(grp.games.length)} />
            <div className="flex flex-col gap-3">
              {grp.games.map((g) => <GameRow key={g.id} g={g} followed={isFollowed(g, followed)} />)}
            </div>
          </section>
        ))
      )}

      {liveCount > 0 && (
        <div className="flex items-center gap-2 px-[18px] pt-[18px] text-[12px] text-faint">
          <span className="live-dot" />
          Auto-refreshing {liveCount} live {liveCount === 1 ? "game" : "games"}
        </div>
      )}
    </div>
  );
}
