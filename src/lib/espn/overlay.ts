import type { Game } from "@/lib/types";

/**
 * Lay a fresher board over a staler one, matching games by id.
 *
 * A week of games is expensive enough to fetch that it is cached for two
 * minutes, which is fine for a slate and far too slow for a score. Today's
 * board is cached for twenty seconds, so where the two overlap the fresher
 * one wins.
 *
 * It replaces and never adds: a game today's board carries that the requested
 * window didn't ask for is not this window's business, and appending it would
 * put today's games into whatever week the caller is actually looking at.
 */
export function overlayFresh(slate: Game[], fresh: Game[]): Game[] {
  if (fresh.length === 0) return slate;
  const byId = new Map(fresh.map((game) => [game.id, game]));
  return slate.map((game) => byId.get(game.id) ?? game);
}

/**
 * Whether a requested window is worth overlaying at all — true when it could
 * hold today's games, so a week the caller has scrolled away to doesn't pay
 * for a fetch that can only miss.
 *
 * The window is widened by a day at each end: the app builds its dates from
 * the device's own calendar, which can be a day off this server's.
 */
export function includesToday(dates: string, now: Date = new Date()): boolean {
  const [start, end = start] = dates.split("-");
  // Two ranges overlap when each starts before the other ends.
  return start <= stamp(shift(now, 1)) && end >= stamp(shift(now, -1));
}

/** "20260913", the shape ESPN's `dates` parameter takes. */
function stamp(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function shift(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
