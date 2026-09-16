import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";

/* ESPN base URLs, overridable via env (non-secret).

   All three point at site.web.api.espn.com. The otherwise-identical
   site.api.espn.com host sits behind a bot-management rule that 403s any
   request whose User-Agent isn't a recognised CLI tool — an honest
   identifier is rejected there just as a browser-impersonating one is.
   site.web.api.espn.com serves the same paths and the same response shapes
   while accepting the UA we actually send, so it's the host we ask. */
const SITE = process.env.ESPN_SITE_API ?? "https://site.web.api.espn.com/apis/site/v2/sports";
const SITE_V2 = process.env.ESPN_STANDINGS_API ?? "https://site.web.api.espn.com/apis/v2/sports";
const WEB = process.env.ESPN_WEB_API ?? "https://site.web.api.espn.com/apis/common/v3/sports";

/** "baseball/mlb" — the sport/league path segment for a league id. */
function seg(league: LeagueId): string {
  const m = LEAGUES[league];
  return `${m.espnSport}/${m.espnLeague}`;
}

export const espnUrl = {
  /** Today's slate, or a whole month ("202609").

      Not a range. `dates=20260914-20260920` answered for years and now returns
      400 "Failed to get events endpoint." on every league and on both ESPN
      hosts, so callers ask for the months their window touches and slice it
      themselves (see `espn/window.ts`). The raised limit is load-bearing: a
      month comes back capped at 100 events without it. */
  scoreboard: (l: LeagueId, month?: string) =>
    month
      ? `${SITE}/${seg(l)}/scoreboard?dates=${month}&limit=400`
      : `${SITE}/${seg(l)}/scoreboard`,
  team: (l: LeagueId, id: string) => `${SITE}/${seg(l)}/teams/${id}`,
  schedule: (l: LeagueId, id: string, seasontype?: number) =>
    `${SITE}/${seg(l)}/teams/${id}/schedule${seasontype ? `?seasontype=${seasontype}` : ""}`,
  roster: (l: LeagueId, id: string) => `${SITE}/${seg(l)}/teams/${id}/roster`,
  teams: (l: LeagueId) => `${SITE}/${seg(l)}/teams?limit=400`,
  // level=3 returns division-level groups (e.g. "AL East") nested in conferences.
  standings: (l: LeagueId) => `${SITE_V2}/${seg(l)}/standings?level=3`,
  athlete: (l: LeagueId, id: string) => `${WEB}/${seg(l)}/athletes/${id}`,
  gamelog: (l: LeagueId, id: string) => `${WEB}/${seg(l)}/athletes/${id}/gamelog`,
};

/** Per-surface upstream cache lifetimes (seconds). Keeps us far under ESPN's
    informal ~2.5k/day budget even with several followed leagues. */
export const REVALIDATE = {
  scoreboard: 20,
  /** A month's slate moves slower than today's, and costs much more to fetch —
      and every week of that month reads the same cached copy. Live scores come
      from today's board laid over the top, so this window never holds one back. */
  scoreboardMonth: 120,
  bracket: 300,
  team: 300,
  standings: 300,
  player: 300,
  teams: 86_400,
  roster: 86_400,
} as const;
