/* Turning a date window into requests ESPN will actually answer.

   ESPN's scoreboard used to take a range — `dates=20260914-20260920` — and do
   the filtering for us. It stopped: a range now answers 400 "Failed to get
   events endpoint." on every league and on both the site.api and site.web
   hosts. Single days still work, and so does a whole month (`dates=202609`),
   which is the cheaper of the two: one upstream read covers four or five
   weeks instead of seven reads covering one.

   So we ask for the months a window touches and cut the window out ourselves.
   That moves the filtering from ESPN to here, and the calendar matters:
   ESPN files a game under its **US Eastern** day, not UTC. `dates=20260915`
   answers with games from 22:40Z that day through 01:40Z the next — a 7:40pm
   and a 9:40pm first pitch in New York. Slicing on the UTC date would drop
   every late game off the end of a week. */

/** A month's worth of games, "202609" — what `dates=` now takes. */
export type Month = string;

/* A window is only ever a week (the app's strip) or the bracket's ~90 days, so
   nothing legitimate spans more than a handful of months. The route's own
   validation admits any two 8-digit numbers, though, and "20200101-20991231"
   would otherwise become 960 upstream reads on one request. */
const MAX_MONTHS = 6;

/** The months a "YYYYMMDD".."YYYYMMDD" window falls in, oldest first. Empty if
    the window is backwards; capped at six months. */
export function monthsSpanning(start: string, end: string): Month[] {
  let year = Number(start.slice(0, 4));
  let month = Number(start.slice(4, 6));
  const lastYear = Number(end.slice(0, 4));
  const lastMonth = Number(end.slice(4, 6));
  if (!year || !month || !lastYear || !lastMonth) return [];
  // Caught by the day, which the month walk below can't see: a window that ends
  // before it starts matches no game, and is not worth an upstream read to learn.
  if (end < start) return [];

  const months: Month[] = [];
  while (
    (year < lastYear || (year === lastYear && month <= lastMonth)) &&
    months.length < MAX_MONTHS
  ) {
    months.push(`${year}${String(month).padStart(2, "0")}`);
    if (++month > 12) {
      month = 1;
      year++;
    }
  }
  return months;
}

/* Built once. Intl formatters are expensive to construct and this runs per
   game; "en-CA" is the locale that renders a date as "2026-09-15". */
const eastern = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The Eastern calendar day ESPN files an instant under, as "20260915".
    Empty string for a date we can't read, which no window will match. */
export function easternStamp(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return eastern.format(at).replaceAll("-", "");
}

/** Whether a game belongs to a "YYYYMMDD".."YYYYMMDD" window, inclusive. */
export function withinWindow(iso: string, start: string, end: string): boolean {
  const day = easternStamp(iso);
  return day !== "" && day >= start && day <= end;
}

/** Split the `dates` parameter into its ends; a single day is both. */
export function windowEnds(dates: string): [string, string] {
  const [start, end = start] = dates.split("-");
  return [start, end];
}
