"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import { usePreferences } from "./store";
import { useSettings } from "./settings";
import { loadUserData, pushPreferences, pushSettings } from "./sync";

/* ───────────────────────────────────────────────────────────────────────────
   Auth on Supabase. The session is a signed JWT kept in cookies by
   @supabase/ssr; this store mirrors it into React state, loads the user's
   profile + follows + settings on sign-in, and writes changes back to Postgres
   (debounced). Guest mode is in-memory only — there's nowhere to persist it, so
   it resets on reload.
   ─────────────────────────────────────────────────────────────────────────── */

export const AVATAR_EMOJIS = [
  "🏈", "🏀", "⚾️", "🏒", "🥎", "🔥", "⚡️", "🦅", "🐂", "🦈", "🐺", "🐉", "👑",
];

export const AVATAR_COLORS = [
  "oklch(0.645 0.168 257)",
  "oklch(0.7 0.158 162)",
  "oklch(0.62 0.196 292)",
  "oklch(0.8 0.142 82)",
  "oklch(0.62 0.214 18)",
  "oklch(0.72 0.13 220)",
];

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
}

type Status = "loading" | "authed" | "guest" | "out";

interface AuthResult {
  ok: boolean;
  error?: string;
  /** Sign-up succeeded but the user must confirm their email before signing in. */
  needsConfirm?: boolean;
}

interface AuthState {
  status: Status;
  /** True once the signed-in user's follows + settings have been loaded. */
  dataReady: boolean;
  user: User | null;
  profile: Profile | null;

  init: () => void;
  signUp: (i: { email: string; password: string; displayName?: string }) => Promise<AuthResult>;
  signIn: (i: { email: string; password: string }) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  updateProfile: (
    patch: Partial<Pick<Profile, "displayName" | "avatarEmoji" | "avatarColor">>,
  ) => Promise<void>;
  changePassword: (next: string) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
}

function sb() {
  return createClient();
}

function profileFromRow(user: User, row: Record<string, string> | null): Profile {
  return {
    id: user.id,
    email: user.email ?? "",
    displayName: row?.display_name || user.email?.split("@")[0] || "",
    avatarEmoji: row?.avatar_emoji || AVATAR_EMOJIS[0],
    avatarColor: row?.avatar_color || AVATAR_COLORS[0],
  };
}

function clearStores() {
  usePreferences.getState().reset();
  useSettings.getState().reset();
}

let initialized = false;
let prefsTimer: ReturnType<typeof setTimeout> | undefined;
let settingsTimer: ReturnType<typeof setTimeout> | undefined;

export const useAuth = create<AuthState>()((set, get) => ({
  status: "loading",
  dataReady: false,
  user: null,
  profile: null,

  init: () => {
    if (initialized) return;
    initialized = true;
    const supabase = sb();

    // Fetch the profile row + follows + settings, then mark the session ready.
    const hydrate = async (user: User) => {
      const { data: row } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      await loadUserData(supabase, user.id);
      set({
        user,
        profile: profileFromRow(user, row),
        status: "authed",
        dataReady: true,
      });
    };

    // Write-through: mirror store changes back to Postgres (debounced), but
    // only while a real user is signed in.
    usePreferences.subscribe(() => {
      const s = get();
      if (s.status !== "authed" || !s.user) return;
      clearTimeout(prefsTimer);
      prefsTimer = setTimeout(() => pushPreferences(supabase, s.user!.id), 400);
    });
    useSettings.subscribe(() => {
      const s = get();
      if (s.status !== "authed" || !s.user) return;
      clearTimeout(settingsTimer);
      settingsTimer = setTimeout(() => pushSettings(supabase, s.user!.id), 400);
    });

    supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      if (user) {
        // Re-hydrate on a new user or the first session we see; otherwise just
        // refresh the cached user object (e.g. token refresh, email change).
        if (get().user?.id !== user.id || !get().dataReady) {
          void hydrate(user);
        } else {
          set({ user });
        }
      } else {
        if (event === "SIGNED_OUT") clearStores();
        set({
          user: null,
          profile: null,
          dataReady: false,
          status: get().status === "guest" ? "guest" : "out",
        });
      }
    });
  },

  signUp: async ({ email, password, displayName }) => {
    const { data, error } = await sb().auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : undefined,
        data: displayName?.trim() ? { display_name: displayName.trim() } : undefined,
      },
    });
    if (error) return { ok: false, error: error.message };
    // With email confirmation on, there's no session yet — prompt to confirm.
    if (!data.session) return { ok: true, needsConfirm: true };
    return { ok: true };
  },

  signIn: async ({ email, password }) => {
    const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  signInWithGoogle: async () => {
    // Redirects to Google; on return, /auth/confirm exchanges the code for a
    // session. A successful call navigates away, so the result matters on error.
    const { error } = await sb().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : undefined,
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  signOut: async () => {
    await sb().auth.signOut();
    clearStores();
    set({ user: null, profile: null, dataReady: false, status: "out" });
  },

  continueAsGuest: () => set({ status: "guest", dataReady: true }),

  updateProfile: async (patch) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    const next = { ...profile, ...patch };
    set({ profile: next });
    await sb()
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: next.displayName,
          avatar_emoji: next.avatarEmoji,
          avatar_color: next.avatarColor,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
  },

  changePassword: async (next) => {
    if (next.length < 6)
      return { ok: false, error: "Password must be at least 6 characters." };
    const { error } = await sb().auth.updateUser({ password: next });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  deleteAccount: async () => {
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error ?? "Couldn't delete the account." };
    }
    await sb().auth.signOut();
    clearStores();
    set({ user: null, profile: null, dataReady: false, status: "out" });
    return { ok: true };
  },
}));

/* ── Hooks ───────────────────────────────────────────────────────────────── */

/** The signed-in user's profile, or null for guests / signed-out visitors. */
export function useCurrentUser(): Profile | null {
  return useAuth((s) => s.profile);
}

/** True once the visitor is allowed past the gate (signed in or a guest). */
export function useIsAuthed(): boolean {
  return useAuth((s) => s.status === "authed" || s.status === "guest");
}

/**
 * True once we know the auth state and, for a signed-in user, their data has
 * loaded. Gating pages wait on this so a returning user never flashes the
 * wrong screen.
 */
export function useAppReady(): boolean {
  return useAuth((s) => s.status !== "loading" && (s.status !== "authed" || s.dataReady));
}
