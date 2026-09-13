import type { RawSituation } from "@/lib/espn/raw";
import type { FieldSituation } from "@/lib/types";

/** What the conversion needs to know about a side: who they are and how the
    feed abbreviates them. */
export interface FieldTeam {
  teamId: string;
  abbreviation: string;
}

/** The trailing "TEX 22" of a marker, whether it stands alone in
    `possessionText` or ends a spelled-out "1st & 10 at TEX 22". The
    abbreviation has to start with a letter so the "& 9" of a bare
    "2nd & 9" can't pass for one. */
const MARKER = /([A-Za-z][A-Za-z&.'’-]{0,6})\s+(\d{1,2})\s*$/;

/**
 * The line of scrimmage as a percentage across the playing surface, 0 at the
 * away team's goal line and 100 at the home team's.
 *
 * `situation.yardLine` is the obvious field to reach for and the wrong one:
 * it counts from a goal line ESPN doesn't name, so a "22" is the home 22 in
 * one payload and the away 22 in the next. The marker text says whose half it
 * is out loud — "TEX 22" — so read that instead, and when it isn't there,
 * say so rather than guess: null draws a field with no lines on it, which is
 * honest, where a guess draws the ball on the wrong half.
 */
export function toFieldPercent(
  sit: RawSituation | undefined,
  home: FieldTeam,
  away: FieldTeam,
): number | null {
  const text = sit?.possessionText?.trim() || sit?.downDistanceText?.trim();
  const marker = text ? MARKER.exec(text) : null;
  if (!marker) return null;

  const abbr = marker[1].toUpperCase();
  const yard = Number(marker[2]);
  // Beyond the 50 the marker has stopped meaning what we think it means.
  if (!Number.isFinite(yard) || yard < 0 || yard > 50) return null;
  // Midfield is midfield from either end, whoever's abbreviation it carries.
  if (yard === 50) return 50;

  if (abbr === away.abbreviation.toUpperCase()) return yard;
  if (abbr === home.abbreviation.toUpperCase()) return 100 - yard;
  return null;
}

/**
 * Where the chains are. The offense drives at the other team's goal line, so
 * the home team works down towards 0 and the away team up towards 100.
 * Goal-to-go lands exactly on the goal line, which is what ESPN means by a
 * distance that runs out the field.
 */
export function toFirstDownPercent(
  ballOn: number | null,
  distance: number | undefined,
  homeHasBall: boolean | null,
): number | null {
  if (ballOn == null || distance == null || homeHasBall == null) return null;
  const marker = homeHasBall ? ballOn - distance : ballOn + distance;
  return Math.min(100, Math.max(0, marker));
}

/** The whole situation, resolved to positions the graphic can draw. */
export function buildField(
  sit: RawSituation,
  home: FieldTeam,
  away: FieldTeam,
): FieldSituation {
  const ballOn = toFieldPercent(sit, home, away);
  const homeHasBall =
    sit.possession === home.teamId
      ? true
      : sit.possession === away.teamId
        ? false
        : null;

  return {
    ballOn,
    firstDown: toFirstDownPercent(ballOn, sit.distance, homeHasBall),
    homeHasBall,
    down: sit.down,
    distance: sit.distance,
    downDistanceText: sit.downDistanceText ?? sit.shortDownDistanceText,
    possessionText: sit.possessionText,
    isRedZone: sit.isRedZone === true,
  };
}
