/* Pure helpers behind the iOS app's Scores tab: merge the followed-teams slate
   with today's board, filter by league, bucket by state, and build the two
   footer lines a game card shows. No React, no fetching — unit-tested. */

import { LEAGUES } from "@/lib/leagues";
import { now as clockNow } from "@/lib/clock";
import type { Game, LeagueId } from "@/lib/types";

export type GameGroup = { key: Game["state"]; title: string; games: Game[] };

const GROUPS: { key: Game["state"]; title: string }[] = [
  { key: "in", title: "LIVE NOW" },
  { key: "pre", title: "UPCOMING" },
  { key: "post", title: "RESULTS" },
];

/** Slate first (followed teams, chronological across leagues), then whatever
    else is on today's board, deduped by id. */
export function mergeSlate(slate: Game[], board: Game[]): Game[] {
  const seen = new Set<string>();
  const out: Game[] = [];
  for (const g of [...slate, ...board]) {
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    out.push(g);
  }
  return out;
}

export function filterLeague(games: Game[], league: LeagueId | "all"): Game[] {
  return league === "all" ? games : games.filter((g) => g.league === league);
}

export function groupGames(games: Game[]): GameGroup[] {
  return GROUPS.map((d) => ({ ...d, games: games.filter((g) => g.state === d.key) })).filter(
    (g) => g.games.length > 0,
  );
}

export function followKey(league: LeagueId, teamId: string): string {
  return `${league}:${teamId}`;
}

export function isFollowed(g: Game, followed: Set<string>): boolean {
  return followed.has(followKey(g.league, g.home.teamId)) || followed.has(followKey(g.league, g.away.teamId));
}

/** "Today · 8:20 PM", "Tomorrow · 1:05 PM", or "Sep 10 · 8:20 PM". */
export function whenLabel(iso: string, now: Date = new Date(clockNow())): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const day = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (day(d) === day(now)) return `Today · ${time}`;
  if (day(d) === day(tomorrow)) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}

/** The card's footer: status on the left, context on the right. */
export function gameFoot(g: Game, now?: Date): { left: string; right: string } {
  if (g.state === "in") {
    return { left: g.shortDetail || "Live", right: g.lastPlay ?? g.situation ?? g.venue ?? "" };
  }
  if (g.state === "pre") {
    const right = [g.odds?.details, g.odds?.overUnder ? `O/U ${g.odds.overUnder}` : null, g.broadcast]
      .filter(Boolean)
      .join(" · ");
    return { left: whenLabel(g.date, now), right: right || g.venue || "" };
  }
  return { left: g.shortDetail || "Final", right: g.venue ?? "" };
}

export function leagueLine(g: Game): string {
  return LEAGUES[g.league]?.name ?? g.league.toUpperCase();
}
