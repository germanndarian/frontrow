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

export interface RawCompetition {
  competitors?: RawCompetitor[];
  status?: { type?: RawStatusType };
  venue?: { fullName?: string };
  broadcasts?: { names?: string[] }[];
  geoBroadcasts?: { media?: { shortName?: string } }[];
  situation?: RawSituation;
  series?: RawSeries;
  notes?: { headline?: string }[];
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
