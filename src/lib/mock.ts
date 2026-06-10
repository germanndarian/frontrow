import type {
  Game,
  GameSide,
  Player,
  Preferences,
  StandingsGroup,
  Team,
  TeamCard,
} from "./types";

/* ───────────────────────────────────────────────────────────────────────────
   Realistic mock dataset. Logos and headshots point at ESPN's public CDN so
   the dashboard reads as a real product; every <TeamLogo>/<Headshot> degrades
   to a monogram if an asset 404s. Replace the accessors in lib/data.ts with
   live fetches and these objects fall away untouched.

   Snapshot moment: an evening in June 2026. MLB + NHL are live; NFL + NCAAF
   are deep in the off-season.
   ─────────────────────────────────────────────────────────────────────────── */

export function logo(
  league: "mlb" | "nhl" | "nfl",
  key: string,
): string {
  return `https://a.espncdn.com/i/teamlogos/${league}/500/${key}.png`;
}
export function ncaaLogo(id: string): string {
  return `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
}
export function headshot(
  sport: "mlb" | "nhl" | "nfl" | "college-football",
  id: string,
): string {
  return `https://a.espncdn.com/i/headshots/${sport}/players/full/${id}.png`;
}

function side(
  partial: Partial<GameSide> & Pick<GameSide, "abbreviation" | "displayName" | "logo" | "color">,
): GameSide {
  return {
    teamId: partial.teamId ?? partial.abbreviation,
    shortName: partial.shortName ?? partial.displayName,
    score: partial.score ?? null,
    record: partial.record ?? null,
    winner: partial.winner ?? false,
    rank: partial.rank,
    ...partial,
  };
}

/* ── Scoreboard ─────────────────────────────────────────────────────────── */

export const GAMES: Game[] = [
  {
    id: "mlb-1",
    league: "mlb",
    state: "in",
    statusDetail: "Bottom 7th",
    shortDetail: "Bot 7th",
    date: "2026-06-05T23:05:00Z",
    venue: "Yankee Stadium",
    broadcast: "YES",
    situation: "2 Out · Runner on 2nd",
    lastPlay: "Soto singles to right, Judge to 2nd",
    period: "Bot 7th",
    away: side({
      teamId: "2",
      abbreviation: "BOS",
      displayName: "Boston Red Sox",
      shortName: "Red Sox",
      logo: logo("mlb", "bos"),
      color: "#bd3039",
      score: 3,
      record: "34-28",
    }),
    home: side({
      teamId: "10",
      abbreviation: "NYY",
      displayName: "New York Yankees",
      shortName: "Yankees",
      logo: logo("mlb", "nyy"),
      color: "#0c2340",
      score: 4,
      record: "37-25",
    }),
  },
  {
    id: "mlb-2",
    league: "mlb",
    state: "in",
    statusDetail: "Top 5th",
    shortDetail: "Top 5th",
    date: "2026-06-05T23:40:00Z",
    venue: "Petco Park",
    broadcast: "ESPN",
    situation: "1 Out · Bases empty",
    lastPlay: "Betts grounds out, second to first",
    period: "Top 5th",
    away: side({
      teamId: "19",
      abbreviation: "LAD",
      displayName: "Los Angeles Dodgers",
      shortName: "Dodgers",
      logo: logo("mlb", "lad"),
      color: "#005a9c",
      score: 2,
      record: "41-22",
    }),
    home: side({
      teamId: "25",
      abbreviation: "SD",
      displayName: "San Diego Padres",
      shortName: "Padres",
      logo: logo("mlb", "sd"),
      color: "#2f241d",
      score: 2,
      record: "35-27",
    }),
  },
  {
    id: "mlb-3",
    league: "mlb",
    state: "post",
    statusDetail: "Final",
    shortDetail: "Final",
    date: "2026-06-05T17:05:00Z",
    venue: "Citizens Bank Park",
    away: side({
      teamId: "21",
      abbreviation: "NYM",
      displayName: "New York Mets",
      shortName: "Mets",
      logo: logo("mlb", "nym"),
      color: "#002d72",
      score: 2,
      record: "33-29",
    }),
    home: side({
      teamId: "22",
      abbreviation: "PHI",
      displayName: "Philadelphia Phillies",
      shortName: "Phillies",
      logo: logo("mlb", "phi"),
      color: "#e81828",
      score: 6,
      record: "36-26",
      winner: true,
    }),
  },
  {
    id: "mlb-4",
    league: "mlb",
    state: "pre",
    statusDetail: "10:10 PM",
    shortDetail: "10:10 PM",
    date: "2026-06-06T02:10:00Z",
    venue: "American Family Field",
    broadcast: "FS1",
    away: side({
      teamId: "16",
      abbreviation: "CHC",
      displayName: "Chicago Cubs",
      shortName: "Cubs",
      logo: logo("mlb", "chc"),
      color: "#0e3386",
      record: "32-30",
    }),
    home: side({
      teamId: "8",
      abbreviation: "MIL",
      displayName: "Milwaukee Brewers",
      shortName: "Brewers",
      logo: logo("mlb", "mil"),
      color: "#12284b",
      record: "38-24",
    }),
  },
  {
    id: "nhl-1",
    league: "nhl",
    state: "in",
    statusDetail: "2nd Period · 07:34",
    shortDetail: "2nd · 07:34",
    date: "2026-06-05T23:00:00Z",
    venue: "Rogers Place",
    broadcast: "ABC",
    situation: "Even Strength · 5-on-5",
    lastPlay: "McDavid wins offensive-zone faceoff",
    period: "2nd · 07:34",
    away: side({
      teamId: "26",
      abbreviation: "FLA",
      displayName: "Florida Panthers",
      shortName: "Panthers",
      logo: logo("nhl", "fla"),
      color: "#c8102e",
      score: 1,
      record: "Series 2-2",
    }),
    home: side({
      teamId: "6",
      abbreviation: "EDM",
      displayName: "Edmonton Oilers",
      shortName: "Oilers",
      logo: logo("nhl", "edm"),
      color: "#fc4c02",
      score: 2,
      record: "Series 2-2",
    }),
  },
  {
    id: "nhl-2",
    league: "nhl",
    state: "post",
    statusDetail: "Final / OT",
    shortDetail: "Final/OT",
    date: "2026-06-04T00:00:00Z",
    venue: "Ball Arena",
    away: side({
      teamId: "25",
      abbreviation: "DAL",
      displayName: "Dallas Stars",
      shortName: "Stars",
      logo: logo("nhl", "dal"),
      color: "#006847",
      score: 3,
      record: "Eliminated",
    }),
    home: side({
      teamId: "17",
      abbreviation: "COL",
      displayName: "Colorado Avalanche",
      shortName: "Avalanche",
      logo: logo("nhl", "col"),
      color: "#6f263d",
      score: 4,
      record: "Advanced",
      winner: true,
    }),
  },
];

/* ── Teams ──────────────────────────────────────────────────────────────── */

export const TEAMS: Record<string, Team> = {
  nyy: {
    id: "10",
    league: "mlb",
    location: "New York",
    name: "Yankees",
    displayName: "New York Yankees",
    abbreviation: "NYY",
    logo: logo("mlb", "nyy"),
    color: "#0c2340",
    altColor: "#c4ced4",
    record: "37-25",
    standingSummary: "2nd in AL East",
  },
  edm: {
    id: "6",
    league: "nhl",
    location: "Edmonton",
    name: "Oilers",
    displayName: "Edmonton Oilers",
    abbreviation: "EDM",
    logo: logo("nhl", "edm"),
    color: "#fc4c02",
    altColor: "#041e42",
    record: "2-2",
    standingSummary: "Stanley Cup Final",
  },
  phi: {
    id: "21",
    league: "nfl",
    location: "Philadelphia",
    name: "Eagles",
    displayName: "Philadelphia Eagles",
    abbreviation: "PHI",
    logo: logo("nfl", "phi"),
    color: "#004c54",
    altColor: "#a5acaf",
    record: "14-3",
    standingSummary: "2025 · NFC East champs",
  },
  tex: {
    id: "251",
    league: "college-football",
    location: "Texas",
    name: "Longhorns",
    displayName: "Texas Longhorns",
    abbreviation: "TEX",
    logo: ncaaLogo("251"),
    color: "#bf5700",
    altColor: "#ffffff",
    record: "13-2",
    standingSummary: "2025 · SEC champs",
  },
};

/* ── Team cards (recent form, next fixture, scoring trend) ──────────────── */

export const TEAM_CARDS: Record<string, TeamCard> = {
  nyy: {
    team: TEAMS.nyy,
    form: [
      { result: "W", opponentAbbr: "BOS", atVs: "vs", score: "4-3", date: "2026-06-05" },
      { result: "W", opponentAbbr: "TB", atVs: "@", score: "6-2", date: "2026-06-03" },
      { result: "L", opponentAbbr: "TB", atVs: "@", score: "1-5", date: "2026-06-02" },
      { result: "W", opponentAbbr: "HOU", atVs: "vs", score: "8-1", date: "2026-06-01" },
      { result: "W", opponentAbbr: "HOU", atVs: "vs", score: "5-4", date: "2026-05-31" },
    ],
    next: {
      opponentAbbr: "BOS",
      opponentName: "Boston Red Sox",
      opponentLogo: logo("mlb", "bos"),
      atVs: "vs",
      date: "2026-06-06T17:05:00Z",
    },
    scoring: [3, 6, 1, 8, 5, 2, 7, 4, 6, 4],
    conceded: [2, 4, 3, 1, 6, 5, 1, 3, 2, 3],
  },
  edm: {
    team: TEAMS.edm,
    form: [
      { result: "W", opponentAbbr: "FLA", atVs: "vs", score: "5-4", date: "2026-06-01" },
      { result: "L", opponentAbbr: "FLA", atVs: "@", score: "2-3", date: "2026-05-30" },
      { result: "W", opponentAbbr: "FLA", atVs: "@", score: "4-1", date: "2026-05-28" },
      { result: "L", opponentAbbr: "FLA", atVs: "vs", score: "1-2", date: "2026-05-26" },
      { result: "W", opponentAbbr: "DAL", atVs: "@", score: "6-3", date: "2026-05-22" },
    ],
    next: {
      opponentAbbr: "FLA",
      opponentName: "Florida Panthers",
      opponentLogo: logo("nhl", "fla"),
      atVs: "vs",
      date: "2026-06-05T23:00:00Z",
    },
    scoring: [6, 1, 4, 2, 5, 3, 4, 1, 5, 2],
    conceded: [3, 2, 2, 4, 1, 5, 3, 2, 3, 3],
  },
  phi: {
    team: TEAMS.phi,
    form: [
      { result: "W", opponentAbbr: "KC", atVs: "@", score: "31-24", date: "2026-02-08" },
      { result: "W", opponentAbbr: "WSH", atVs: "@", score: "55-23", date: "2026-01-26" },
      { result: "W", opponentAbbr: "LAR", atVs: "vs", score: "28-22", date: "2026-01-19" },
      { result: "W", opponentAbbr: "GB", atVs: "vs", score: "22-10", date: "2026-01-12" },
      { result: "L", opponentAbbr: "DAL", atVs: "@", score: "17-41", date: "2026-01-05" },
    ],
    next: {
      opponentAbbr: "DAL",
      opponentName: "Dallas Cowboys",
      opponentLogo: logo("nfl", "dal"),
      atVs: "@",
      date: "2026-09-11T00:20:00Z",
    },
    scoring: [],
  },
  tex: {
    team: TEAMS.tex,
    form: [
      { result: "W", opponentAbbr: "GA", atVs: "vs", score: "27-19", date: "2026-01-09" },
      { result: "L", opponentAbbr: "OSU", atVs: "@", score: "21-28", date: "2025-12-20" },
      { result: "W", opponentAbbr: "A&M", atVs: "@", score: "31-17", date: "2025-11-29" },
      { result: "W", opponentAbbr: "ARK", atVs: "vs", score: "45-24", date: "2025-11-22" },
      { result: "W", opponentAbbr: "GA", atVs: "@", score: "30-15", date: "2025-11-15" },
    ],
    next: {
      opponentAbbr: "OSU",
      opponentName: "Ohio State Buckeyes",
      opponentLogo: ncaaLogo("194"),
      atVs: "@",
      date: "2026-08-29T19:30:00Z",
    },
    scoring: [],
  },
};

/* ── Players ────────────────────────────────────────────────────────────── */

export const PLAYERS: Record<string, Player> = {
  judge: {
    id: "33192",
    league: "mlb",
    fullName: "Aaron Judge",
    firstName: "Aaron",
    lastName: "Judge",
    teamId: "10",
    teamAbbr: "NYY",
    teamLogo: logo("mlb", "nyy"),
    color: "#0c2340",
    position: "RF",
    jersey: "99",
    headshot: headshot("mlb", "33192"),
    seasonLabel: "2026 season",
    stats: [
      { name: "avg", abbr: "AVG", label: "Batting Average", value: ".311", rank: 6, rankDisplay: "6th" },
      { name: "homeRuns", abbr: "HR", label: "Home Runs", value: "24", rank: 1, rankDisplay: "1st" },
      { name: "RBIs", abbr: "RBI", label: "Runs Batted In", value: "58", rank: 2, rankDisplay: "2nd" },
      { name: "onBasePct", abbr: "OBP", label: "On-Base %", value: ".441", rank: 1, rankDisplay: "1st" },
      { name: "slugAvg", abbr: "SLG", label: "Slugging", value: ".688", rank: 1, rankDisplay: "1st" },
      { name: "OPS", abbr: "OPS", label: "On-Base + Slugging", value: "1.129", rank: 1, rankDisplay: "1st" },
    ],
    recent: {
      label: "Hits",
      entries: [
        { id: "g1", date: "2026-06-05", opponentAbbr: "BOS", opponentLogo: logo("mlb", "bos"), atVs: "vs", result: "W", score: "4-3", stats: { H: "2", HR: "1", RBI: "2", BB: "1" }, primary: 2 },
        { id: "g2", date: "2026-06-03", opponentAbbr: "TB", opponentLogo: logo("mlb", "tb"), atVs: "@", result: "W", score: "6-2", stats: { H: "3", HR: "1", RBI: "3", BB: "0" }, primary: 3 },
        { id: "g3", date: "2026-06-02", opponentAbbr: "TB", opponentLogo: logo("mlb", "tb"), atVs: "@", result: "L", score: "1-5", stats: { H: "1", HR: "0", RBI: "0", BB: "2" }, primary: 1 },
        { id: "g4", date: "2026-06-01", opponentAbbr: "HOU", opponentLogo: logo("mlb", "hou"), atVs: "vs", result: "W", score: "8-1", stats: { H: "2", HR: "1", RBI: "4", BB: "1" }, primary: 2 },
        { id: "g5", date: "2026-05-31", opponentAbbr: "HOU", opponentLogo: logo("mlb", "hou"), atVs: "vs", result: "W", score: "5-4", stats: { H: "1", HR: "0", RBI: "1", BB: "0" }, primary: 1 },
        { id: "g6", date: "2026-05-30", opponentAbbr: "LAA", opponentLogo: logo("mlb", "laa"), atVs: "vs", result: "W", score: "7-3", stats: { H: "4", HR: "2", RBI: "5", BB: "0" }, primary: 4 },
      ],
    },
  },
  mcdavid: {
    id: "3895074",
    league: "nhl",
    fullName: "Connor McDavid",
    firstName: "Connor",
    lastName: "McDavid",
    teamId: "6",
    teamAbbr: "EDM",
    teamLogo: logo("nhl", "edm"),
    color: "#fc4c02",
    position: "C",
    jersey: "97",
    headshot: headshot("nhl", "3895074"),
    seasonLabel: "2026 playoffs",
    stats: [
      { name: "goals", abbr: "G", label: "Goals", value: "9", rank: 2, rankDisplay: "2nd" },
      { name: "assists", abbr: "A", label: "Assists", value: "24", rank: 1, rankDisplay: "1st" },
      { name: "points", abbr: "PTS", label: "Points", value: "33", rank: 1, rankDisplay: "1st" },
      { name: "plusMinus", abbr: "+/-", label: "Plus / Minus", value: "+12", rank: 3, rankDisplay: "3rd" },
      { name: "powerPlayGoals", abbr: "PPG", label: "Power-Play Goals", value: "4", rank: 2, rankDisplay: "2nd" },
      { name: "shots", abbr: "SOG", label: "Shots on Goal", value: "71", rank: 1, rankDisplay: "1st" },
    ],
    recent: {
      label: "Points",
      entries: [
        { id: "h1", date: "2026-06-01", opponentAbbr: "FLA", opponentLogo: logo("nhl", "fla"), atVs: "vs", result: "W", score: "5-4", stats: { G: "1", A: "2", SOG: "6" }, primary: 3 },
        { id: "h2", date: "2026-05-30", opponentAbbr: "FLA", opponentLogo: logo("nhl", "fla"), atVs: "@", result: "L", score: "2-3", stats: { G: "0", A: "1", SOG: "4" }, primary: 1 },
        { id: "h3", date: "2026-05-28", opponentAbbr: "FLA", opponentLogo: logo("nhl", "fla"), atVs: "@", result: "W", score: "4-1", stats: { G: "2", A: "1", SOG: "8" }, primary: 3 },
        { id: "h4", date: "2026-05-26", opponentAbbr: "FLA", opponentLogo: logo("nhl", "fla"), atVs: "vs", result: "L", score: "1-2", stats: { G: "0", A: "0", SOG: "5" }, primary: 0 },
        { id: "h5", date: "2026-05-22", opponentAbbr: "DAL", opponentLogo: logo("nhl", "dal"), atVs: "@", result: "W", score: "6-3", stats: { G: "1", A: "3", SOG: "7" }, primary: 4 },
        { id: "h6", date: "2026-05-20", opponentAbbr: "DAL", opponentLogo: logo("nhl", "dal"), atVs: "@", result: "W", score: "3-2", stats: { G: "1", A: "1", SOG: "6" }, primary: 2 },
      ],
    },
  },
  hurts: {
    id: "4040715",
    league: "nfl",
    fullName: "Jalen Hurts",
    firstName: "Jalen",
    lastName: "Hurts",
    teamId: "21",
    teamAbbr: "PHI",
    teamLogo: logo("nfl", "phi"),
    color: "#004c54",
    position: "QB",
    jersey: "1",
    headshot: headshot("nfl", "4040715"),
    seasonLabel: "2025 season",
    stats: [
      { name: "passYards", abbr: "YDS", label: "Passing Yards", value: "3,512", rank: 12, rankDisplay: "12th" },
      { name: "passTD", abbr: "TD", label: "Passing TD", value: "26", rank: 8, rankDisplay: "8th" },
      { name: "int", abbr: "INT", label: "Interceptions", value: "7", rank: 5, rankDisplay: "5th" },
      { name: "rushYards", abbr: "RUSH", label: "Rushing Yards", value: "618", rank: 1, rankDisplay: "1st QB" },
      { name: "rushTD", abbr: "rTD", label: "Rushing TD", value: "14", rank: 1, rankDisplay: "1st QB" },
      { name: "qbr", abbr: "QBR", label: "Total QBR", value: "68.4", rank: 6, rankDisplay: "6th" },
    ],
    recent: {
      label: "Pass Yds",
      entries: [
        { id: "f1", date: "2026-02-08", opponentAbbr: "KC", opponentLogo: logo("nfl", "kc"), atVs: "@", result: "W", score: "31-24", stats: { YDS: "278", TD: "2", INT: "0" }, primary: 278 },
        { id: "f2", date: "2026-01-26", opponentAbbr: "WSH", opponentLogo: logo("nfl", "wsh"), atVs: "@", result: "W", score: "55-23", stats: { YDS: "246", TD: "1", INT: "0" }, primary: 246 },
        { id: "f3", date: "2026-01-19", opponentAbbr: "LAR", opponentLogo: logo("nfl", "lar"), atVs: "vs", result: "W", score: "28-22", stats: { YDS: "204", TD: "0", INT: "1" }, primary: 204 },
        { id: "f4", date: "2026-01-12", opponentAbbr: "GB", opponentLogo: logo("nfl", "gb"), atVs: "vs", result: "W", score: "22-10", stats: { YDS: "131", TD: "1", INT: "0" }, primary: 131 },
      ],
    },
  },
  manning: {
    id: "4870906",
    league: "college-football",
    fullName: "Arch Manning",
    firstName: "Arch",
    lastName: "Manning",
    teamId: "251",
    teamAbbr: "TEX",
    teamLogo: ncaaLogo("251"),
    color: "#bf5700",
    position: "QB",
    jersey: "16",
    headshot: headshot("college-football", "4870906"),
    seasonLabel: "2025 season",
    stats: [
      { name: "passYards", abbr: "YDS", label: "Passing Yards", value: "3,941", rank: 4, rankDisplay: "4th" },
      { name: "passTD", abbr: "TD", label: "Passing TD", value: "34", rank: 3, rankDisplay: "3rd" },
      { name: "completionPct", abbr: "CMP%", label: "Completion %", value: "67.8", rank: 9, rankDisplay: "9th" },
      { name: "rushYards", abbr: "RUSH", label: "Rushing Yards", value: "512", rank: 2, rankDisplay: "2nd QB" },
      { name: "rushTD", abbr: "rTD", label: "Rushing TD", value: "9", rank: 4, rankDisplay: "4th" },
      { name: "qbr", abbr: "QBR", label: "Total QBR", value: "84.1", rank: 2, rankDisplay: "2nd" },
    ],
    recent: {
      label: "Pass Yds",
      entries: [
        { id: "m1", date: "2026-01-09", opponentAbbr: "GA", opponentLogo: ncaaLogo("61"), atVs: "vs", result: "W", score: "27-19", stats: { YDS: "312", TD: "3", INT: "0" }, primary: 312 },
        { id: "m2", date: "2025-12-20", opponentAbbr: "OSU", opponentLogo: ncaaLogo("194"), atVs: "@", result: "L", score: "21-28", stats: { YDS: "265", TD: "2", INT: "2" }, primary: 265 },
        { id: "m3", date: "2025-11-29", opponentAbbr: "A&M", opponentLogo: ncaaLogo("245"), atVs: "@", result: "W", score: "31-17", stats: { YDS: "298", TD: "3", INT: "1" }, primary: 298 },
        { id: "m4", date: "2025-11-22", opponentAbbr: "ARK", opponentLogo: ncaaLogo("8"), atVs: "vs", result: "W", score: "45-24", stats: { YDS: "356", TD: "4", INT: "0" }, primary: 356 },
      ],
    },
  },
};

/* ── Standings ──────────────────────────────────────────────────────────── */

export const STANDINGS: Record<string, StandingsGroup> = {
  mlb: {
    id: "al-east",
    name: "AL East",
    rows: [
      { teamId: "1", abbreviation: "TOR", displayName: "Toronto Blue Jays", logo: logo("mlb", "tor"), position: 1, followed: false, stats: { wins: "39", losses: "23", winPercent: ".629", gamesBehind: "-", streak: "W2" } },
      { teamId: "10", abbreviation: "NYY", displayName: "New York Yankees", logo: logo("mlb", "nyy"), position: 2, followed: true, stats: { wins: "37", losses: "25", winPercent: ".597", gamesBehind: "2.0", streak: "W3" } },
      { teamId: "2", abbreviation: "BOS", displayName: "Boston Red Sox", logo: logo("mlb", "bos"), position: 3, followed: false, stats: { wins: "34", losses: "28", winPercent: ".548", gamesBehind: "5.0", streak: "L1" } },
      { teamId: "30", abbreviation: "TB", displayName: "Tampa Bay Rays", logo: logo("mlb", "tb"), position: 4, followed: false, stats: { wins: "31", losses: "31", winPercent: ".500", gamesBehind: "8.0", streak: "L2" } },
      { teamId: "3", abbreviation: "BAL", displayName: "Baltimore Orioles", logo: logo("mlb", "bal"), position: 5, followed: false, stats: { wins: "27", losses: "35", winPercent: ".435", gamesBehind: "12.0", streak: "W1" } },
    ],
  },
  nhl: {
    id: "pacific",
    name: "Pacific Division",
    rows: [
      { teamId: "37", abbreviation: "VGK", displayName: "Vegas Golden Knights", logo: logo("nhl", "vgk"), position: 1, followed: false, clinched: "x", stats: { gamesPlayed: "82", wins: "51", losses: "24", otLosses: "7", points: "109" } },
      { teamId: "6", abbreviation: "EDM", displayName: "Edmonton Oilers", logo: logo("nhl", "edm"), position: 2, followed: true, clinched: "x", stats: { gamesPlayed: "82", wins: "48", losses: "26", otLosses: "8", points: "104" } },
      { teamId: "20", abbreviation: "LA", displayName: "Los Angeles Kings", logo: logo("nhl", "la"), position: 3, followed: false, clinched: "x", stats: { gamesPlayed: "82", wins: "46", losses: "27", otLosses: "9", points: "101" } },
      { teamId: "22", abbreviation: "VAN", displayName: "Vancouver Canucks", logo: logo("nhl", "van"), position: 4, followed: false, stats: { gamesPlayed: "82", wins: "40", losses: "33", otLosses: "9", points: "89" } },
      { teamId: "53", abbreviation: "CGY", displayName: "Calgary Flames", logo: logo("nhl", "cgy"), position: 5, followed: false, stats: { gamesPlayed: "82", wins: "38", losses: "35", otLosses: "9", points: "85" } },
    ],
  },
  nfl: {
    id: "nfc-east",
    name: "NFC East · 2025 final",
    rows: [
      { teamId: "21", abbreviation: "PHI", displayName: "Philadelphia Eagles", logo: logo("nfl", "phi"), position: 1, followed: true, clinched: "z", stats: { wins: "14", losses: "3", ties: "0", winPercent: ".824", streak: "W7" } },
      { teamId: "6", abbreviation: "DAL", displayName: "Dallas Cowboys", logo: logo("nfl", "dal"), position: 2, followed: false, clinched: "x", stats: { wins: "11", losses: "6", ties: "0", winPercent: ".647", streak: "L1" } },
      { teamId: "19", abbreviation: "NYG", displayName: "New York Giants", logo: logo("nfl", "nyg"), position: 3, followed: false, stats: { wins: "7", losses: "10", ties: "0", winPercent: ".412", streak: "W1" } },
      { teamId: "28", abbreviation: "WSH", displayName: "Washington Commanders", logo: logo("nfl", "wsh"), position: 4, followed: false, stats: { wins: "6", losses: "11", ties: "0", winPercent: ".353", streak: "L3" } },
    ],
  },
  "college-football": {
    id: "sec",
    name: "SEC · 2025 final",
    rows: [
      { teamId: "251", abbreviation: "TEX", displayName: "Texas Longhorns", logo: ncaaLogo("251"), position: 1, followed: true, stats: { wins: "13", losses: "2", winPercent: ".867", streak: "W1" } },
      { teamId: "61", abbreviation: "UGA", displayName: "Georgia Bulldogs", logo: ncaaLogo("61"), position: 2, followed: false, stats: { wins: "12", losses: "2", winPercent: ".857", streak: "L1" } },
      { teamId: "333", abbreviation: "ALA", displayName: "Alabama Crimson Tide", logo: ncaaLogo("333"), position: 3, followed: false, stats: { wins: "11", losses: "2", winPercent: ".846", streak: "W3" } },
      { teamId: "99", abbreviation: "LSU", displayName: "LSU Tigers", logo: ncaaLogo("99"), position: 4, followed: false, stats: { wins: "10", losses: "3", winPercent: ".769", streak: "W2" } },
    ],
  },
};

/* ── Default preferences (stands in for completed onboarding) ───────────── */

export const DEFAULT_PREFERENCES: Preferences = {
  sports: ["baseball", "hockey", "football"],
  leagues: ["mlb", "nhl", "nfl", "college-football"],
  teams: [
    { league: "mlb", teamId: "10", displayName: "New York Yankees", abbreviation: "NYY", logo: logo("mlb", "nyy"), color: "#0c2340" },
    { league: "nhl", teamId: "6", displayName: "Edmonton Oilers", abbreviation: "EDM", logo: logo("nhl", "edm"), color: "#fc4c02" },
    { league: "nfl", teamId: "21", displayName: "Philadelphia Eagles", abbreviation: "PHI", logo: logo("nfl", "phi"), color: "#004c54" },
    { league: "college-football", teamId: "251", displayName: "Texas Longhorns", abbreviation: "TEX", logo: ncaaLogo("251"), color: "#bf5700" },
  ],
  players: [
    { league: "mlb", id: "33192", fullName: "Aaron Judge", teamAbbr: "NYY", headshot: headshot("mlb", "33192"), position: "RF" },
    { league: "nhl", id: "3895074", fullName: "Connor McDavid", teamAbbr: "EDM", headshot: headshot("nhl", "3895074"), position: "C" },
    { league: "nfl", id: "4040715", fullName: "Jalen Hurts", teamAbbr: "PHI", headshot: headshot("nfl", "4040715"), position: "QB" },
    { league: "college-football", id: "4870906", fullName: "Arch Manning", teamAbbr: "TEX", headshot: headshot("college-football", "4870906"), position: "QB" },
  ],
  onboarded: true,
};

/** Keyed lookup helpers used by the data facade. */
export const TEAM_CARD_BY_ID: Record<string, TeamCard> = {
  "10": TEAM_CARDS.nyy,
  "6": TEAM_CARDS.edm,
  "21": TEAM_CARDS.phi,
  "251": TEAM_CARDS.tex,
};

export const PLAYER_BY_ID: Record<string, Player> = {
  "33192": PLAYERS.judge,
  "3895074": PLAYERS.mcdavid,
  "4040715": PLAYERS.hurts,
  "4870906": PLAYERS.manning,
};
