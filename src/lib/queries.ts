"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  keepPreviousData,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  FollowedTeam,
  Game,
  GameSide,
  LeagueId,
  PlayoffBracket,
  ScheduleGame,
} from "./types";
import { LEAGUES } from "./leagues";
import { now } from "./clock";
import { firstDayOfWeek, weekQuery, weekWindow, type WeekWindow } from "./week";
import {
  getCatalogTeams,
  getPlayer,
  getPlayoffBracket,
  getRostersForTeams,
  getSchedule,
  getScoreboard,
  getStandings,
  getTeamCard,
  hasLiveGame,
} from "./data";

/** How often live games refresh. ESPN's informal guidance is 30–60s; we poll
    only while a game is actually live, so 30s is polite and well within budget. */
export const LIVE_POLL_MS = Number(process.env.NEXT_PUBLIC_LIVE_POLL_MS) || 30_000;

export function useScoreboard(leagues: LeagueId[]) {
  return useQuery({
    queryKey: ["scoreboard", [...leagues].sort()],
    queryFn: () => getScoreboard(leagues),
    refetchInterval: (query) =>
      hasLiveGame(query.state.data) ? LIVE_POLL_MS : false,
    // Keep the last good board visible through a refetch / momentary ESPN hiccup.
    placeholderData: keepPreviousData,
    enabled: leagues.length > 0,
  });
}

/**
 * One week of the scoreboard for the leagues you follow — the dashboard's
 * board. It refreshes only while it's showing this week and a game is live,
 * and keeps the board on screen through a refresh, but never carries one
 * week's games over to another week's heading: a new week shows placeholders
 * until it arrives.
 */
export function useWeekScoreboard(leagues: LeagueId[], week: WeekWindow) {
  const dates = weekQuery(week);
  return useQuery({
    queryKey: weekScoreboardKey(leagues, dates),
    queryFn: () => getScoreboard(leagues, dates),
    refetchInterval: (query) =>
      week.offset === 0 && hasLiveGame(query.state.data) ? LIVE_POLL_MS : false,
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === dates ? previous : undefined,
    enabled: leagues.length > 0,
  });
}

function weekScoreboardKey(leagues: LeagueId[], dates: string) {
  return ["scoreboard", [...leagues].sort(), dates];
}

/** Fetch this week's board ahead of time — the Done screen warms it while it's
    read, so the dashboard opens on games rather than placeholders. */
export function prefetchThisWeek(client: QueryClient, leagues: LeagueId[]) {
  if (leagues.length === 0) return;
  const dates = weekQuery(weekWindow(new Date(now()), 0, firstDayOfWeek()));
  void client.prefetchQuery({
    queryKey: weekScoreboardKey(leagues, dates),
    queryFn: () => getScoreboard(leagues, dates),
  });
}

/** A followed team's scheduled game rendered in the same shape as a live one. */
function scheduleToGame(sg: ScheduleGame, team: FollowedTeam): Game {
  const me: GameSide = {
    teamId: team.teamId,
    abbreviation: team.abbreviation,
    displayName: team.displayName,
    shortName: team.displayName,
    logo: team.logo,
    color: team.color,
    score: null,
    record: null,
    winner: false,
  };
  const opp: GameSide = {
    teamId: "",
    abbreviation: sg.opponentAbbr,
    displayName: sg.opponentName,
    shortName: sg.opponentName,
    logo: sg.opponentLogo,
    color: "#64748b",
    score: null,
    record: null,
    winner: false,
  };
  const isHome = sg.atVs === "vs";
  return {
    id: sg.id,
    league: team.league,
    state: "pre",
    statusDetail: "",
    shortDetail: "",
    date: sg.date,
    home: isHome ? me : opp,
    away: isHome ? opp : me,
    broadcast: sg.broadcast,
  };
}

/**
 * The live + upcoming slate for *the user's teams only*, in chronological order.
 *
 * Live and same-day games come from the scoreboard (richest, real-time). Future
 * games come from each followed team's full-season schedule (the scoreboard only
 * covers today), so a team's next game shows even when it's days away. Games are
 * de-duped by id (a matchup between two followed teams, or a today game present
 * in both sources, appears once) and sorted by date — which naturally puts live
 * games first, then the soonest upcoming.
 */
export function useTeamSlate(teams: FollowedTeam[]) {
  const leagues = [...new Set(teams.map((t) => t.league))];
  const scoreboard = useScoreboard(leagues);

  const schedules = useQueries({
    queries: teams.map((t) => ({
      queryKey: ["schedule", t.league, t.teamId],
      queryFn: () => getSchedule(t.league, t.teamId),
      staleTime: 5 * 60_000,
    })),
  });

  const followed = new Set(teams.map((t) => `${t.league}:${t.teamId}`));
  // Captured once at mount; the scoreboard refetch keeps live games current.
  const [asOf] = useState(now);
  const byId = new Map<string, Game>();

  // Live / today's games from the scoreboard (skip finished ones), my teams only.
  for (const g of scoreboard.data ?? []) {
    if (g.state === "post") continue;
    const mine =
      followed.has(`${g.league}:${g.home.teamId}`) ||
      followed.has(`${g.league}:${g.away.teamId}`);
    if (mine) byId.set(g.id, g);
  }

  // Future games from each followed team's schedule (beyond what the daily
  // scoreboard covers), capped to keep the strip focused.
  schedules.forEach((q, i) => {
    const team = teams[i];
    if (!team || !q.data) return;
    const upcoming = q.data
      .filter((sg) => sg.state === "pre" && new Date(sg.date).getTime() > asOf)
      .slice(0, 6);
    for (const sg of upcoming) {
      if (!byId.has(sg.id)) byId.set(sg.id, scheduleToGame(sg, team));
    }
  });

  const games = [...byId.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return {
    games,
    liveCount: games.filter((g) => g.state === "in").length,
    isPending: scoreboard.isPending || schedules.some((q) => q.isPending),
    isError: scoreboard.isError,
    isFetching: scoreboard.isFetching || schedules.some((q) => q.isFetching),
    refetch: () => {
      scoreboard.refetch();
      schedules.forEach((q) => q.refetch());
    },
  };
}

/** The freshest copy of a game any scoreboard query holds — whichever was
    updated last — or null when none of them has it. */
export function freshestGame(client: QueryClient, id: string): Game | null {
  let best: Game | null = null;
  let at = -1;
  for (const query of client.getQueryCache().findAll({ queryKey: ["scoreboard"] })) {
    const hit = (query.state.data as Game[] | undefined)?.find((g) => g.id === id);
    if (hit && query.state.dataUpdatedAt > at) {
      best = hit;
      at = query.state.dataUpdatedAt;
    }
  }
  return best;
}

/**
 * A game kept up to date by whichever scoreboard the page is already
 * refreshing, so an open sheet follows the same 30-second poll as the board
 * beneath it without starting one of its own. Falls back to the copy the caller
 * holds — a game from a team's schedule, say, which no scoreboard carries.
 */
export function useFreshGame(id: string | null | undefined, fallback: Game | null = null): Game | null {
  const client = useQueryClient();
  const subscribe = useCallback(
    (onChange: () => void) => client.getQueryCache().subscribe(onChange),
    [client],
  );
  const read = useCallback(
    () => (id ? freshestGame(client, id) : null) ?? fallback,
    [client, id, fallback],
  );
  return useSyncExternalStore(subscribe, read, () => fallback);
}

export function useTeamCard(league: LeagueId, teamId: string) {
  return useQuery({
    queryKey: ["team-card", league, teamId],
    queryFn: () => getTeamCard(league, teamId),
  });
}

export function usePlayer(league: LeagueId, id: string) {
  return useQuery({
    queryKey: ["player", league, id],
    queryFn: () => getPlayer(league, id),
    // A follow without an id has nothing to look up; don't ask ESPN for "undefined".
    enabled: Boolean(id),
  });
}

/** Lazy: only fetched when the schedule modal opens (`enabled`). */
export function useSchedule(league: LeagueId, teamId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["schedule", league, teamId],
    queryFn: () => getSchedule(league, teamId),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Shared, deduped per league: every team card + the modal read one fetch.
    Only leagues currently in season can have a live bracket. */
export function usePlayoffBracket(league: LeagueId) {
  return useQuery({
    queryKey: ["playoff-bracket", league],
    queryFn: () => getPlayoffBracket(league),
    enabled: LEAGUES[league].inSeason,
    staleTime: 5 * 60_000,
  });
}

/** True when the team appears anywhere in the bracket. */
export function teamInBracket(bracket: PlayoffBracket | undefined, teamId: string): boolean {
  return Boolean(
    bracket?.rounds.some((r) =>
      r.matchups.some((m) => m.home.teamId === teamId || m.away.teamId === teamId),
    ),
  );
}

export function useStandings(league: LeagueId, teamId?: string) {
  return useQuery({
    queryKey: ["standings", league, teamId ?? null],
    queryFn: () => getStandings(league, teamId),
  });
}

export function useCatalogTeams(leagues: LeagueId[]) {
  return useQuery({
    queryKey: ["catalog-teams", [...leagues].sort()],
    queryFn: () => getCatalogTeams(leagues),
    enabled: leagues.length > 0,
    staleTime: 60 * 60_000,
  });
}

/** Rosters for the teams the user selected during onboarding. */
export function useRosters(teams: FollowedTeam[]) {
  const key = teams.map((t) => `${t.league}:${t.teamId}`).sort();
  return useQuery({
    queryKey: ["rosters", key],
    queryFn: () =>
      getRostersForTeams(teams.map((t) => ({ league: t.league, teamId: t.teamId }))),
    enabled: teams.length > 0,
    staleTime: 60 * 60_000,
  });
}
