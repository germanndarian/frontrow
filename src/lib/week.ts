/* The scoreboard a week at a time, the way the iPhone app pages it: last week,
   this week, next week, and the season ahead.

   A week is seven local calendar days starting on the reader's own first day of
   the week — Sunday in the US, Monday in most of Europe — the way the app
   follows the phone's calendar. The server slices the games on the US Eastern
   day, and lays today's board over any window that could hold today, a day
   either side, so a reader a few time zones out still gets live scores. */

export interface WeekWindow {
  /** Weeks from this one: -1 is last week, 0 this week. */
  offset: number;
  /** Local midnight on the first and last day. */
  start: Date;
  end: Date;
}

/** Last week through sixteen weeks ahead. */
export const WEEK_OFFSETS = Array.from({ length: 18 }, (_, i) => i - 1);

type WeekInfoLocale = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
};

/** The reader's first day of the week, numbered the way Intl numbers them:
    1 is Monday, 7 is Sunday. Monday when the browser doesn't say — Firefox
    doesn't yet. */
export function firstDayOfWeek(language?: string): number {
  try {
    const tag = language ?? (typeof navigator === "undefined" ? "en-US" : navigator.language);
    const locale = new Intl.Locale(tag) as WeekInfoLocale;
    const day = (locale.getWeekInfo?.() ?? locale.weekInfo)?.firstDay;
    return day != null && day >= 1 && day <= 7 ? day : 1;
  } catch {
    return 1;
  }
}

/** The week around `at` that starts on `firstDay`, moved `offset` weeks on. */
export function weekWindow(at: Date, offset: number, firstDay: number): WeekWindow {
  const start = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  // getDay counts Sunday as 0; Intl counts it as 7.
  const weekday = start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - ((weekday - firstDay + 7) % 7) + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { offset, start, end };
}

export function weekWindows(at: Date, firstDay: number): WeekWindow[] {
  return WEEK_OFFSETS.map((offset) => weekWindow(at, offset, firstDay));
}

const monthDay = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** What a week's chip says: the near weeks in words, the rest by their date. */
export function weekLabel(week: WeekWindow): string {
  if (week.offset === -1) return "Last week";
  if (week.offset === 0) return "This week";
  if (week.offset === 1) return "Next week";
  return monthDay(week.start);
}

/** "Sep 21 – 27", or "Sep 28 – Oct 4" when the week runs into a new month. */
export function weekRange(week: WeekWindow): string {
  const sameMonth = week.start.getMonth() === week.end.getMonth();
  const to = sameMonth ? String(week.end.getDate()) : monthDay(week.end);
  return `${monthDay(week.start)} – ${to}`;
}

/** "20260921-20260927", the window the scoreboard takes. */
export function weekQuery(week: WeekWindow): string {
  return `${stamp(week.start)}-${stamp(week.end)}`;
}

function stamp(d: Date): string {
  const two = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}`;
}
