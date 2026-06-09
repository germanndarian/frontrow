/* Reconstruct a playoff bracket from ESPN's postseason scoreboard.

   ESPN has no single "bracket" endpoint, but the scoreboard over the postseason
   date window carries everything we need: each playoff game has a `series` object
   (wins per team, best-of-N) for series leagues, a `notes` headline naming the
   round, and `season.type === 3` marks the postseason. We group games into series
   by (round, team-pair), take each series' latest game for the current score,
   order rounds by earliest game date, and link a series to the next round by
   which winner advances. Defensive throughout — anything unexpected degrades to an
   empty bracket rather than throwing. */

import type {
  GameState,
  LeagueId,
  PlayoffBracket,
  PlayoffMatchup,
  PlayoffRound,
  PlayoffSide,
} from "@/lib/types";
import { hex } from "@/lib/utils";
import { espnFetch } from "./client";
import { espnUrl, REVALIDATE } from "./endpoints";
import type { RawCompetition, RawCompetitor, RawScoreboard } from "./raw";

const BRACKET_NAME: Record<LeagueId, string> = {
  nhl: "Stanley Cup Playoffs",
  mlb: "MLB Postseason",
  nfl: "NFL Playoffs",
  "college-football": "College Football Playoff",
  nba: "NBA Playoffs",
};

function toState(s?: string): GameState {
  return s === "in" ? "in" : s === "pre" ? "pre" : "post";
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

/** "Stanley Cup Final - Game 4" → "Stanley Cup Final". Empty if no headline. */
function roundNote(comp: RawCompetition): string {
  const h = comp.notes?.[0]?.headline ?? "";
  return h.replace(/\s*-\s*Game\s*\d+.*$/i, "").trim();
}

/** Map a round headline to a canonical, conference-agnostic round name, so East
    & West (or AL & NL) share one round column and naming is clean. */
function canonicalRound(note: string): string {
  const n = note.toLowerCase();
  if (/world series/.test(n)) return "World Series";
  if (/super bowl/.test(n)) return "Super Bowl";
  if (/stanley cup final/.test(n)) return "Stanley Cup Final";
  if (/national championship/.test(n)) return "National Championship";
  if (/wild ?card/.test(n)) return "Wild Card";
  if (/divisional/.test(n)) return "Divisional Round";
  if (/conference semifinal|conf semifinal|^(eastern|western|east|west)\s+semifinals?\b/.test(n))
    return "Conference Semifinals";
  if (/conference final|conf final|conference championship|^(eastern|western|east|west)\s+finals?\b/.test(n))
    return "Conference Finals";
  if (/division series/.test(n)) return "Division Series";
  if (/championship series/.test(n)) return "Championship Series";
  if (/1st round|first round/.test(n)) return "1st Round";
  if (/2nd round|second round/.test(n)) return "2nd Round";
  if (/3rd round|third round/.test(n)) return "3rd Round";
  const stripped = note
    .replace(/^(eastern|western|east|west|american league|national league|afc|nfc)\s+/i, "")
    .trim();
  return stripped || "Playoffs";
}

function teamId(c: RawCompetitor): string {
  return c.team?.id ?? "";
}

interface Game {
  id: string;
  date: string;
  tier: string;
  comp: RawCompetition;
  ids: string[];
}

function collectGames(raw: RawScoreboard): Game[] {
  const out: Game[] = [];
  for (const e of raw.events ?? []) {
    const comp = e.competitions?.[0];
    if (!comp) continue;
    const isPlayoff = e.season?.type === 3 || Boolean(comp.series);
    if (!isPlayoff) continue;
    // A game with no round headline can't be placed in the bracket — skip it
    // (these are stray/placeholder entries, e.g. unplayed "if necessary" games).
    const note = roundNote(comp);
    if (!note) continue;
    const comps = (comp.competitors ?? []).filter((c) => teamId(c));
    if (comps.length < 2) continue;
    out.push({
      id: e.id ?? "",
      date: e.date ?? "",
      tier: canonicalRound(note),
      comp,
      ids: comps.map(teamId),
    });
  }
  return out;
}

function buildMatchup(group: Game[], league: LeagueId): PlayoffMatchup | null {
  // Latest game holds the current series state / final score.
  const latest = group.reduce((a, b) => (a.date >= b.date ? a : b));
  const comp = latest.comp;
  const series = comp.series;
  const comps = (comp.competitors ?? []).filter((c) => teamId(c)).slice(0, 2);
  if (comps.length < 2) return null;

  const sides = comps.map((c) => {
    const id = teamId(c);
    const score = series
      ? series.competitors?.find((x) => x.id === id)?.wins ?? 0
      : num(c.score);
    return { c, id, score };
  });

  const bestOf = series?.totalCompetitions;
  const needed = bestOf ? Math.ceil(bestOf / 2) : undefined;
  let winnerTeamId: string | null = null;
  if (series) {
    const w = sides.find((s) => needed != null && (s.score ?? 0) >= needed);
    winnerTeamId = w?.id ?? null;
  } else {
    winnerTeamId = sides.find((s) => s.c.winner)?.id ?? null;
  }

  // Leader / winner on top.
  sides.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const toSide = (s: (typeof sides)[number]): PlayoffSide => {
    const t = s.c.team ?? {};
    const rank = s.c.curatedRank?.current;
    return {
      teamId: s.id,
      abbreviation: t.abbreviation ?? "",
      displayName: t.displayName ?? t.shortDisplayName ?? t.abbreviation ?? "",
      logo: t.logo ?? t.logos?.[0]?.href ?? "",
      color: hex(t.color),
      seed: rank && rank > 0 && rank <= 25 ? rank : undefined,
      score: s.score,
      winner: s.id === winnerTeamId,
    };
  };

  const state = toState(comp.status?.type?.state);
  const detail = comp.status?.type?.shortDetail ?? "";
  const summary = series
    ? (series.summary ?? "") + (state === "in" && detail ? ` · ${detail}` : "")
    : detail;

  const idKey = [...latest.ids].sort().join("-");
  return {
    id: `${league}-${latest.tier}-${idKey}`.replace(/\s+/g, "_").toLowerCase(),
    round: 0,
    format: series ? "series" : "game",
    bestOf,
    state,
    home: toSide(sides[0]),
    away: toSide(sides[1]),
    summary,
    winnerTeamId,
    nextMatchupId: null,
  };
}

export function normalizeBracket(raw: RawScoreboard, league: LeagueId): PlayoffBracket {
  const games = collectGames(raw);
  const empty: PlayoffBracket = { league, name: BRACKET_NAME[league], rounds: [] };
  if (games.length === 0) return empty;

  // Group games into matchups. Series leagues group by (tier + team-pair);
  // single-game playoffs are one matchup per game.
  const groups = new Map<string, Game[]>();
  const firstDate = new Map<string, string>(); // tier → earliest game date
  for (const g of games) {
    const seriesGame = Boolean(g.comp.series);
    const key = seriesGame ? `${g.tier}|${[...g.ids].sort().join("-")}` : `game|${g.id}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(g);
    const prev = firstDate.get(g.tier);
    if (!prev || g.date < prev) firstDate.set(g.tier, g.date);
  }

  // Round order = tiers sorted by earliest game date.
  const tierOrder = [...firstDate.entries()]
    .sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0))
    .map(([tier]) => tier);
  const roundIndex = new Map(tierOrder.map((t, i) => [t, i]));

  const matchups: PlayoffMatchup[] = [];
  for (const group of groups.values()) {
    const m = buildMatchup(group, league);
    if (!m) continue;
    m.round = roundIndex.get(group[0].tier) ?? 0;
    matchups.push(m);
  }

  // Link each matchup to the next-round matchup its winner advanced into.
  for (const m of matchups) {
    if (!m.winnerTeamId) continue;
    const next = matchups.find(
      (n) =>
        n.round === m.round + 1 &&
        (n.home.teamId === m.winnerTeamId || n.away.teamId === m.winnerTeamId),
    );
    m.nextMatchupId = next?.id ?? null;
  }

  const rounds: PlayoffRound[] = tierOrder.map((tier, i) => ({
    id: `r${i}`,
    name: tier,
    matchups: matchups
      .filter((m) => m.round === i)
      .sort((a, b) => (b.home.score ?? 0) - (a.home.score ?? 0)),
  }));

  return { league, name: BRACKET_NAME[league], rounds };
}

function dateWindow(now = new Date()): string {
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  const start = new Date(now);
  start.setDate(start.getDate() - 80);
  const end = new Date(now);
  end.setDate(end.getDate() + 10);
  return `${fmt(start)}-${fmt(end)}`;
}

export async function fetchBracket(league: LeagueId): Promise<PlayoffBracket> {
  const raw = await espnFetch<RawScoreboard>(
    espnUrl.playoffScoreboard(league, dateWindow()),
    REVALIDATE.bracket,
  ).catch(() => ({ events: [] }) as RawScoreboard);
  return normalizeBracket(raw, league);
}
