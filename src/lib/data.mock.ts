import type {
  Game,
  LeagueId,
  PlayoffBracket,
  PlayoffSide,
  Player,
  ScheduleGame,
  StandingsGroup,
  TeamCard,
} from "./types";
import { GAMES, PLAYER_BY_ID, STANDINGS, TEAM_CARD_BY_ID } from "./mock";
import {
  type CatalogPlayer,
  type CatalogTeam,
  PLAYERS_BY_LEAGUE,
  TEAMS_BY_LEAGUE,
  findCatalogPlayer,
  findCatalogTeam,
} from "./catalog";
import { sleep } from "./utils";

/* Offline / demo data source. Selected via NEXT_PUBLIC_USE_MOCK=true. Mirrors
   the live facade's signatures so the app behaves identically without ESPN. */

const LATENCY = [180, 420];
function jitter() {
  return LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]);
}

function tickLiveGames(games: Game[]): Game[] {
  return games.map((g) => {
    if (g.state !== "in") return g;
    const roll = Math.random();
    const next: Game = structuredClone(g);
    if (roll < 0.18 && next.home.score != null) {
      next.home.score += 1;
      next.lastPlay =
        g.league === "nhl"
          ? `${next.home.shortName} score! Tip-in off the rush`
          : `${next.home.shortName} plate a run on a sac fly`;
    } else if (roll < 0.34 && next.away.score != null) {
      next.away.score += 1;
      next.lastPlay =
        g.league === "nhl"
          ? `${next.away.shortName} answer on the power play`
          : `${next.away.shortName} tie it with a two-out single`;
    }
    return next;
  });
}

function synthTeamCard(ct: CatalogTeam): TeamCard {
  return {
    team: {
      id: ct.teamId,
      league: ct.league,
      location: ct.displayName.replace(` ${ct.name}`, ""),
      name: ct.name,
      displayName: ct.displayName,
      abbreviation: ct.abbreviation,
      logo: ct.logo,
      color: ct.color,
      altColor: ct.color,
      record: "—",
      standingSummary: "Stats arrive with live data",
    },
    form: [],
    next: null,
    scoring: [],
    placeholder: true,
  };
}

function synthPlayer(cp: CatalogPlayer): Player {
  const team = findCatalogTeam(cp.teamId);
  return {
    id: cp.id,
    league: cp.league,
    fullName: cp.fullName,
    firstName: cp.fullName.split(" ")[0],
    lastName: cp.fullName.split(" ").slice(1).join(" "),
    teamId: cp.teamId,
    teamAbbr: cp.teamAbbr,
    teamLogo: team?.logo ?? "",
    color: team?.color ?? "#64748b",
    position: cp.position,
    jersey: "—",
    headshot: cp.headshot,
    seasonLabel: "—",
    stats: [],
    recent: { label: "", entries: [] },
    placeholder: true,
  };
}

export async function getScoreboard(leagues: LeagueId[]): Promise<Game[]> {
  await sleep(jitter());
  return tickLiveGames(GAMES.filter((g) => leagues.includes(g.league)));
}

export async function getTeamCard(_league: LeagueId, teamId: string): Promise<TeamCard | null> {
  await sleep(jitter());
  if (TEAM_CARD_BY_ID[teamId]) return TEAM_CARD_BY_ID[teamId];
  const ct = findCatalogTeam(teamId);
  return ct ? synthTeamCard(ct) : null;
}

export async function getPlayer(_league: LeagueId, id: string): Promise<Player | null> {
  await sleep(jitter());
  if (PLAYER_BY_ID[id]) return PLAYER_BY_ID[id];
  const cp = findCatalogPlayer(id);
  return cp ? synthPlayer(cp) : null;
}

export async function getStandings(
  league: LeagueId,
  _teamId?: string,
): Promise<StandingsGroup | null> {
  await sleep(jitter());
  return STANDINGS[league] ?? null;
}

export async function getSchedule(
  _league: LeagueId,
  teamId: string,
): Promise<ScheduleGame[]> {
  await sleep(jitter());
  const card = TEAM_CARD_BY_ID[teamId];
  if (!card) return [];
  const past: ScheduleGame[] = card.form.map((f, i) => ({
    id: `past-${i}`,
    date: f.date,
    state: "post",
    opponentAbbr: f.opponentAbbr,
    opponentName: f.opponentAbbr,
    opponentLogo: "",
    atVs: f.atVs,
    result: f.result,
    score: f.score,
  }));
  const upcoming: ScheduleGame[] = card.next
    ? [
        {
          id: "next-0",
          date: card.next.date,
          state: "pre",
          opponentAbbr: card.next.opponentAbbr,
          opponentName: card.next.opponentName,
          opponentLogo: card.next.opponentLogo,
          atVs: card.next.atVs,
        },
      ]
    : [];
  return [...past, ...upcoming].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export async function getCatalogTeams(leagues: LeagueId[]): Promise<CatalogTeam[]> {
  await sleep(jitter());
  return leagues.flatMap((l) => TEAMS_BY_LEAGUE[l] ?? []);
}

export async function getRostersForTeams(
  teams: { league: LeagueId; teamId: string }[],
): Promise<CatalogPlayer[]> {
  await sleep(jitter());
  const ids = new Set(teams.map((t) => t.teamId));
  return Object.values(PLAYERS_BY_LEAGUE)
    .flat()
    .filter((p) => ids.has(p.teamId));
}

/* ── Playoff bracket (demo) ─────────────────────────────────────────────── */

function nhlLogo(abbr: string) {
  return `https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/${abbr.toLowerCase()}.png`;
}
function side(
  teamId: string,
  abbreviation: string,
  displayName: string,
  color: string,
  score: number,
  winner = false,
): PlayoffSide {
  return { teamId, abbreviation, displayName, logo: nhlLogo(abbreviation), color: `#${color}`, score, winner };
}

const NHL_BRACKET: PlayoffBracket = {
  league: "nhl",
  name: "Stanley Cup Playoffs",
  rounds: [
    {
      id: "r0",
      name: "1st Round",
      matchups: [
        {
          id: "nhl-1st_round-bos-tor",
          round: 0,
          format: "series",
          bestOf: 7,
          state: "post",
          home: side("6", "BOS", "Boston Bruins", "FFB81C", 4, true),
          away: side("10", "TOR", "Toronto Maple Leafs", "00205B", 3),
          summary: "BOS wins series 4-3",
          winnerTeamId: "6",
          nextMatchupId: "nhl-final-bos-fla",
        },
        {
          id: "nhl-1st_round-fla-tbl",
          round: 0,
          format: "series",
          bestOf: 7,
          state: "post",
          home: side("26", "FLA", "Florida Panthers", "C8102E", 4, true),
          away: side("20", "TBL", "Tampa Bay Lightning", "002868", 1),
          summary: "FLA wins series 4-1",
          winnerTeamId: "26",
          nextMatchupId: "nhl-final-bos-fla",
        },
      ],
    },
    {
      id: "r1",
      name: "Stanley Cup Final",
      matchups: [
        {
          id: "nhl-final-bos-fla",
          round: 1,
          format: "series",
          bestOf: 7,
          state: "in",
          home: side("6", "BOS", "Boston Bruins", "FFB81C", 2),
          away: side("26", "FLA", "Florida Panthers", "C8102E", 1),
          summary: "BOS leads series 2-1 · Game 4 tonight",
          winnerTeamId: null,
          nextMatchupId: null,
        },
      ],
    },
  ],
};

const MOCK_BRACKETS: Partial<Record<LeagueId, PlayoffBracket>> = { nhl: NHL_BRACKET };

export async function getPlayoffBracket(league: LeagueId): Promise<PlayoffBracket> {
  await sleep(jitter());
  return MOCK_BRACKETS[league] ?? { league, name: "Playoffs", rounds: [] };
}
