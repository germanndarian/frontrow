# Playoff Bracket — Design

**Date:** 2026-06-08
**Status:** Approved (design)
**Feature:** Show the current playoff bracket for a followed team's league, reachable from the team's dashboard card.

## Goal

When a followed team is currently in a playoff, surface a **View playoff bracket**
action on that team's card. Opening it shows the full league bracket — every round
and matchup — with the **series score** for each matchup and the followed team's
path through the bracket highlighted.

## Decisions (locked)

- **Data source:** Demo data now, built live-ready. Bundled bracket data that always
  renders, shaped exactly how a live ESPN feed would later fill it. Mirrors the
  existing `data.ts` facade + `data.mock.ts` pattern; swapping to live ESPN is a
  config/normalizer change with **zero UI changes**.
- **Detail level:** Series tally only (e.g. "Series 2–1 · Game 4 tonight" or
  "Final · BOS 27–24"). No per-game expansion in v1.
- **League scope:** All four. NHL + MLB render as best-of-N **series**; NFL +
  College Football render as single-**game** matchups. One component handles both
  via a `format` field.
- **Entry point:** The **View playoff bracket** button appears on a team card
  **only when that team is in its league's current bracket** (`inPlayoffs`).
- **Presentation:** Classic horizontal-scroll bracket in a modal (same shell as
  `ScheduleModal`), with structured rounded-corner connector lines and the followed
  team's winning path glowing cobalt. Auto-scrolls the team into view; scrolls
  sideways on narrow screens.

## Data model (`src/lib/types.ts`)

```ts
export type MatchupFormat = "series" | "game";

export interface PlayoffSide {
  teamId: string;
  abbreviation: string;
  displayName: string;
  logo: string;
  color: string;
  seed?: number;
  /** Series: games won. Single game: the team's score. null until played. */
  score: number | null;
  winner: boolean;
}

export interface PlayoffMatchup {
  id: string;
  /** 0-based round index (0 = first round). */
  round: number;
  format: MatchupFormat;
  /** Best-of-N for series; omitted for single-game. */
  bestOf?: number;
  state: GameState;                 // "pre" | "in" | "post"
  home: PlayoffSide;
  away: PlayoffSide;
  /** Short status line, e.g. "Series 2–1 · Game 4 tonight", "Final". */
  summary: string;
  winnerTeamId?: string | null;
  /** Matchup this winner feeds into — drives the connector lines. */
  nextMatchupId?: string | null;
}

export interface PlayoffRound {
  id: string;
  name: string;                     // "Round 1", "Semifinals", "Final"
  matchups: PlayoffMatchup[];
}

export interface PlayoffBracket {
  league: LeagueId;
  name: string;                     // "Stanley Cup Playoffs"
  rounds: PlayoffRound[];
}
```

The existing `TeamCard` payload gains **`inPlayoffs: boolean`** — true when the team
appears in its league's current bracket. This is the only signal the card needs to
decide whether to render the button.

## Data flow

Mirrors the existing surfaces exactly:

```
TeamCardView (inPlayoffs?) ──▶ button ──▶ BracketModal
        │                                      │
   useTeamCard                          usePlayoffBracket(league, enabled)
        │                                      │
        ▼                                      ▼
  /api/team/[id]                      /api/playoffs/[league]  (route handler, cached)
                                               │
                                          data.ts facade ──▶ data.mock.ts  (ESPN normalizer later)
```

- **Route handler:** `src/app/api/playoffs/[league]/route.ts` returns the
  `PlayoffBracket` for the league (or `404`/empty when no active bracket). Cached
  server-side with a REVALIDATE entry (~5 min).
- **Query hook:** `usePlayoffBracket(league, enabled)` in `src/lib/queries.ts`,
  modeled on `useSchedule` (only fetches when the modal is open).
- **Facade:** `getPlayoffBracket(league)` in `src/lib/data.ts`; `inPlayoffs` is
  derived where the team card is assembled (team appears in the league bracket).
- **Mock:** `src/lib/data.mock.ts` provides:
  - An **active NHL** bracket (best-of-7 series) as the primary showcase.
  - At least one **single-game** bracket (e.g. College Football Playoff) to exercise
    the `format: "game"` path.
  - Teams present in an active bracket are flagged `inPlayoffs: true`.
  - Leagues with no active bracket return none → no button.

## Components

- **`src/components/dashboard/BracketModal.tsx`** — shell mirrors `ScheduleModal`
  (`Modal` + branded header showing the league + bracket name + close). Body renders
  `<Bracket>`; handles pending / error / empty states.
- **`src/components/dashboard/Bracket.tsx`** — renders rounds as columns of
  `<MatchupCard>`, plus an absolutely-positioned **SVG connector layer**. Uses a
  **deterministic layout** (fixed card height + fixed round column width) so connector
  coordinates are computed by a pure function from `(rounds, nextMatchupId map)` —
  no DOM measurement needed, which keeps connectors reliable and testable. Highlights
  the followed team's path (matchups containing the team, chained via `nextMatchupId`)
  in cobalt. Auto-scrolls the followed team's column into view on open. Horizontal
  scroll container for narrow screens.
- **`src/components/dashboard/MatchupCard.tsx`** — two `PlayoffSide` rows (logo/dot +
  abbr + score, winner emphasized) and the `summary` line. Highlighted variant when
  on the followed team's path.
- **`src/lib/bracket-layout.ts`** — pure helper: given rounds + the followed teamId,
  returns each matchup's `{ x, y }` position, the connector path segments
  (structured rounded elbows with gaps, per the approved mockup), and which segments
  are "on path" (cobalt). This is the unit-testable core.

## Entry point (`src/components/dashboard/TeamCardView.tsx`)

Add a **View playoff bracket** action rendered **only when `data.inPlayoffs`**.
Placed alongside the existing "View full schedule" footer button (e.g. a second
full-width action or a split row). Clicking opens `BracketModal` for `team.league`,
passing the followed `teamId` so the bracket can highlight its path. Reuses the
existing `stopPropagation` pattern so it doesn't trigger the card's select handler.

## Visual spec (from the approved mockup)

- Rounds laid out left → right as columns; matchup cards ~150px wide, fixed height
  per round.
- **Connectors:** each matchup sends two structured lines (top + bottom feeder) into
  its `nextMatchupId` card — horizontal out, rounded corner, vertical, rounded corner,
  horizontal in. A visible **gap** between line ends and the cards, and the two feeder
  lines stay **separated** where they approach the next card.
- Followed team's path (cards + the connectors along it) rendered in **cobalt**
  (`--color-primary`); everything else quiet gray. Live matchups get the red pulse
  treatment consistent with the rest of the app.
- Honors `prefers-reduced-motion` and the user's reduce-motion setting.

## Edge cases

- League not in playoffs / no bracket → no button, modal never opens.
- Team eliminated → button still shows (bracket viewable); the team's path highlights
  up to its elimination.
- Bracket not yet started (matchups `pre`) → cards show seeds and "—" scores, summary
  like "Starts Sat".
- Single-game matchup → `score` is the game score; `summary` is "Final · ABC 27–24"
  or the tipoff time; no "Series" wording.
- Bye / TBD slots → a placeholder side until the feeding matchup resolves.

## Testing

Offline unit tests (Vitest, no network):
- `bracket-layout.ts`: positions are correct for a known bracket; connector segments
  link each matchup to its `nextMatchupId`; the on-path segments match the followed
  team's chain.
- Mock shape: every `nextMatchupId` resolves to a real matchup; rounds are ordered;
  `inPlayoffs` is true exactly for teams present in an active bracket.
- A small render smoke test of `MatchupCard` (series vs game summary) if it adds value.

## Out of scope (v1)

- Live ESPN bracket parsing (the normalizer is stubbed; mock powers it now).
- Per-game score expansion within a series.
- Bracket predictions / "what if" interactions.

## Future

- Swap `data.mock.ts` for a live ESPN normalizer (`src/lib/espn/`) — no UI change.
- Optional per-game breakdown on matchup tap.
