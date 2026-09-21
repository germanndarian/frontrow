import type {
  Game,
  LeagueId,
  PlayoffBracket,
  Player,
  ScheduleGame,
  StandingsGroup,
  TeamCard,
} from "./types";
import type { CatalogPlayer, CatalogTeam } from "./catalog";
import { reportUpstream, STALE_HEADER } from "./upstream";

/* ───────────────────────────────────────────────────────────────────────────
   Data facade. Calls the Next.js /api route handlers, which fetch ESPN's
   public endpoints server-side and return the normalized shapes in lib/types.
   Set NEXT_PUBLIC_USE_MOCK=true to fall back to the offline dataset.
   ─────────────────────────────────────────────────────────────────────────── */

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  // A tagged response means ESPN was unreachable and the route fell back to the
  // last good payload — the dashboard says so rather than passing it off as live.
  reportUpstream(url, res.headers.get(STALE_HEADER) === "1");
  return (await res.json()) as T;
}

/** Today's games, or a window's — "20260921-20260927" — when `dates` is given. */
export async function getScoreboard(leagues: LeagueId[], dates?: string): Promise<Game[]> {
  if (leagues.length === 0) return [];
  if (USE_MOCK) return (await import("./data.mock")).getScoreboard(leagues, dates);
  const range = dates ? `&dates=${dates}` : "";
  return get<Game[]>(`/api/scoreboard?leagues=${leagues.join(",")}${range}`);
}

export async function getTeamCard(
  league: LeagueId,
  teamId: string,
): Promise<TeamCard | null> {
  if (USE_MOCK) return (await import("./data.mock")).getTeamCard(league, teamId);
  return get<TeamCard>(`/api/team/${teamId}?league=${league}`);
}

export async function getPlayer(league: LeagueId, id: string): Promise<Player | null> {
  if (USE_MOCK) return (await import("./data.mock")).getPlayer(league, id);
  return get<Player>(`/api/player/${id}?league=${league}`);
}

export async function getStandings(
  league: LeagueId,
  teamId?: string,
): Promise<StandingsGroup | null> {
  if (USE_MOCK) return (await import("./data.mock")).getStandings(league, teamId);
  const q = teamId ? `?teamId=${teamId}` : "";
  return get<StandingsGroup>(`/api/standings/${league}${q}`);
}

export async function getSchedule(
  league: LeagueId,
  teamId: string,
): Promise<ScheduleGame[]> {
  if (USE_MOCK) return (await import("./data.mock")).getSchedule(league, teamId);
  return get<ScheduleGame[]>(`/api/schedule?league=${league}&teamId=${teamId}`);
}

export async function getCatalogTeams(leagues: LeagueId[]): Promise<CatalogTeam[]> {
  if (leagues.length === 0) return [];
  if (USE_MOCK) return (await import("./data.mock")).getCatalogTeams(leagues);
  return get<CatalogTeam[]>(`/api/teams?leagues=${leagues.join(",")}`);
}

export async function getRostersForTeams(
  teams: { league: LeagueId; teamId: string }[],
): Promise<CatalogPlayer[]> {
  if (teams.length === 0) return [];
  if (USE_MOCK) return (await import("./data.mock")).getRostersForTeams(teams);
  const lists = await Promise.all(
    teams.map((t) =>
      get<CatalogPlayer[]>(`/api/roster?league=${t.league}&teamId=${t.teamId}`).catch(
        () => [] as CatalogPlayer[],
      ),
    ),
  );
  return lists.flat();
}

export async function getPlayoffBracket(league: LeagueId): Promise<PlayoffBracket> {
  if (USE_MOCK) return (await import("./data.mock")).getPlayoffBracket(league);
  return get<PlayoffBracket>(`/api/playoffs/${league}`);
}

/** True if any game in a set is currently live (drives poll cadence). */
export function hasLiveGame(games: Game[] | undefined): boolean {
  return !!games?.some((g) => g.state === "in");
}
