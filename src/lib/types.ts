/* ───────────────────────────────────────────────────────────────────────────
   Normalized domain models.
   These mirror what a server-side normalizer would produce from ESPN's
   responses, so the UI is built against clean shapes. Swapping mock data for
   live ESPN data later means filling these same types — no component changes.
   ─────────────────────────────────────────────────────────────────────────── */

export type LeagueId = "nfl" | "college-football" | "mlb" | "nhl";
export type SportId = "football" | "baseball" | "hockey";
export type GameState = "pre" | "in" | "post";
export type Outcome = "W" | "L" | "T";

export interface SportMeta {
  id: SportId;
  name: string;
  /** Leagues that belong to this sport, in display order. */
  leagues: LeagueId[];
}

export interface LeagueMeta {
  id: LeagueId;
  sport: SportId;
  /** ESPN path segments — kept here so the live swap is config-only. */
  espnSport: string;
  espnLeague: string;
  name: string; // "MLB"
  fullName: string; // "Major League Baseball"
  /** Whether the league is currently mid-season (drives empty-state copy). */
  inSeason: boolean;
  /** Off-season hint, e.g. "Kicks off Sep 2026". */
  seasonHint: string;
  /** Columns to render in the standings table for this league. */
  standingsColumns: { key: string; label: string; emphasis?: boolean }[];
  /** Word for the standings unit, e.g. "Division", "Conference". */
  groupNoun: string;
}

export interface Team {
  id: string;
  league: LeagueId;
  location: string;
  name: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string; // hex with leading '#'
  altColor: string;
  record: string; // "37-25"
  standingSummary: string; // "2nd in AL East"
}

export interface GameSide {
  teamId: string;
  abbreviation: string;
  displayName: string;
  shortName: string;
  logo: string;
  color: string;
  score: number | null;
  record: string | null;
  winner: boolean;
  rank?: number; // AP rank for college football
}

export interface Game {
  id: string;
  league: LeagueId;
  state: GameState;
  /** "Final", "Bot 7th", "8:05 PM" — long status detail. */
  statusDetail: string;
  shortDetail: string;
  date: string; // ISO
  home: GameSide;
  away: GameSide;
  venue?: string;
  broadcast?: string;
  /** Live-only colour: count/down-and-distance, last play, period+clock. */
  situation?: string;
  lastPlay?: string;
  period?: string;
}

export interface StandingRow {
  teamId: string;
  abbreviation: string;
  displayName: string;
  logo: string;
  position: number;
  stats: Record<string, string>;
  followed: boolean;
  clinched?: "x" | "y" | "z" | "e" | null; // playoff markers
}

export interface StandingsGroup {
  id: string;
  name: string; // "AL East"
  rows: StandingRow[];
}

export interface ScheduleGame {
  id: string;
  date: string; // ISO
  state: "pre" | "post";
  opponentAbbr: string;
  opponentName: string;
  opponentLogo: string;
  atVs: "@" | "vs";
  result?: Outcome;
  score?: string; // "13-8" (team-opponent), completed games only
  broadcast?: string;
}

export interface PlayerSeasonStat {
  name: string;
  abbr: string; // "HR"
  label: string; // "Home Runs"
  value: string; // ".248"
  rank?: number;
  rankDisplay?: string; // "92nd"
}

export interface GameLogEntry {
  id: string;
  date: string;
  opponentAbbr: string;
  opponentLogo: string;
  atVs: "@" | "vs";
  result: Outcome;
  score: string; // "13-8"
  stats: Record<string, string>; // keyed by label, e.g. { HR: "1", RBI: "2" }
  /** A single headline number for the sparkline (e.g. hits, points, goals). */
  primary: number;
}

export interface Player {
  id: string;
  league: LeagueId;
  fullName: string;
  firstName: string;
  lastName: string;
  teamId: string;
  teamAbbr: string;
  teamLogo: string;
  color: string;
  position: string; // "RF", "QB", "C"
  jersey: string;
  headshot: string;
  seasonLabel: string; // "2026 season stats"
  stats: PlayerSeasonStat[];
  recent: {
    label: string; // what `primary` measures, e.g. "Hits"
    entries: GameLogEntry[];
  };
  /** True for a followed entity we have no rich mock data for yet. */
  placeholder?: boolean;
}

/** A team's compact dashboard card payload. */
export interface TeamCard {
  team: Team;
  form: { result: Outcome; opponentAbbr: string; atVs: "@" | "vs"; score: string; date: string }[];
  next: {
    opponentAbbr: string;
    opponentName: string;
    opponentLogo: string;
    atVs: "@" | "vs";
    date: string;
  } | null;
  /** Runs/points/goals scored across the recent stretch, oldest → newest. */
  scoring: number[];
  /** True for a followed team we have no rich mock data for yet. */
  placeholder?: boolean;
}

/* ── Persisted user preferences ─────────────────────────────────────────── */

export interface FollowedTeam {
  league: LeagueId;
  teamId: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string;
}

export interface FollowedPlayer {
  league: LeagueId;
  id: string;
  fullName: string;
  teamAbbr: string;
  headshot: string;
  position: string;
}

export interface Preferences {
  sports: SportId[];
  leagues: LeagueId[];
  teams: FollowedTeam[];
  players: FollowedPlayer[];
  onboarded: boolean;
}
