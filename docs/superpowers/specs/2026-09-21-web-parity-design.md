# The iPhone app's features, on the website — design

**Date:** 2026-09-21
**Status:** built — one PR, a commit per piece

## Goal

Bring what was built for the native iPhone app (PRs #40–#59) to the website,
and stop the website calling football off-season in the middle of September.

## Decisions taken

| Question | Decision |
| --- | --- |
| Which website | `/dashboard`, `/settings` and `/setup`. `/app` is left alone — nothing links to it since the Capacitor shell was retired — but it picks up the setup changes, because `SetupFlow` is shared |
| Lock Screen tracker | Not ported. A browser can't draw on the Lock Screen or in the Dynamic Island, and the maintainer chose to skip a web stand-in |
| Home and lock-screen widgets | Not ported. The game link covers the part that translates: opening straight to a game |
| iOS-only polish | Not ported: the shrinking tab bar, hidden scroll bars, pull-to-refresh, keyboard handling |
| Where a week of games lives | Inside the dashboard, one sideways-scrolling row per group |
| How sheets are presented | The site's existing `Modal`: up from the bottom on a phone, centred on a desktop |
| How to pin | From the game's sheet |
| Season flags | Worked out from the date instead of written in by hand |
| Shipping | One PR, one commit per piece, by the maintainer's request |

## What already exists

The server half is done. Every iPhone feature that needed new data added it to
the shared routes: the scoreboard takes a `dates` window (fetched a month at a
time and sliced on the US Eastern day), today's board is laid over it, and a
`Game` carries `week`, `linescores` per side, `field` and `bases`. A `Player`
carries `bio`. The website receives all of it and draws none of it.

So there are no new API routes. The one data-layer change is that the website's
scoreboard facade passes a `dates` window through, as the app's does.

## Architecture

The rules the app follows move into small modules in `src/lib`, each with unit
tests, and the components stay thin. This mirrors how the app split `Models`
from `Features`.

| Module | What it knows |
| --- | --- |
| `clock.ts` | What time it is. The real time normally; the demo evening in demo mode (see Demo data) |
| `week.ts` | The week windows: last week to sixteen weeks ahead, their labels ("Last week", "This week", "Next week", "Oct 5"), ranges ("Sep 21 – 27", "Sep 28 – Oct 4") and `dates` query strings. A week starts on the browser locale's first day, Monday when the browser doesn't say — the way the app follows the phone's calendar |
| `scores.ts` | Today's `mobile-scores.ts`, renamed now the website uses it. Gains the board rules: which games a filter shows, the groups and their order, the counts, the week note, when marks and pins apply |
| `seasons.ts` | Each league's season window, and what to say outside it |
| `game-detail.ts` | Line-score columns (innings keep counting into extras; three periods or four quarters, then `OT`, `OT2`), the total's label (`R` or `T`), the countdown text, the details rows |
| `field-graphic.ts` | Where each line of the field goes, which way the ball faces, the endzone colours, the down-and-distance headline and the last-play line |
| `pins.ts` | The pinned games, kept in the browser |
| `players.ts` | Players grouped by team, and the rows of a player's profile |
| `follows.ts` | The "What you follow" summary line and preview |
| `setup-steps.ts` | Which setup steps a set of sports earns, and how far the pager may reach |

An open sheet doesn't need the app's `LiveFeed`. It looks its game up by id in
the scoreboard data React Query already holds, so it follows the same 30-second
refresh as the board beneath it without starting one of its own.

## 1. The game sheet

Any game card opens it: every card on the board, and every card in the list of
live games. It's the site's `Modal`, with the content and order of the app's
`GameDetailSheet`:

- A header card: the status (live, in red with the pulse; `FINAL`; `SCHEDULED`),
  the season week for football, then both teams with logo, name, record and
  score. The side that isn't ahead is muted.
- Before the start, a countdown: `2d 04:31:09`, `04:31:09` or `31:09`, ticking
  once a second, with the full date under it. "Any moment" once the time has
  passed; "Not scheduled yet" with no time at all.
- Once it's under way, football draws the field (below), and any sport with a
  line score shows it: a column per period, as many as either side has
  reported, and the total. A period a side hasn't reached reads "–".
- Details: the last play (when there's no field to carry it), venue, TV, the
  line, the over/under, the start, and ESPN's status text.
- A Pin / Unpin button in the header.

The header's LIVE pill becomes a button. One live game opens its sheet; several
open a list of the live games, and picking one swaps the list for that game's
sheet.

Opening a game writes `?game=<id>` into the address bar with
`history.replaceState`, and closing it takes it out, so the address can be copied
and shared. Loading `/dashboard?game=<id>` opens that game once this week's board
has it, and gives up quietly if the board doesn't. It works for anyone already
signed in; a signed-out visitor goes through login as usual and arrives without
it.

### The field

Drawn in SVG, from the app's `FieldPosition`:

- The away team's endzone on the left and the home team's on the right, each in
  the team's colour with its abbreviation, white or ink, whichever reads. A
  colour that can't carry either at WCAG's 3:1 for large text falls back to the
  surface colour and ink.
- Yard lines every ten, the goal lines brighter, hash marks, and 10–50–10 up both
  sidelines. The field is squashed to 3.4:1 so the numbers stay legible.
- The line of scrimmage in blue and the chains in yellow, placed from the
  percentages the API already sends: 0 at the away goal line, 100 at the home
  one. The ball sits just behind the line, on the side the offense is driving
  from.
- In the red zone, the twenty being defended is tinted.
- At the half and between drives ESPN keeps the situation and stops saying where
  the ball is, so the field draws with no lines. With no side named, there's no
  ball.
- The lines slide between refreshes (unless motion is reduced).
- Underneath: "2nd & 9 at DAL 48", then "Last play: 09:32 · …", with the game
  clock put in front when ESPN hasn't already.

## 2. Scores by week

The dashboard's top section, "Live & Upcoming", becomes a week at a time:

- A row of week chips — Last week, This week, Next week, then each week's date
  out to sixteen weeks ahead — and the week's range beside the title.
- A note of where the season is for the football in view: "NFL Week 3 · NCAAF
  Week 4". Football cards carry a `WEEK 3` badge.
- Three groups, each a sideways-scrolling row with the current strip's fading
  edges: LIVE NOW, UPCOMING, RESULTS. An empty group isn't drawn.

The dashboard's existing league filter decides what's on the board, so there's
no second row of chips:

- **All** shows only your teams' games, unmarked. With no teams followed it shows
  everything, rather than nothing.
- **A league** shows that league in full. Your games are marked — a star, a blue
  tint, a blue edge down the left and a 2px blue border — and sorted to the
  front of each row, and each rule counts them ("UPCOMING · 45 · 3 yours") and
  turns blue when there are any.

The filter now shows whenever you follow a league; today it hides with only one,
which would leave the full league unreachable.

Everything else keeps its current behaviour:

- The board refreshes every 30 seconds only while it's showing this week and a
  game is live. A different week shows placeholders until it arrives, never the
  previous week's games under the new heading.
- The header's LIVE count and the greeting's "2 games live" stay "your teams'
  games live right now", whichever week is on screen.
- An empty week says so: "None of your teams play Sep 21 – 27. Pick a league to
  see everything that's on." or "Nothing on the slate".
- The strip's habit of adding each team's next six games from its full schedule
  goes. The week picker replaces it, and a team's next game is still on its card
  under "Next up".

## 3. Pins

- Pin or unpin from the game's sheet. The app's press-and-hold on a card has no
  good web equivalent, and the sheet is one click away.
- Pins only reorder a league's view: a pinned game goes to the front of its own
  row, then your teams' games, then start time. A pinned live game stays with the
  live games. A gold pin marks it there. Under **All** a pin does nothing — no
  mark, no reordering — as on the phone.
- Kept in the browser under `frontrow.pinnedGames`, not synced to the account. A
  pinned game's id is dropped once any board shows it final.

## 4. Players

- "Your Players" groups players under their team, in the order your teams are
  listed. A player whose team you don't follow gets a group at the end.
- Each group's rule carries the team name, abbreviation and colour, and a
  chevron that folds it. Folded, it shows the count ("NYY · 3"). Folds last until
  you leave the page and aren't saved.
- The league filter still applies first.
- The whole card opens the player sheet: the headshot (the follow's own, so it's
  there from the first frame), name, "NYY · RF · #99 · 2026 season"; all six
  stats with their labels and league ranks, gold for a league leader; the whole
  game log; then a Profile — status (only when it isn't active), height, weight,
  age, birthplace, bats/throws, experience, college, draft — leaving out whatever
  ESPN doesn't have.

## 5. What you follow (Settings)

- The Sports & leagues, Teams and Players cards become one panel: a summary
  ("3 leagues · 4 teams · 2 players"), the league chips, three teams and three
  players with ✕ to remove, and "View all 9" when there are more. Three of each,
  so a long list of teams can't push the players out of the preview.
- "View all" opens every follow in a dialog, Teams then Players, with the same ✕.
- One Edit button opens a dialog with Sports / Leagues / Teams / Players tabs,
  using the setup pickers. Leagues only appears when a sport you follow has more
  than one league — football — and if it goes away while open, the dialog falls
  back to Sports. Changes save as you tap, as they do now.
- Adding a sport follows its leagues, the way the app's `setSports` does; with
  the Leagues tab hidden, that is the only way a league gets followed. Removing
  a sport or a league still removes its teams and players.
- Profile, Appearance and Dashboard don't change.

## 6. Setup

- The league step only appears when you pick football, the only sport with two
  leagues. Everyone else goes sports → teams → players, and the step counter
  reads "Step 1 / 3".
- Picking a sport follows its leagues; the league step, when it's there, is for
  taking one back.
- Swiping goes back through steps you've seen and forward only as far as
  Continue has been. Only Continue opens a step.
- Dropping football on a later step takes the league step away without leaving
  you on a page that's gone.
- The Done screen's check draws itself — the ring, then the tick, then a small
  settle — and simply appears with motion reduced.
- The Done screen fetches this week's board while it's read, so the dashboard
  opens on games.

## The season flags

`leagues.ts` hard-codes `inSeason` and `seasonHint` "as of June 2026", so today
the NFL and college football read as off-season in Week 3 and the NHL as in its
playoffs. The flags become a function of the date, in `seasons.ts`, with windows
that repeat every year (US Eastern dates, inclusive):

| League | In season | Phases | Off-season hint |
| --- | --- | --- | --- |
| MLB | Mar 18 – Nov 7 | Regular season, then Postseason from Sep 29 | Opening Day is in late March |
| NFL | Sep 1 – Feb 15 | Regular season, then Playoffs from Jan 13 | Kicks off in September |
| NCAAF | Aug 20 – Jan 25 | Regular season, then Bowl season from Dec 15 | Kicks off in late August |
| NHL | Oct 1 – Jun 30 | Regular season, then Playoffs from Apr 18 | Opens in October |
| NBA | Oct 15 – Jun 25 | Regular season, then Playoffs from Apr 13 | Tips off in October |

`LEAGUES` keeps its `inSeason` and `seasonHint` fields, filled from these when the
module loads, so nothing that reads them has to change. The windows are
approximate by a few days at either end, which costs at most an off-season
message a few days early or late.

## Demo data

The demo dataset is one evening, Friday June 5 2026, with its dates written in.
Now that the board is a week at a time and the seasons depend on the date, demo
mode runs on that evening's clock: `clock.ts` answers 7:30 PM Eastern on June 5,
advancing in real time from page load. The demo's This week is then the week of
June 5, the NHL is in its playoffs and football is off-season — exactly the story
the demo tells — and the browser tests don't change with the calendar.

- The demo scoreboard honours `dates` the way the route does, slicing on the
  Eastern day, and without `dates` answers today's games.
- A few games are added so a week has something in each group for your teams,
  and last and next week aren't empty. They're the games the demo team cards
  already list as recent form and next up.
- Line scores are added to the demo games, and a live game's line score moves
  with its score.
- There's no football in June, so the field isn't in the demo. Its drawing rules
  are unit-tested, and it's checked by hand on a live game.

## When things go wrong

- **Game sheet.** It opens from data the page already has, so it can't fail to
  load. If its game leaves the board, it keeps what it opened with.
- **Board.** A failed first load shows the existing error card with Try again. A
  failed refresh keeps the last good board, and the existing stale notice covers
  ESPN falling back to its last good answer.
- **Player sheet.** The same loading, error and "no stats yet" states as the
  player cards.
- **Pins.** If the browser refuses storage, pins last until the tab closes.
- **Field, countdown.** As above: no lines without a ball, no marker without a
  side, a neutral endzone for an unreadable colour, "Any moment" and "Not
  scheduled yet".

## Testing

- **Unit (Vitest)**, for every module above: week labels, ranges and query
  strings, including a week across a month and a Sunday-start locale; what a
  filter shows, the sort, the counts and the week note; overtime columns; the
  countdown text; field positions, direction, chains, red zone and endzone
  contrast; pins dropping finished games; player groups and profile rows; the
  follows summary and preview; setup steps and reach; the season windows either
  side of each boundary and across New Year.
- **Browser (Playwright)**, on the demo data: open a game from its card and see
  the line score; a game that hasn't started counts down; the LIVE pill opens a
  list and swaps to a game; the game link opens its sheet; switching weeks; a
  league shows everything with your games first; pinning moves a game to the
  front; folding a team's players; a player's profile; the follows panel, View
  all and the Edit tabs; setup without football skips the league step, and with
  football shows it.
- Tests that encode the old behaviour change with it: the onboarding test counts
  three steps without football.
- The live-ESPN suite already checks the week request the board uses, so it
  doesn't change.
- Before the PR: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run e2e`,
  `npm run build`, and the dashboard checked by hand against live data, with a
  live football game for the field.

## Out of scope

- `/app`, beyond the setup screens it shares.
- The Lock Screen tracker, and with it the bases diamond — the tracker was the
  only thing that drew it.
- Syncing pins to the account.
- Keeping `?game=` through a login.
- A season calendar read from ESPN rather than written down.
