"use client";

import { useMemo } from "react";
import { usePlayer, usePlayoffBracket, useSchedule } from "@/lib/queries";
import { LEAGUES } from "@/lib/leagues";
import type { FollowedPlayer, FollowedTeam, PlayoffMatchup, ScheduleGame } from "@/lib/types";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Sheet, SheetGroupLabel } from "./Sheet";
import { Eyebrow } from "./primitives";
import { GameLogRows, StatGrid } from "./PlayersTab";
import { cn } from "@/lib/utils";

/* The three bottom sheets the tabs open: a team's full schedule, its league's
   playoff bracket, and a player's full stat sheet. Each fetches its own data
   with the same hooks the website's modals use. */

function shortDate(iso: string): string {
  const d = new Date(iso);
  // "Sat 9/12" — drop the locale's comma so the column never wraps.
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" }).replace(",", "");
}
function shortTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ScheduleRow({ g }: { g: ScheduleGame }) {
  const done = g.state === "post";
  return (
    <div className="flex items-center gap-[11px] border-t border-line-soft/70 px-[18px] py-2.5">
      <span className="w-[52px] flex-none whitespace-nowrap font-mono text-[11px] text-faint">{shortDate(g.date)}</span>
      <span className="w-[18px] flex-none text-center text-[11.5px] text-faint">{g.atVs}</span>
      <TeamLogo src={g.opponentLogo} name={g.opponentName} abbr={g.opponentAbbr} size={26} className="rounded-[8px]" />
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">{g.opponentName}</span>
      <span className="flex-none text-right">
        <span className={cn("block font-mono text-[12.5px] font-semibold", done ? (g.result === "W" ? "text-win" : g.result === "L" ? "text-loss" : "text-muted") : "text-ink")}>
          {done ? g.score : shortTime(g.date)}
        </span>
        <span className="block text-[11px] text-faint">{done ? g.result : g.broadcast ?? ""}</span>
      </span>
    </div>
  );
}

export function ScheduleSheet({ team, onClose }: { team: FollowedTeam; onClose: () => void }) {
  const { data, isPending, isError, refetch } = useSchedule(team.league, team.teamId, true);
  const { upcoming, recent } = useMemo(() => {
    const games = data ?? [];
    return { upcoming: games.filter((g) => g.state === "pre"), recent: games.filter((g) => g.state === "post").reverse() };
  }, [data]);

  return (
    <Sheet abbr={team.abbreviation} color={team.color} title={team.displayName} subtitle="Full schedule" onClose={onClose}>
      {isPending ? (
        <div className="p-[18px]"><Skeleton className="h-64 w-full rounded-[14px]" /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} message="Couldn't load the schedule." />
      ) : upcoming.length === 0 && recent.length === 0 ? (
        <EmptyState title="No games listed" body={LEAGUES[team.league].inSeason ? "The schedule hasn't been published yet." : LEAGUES[team.league].seasonHint} />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <SheetGroupLabel>Upcoming · {upcoming.length}</SheetGroupLabel>
              {upcoming.map((g) => <ScheduleRow key={g.id} g={g} />)}
            </div>
          )}
          {recent.length > 0 && (
            <div>
              <SheetGroupLabel>Results · {recent.length}</SheetGroupLabel>
              {recent.map((g) => <ScheduleRow key={g.id} g={g} />)}
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}

function Matchup({ m, mine }: { m: PlayoffMatchup; mine: boolean }) {
  const live = m.state === "in";
  return (
    <div className={cn("rounded-[14px] border p-[11px]", live ? "border-live/45 bg-live/5" : mine ? "border-primary/50 bg-primary/6" : "border-line bg-surface")}>
      {[m.home, m.away].map((s) => {
        const dim = !!m.winnerTeamId && m.winnerTeamId !== s.teamId;
        return (
          <div key={s.teamId} className="flex items-center gap-2 py-[3px]">
            <TeamLogo src={s.logo} name={s.displayName} abbr={s.abbreviation} color={s.color} size={22} className="rounded-[7px]" />
            <span className={cn("flex-1 truncate text-[12.5px] font-semibold", dim ? "text-faint" : "text-ink")}>{s.seed ? `(${s.seed}) ` : ""}{s.displayName}</span>
            <span className={cn("font-mono text-[13px] font-bold", dim ? "text-faint" : "text-ink")}>{s.score ?? "–"}</span>
          </div>
        );
      })}
      {m.summary && <div className={cn("mt-[7px] border-t border-line-soft pt-[7px] text-[11px]", live ? "text-live" : "text-faint")}>{m.summary}</div>}
    </div>
  );
}

export function BracketSheet({ team, onClose }: { team: FollowedTeam; onClose: () => void }) {
  const { data, isPending, isError, refetch } = usePlayoffBracket(team.league);
  const rounds = data?.rounds ?? [];
  return (
    <Sheet abbr={team.abbreviation} color={team.color} title={data?.name ?? LEAGUES[team.league].fullName} subtitle={`${team.displayName} on the path`} onClose={onClose}>
      {isPending ? (
        <div className="p-[18px]"><Skeleton className="h-64 w-full rounded-[14px]" /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} message="Couldn't load the bracket." />
      ) : rounds.length === 0 ? (
        <EmptyState title="No active bracket" body="The postseason picture appears here once it starts." />
      ) : (
        <div data-hscroll className="no-scrollbar overflow-x-auto px-[18px] pb-2 pt-4">
          <div className="flex min-w-max gap-4">
            {rounds.map((rd) => {
              const isLive = rd.matchups.some((m) => m.state === "in");
              return (
                <div key={rd.id} className="flex w-[176px] flex-col gap-3">
                  <div className={cn("text-[10px] font-bold uppercase tracking-[0.12em]", isLive ? "text-live" : "text-faint")}>{isLive ? "● " : ""}{rd.name}</div>
                  {rd.matchups.map((m) => (
                    <Matchup key={m.id} m={m} mine={m.home.teamId === team.teamId || m.away.teamId === team.teamId} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function PlayerSheet({ player, onClose }: { player: FollowedPlayer; onClose: () => void }) {
  const { data, isPending, isError, refetch } = usePlayer(player.league, player.id);
  const meta = data ? `${data.teamAbbr} · ${data.position}${data.jersey ? ` · #${data.jersey}` : ""} · ${data.seasonLabel}` : player.teamAbbr;
  return (
    <Sheet abbr={player.teamAbbr} color={data?.color ?? "var(--color-faint)"} title={player.fullName} subtitle={meta} onClose={onClose}>
      {isPending ? (
        <div className="p-[18px]"><Skeleton className="h-64 w-full rounded-[14px]" /></div>
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} message={`Couldn't load ${player.fullName}.`} />
      ) : (
        <>
          <div className="px-[18px] pb-2 pt-4"><StatGrid stats={data.stats} labels /></div>
          {data.recent.entries.length > 0 && (
            <div className="px-[18px] pb-2 pt-3">
              <Eyebrow className="mb-1">Last {data.recent.entries.length} · {data.recent.label}</Eyebrow>
              <GameLogRows entries={data.recent.entries} />
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
