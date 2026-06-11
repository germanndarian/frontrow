/* Minimal structural types for the slices of ESPN responses we actually read.
   Everything is optional — ESPN can omit or change fields, and the normalizers
   default around it rather than trusting any field exists. */

export interface RawTeam {
  id?: string;
  abbreviation?: string;
  displayName?: string;
  shortDisplayName?: string;
  name?: string;
  location?: string;
  nickname?: string;
  logo?: string;
  logos?: { href?: string }[];
  color?: string;
  alternateColor?: string;
}

export interface RawScore {
  value?: number;
  displayValue?: string;
}

export interface RawRecordItem {
  type?: string;
  summary?: string;
}

export interface RawCompetitor {
  id?: string;
  homeAway?: string;
  winner?: boolean;
  team?: RawTeam;
  score?: string | RawScore;
  records?: { type?: string; summary?: string }[];
  curatedRank?: { current?: number };
}

export interface RawStatusType {
  state?: string; // pre | in | post
  completed?: boolean;
  detail?: string;
  shortDetail?: string;
}

export interface RawSituation {
  balls?: number;
  strikes?: number;
  outs?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
  downDistanceText?: string;
  shortDownDistanceText?: string;
  lastPlay?: { text?: string };
}

export interface RawSeries {
  type?: string;
  title?: string;
  summary?: string; // "VGK leads series 2-1"
  completed?: boolean;
  totalCompetitions?: number; // best-of-N
  competitors?: { id?: string; wins?: number }[];
}

export interface RawOdds {
  provider?: { name?: string; priority?: number };
  /** Ready-made line, e.g. "DAL -3.5", "EVEN". */
  details?: string;
  /** Over/under total. */
  overUnder?: number;
  spread?: number;
}

export interface RawCompetition {
  competitors?: RawCompetitor[];
  status?: { type?: RawStatusType };
  venue?: { fullName?: string };
  broadcasts?: { names?: string[] }[];
  geoBroadcasts?: { media?: { shortName?: string } }[];
  situation?: RawSituation;
  series?: RawSeries;
  notes?: { headline?: string }[];
  odds?: RawOdds[];
}

export interface RawEvent {
  id?: string;
  date?: string;
  status?: { type?: RawStatusType };
  competitions?: RawCompetition[];
  /** Postseason = type 3. */
  season?: { type?: number };
  seasonType?: { type?: number };
}

export interface RawScoreboard {
  events?: RawEvent[];
}

export interface RawTeamDetail {
  team?: RawTeam & {
    record?: { items?: RawRecordItem[] };
    standingSummary?: string;
    nextEvent?: RawEvent[];
  };
}

export interface RawSchedule {
  events?: RawEvent[];
}

export interface RawStandingEntry {
  team?: RawTeam;
  stats?: { name?: string; displayValue?: string; value?: number }[];
}

export interface RawStandingNode {
  name?: string;
  shortName?: string;
  abbreviation?: string;
  standings?: { entries?: RawStandingEntry[] };
  children?: RawStandingNode[];
}

export interface RawStandings {
  children?: RawStandingNode[];
}

export interface RawAthleteStat {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  displayValue?: string;
  rank?: number;
  rankDisplayValue?: string;
}

export interface RawAthlete {
  athlete?: {
    id?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    jersey?: string;
    position?: { abbreviation?: string };
    headshot?: { href?: string };
    team?: RawTeam;
    statsSummary?: { displayName?: string; statistics?: RawAthleteStat[] };
  };
}

export interface RawGamelog {
  labels?: string[];
  names?: string[];
  events?: Record<
    string,
    {
      gameResult?: string;
      score?: string;
      opponent?: RawTeam;
      atVs?: string;
      gameDate?: string;
    }
  >;
  seasonTypes?: {
    categories?: { events?: { eventId?: string; stats?: string[] }[] }[];
  }[];
}

export interface RawRosterPlayer {
  id?: string;
  fullName?: string;
  displayName?: string;
  jersey?: string;
  position?: { abbreviation?: string };
  headshot?: { href?: string };
}

export interface RawRoster {
  team?: RawTeam;
  athletes?: ({ items?: RawRosterPlayer[] } | RawRosterPlayer)[];
}

export interface RawTeamsList {
  sports?: { leagues?: { teams?: { team?: RawTeam }[] }[] }[];
}

/* ── summary (single-game Game Center) ──────────────────────────────────────
   Win probability, play-by-play, drives (football), and per-team leaders.
   As elsewhere, every field is optional — ESPN purges plays/drives from old
   games and omits whole sections per sport, so the normalizer defaults around
   anything missing. */

export interface RawPeriod {
  number?: number;
  displayValue?: string;
  type?: string;
}

export interface RawClock {
  value?: number;
  displayValue?: string;
}

export interface RawWinProbability {
  homeWinPercentage?: number;
  tiePercentage?: number;
  playId?: string;
}

export interface RawScoringPlay {
  id?: string;
  text?: string;
  shortText?: string;
  period?: RawPeriod;
  clock?: RawClock;
  team?: RawTeam;
  scoringType?: { abbreviation?: string; displayName?: string };
  type?: { abbreviation?: string; text?: string };
  homeScore?: number;
  awayScore?: number;
}

export interface RawPlay {
  id?: string;
  sequenceNumber?: string;
  text?: string;
  shortText?: string;
  period?: RawPeriod;
  clock?: RawClock;
  scoringPlay?: boolean;
  team?: RawTeam; // sometimes only { id }, sometimes null
  homeScore?: number;
  awayScore?: number;
}

export interface RawDrive {
  id?: string;
  description?: string;
  team?: RawTeam;
  result?: string;
  displayResult?: string;
  shortDisplayResult?: string;
  isScore?: boolean;
}

export interface RawDrives {
  current?: RawDrive;
  previous?: RawDrive[];
}

export interface RawLeaderItem {
  displayValue?: string;
  value?: number;
  summary?: string; // "40 PTS, 6 REB, 5 AST"
  athlete?: {
    displayName?: string;
    shortName?: string;
    headshot?: { href?: string };
    position?: { abbreviation?: string };
    jersey?: string;
  };
}

export interface RawLeaderCategory {
  name?: string;
  displayName?: string;
  leaders?: RawLeaderItem[];
}

export interface RawTeamLeaders {
  team?: RawTeam;
  leaders?: RawLeaderCategory[];
}

export interface RawSummaryCompetitor {
  id?: string;
  homeAway?: string;
  winner?: boolean;
  team?: RawTeam;
  score?: string | RawScore;
  record?: { type?: string; summary?: string }[];
  records?: { type?: string; summary?: string }[];
}

export interface RawSummaryCompetition {
  id?: string;
  date?: string;
  status?: { type?: RawStatusType };
  competitors?: RawSummaryCompetitor[];
  broadcasts?: { media?: { shortName?: string }; names?: string[] }[];
}

export interface RawSummary {
  header?: {
    id?: string;
    competitions?: RawSummaryCompetition[];
  };
  gameInfo?: { venue?: { fullName?: string } };
  winprobability?: RawWinProbability[];
  scoringPlays?: RawScoringPlay[];
  plays?: RawPlay[];
  drives?: RawDrives;
  leaders?: RawTeamLeaders[];
}
