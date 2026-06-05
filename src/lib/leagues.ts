import type { LeagueId, LeagueMeta, SportId, SportMeta } from "./types";

/* June 2026 reality: MLB and NHL are mid-season; NFL and college football are
   in the off-season. `inSeason` drives whether the dashboard shows live data or
   a considered "season hasn't started" state. */

export const SPORTS: Record<SportId, SportMeta> = {
  football: {
    id: "football",
    name: "Football",
    leagues: ["nfl", "college-football"],
  },
  baseball: { id: "baseball", name: "Baseball", leagues: ["mlb"] },
  hockey: { id: "hockey", name: "Hockey", leagues: ["nhl"] },
};

export const SPORT_ORDER: SportId[] = ["football", "baseball", "hockey"];

export const LEAGUES: Record<LeagueId, LeagueMeta> = {
  mlb: {
    id: "mlb",
    sport: "baseball",
    espnSport: "baseball",
    espnLeague: "mlb",
    name: "MLB",
    fullName: "Major League Baseball",
    inSeason: true,
    seasonHint: "Regular season",
    groupNoun: "Division",
    standingsColumns: [
      { key: "wins", label: "W" },
      { key: "losses", label: "L" },
      { key: "winPercent", label: "PCT", emphasis: true },
      { key: "gamesBehind", label: "GB" },
      { key: "streak", label: "STRK" },
    ],
  },
  nhl: {
    id: "nhl",
    sport: "hockey",
    espnSport: "hockey",
    espnLeague: "nhl",
    name: "NHL",
    fullName: "National Hockey League",
    inSeason: true,
    seasonHint: "Regular season",
    groupNoun: "Division",
    standingsColumns: [
      { key: "gamesPlayed", label: "GP" },
      { key: "wins", label: "W" },
      { key: "losses", label: "L" },
      { key: "otLosses", label: "OTL" },
      { key: "points", label: "PTS", emphasis: true },
    ],
  },
  nfl: {
    id: "nfl",
    sport: "football",
    espnSport: "football",
    espnLeague: "nfl",
    name: "NFL",
    fullName: "National Football League",
    inSeason: false,
    seasonHint: "Kicks off Sep 2026",
    groupNoun: "Division",
    standingsColumns: [
      { key: "wins", label: "W" },
      { key: "losses", label: "L" },
      { key: "ties", label: "T" },
      { key: "winPercent", label: "PCT", emphasis: true },
      { key: "streak", label: "STRK" },
    ],
  },
  "college-football": {
    id: "college-football",
    sport: "football",
    espnSport: "football",
    espnLeague: "college-football",
    name: "NCAAF",
    fullName: "College Football",
    inSeason: false,
    seasonHint: "Kicks off Aug 2026",
    groupNoun: "Conference",
    standingsColumns: [
      { key: "wins", label: "W" },
      { key: "losses", label: "L" },
      { key: "winPercent", label: "PCT", emphasis: true },
      { key: "streak", label: "STRK" },
    ],
  },
};

export const LEAGUE_ORDER: LeagueId[] = ["mlb", "nhl", "nfl", "college-football"];

export function leaguesForSports(sports: SportId[]): LeagueId[] {
  return LEAGUE_ORDER.filter((id) => sports.includes(LEAGUES[id].sport));
}
