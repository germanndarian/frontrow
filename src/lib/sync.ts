"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FollowedPlayer, FollowedTeam, LeagueId, SportId } from "./types";
import { usePreferences } from "./store";
import {
  DEFAULT_SETTINGS,
  useSettings,
  type AccentId,
  type Appearance,
  type AppSettings,
  type Density,
  type Radius,
  type SectionId,
} from "./settings";

/* ───────────────────────────────────────────────────────────────────────────
   Map between the database rows (snake_case) and the in-memory store shapes
   (camelCase), and read/write the signed-in user's preferences + settings.

   These run only in the browser, through the authed Supabase client, so RLS
   scopes every query to the current user — no user id needs to be trusted from
   the client.
   ─────────────────────────────────────────────────────────────────────────── */

interface PreferencesRow {
  user_id: string;
  sports: SportId[];
  leagues: LeagueId[];
  teams: FollowedTeam[];
  players: FollowedPlayer[];
  onboarded: boolean;
}

interface SettingsRow {
  user_id: string;
  appearance: Appearance;
  accent: AccentId;
  radius: Radius;
  density: Density;
  reduce_motion: boolean;
  background_glow: boolean;
  greeting_name: string;
  default_league: LeagueId | "all";
  hidden_sections: SectionId[];
}

function settingsFromRow(r: SettingsRow): AppSettings {
  return {
    appearance: r.appearance ?? DEFAULT_SETTINGS.appearance,
    accent: r.accent ?? DEFAULT_SETTINGS.accent,
    radius: r.radius ?? DEFAULT_SETTINGS.radius,
    density: r.density ?? DEFAULT_SETTINGS.density,
    reduceMotion: r.reduce_motion ?? DEFAULT_SETTINGS.reduceMotion,
    backgroundGlow: r.background_glow ?? DEFAULT_SETTINGS.backgroundGlow,
    greetingName: r.greeting_name ?? DEFAULT_SETTINGS.greetingName,
    defaultLeague: r.default_league ?? DEFAULT_SETTINGS.defaultLeague,
    hiddenSections: r.hidden_sections ?? [],
  };
}

function settingsToRow(s: AppSettings, userId: string): SettingsRow {
  return {
    user_id: userId,
    appearance: s.appearance,
    accent: s.accent,
    radius: s.radius,
    density: s.density,
    reduce_motion: s.reduceMotion,
    background_glow: s.backgroundGlow,
    greeting_name: s.greetingName,
    default_league: s.defaultLeague,
    hidden_sections: s.hiddenSections,
  };
}

function prefsToRow(userId: string): PreferencesRow {
  const p = usePreferences.getState();
  return {
    user_id: userId,
    sports: p.sports,
    leagues: p.leagues,
    teams: p.teams,
    players: p.players,
    onboarded: p.onboarded,
  };
}

/** Load the user's preferences + settings from the DB into the live stores. */
export async function loadUserData(supabase: SupabaseClient, userId: string) {
  const [prefs, settings] = await Promise.all([
    supabase.from("preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (prefs.data) {
    const r = prefs.data as PreferencesRow;
    usePreferences.setState({
      sports: r.sports ?? [],
      leagues: r.leagues ?? [],
      teams: r.teams ?? [],
      players: r.players ?? [],
      onboarded: r.onboarded ?? false,
    });
  }
  if (settings.data) {
    useSettings.getState().load(settingsFromRow(settings.data as SettingsRow));
  }
}

export async function pushPreferences(supabase: SupabaseClient, userId: string) {
  await supabase.from("preferences").upsert(prefsToRow(userId), { onConflict: "user_id" });
}

export async function pushSettings(supabase: SupabaseClient, userId: string) {
  await supabase
    .from("settings")
    .upsert(settingsToRow(useSettings.getState(), userId), { onConflict: "user_id" });
}
