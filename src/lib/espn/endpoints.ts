import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";

/* ESPN base URLs. Site/web bases are overridable via env (non-secret); the
   standings host (apis/v2) differs from the site host and is kept here. */
const SITE = process.env.ESPN_SITE_API ?? "https://site.api.espn.com/apis/site/v2/sports";
const SITE_V2 = process.env.ESPN_STANDINGS_API ?? "https://site.api.espn.com/apis/v2/sports";
const WEB = process.env.ESPN_WEB_API ?? "https://site.web.api.espn.com/apis/common/v3/sports";

/** "baseball/mlb" — the sport/league path segment for a league id. */
function seg(league: LeagueId): string {
  const m = LEAGUES[league];
  return `${m.espnSport}/${m.espnLeague}`;
}

export const espnUrl = {
  scoreboard: (l: LeagueId) => `${SITE}/${seg(l)}/scoreboard`,
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
  team: 300,
  standings: 300,
  player: 300,
  teams: 86_400,
  roster: 86_400,
} as const;
