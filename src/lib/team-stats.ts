/* Derived team stats shared by the dashboard's season-stat cards and the
   iOS app's Teams tab: record parsing, win %, streak and per-game means.
   Pure functions over the TeamCard shape — no fetching, no React. */

import type { LeagueId, Outcome } from "@/lib/types";

/** Noun for the scoring unit in a league, for labels like "Runs/G". */
export const SCORE_NOUN: Record<string, string> = {
  mlb: "Runs",
  nhl: "Goals",
  nfl: "Points",
  nba: "Points",
  "college-football": "Points",
};

export function scoreNoun(league: LeagueId): string {
  return SCORE_NOUN[league] ?? "Points";
}

export function parseRecord(rec: string): { w: number; l: number; t: number } | null {
  const parts = rec.split("-").map((n) => parseInt(n.trim(), 10));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return { w: parts[0], l: parts[1], t: Number.isNaN(parts[2]) ? 0 : parts[2] ?? 0 };
}

/** ".597" — win percentage without a leading zero. */
export function winPct(w: number, l: number, t: number): string {
  const games = w + l + t;
  if (games === 0) return "—";
  return ((w + t / 2) / games).toFixed(3).replace(/^0/, "");
}

/** Current streak from the form list (most-recent first), e.g. "W3". */
export function currentStreak(form: { result: Outcome }[]): { label: string; result: Outcome } | null {
  if (!form.length) return null;
  const result = form[0].result;
  let n = 0;
  for (const g of form) {
    if (g.result === result) n++;
    else break;
  }
  return { label: `${result}${n}`, result };
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
