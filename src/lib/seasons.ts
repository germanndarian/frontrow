import type { LeagueId } from "./types";
import { easternStamp } from "./espn/window";

/* Which leagues are playing, worked out from the date.

   These used to be written into leagues.ts by hand, "as of June 2026" — right
   for a month and then quietly wrong: in September the site still called the
   NFL's third week the off-season. A season keeps to roughly the same calendar
   every year, so the windows below repeat and nothing has to be remembered in
   the spring.

   The dates are approximate by a few days at either end, which costs at most an
   off-season message shown a little early or late. They are read as US Eastern
   days, the calendar ESPN files games under. */

interface SeasonWindow {
  /** First and last day in season, "MMDD", inclusive. May run past New Year. */
  opens: string;
  closes: string;
  /** The first day of the postseason, and what it's called. */
  post: string;
  postLabel: string;
  /** What to say when the league isn't playing. */
  offseason: string;
}

const WINDOWS: Record<LeagueId, SeasonWindow> = {
  mlb: { opens: "0318", closes: "1107", post: "0929", postLabel: "Postseason", offseason: "Opening Day is in late March" },
  nfl: { opens: "0901", closes: "0215", post: "0113", postLabel: "Playoffs", offseason: "Kicks off in September" },
  "college-football": { opens: "0820", closes: "0125", post: "1215", postLabel: "Bowl season", offseason: "Kicks off in late August" },
  nhl: { opens: "1001", closes: "0630", post: "0418", postLabel: "Playoffs", offseason: "Opens in October" },
  nba: { opens: "1015", closes: "0625", post: "0413", postLabel: "Playoffs", offseason: "Tips off in October" },
};

export interface Season {
  inSeason: boolean;
  phase: "regular" | "post" | null;
  /** "Regular season", "Playoffs" — or, out of season, when it comes back. */
  label: string;
}

/** Whether a "MMDD" day falls between two others, inclusive, running past New
    Year when the window closes earlier in the calendar than it opens. */
function within(day: string, from: string, to: string): boolean {
  return from <= to ? day >= from && day <= to : day >= from || day <= to;
}

/** Where a league's season stands on a given day. */
export function seasonAt(league: LeagueId, at: Date): Season {
  const span = WINDOWS[league];
  // "20260921" → "0921". An unreadable date matches no window: off-season.
  const day = Number.isNaN(at.getTime()) ? "" : easternStamp(at.toISOString()).slice(4);
  if (!day || !within(day, span.opens, span.closes)) {
    return { inSeason: false, phase: null, label: span.offseason };
  }
  const post = within(day, span.post, span.closes);
  return {
    inSeason: true,
    phase: post ? "post" : "regular",
    label: post ? span.postLabel : "Regular season",
  };
}
