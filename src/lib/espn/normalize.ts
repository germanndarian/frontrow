import { LEAGUES } from "@/lib/leagues";
import { hex } from "@/lib/utils";
import type { CatalogPlayer, CatalogTeam } from "@/lib/catalog";
import type {
  Game,
  GameSide,
  LeagueId,
  Outcome,
  Player,
  ScheduleGame,
  StandingsGroup,
  Team,
  TeamCard,
} from "@/lib/types";
import type {
  RawAthlete,
  RawCompetition,
  RawCompetitor,
  RawEvent,
  RawGamelog,
  RawRoster,
  RawRosterPlayer,
  RawScore,
  RawScoreboard,
  RawSchedule,
  RawStandingNode,
  RawStandings,
  RawTeam,
  RawTeamDetail,
  RawTeamsList,
} from "./raw";

/* ── shared helpers ─────────────────────────────────────────────────────── */

function teamLogo(t?: RawTeam): string {
  return t?.logo ?? t?.logos?.[0]?.href ?? "";
}

function parseScore(s?: string | RawScore): number | null {
  if (s == null) return null;
  if (typeof s === "object") {
    if (typeof s.value === "number") return s.value;
    if (s.displayValue != null && s.displayValue !== "") {
      const n = Number(s.displayValue);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function scoreDisp(s?: string | RawScore): string {
  if (s == null) return "";
  if (typeof s === "object") return s.displayValue ?? (s.value != null ? String(s.value) : "");
  return s;
}

function byDateAsc(a: RawEvent, b: RawEvent): number {
  return new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime();
}

function lastName(displayName?: string): string {
  return displayName?.trim().split(/\s+/).pop() ?? "";
}

/* ── scoreboard → Game[] ────────────────────────────────────────────────── */

function side(c?: RawCompetitor): GameSide {
  const t = c?.team ?? {};
  const rank = c?.curatedRank?.current;
  return {
    teamId: t.id ?? "",
    abbreviation: t.abbreviation ?? "",
    displayName: t.displayName ?? "",
    shortName: t.shortDisplayName ?? t.name ?? t.displayName ?? "",
    logo: teamLogo(t),
    color: hex(t.color),
    score: parseScore(c?.score),
    record:
      c?.records?.find((r) => r.type === "total")?.summary ?? c?.records?.[0]?.summary ?? null,
    winner: !!c?.winner,
    rank: typeof rank === "number" && rank > 0 && rank <= 25 ? rank : undefined,
  };
}

function buildSituation(
  comp: RawCompetition,
  sport: string,
): { situation?: string; lastPlay?: string } {
  const s = comp.situation;
  if (!s) return {};
  const lastPlay = s.lastPlay?.text;
  if (sport === "baseball") {
    const bases: string[] = [];
    if (s.onThird) bases.push("3rd");
    if (s.onSecond) bases.push("2nd");
    if (s.onFirst) bases.push("1st");
    const baseTxt = bases.length
      ? `Runner${bases.length > 1 ? "s" : ""} on ${bases.join(" & ")}`
      : "Bases empty";
    const situation = s.outs != null ? `${s.outs} Out · ${baseTxt}` : baseTxt;
    return { situation, lastPlay };
  }
  if (sport === "football") {
    return { situation: s.downDistanceText ?? s.shortDownDistanceText, lastPlay };
  }
  return { situation: undefined, lastPlay };
}

export function normalizeScoreboard(raw: RawScoreboard, league: LeagueId): Game[] {
  const sport = LEAGUES[league].espnSport;
  return (raw.events ?? []).map((ev): Game => {
    const comp = ev.competitions?.[0] ?? {};
    const cs = comp.competitors ?? [];
    const home = cs.find((c) => c.homeAway === "home") ?? cs[0];
    const away = cs.find((c) => c.homeAway === "away") ?? cs[1];
    const st = ev.status?.type ?? comp.status?.type ?? {};
    const state = st.state === "in" || st.state === "post" ? st.state : "pre";
    const broadcast =
      comp.broadcasts?.find((b) => b.names?.length)?.names?.[0] ??
      comp.geoBroadcasts?.[0]?.media?.shortName;
    const sit = state === "in" ? buildSituation(comp, sport) : {};
    return {
      id: ev.id ?? `${league}-${ev.date ?? Math.random()}`,
      league,
      state,
      statusDetail: st.detail ?? "",
      shortDetail: st.shortDetail ?? st.detail ?? "",
      date: ev.date ?? "",
      home: side(home),
      away: side(away),
      venue: comp.venue?.fullName,
      broadcast: broadcast || undefined,
      situation: sit.situation,
      lastPlay: sit.lastPlay,
      period: state === "in" ? st.shortDetail ?? "" : undefined,
    };
  });
}

/* ── team detail + schedule → TeamCard ──────────────────────────────────── */

export function normalizeTeamCard(
  detail: RawTeamDetail,
  sched: RawSchedule,
  league: LeagueId,
): TeamCard {
  const t = detail.team ?? {};
  const team: Team = {
    id: t.id ?? "",
    league,
    location: t.location ?? "",
    name: t.name ?? lastName(t.displayName),
    displayName: t.displayName ?? "",
    abbreviation: t.abbreviation ?? "",
    logo: teamLogo(t),
    color: hex(t.color),
    altColor: hex(t.alternateColor, t.color ?? "64748b"),
    record:
      t.record?.items?.find((i) => i.type === "total")?.summary ??
      t.record?.items?.[0]?.summary ??
      "—",
    standingSummary: t.standingSummary ?? "",
  };

  const pick = (ev: RawEvent) => {
    const c = ev.competitions?.[0];
    const me = c?.competitors?.find((x) => x.team?.id === t.id);
    const opp = c?.competitors?.find((x) => x.team?.id !== t.id);
    return { c, me, opp };
  };
  const events = sched.events ?? [];
  const completed = events
    .filter((ev) => ev.competitions?.[0]?.status?.type?.completed)
    .sort(byDateAsc);
  const upcoming = events
    .filter((ev) => !ev.competitions?.[0]?.status?.type?.completed)
    .sort(byDateAsc);

  const form = completed
    .slice(-5)
    .reverse()
    .map((ev) => {
      const { me, opp } = pick(ev);
      const result: Outcome = me?.winner ? "W" : opp?.winner ? "L" : "T";
      return {
        result,
        opponentAbbr: opp?.team?.abbreviation ?? "",
        atVs: (me?.homeAway === "home" ? "vs" : "@") as "@" | "vs",
        score: `${scoreDisp(me?.score)}-${scoreDisp(opp?.score)}`,
        date: ev.date ?? "",
      };
    });

  const scoring = completed.slice(-10).map((ev) => parseScore(pick(ev).me?.score) ?? 0);

  const nextEv = upcoming[0];
  let next: TeamCard["next"] = null;
  if (nextEv) {
    const { me, opp } = pick(nextEv);
    next = {
      opponentAbbr: opp?.team?.abbreviation ?? "",
      opponentName: opp?.team?.displayName ?? "Opponent",
      opponentLogo: teamLogo(opp?.team),
      atVs: me?.homeAway === "home" ? "vs" : "@",
      date: nextEv.date ?? "",
    };
  }

  return { team, form, next, scoring, placeholder: false };
}

/* ── schedule → ScheduleGame[] (full season, chronological) ─────────────── */

export function normalizeSchedule(
  sched: RawSchedule,
  league: LeagueId,
  teamId: string,
): ScheduleGame[] {
  void league;
  return (sched.events ?? [])
    .map((ev): ScheduleGame => {
      const c = ev.competitions?.[0];
      const me = c?.competitors?.find((x) => x.team?.id === teamId);
      const opp = c?.competitors?.find((x) => x.team?.id !== teamId);
      const completed = !!c?.status?.type?.completed;
      const broadcast =
        c?.broadcasts?.find((b) => b.names?.length)?.names?.[0] ??
        c?.geoBroadcasts?.[0]?.media?.shortName;
      return {
        id: ev.id ?? "",
        date: ev.date ?? "",
        state: completed ? "post" : "pre",
        opponentAbbr: opp?.team?.abbreviation ?? "",
        opponentName: opp?.team?.displayName ?? "Opponent",
        opponentLogo: teamLogo(opp?.team),
        atVs: me?.homeAway === "home" ? "vs" : "@",
        result: completed ? (me?.winner ? "W" : opp?.winner ? "L" : "T") : undefined,
        score: completed ? `${scoreDisp(me?.score)}-${scoreDisp(opp?.score)}` : undefined,
        broadcast: completed ? undefined : broadcast || undefined,
      };
    })
    .filter((g) => g.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/* ── standings → StandingsGroup (the followed team's division) ───────────── */

export function normalizeStandings(
  raw: RawStandings,
  league: LeagueId,
  teamId?: string,
): StandingsGroup | null {
  const leaves: RawStandingNode[] = [];
  const walk = (n: RawStandingNode) => {
    if (n.standings?.entries?.length) leaves.push(n);
    (n.children ?? []).forEach(walk);
  };
  (raw.children ?? []).forEach(walk);
  if (leaves.length === 0) return null;

  const group =
    (teamId &&
      leaves.find((g) => g.standings?.entries?.some((e) => e.team?.id === teamId))) ||
    leaves[0];

  const rows = (group.standings?.entries ?? []).map((e, i) => {
    const t = e.team ?? {};
    const stats: Record<string, string> = {};
    for (const s of e.stats ?? []) {
      if (s.name) stats[s.name] = s.displayValue ?? (s.value != null ? String(s.value) : "—");
    }
    return {
      teamId: t.id ?? "",
      abbreviation: t.abbreviation ?? "",
      displayName: t.displayName ?? "",
      logo: teamLogo(t),
      position: i + 1,
      stats,
      followed: !!teamId && t.id === teamId,
    };
  });

  return {
    id: group.abbreviation ?? group.name ?? league,
    name: group.shortName ?? group.name ?? "",
    rows,
  };
}

/* ── athlete + gamelog → Player ─────────────────────────────────────────── */

const PRIMARY_LABELS = ["PTS", "H", "YDS", "G", "TD", "REC", "GOALS", "P"];

function buildRecent(gamelog: RawGamelog, league: LeagueId): Player["recent"] {
  const labels = gamelog.labels ?? [];
  const eventsMap = gamelog.events ?? {};
  let catEvents: { eventId?: string; stats?: string[] }[] = [];
  for (const stp of gamelog.seasonTypes ?? []) {
    for (const c of stp.categories ?? []) {
      if (c.events?.length) {
        catEvents = c.events;
        break;
      }
    }
    if (catEvents.length) break;
  }

  let pIdx = labels.findIndex((l) => PRIMARY_LABELS.includes(l));
  if (pIdx < 0) pIdx = 0;
  const label = labels[pIdx] ?? "Output";

  const entries = catEvents
    .map((ce) => {
      const meta = eventsMap[ce.eventId ?? ""] ?? {};
      const arr = ce.stats ?? [];
      const stats: Record<string, string> = {};
      labels.slice(0, 8).forEach((lab, i) => {
        if (lab && arr[i] != null) stats[lab] = arr[i];
      });
      const primary = Number(arr[pIdx]);
      const result: Outcome =
        meta.gameResult === "W" ? "W" : meta.gameResult === "L" ? "L" : "T";
      return {
        id: ce.eventId ?? "",
        date: meta.gameDate ?? "",
        opponentAbbr: meta.opponent?.abbreviation ?? "",
        opponentLogo: teamLogo(meta.opponent),
        atVs: (meta.atVs === "@" ? "@" : "vs") as "@" | "vs",
        result,
        score: meta.score ?? "",
        stats,
        primary: Number.isFinite(primary) ? primary : 0,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return { label, entries };
}

export function normalizePlayer(
  athlete: RawAthlete,
  gamelog: RawGamelog,
  league: LeagueId,
): Player {
  const a = athlete.athlete ?? {};
  const ss = a.statsSummary;
  const stats = (ss?.statistics ?? []).slice(0, 6).map((s) => ({
    name: s.name ?? "",
    abbr: s.abbreviation ?? s.shortDisplayName ?? s.name ?? "",
    label: s.displayName ?? "",
    value: s.displayValue ?? "",
    rank: s.rank,
    rankDisplay: s.rankDisplayValue,
  }));
  const team = a.team ?? {};
  return {
    id: a.id ?? "",
    league,
    fullName: a.fullName ?? a.displayName ?? "",
    firstName: a.firstName ?? (a.fullName ?? "").split(" ")[0] ?? "",
    lastName: a.lastName ?? (a.fullName ?? "").split(" ").slice(1).join(" "),
    teamId: team.id ?? "",
    teamAbbr: team.abbreviation ?? "",
    teamLogo: teamLogo(team),
    color: hex(team.color),
    position: a.position?.abbreviation ?? "",
    jersey: a.jersey ?? "—",
    headshot: a.headshot?.href ?? "",
    seasonLabel: ss?.displayName ?? "Season",
    stats,
    recent: buildRecent(gamelog, league),
    placeholder: stats.length === 0,
  };
}

/* ── teams list → CatalogTeam[] ─────────────────────────────────────────── */

export function normalizeTeams(raw: RawTeamsList, league: LeagueId): CatalogTeam[] {
  const teams = raw.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return teams
    .map((wrap) => wrap.team)
    .filter((t): t is RawTeam => !!t && !!t.id)
    .map((t) => ({
      league,
      teamId: t.id ?? "",
      abbreviation: t.abbreviation ?? "",
      displayName: t.displayName ?? "",
      name: t.name ?? lastName(t.displayName),
      logo: teamLogo(t),
      color: hex(t.color),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/* ── roster → CatalogPlayer[] ───────────────────────────────────────────── */

export function normalizeRoster(raw: RawRoster, league: LeagueId): CatalogPlayer[] {
  const teamMeta = raw.team ?? {};
  const flat: RawRosterPlayer[] = [];
  for (const group of raw.athletes ?? []) {
    if (group && typeof group === "object" && "items" in group && Array.isArray(group.items)) {
      flat.push(...group.items);
    } else if (group && "id" in group) {
      flat.push(group as RawRosterPlayer);
    }
  }
  return flat
    .filter((p) => p && p.id)
    .map((p) => ({
      league,
      id: p.id ?? "",
      fullName: p.fullName ?? p.displayName ?? "",
      teamId: teamMeta.id ?? "",
      teamAbbr: teamMeta.abbreviation ?? "",
      position: p.position?.abbreviation ?? "",
      headshot: p.headshot?.href ?? "",
    }));
}
