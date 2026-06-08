"use client";

import { create } from "zustand";
import { useEffect, useState } from "react";
import type {
  FollowedPlayer,
  FollowedTeam,
  LeagueId,
  Preferences,
  SportId,
} from "./types";
import { LEAGUES } from "./leagues";

interface PrefState extends Preferences {
  setSports: (sports: SportId[]) => void;
  setLeagues: (leagues: LeagueId[]) => void;
  setTeams: (teams: FollowedTeam[]) => void;
  setPlayers: (players: FollowedPlayer[]) => void;
  toggleSport: (sport: SportId) => void;
  toggleLeague: (league: LeagueId) => void;
  toggleTeam: (team: FollowedTeam) => void;
  togglePlayer: (player: FollowedPlayer) => void;
  complete: () => void;
  reset: () => void;
}

const EMPTY: Preferences = {
  sports: [],
  leagues: [],
  teams: [],
  players: [],
  onboarded: false,
};

// In-memory working copy of the user's follows. The DB is the source of truth:
// the auth layer loads these on sign-in and writes changes back to Postgres.
export const usePreferences = create<PrefState>()((set) => ({
  ...EMPTY,
  setSports: (sports) => set({ sports }),
  setLeagues: (leagues) => set({ leagues }),
  setTeams: (teams) => set({ teams }),
  setPlayers: (players) => set({ players }),
  // Removing a sport prunes its leagues, and removing leagues prunes any
  // followed teams/players in them — so the dashboard never shows orphans.
  toggleSport: (sport) =>
    set((s) => {
      if (!s.sports.includes(sport)) {
        return { sports: [...s.sports, sport] };
      }
      const leagues = s.leagues.filter((l) => LEAGUES[l].sport !== sport);
      const kept = new Set(leagues);
      return {
        sports: s.sports.filter((x) => x !== sport),
        leagues,
        teams: s.teams.filter((t) => kept.has(t.league)),
        players: s.players.filter((p) => kept.has(p.league)),
      };
    }),
  toggleLeague: (league) =>
    set((s) => {
      if (s.leagues.includes(league)) {
        return {
          leagues: s.leagues.filter((l) => l !== league),
          teams: s.teams.filter((t) => t.league !== league),
          players: s.players.filter((p) => p.league !== league),
        };
      }
      const sport = LEAGUES[league].sport;
      return {
        leagues: [...s.leagues, league],
        sports: s.sports.includes(sport) ? s.sports : [...s.sports, sport],
      };
    }),
  toggleTeam: (team) =>
    set((s) => ({
      teams: s.teams.some((t) => t.teamId === team.teamId && t.league === team.league)
        ? s.teams.filter((t) => !(t.teamId === team.teamId && t.league === team.league))
        : [...s.teams, team],
    })),
  togglePlayer: (player) =>
    set((s) => ({
      players: s.players.some((p) => p.id === player.id)
        ? s.players.filter((p) => p.id !== player.id)
        : [...s.players, player],
    })),
  complete: () => set({ onboarded: true }),
  reset: () => set(EMPTY),
}));

/** True after first client mount — guards against SSR/client hydration mismatch
 *  now that the stores start empty on the server and fill in on the client. */
export function useHasHydrated() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  return mounted;
}
