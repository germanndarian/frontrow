import type { Game, GameSide, LeagueId } from "./types";
import { whenLabel } from "./scores";

/* What a game's sheet says, apart from the field drawing: the line score's
   columns, the countdown to the start, the status line and the details list.
   The same rules as the iPhone app's game sheet. No React — unit-tested. */

/** Periods in a regulation game: innings, periods or quarters. */
const REGULATION: Record<LeagueId, number> = {
  mlb: 9,
  nhl: 3,
  nba: 4,
  nfl: 4,
  "college-football": 4,
};

/** How many columns a line score needs: as many periods as either side has
    reported, so overtime columns appear on their own. */
export function periodCount(game: Game): number {
  return Math.max(game.home.linescores?.length ?? 0, game.away.linescores?.length ?? 0);
}

export function hasLineScore(game: Game): boolean {
  return periodCount(game) > 0;
}

/** What one column is called. An inning is an inning however many there are;
    everyone else counts regulation periods, then "OT" — or "OT", "OT2", "OT3"
    when one wasn't enough. */
export function periodLabel(league: LeagueId, index: number): string {
  const regulation = REGULATION[league];
  if (league === "mlb" || index < regulation) return String(index + 1);
  const extra = index - regulation + 1;
  return extra === 1 ? "OT" : `OT${extra}`;
}

/** The head of the running-total column: runs in baseball, a total elsewhere. */
export function totalLabel(league: LeagueId): string {
  return league === "mlb" ? "R" : "T";
}

/** One side's score for a period. A period it hasn't reached reads as a dash,
    not a zero. */
export function periodValue(side: GameSide, index: number): string {
  const value = side.linescores?.[index];
  return value == null ? "–" : String(value);
}

/** Time left before the start: "2d 04:31:09", "04:31:09" or "31:09" — as much
    as is left and no more. "Any moment" once the time has passed. */
export function countdownText(startsAt: number, at: number): string {
  const seconds = Math.round((startsAt - at) / 1000);
  if (!(seconds > 0)) return "Any moment";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${two(hours)}:${two(minutes)}:${two(secs)}`;
  if (hours > 0) return `${two(hours)}:${two(minutes)}:${two(secs)}`;
  return `${two(minutes)}:${two(secs)}`;
}

/** The line under the sheet's title: the clock while it's on, the start time
    before, and the final after. */
export function statusLine(game: Game): string {
  if (game.state === "in") return game.shortDetail || "Live";
  if (game.state === "post") return game.shortDetail || "Final";
  return whenLabel(game.date);
}

/** Whether a side is ahead, or level — before the start nobody trails. */
export function isLeading(game: Game, side: GameSide): boolean {
  if (game.state === "pre") return true;
  const other = side === game.home ? game.away : game.home;
  return (side.score ?? 0) >= (other.score ?? 0);
}

/** "Sep 21, 2026, 8:15 PM" in the reader's own format. Empty for a date that
    can't be read. */
function startLabel(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Everything else the feed knows, as label/value rows. The last play is here
    only when there's no field to carry it. */
export function detailRows(game: Game): [label: string, value: string][] {
  const rows: [string, string][] = [];
  const play = game.lastPlay ?? game.situation;
  if (!game.field && play) rows.push(["Last play", play]);
  if (game.venue) rows.push(["Venue", game.venue]);
  if (game.broadcast) rows.push(["TV", game.broadcast]);
  if (game.odds?.details) rows.push(["Line", game.odds.details]);
  if (game.odds?.overUnder != null) rows.push(["Over/under", String(game.odds.overUnder)]);
  const start = startLabel(game.date);
  if (start) rows.push(["Start", start]);
  if (game.statusDetail) rows.push(["Status", game.statusDetail]);
  return rows;
}
