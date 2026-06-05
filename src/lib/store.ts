"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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

const STORAGE_KEY = "frontrow.prefs";
const LEGACY_KEY = "boxscore.prefs";

// One-time migration: carry the user's saved follows over from the pre-rebrand
// key so renaming the app doesn't reset anyone. Runs before persist hydrates.
if (typeof window !== "undefined") {
  try {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        window.localStorage.setItem(STORAGE_KEY, legacy);
        window.localStorage.removeItem(LEGACY_KEY);
      }
    }
  } catch {
    // localStorage unavailable (private mode / SSR edge) — start fresh.
  }
}

export const usePreferences = create<PrefState>()(
  persist(
    (set) => ({
      // Fresh visitors start empty and are routed through onboarding. Returning
      // visitors load their persisted follows and skip setup.
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
    }),
    { name: STORAGE_KEY, version: 1 },
  ),
);

/** Avoids hydration mismatch: only trust persisted state after rehydration. */
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Intentional: flip to hydrated once, on mount, to avoid SSR mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
    const unsub = usePreferences.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    if (usePreferences.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
