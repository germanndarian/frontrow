"use client";

import { create } from "zustand";
import type { LeagueId } from "./types";

/* ───────────────────────────────────────────────────────────────────────────
   Customization — per-user appearance + dashboard preferences.

   These are kept separate from the sports `Preferences` (who you follow) so the
   two can be reasoned about independently. The auth layer snapshots both into
   the signed-in account so a login restores the exact look and layout.
   ─────────────────────────────────────────────────────────────────────────── */

export type AccentId =
  | "cobalt"
  | "emerald"
  | "violet"
  | "crimson"
  | "amber"
  | "cyan"
  | "rose";

export type Radius = "sharp" | "default" | "round";
export type Density = "comfortable" | "compact";

/** Dashboard sections, in default display order. */
export type SectionId =
  | "scoreboard"
  | "teams"
  | "trend"
  | "players"
  | "standings";

export interface AppSettings {
  /* Appearance */
  accent: AccentId;
  radius: Radius;
  density: Density;
  reduceMotion: boolean;
  backgroundGlow: boolean;
  /* Dashboard */
  greetingName: string;
  defaultLeague: LeagueId | "all";
  hiddenSections: SectionId[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  accent: "cobalt",
  radius: "default",
  density: "comfortable",
  reduceMotion: false,
  backgroundGlow: true,
  greetingName: "",
  defaultLeague: "all",
  hiddenSections: [],
};

/* ── Accent presets ──────────────────────────────────────────────────────── */

export interface Accent {
  id: AccentId;
  name: string;
  /** Swatch shown in the picker (matches `primary`). */
  swatch: string;
  vars: {
    "--color-primary": string;
    "--color-primary-bright": string;
    "--color-primary-ink": string;
    /** The two floodlight washes bled over the page background. */
    "--glow-1": string;
    "--glow-2": string;
  };
}

const LIGHT_INK = "oklch(0.99 0.01 256)";
const DARK_INK = "oklch(0.22 0.03 90)";

export const ACCENTS: Record<AccentId, Accent> = {
  cobalt: {
    id: "cobalt",
    name: "Cobalt",
    swatch: "oklch(0.68 0.16 257)",
    vars: {
      "--color-primary": "oklch(0.68 0.16 257)",
      "--color-primary-bright": "oklch(0.755 0.15 256)",
      "--color-primary-ink": LIGHT_INK,
      "--glow-1": "oklch(0.68 0.16 257 / 0.16)",
      "--glow-2": "oklch(0.66 0.14 280 / 0.12)",
    },
  },
  emerald: {
    id: "emerald",
    name: "Emerald",
    swatch: "oklch(0.7 0.158 162)",
    vars: {
      "--color-primary": "oklch(0.7 0.158 162)",
      "--color-primary-bright": "oklch(0.78 0.15 164)",
      "--color-primary-ink": DARK_INK,
      "--glow-1": "oklch(0.7 0.158 162 / 0.16)",
      "--glow-2": "oklch(0.72 0.13 190 / 0.12)",
    },
  },
  violet: {
    id: "violet",
    name: "Violet",
    swatch: "oklch(0.62 0.196 292)",
    vars: {
      "--color-primary": "oklch(0.62 0.196 292)",
      "--color-primary-bright": "oklch(0.7 0.186 294)",
      "--color-primary-ink": LIGHT_INK,
      "--glow-1": "oklch(0.62 0.196 292 / 0.18)",
      "--glow-2": "oklch(0.66 0.16 320 / 0.12)",
    },
  },
  crimson: {
    id: "crimson",
    name: "Crimson",
    swatch: "oklch(0.62 0.214 18)",
    vars: {
      "--color-primary": "oklch(0.62 0.214 18)",
      "--color-primary-bright": "oklch(0.69 0.2 20)",
      "--color-primary-ink": LIGHT_INK,
      "--glow-1": "oklch(0.62 0.214 18 / 0.16)",
      "--glow-2": "oklch(0.64 0.17 358 / 0.12)",
    },
  },
  amber: {
    id: "amber",
    name: "Amber",
    swatch: "oklch(0.8 0.142 82)",
    vars: {
      "--color-primary": "oklch(0.8 0.142 82)",
      "--color-primary-bright": "oklch(0.86 0.135 84)",
      "--color-primary-ink": DARK_INK,
      "--glow-1": "oklch(0.8 0.142 82 / 0.16)",
      "--glow-2": "oklch(0.78 0.13 50 / 0.12)",
    },
  },
  cyan: {
    id: "cyan",
    name: "Cyan",
    swatch: "oklch(0.72 0.13 220)",
    vars: {
      "--color-primary": "oklch(0.72 0.13 220)",
      "--color-primary-bright": "oklch(0.79 0.12 218)",
      "--color-primary-ink": DARK_INK,
      "--glow-1": "oklch(0.72 0.13 220 / 0.16)",
      "--glow-2": "oklch(0.7 0.13 200 / 0.12)",
    },
  },
  rose: {
    id: "rose",
    name: "Rose",
    swatch: "oklch(0.68 0.176 8)",
    vars: {
      "--color-primary": "oklch(0.68 0.176 8)",
      "--color-primary-bright": "oklch(0.75 0.166 10)",
      "--color-primary-ink": LIGHT_INK,
      "--glow-1": "oklch(0.68 0.176 8 / 0.16)",
      "--glow-2": "oklch(0.66 0.16 330 / 0.12)",
    },
  },
};

export const ACCENT_ORDER: AccentId[] = [
  "cobalt",
  "emerald",
  "violet",
  "cyan",
  "amber",
  "crimson",
  "rose",
];

/* ── Radius presets ──────────────────────────────────────────────────────── */

const RADII: Record<Radius, Record<string, string>> = {
  sharp: {
    "--radius-xs": "3px",
    "--radius-sm": "4px",
    "--radius-md": "6px",
    "--radius-lg": "9px",
    "--radius-xl": "12px",
  },
  default: {
    "--radius-xs": "6px",
    "--radius-sm": "9px",
    "--radius-md": "13px",
    "--radius-lg": "18px",
    "--radius-xl": "24px",
  },
  round: {
    "--radius-xs": "9px",
    "--radius-sm": "13px",
    "--radius-md": "18px",
    "--radius-lg": "24px",
    "--radius-xl": "32px",
  },
};

export const SECTION_LABELS: Record<SectionId, string> = {
  scoreboard: "Live & Upcoming",
  teams: "Your Teams",
  trend: "Season Stats",
  players: "Your Players",
  standings: "Around the League",
};

export const SECTION_ORDER: SectionId[] = [
  "scoreboard",
  "teams",
  "trend",
  "players",
  "standings",
];

/* ── Store ───────────────────────────────────────────────────────────────── */

interface SettingsState extends AppSettings {
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  toggleSection: (id: SectionId) => void;
  reset: () => void;
  /** Bulk-replace (used by the auth layer when loading an account). */
  load: (next: AppSettings) => void;
}

// In-memory working copy. The DB is the source of truth: the auth layer loads
// these on sign-in and writes changes back to Postgres.
export const useSettings = create<SettingsState>()((set) => ({
  ...DEFAULT_SETTINGS,
  set: (key, value) => set({ [key]: value } as Partial<AppSettings>),
  toggleSection: (id) =>
    set((s) => ({
      hiddenSections: s.hiddenSections.includes(id)
        ? s.hiddenSections.filter((x) => x !== id)
        : [...s.hiddenSections, id],
    })),
  reset: () => set({ ...DEFAULT_SETTINGS }),
  load: (next) => set({ ...next }),
}));

/** Plain snapshot of just the persisted fields (no methods). */
export function snapshotSettings(s: AppSettings): AppSettings {
  return {
    accent: s.accent,
    radius: s.radius,
    density: s.density,
    reduceMotion: s.reduceMotion,
    backgroundGlow: s.backgroundGlow,
    greetingName: s.greetingName,
    defaultLeague: s.defaultLeague,
    hiddenSections: [...s.hiddenSections],
  };
}

/* ── DOM application ─────────────────────────────────────────────────────── */

/** Push the current settings onto <html> as CSS variables + data attributes. */
export function applySettings(s: AppSettings) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;

  for (const [k, v] of Object.entries(ACCENTS[s.accent].vars)) {
    el.style.setProperty(k, v);
  }
  for (const [k, v] of Object.entries(RADII[s.radius])) {
    el.style.setProperty(k, v);
  }

  // Compact density gently scales the whole rem-based type + spacing ramp.
  el.style.fontSize = s.density === "compact" ? "15px" : "16px";

  el.dataset.reduceMotion = s.reduceMotion ? "true" : "false";
  el.dataset.glow = s.backgroundGlow ? "on" : "off";
}
