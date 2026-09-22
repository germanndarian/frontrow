/* The scoreboard's rules, shared by the dashboard's week of games and the phone
   layout at /app: which games a filter shows, how they group and sort, what's
   marked as yours, the season-week note, and the two footer lines a card
   shows. The same rules as the iPhone app's Scores tab. No React, no fetching —
   unit-tested. */

import { LEAGUES, LEAGUE_ORDER } from "@/lib/leagues";
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

/* ── The dashboard's week of games ─────────────────────────────────────── */

/** "all" is your teams; a league is that league in full. */
export type BoardFilter = LeagueId | "all";

/** A league's view is where your games are marked and pins apply. Under "all"
    every card is yours, so a mark would say nothing and turn the board blue;
    and the list is already the games you care about, in the order you'd want. */
export function isLeagueView(filter: BoardFilter): boolean {
  return filter !== "all";
}

/** Which games a filter shows. "All" is your teams' games — the point of the
    app is the handful you follow, and a week of everything is the wrong thing to
    open on. A league shows everything in it. With nothing followed yet, "all"
    shows everything rather than an empty board that reads as broken. */
export function visibleGames(games: Game[], filter: BoardFilter, followed: Set<string>): Game[] {
  if (filter !== "all") return games.filter((g) => g.league === filter);
  return followed.size === 0 ? games : games.filter((g) => isFollowed(g, followed));
}

export type BoardGroup = GameGroup & { yours: number };

/** The board's rows: live, upcoming, results. Within each, pinned games first
    (in a league's view), then yours, then by start time. A pinned live game
    stays with the live games — a pin lifts it above its neighbours, not above
    everything. Empty rows are dropped. */
export function boardGroups(
  games: Game[],
  { filter, followed, pinned = new Set() }: { filter: BoardFilter; followed: Set<string>; pinned?: Set<string> },
): BoardGroup[] {
  const pins = isLeagueView(filter);
  const rank = (g: Game) => [pins && pinned.has(g.id) ? 0 : 1, isFollowed(g, followed) ? 0 : 1];
  return GROUPS.map(({ key, title }) => {
    const inGroup = games
      .filter((g) => g.state === key)
      .sort((a, b) => {
        const [pa, ya] = rank(a);
        const [pb, yb] = rank(b);
        return pa - pb || ya - yb || a.date.localeCompare(b.date);
      });
    return { key, title, games: inGroup, yours: inGroup.filter((g) => isFollowed(g, followed)).length };
  }).filter((g) => g.games.length > 0);
}

/** A row's count: "45", or "45 · 3 yours" in a league's view. */
export function groupCount(group: BoardGroup, filter: BoardFilter): string {
  return isLeagueView(filter) ? `${group.games.length} · ${group.yours} yours` : String(group.games.length);
}

/** "NFL Week 3 · NCAAF Week 4" — where the season is, for the leagues that count
    in weeks and have a game in view. Null when none do. */
export function weekNote(games: Game[]): string | null {
  const notes = LEAGUE_ORDER.flatMap((league) => {
    const weeks = games.filter((g) => g.league === league && g.week != null).map((g) => g.week as number);
    return weeks.length ? [`${LEAGUES[league].name} Week ${Math.max(...weeks)}`] : [];
  });
  return notes.length ? notes.join(" · ") : null;
}

/** What an empty week says. */
export function emptyBoard(filter: BoardFilter, followsTeams: boolean, range: string): { title: string; body: string } {
  if (filter === "all" && followsTeams) {
    return {
      title: "None of your teams play",
      body: `Your teams have no games in ${range}. Pick a league to see everything that's on.`,
    };
  }
  const which = filter === "all" ? "games for the leagues you follow" : `${LEAGUES[filter].name} games`;
  return { title: "Nothing on the slate", body: `No ${which} in ${range}.` };
}
