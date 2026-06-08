"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { Preferences } from "./types";
import { usePreferences } from "./store";
import {
  type AppSettings,
  DEFAULT_SETTINGS,
  snapshotSettings,
  useSettings,
} from "./settings";

/* ───────────────────────────────────────────────────────────────────────────
   Local-first accounts + sessions.

   This is a client-only auth layer: accounts, password hashes and the active
   session all live in this browser's localStorage. It is NOT a server-secured
   login — it exists so a person can keep multiple profiles on one device and
   have each profile restore its own follows and look. Passwords are salted +
   SHA-256 hashed (never stored in clear) so a glance at localStorage doesn't
   reveal them, but anyone with the device can still read the data. Treat it as
   convenience, not security.

   The signed-in account is the source of truth for that user's sports
   `Preferences` and `AppSettings`. On login we load them into the live stores;
   while signed in, every change is mirrored back into the account.
   ─────────────────────────────────────────────────────────────────────────── */

export interface Avatar {
  /** A single emoji shown as the profile glyph. */
  emoji: string;
  /** Accent-style oklch color behind the glyph. */
  color: string;
}

export interface Account {
  /** Lowercased username — also the account + session key. */
  id: string;
  username: string;
  displayName: string;
  email?: string;
  salt: string;
  passwordHash: string;
  createdAt: number;
  avatar: Avatar;
  prefs: Preferences;
  settings: AppSettings;
}

export interface Session {
  userId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  remember: boolean;
}

export const AVATAR_EMOJIS = [
  "🏈", "⚾️", "🏒", "🥎", "🔥", "⚡️", "🦅", "🐂", "🦈", "🐺", "🐉", "👑",
];

export const AVATAR_COLORS = [
  "oklch(0.645 0.168 257)",
  "oklch(0.7 0.158 162)",
  "oklch(0.62 0.196 292)",
  "oklch(0.8 0.142 82)",
  "oklch(0.62 0.214 18)",
  "oklch(0.72 0.13 220)",
];

const DAY = 86_400_000;
const REMEMBER_DAYS = 30;
const SESSION_DAYS = 1;

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthState {
  accounts: Record<string, Account>;
  session: Session | null;
  /** True when the visitor chose "continue without an account". */
  guest: boolean;

  signUp: (input: {
    username: string;
    password: string;
    displayName?: string;
    remember?: boolean;
  }) => Promise<AuthResult>;
  logIn: (input: {
    username: string;
    password: string;
    remember?: boolean;
  }) => Promise<AuthResult>;
  logOut: () => void;
  continueAsGuest: () => void;

  updateProfile: (patch: Partial<Pick<Account, "displayName" | "email" | "avatar">>) => void;
  changePassword: (current: string, next: string) => Promise<AuthResult>;
  deleteAccount: () => void;

  /** Snapshot the live stores into the signed-in account. */
  syncActive: () => void;
}

/* ── Crypto helpers ──────────────────────────────────────────────────────── */

function randomHex(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** Constant-ish time string compare to avoid trivial timing leaks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function newSession(userId: string, remember: boolean): Session {
  const now = Date.now();
  return {
    userId,
    token: randomHex(24),
    createdAt: now,
    expiresAt: now + (remember ? REMEMBER_DAYS : SESSION_DAYS) * DAY,
    remember,
  };
}

function snapshotPrefs(p: Preferences): Preferences {
  return {
    sports: [...p.sports],
    leagues: [...p.leagues],
    teams: [...p.teams],
    players: [...p.players],
    onboarded: p.onboarded,
  };
}

/** Push an account's saved prefs + settings into the live stores. */
function loadIntoLiveStores(account: Account) {
  usePreferences.setState(snapshotPrefs(account.prefs));
  useSettings.getState().load({ ...DEFAULT_SETTINGS, ...account.settings });
}

function validateUsername(u: string): string | null {
  if (u.length < 3) return "Username must be at least 3 characters.";
  if (u.length > 24) return "Username must be 24 characters or fewer.";
  if (!/^[a-zA-Z0-9_.-]+$/.test(u))
    return "Use only letters, numbers, dots, dashes or underscores.";
  return null;
}

/* ── Store ───────────────────────────────────────────────────────────────── */

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: {},
      session: null,
      guest: false,

      signUp: async ({ username, password, displayName, remember = true }) => {
        const handle = username.trim();
        const idErr = validateUsername(handle);
        if (idErr) return { ok: false, error: idErr };
        if (password.length < 6)
          return { ok: false, error: "Password must be at least 6 characters." };

        const id = handle.toLowerCase();
        if (get().accounts[id])
          return { ok: false, error: "That username is already taken." };

        const salt = randomHex(8);
        const passwordHash = await hashPassword(password, salt);

        // Carry whatever a guest already built (follows + look) into the new
        // account so signing up never throws away in-progress setup.
        const prefs = snapshotPrefs(usePreferences.getState());
        const settings = snapshotSettings(useSettings.getState());

        const account: Account = {
          id,
          username: handle,
          displayName: displayName?.trim() || handle,
          salt,
          passwordHash,
          createdAt: Date.now(),
          avatar: {
            emoji: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
            color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          },
          prefs,
          settings,
        };

        set((s) => ({
          accounts: { ...s.accounts, [id]: account },
          session: newSession(id, remember),
          guest: false,
        }));
        loadIntoLiveStores(account);
        return { ok: true };
      },

      logIn: async ({ username, password, remember = true }) => {
        const id = username.trim().toLowerCase();
        const account = get().accounts[id];
        if (!account)
          return { ok: false, error: "No account found for that username." };

        const hash = await hashPassword(password, account.salt);
        if (!safeEqual(hash, account.passwordHash))
          return { ok: false, error: "Incorrect password." };

        set({ session: newSession(id, remember), guest: false });
        loadIntoLiveStores(account);
        return { ok: true };
      },

      logOut: () => {
        get().syncActive();
        set({ session: null, guest: false });
        // Wipe the live stores so the next person doesn't inherit this profile.
        usePreferences.getState().reset();
        useSettings.getState().reset();
      },

      continueAsGuest: () => set({ guest: true }),

      updateProfile: (patch) =>
        set((s) => {
          const id = s.session?.userId;
          if (!id || !s.accounts[id]) return {};
          return {
            accounts: {
              ...s.accounts,
              [id]: { ...s.accounts[id], ...patch },
            },
          };
        }),

      changePassword: async (current, next) => {
        const s = get();
        const id = s.session?.userId;
        const account = id ? s.accounts[id] : undefined;
        if (!account) return { ok: false, error: "You're not signed in." };
        const currentHash = await hashPassword(current, account.salt);
        if (!safeEqual(currentHash, account.passwordHash))
          return { ok: false, error: "Current password is incorrect." };
        if (next.length < 6)
          return { ok: false, error: "New password must be at least 6 characters." };
        const salt = randomHex(8);
        const passwordHash = await hashPassword(next, salt);
        set((st) => ({
          accounts: {
            ...st.accounts,
            [account.id]: { ...st.accounts[account.id], salt, passwordHash },
          },
        }));
        return { ok: true };
      },

      deleteAccount: () => {
        const id = get().session?.userId;
        if (!id) return;
        set((s) => {
          const accounts = { ...s.accounts };
          delete accounts[id];
          return { accounts, session: null, guest: false };
        });
        // Reset after the session is cleared so the mirror in SessionBridge
        // sees no session and skips — otherwise it would resurrect the account.
        usePreferences.getState().reset();
        useSettings.getState().reset();
      },

      syncActive: () =>
        set((s) => {
          const id = s.session?.userId;
          if (!id || !s.accounts[id]) return {};
          return {
            accounts: {
              ...s.accounts,
              [id]: {
                ...s.accounts[id],
                prefs: snapshotPrefs(usePreferences.getState()),
                settings: snapshotSettings(useSettings.getState()),
              },
            },
          };
        }),
    }),
    { name: "frontrow.auth", version: 1 },
  ),
);

/* ── Hooks ───────────────────────────────────────────────────────────────── */

/** The signed-in account, or null for guests / signed-out visitors. */
export function useCurrentUser(): Account | null {
  return useAuth((s) => (s.session ? s.accounts[s.session.userId] ?? null : null));
}

/** True once the visitor is allowed past the gate (signed in or a guest). */
export function useIsAuthed(): boolean {
  return useAuth((s) => Boolean(s.session) || s.guest);
}

/**
 * True once every persisted store has rehydrated. Gating pages wait on this so
 * we never flash the login screen at a returning, already-signed-in user.
 */
export function useAppReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const check = () => {
      if (
        useAuth.persist.hasHydrated() &&
        usePreferences.persist.hasHydrated() &&
        useSettings.persist.hasHydrated()
      ) {
        setReady(true);
      }
    };
    check();
    const subs = [
      useAuth.persist.onFinishHydration(check),
      usePreferences.persist.onFinishHydration(check),
      useSettings.persist.onFinishHydration(check),
    ];
    return () => subs.forEach((u) => u());
  }, []);
  return ready;
}
