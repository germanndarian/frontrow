/* What time it is, as far as the app is concerned.

   Normally that is simply the time. In demo mode (NEXT_PUBLIC_USE_MOCK=true)
   the app runs on the demo dataset's own evening — Friday 5 June 2026, 7:30 PM
   in New York — so "this week", the countdowns and which leagues are in season
   all agree with the games the dataset holds, whatever day it really is. That
   is also what keeps the browser tests from changing with the calendar.

   The demo clock still ticks: it starts at that moment when the page loads and
   runs forward in real time, so a countdown counts down. */

const DEMO = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/** The demo evening: 7:30 PM Eastern on Friday 5 June 2026. */
export const DEMO_MOMENT = Date.UTC(2026, 5, 5, 23, 30);

const booted = Date.now();

/** Milliseconds since the epoch — the real time, or the demo evening's. */
export function now(): number {
  return DEMO ? DEMO_MOMENT + (Date.now() - booted) : Date.now();
}
