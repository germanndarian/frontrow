"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { FollowedTeam, LeagueId } from "./types";
import {
  getCatalogTeams,
  getPlayer,
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
