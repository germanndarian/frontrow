import type { LeagueId, LeagueMeta, SportId, SportMeta } from "./types";
import { now } from "./clock";
import { seasonAt } from "./seasons";

/* `inSeason` drives whether the dashboard shows live data or a considered
   "season hasn't started" state, and `seasonHint` is what that state says.
   Both are worked out from the date when this module loads (see seasons.ts),
   rather than written in by hand and left to go stale. */

type LeagueBase = Omit<LeagueMeta, "inSeason" | "seasonHint">;

function withSeason(meta: LeagueBase): LeagueMeta {
  const season = seasonAt(meta.id, new Date(now()));
  return { ...meta, inSeason: season.inSeason, seasonHint: season.label };
}

export const SPORTS: Record<SportId, SportMeta> = {
  football: {
    id: "football",
    name: "Football",
    leagues: ["nfl", "college-football"],
  },
  baseball: { id: "baseball", name: "Baseball", leagues: ["mlb"] },
  hockey: { id: "hockey", name: "Hockey", leagues: ["nhl"] },
  basketball: { id: "basketball", name: "Basketball", leagues: ["nba"] },
};

export const SPORT_ORDER: SportId[] = ["football", "basketball", "baseball", "hockey"];

export const LEAGUES: Record<LeagueId, LeagueMeta> = {
  mlb: withSeason({
    id: "mlb",
    sport: "baseball",
    espnSport: "baseball",
    espnLeague: "mlb",
    name: "MLB",
    fullName: "Major League Baseball",
    groupNoun: "Division",
    standingsColumns: [
      { key: "wins", label: "W" },
      { key: "losses", label: "L" },
      { key: "winPercent", label: "PCT", emphasis: true },
      { key: "gamesBehind", label: "GB" },
      { key: "streak", label: "STRK" },
    ],
  }),
  nba: withSeason({
    id: "nba",
    sport: "basketball",
    espnSport: "basketball",
    espnLeague: "nba",
    name: "NBA",
    fullName: "National Basketball Association",
    groupNoun: "Division",
    standingsColumns: [
      { key: "wins", label: "W" },
      { key: "losses", label: "L" },
      { key: "winPercent", label: "PCT", emphasis: true },
      { key: "gamesBehind", label: "GB" },
      { key: "streak", label: "STRK" },
    ],
  }),
  nhl: withSeason({
    id: "nhl",
    sport: "hockey",
    espnSport: "hockey",
    espnLeague: "nhl",
    name: "NHL",
    fullName: "National Hockey League",
    groupNoun: "Division",
    standingsColumns: [
      { key: "gamesPlayed", label: "GP" },
      { key: "wins", label: "W" },
      { key: "losses", label: "L" },
      { key: "otLosses", label: "OTL" },
      { key: "points", label: "PTS", emphasis: true },
    ],
  }),
  nfl: withSeason({
    id: "nfl",
    sport: "football",
    espnSport: "football",
    espnLeague: "nfl",
    name: "NFL",
    fullName: "National Football League",
    groupNoun: "Division",
    standingsColumns: [
      { key: "wins", label: "W" },
      { key: "losses", label: "L" },
      { key: "ties", label: "T" },
      { key: "winPercent", label: "PCT", emphasis: true },
      { key: "streak", label: "STRK" },
    ],
  }),
  "college-football": withSeason({
    id: "college-football",
    sport: "football",
    espnSport: "football",
    espnLeague: "college-football",
    name: "NCAAF",
    fullName: "College Football",
    groupNoun: "Conference",
    standingsColumns: [
      { key: "wins", label: "W" },
      { key: "losses", label: "L" },
      { key: "winPercent", label: "PCT", emphasis: true },
      { key: "streak", label: "STRK" },
    ],
  }),
};

export const LEAGUE_ORDER: LeagueId[] = ["nba", "mlb", "nhl", "nfl", "college-football"];

export function leaguesForSports(sports: SportId[]): LeagueId[] {
  return LEAGUE_ORDER.filter((id) => sports.includes(LEAGUES[id].sport));
}
