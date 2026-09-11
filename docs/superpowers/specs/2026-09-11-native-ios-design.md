# Frontrow — native iOS app — design

**Date:** 2026-09-11
**Status:** built — phases 1, 2 and 3

## Goal

Replace the Capacitor shell with a native SwiftUI app that feels like a
first-party Apple app — Apple Music is the reference — with real Liquid
Glass and the iOS 26 tab bar that minimises to icons on scroll-down and
expands on scroll-up or tap. The website and its `/app` route stay as they
are.

## Decisions taken

| Question | Decision |
| --- | --- |
| Platform | SwiftUI, iOS 26 minimum (Liquid Glass and `tabBarMinimizeBehavior` are iOS 26 APIs) |
| Tab swipe | None — native tab bar behaviour, as Apple Music. Swipe stays in onboarding (page-style) and sheets |
| Data | The existing `/api/*` route handlers on Vercel. No new backend |
| Auth (Phase 3) | Supabase Swift SDK, email/password first; Sign in with Apple is a natural follow-up |
| Project | Generated from `apple/project.yml` with xcodegen; the `.xcodeproj` is committed for convenience |
| Bundle id | `com.germanndarian.frontrow` — the same as the shell, so it replaces it on the phone |
| Phasing | 1: shell + Scores · 2: Teams, Players, Table, sheets · 3: login, onboarding, settings sync |

## Architecture

```
 iPhone ─▶ Frontrow.app (SwiftUI)
              ├─▶ https://frontrow-ten.vercel.app/api/*   scores, teams, players, standings…
              └─▶ Supabase (Phase 3)                         auth, follows, settings
```

- **Networking.** One `APIClient` with typed `Codable` models mirroring
  `src/lib/types.ts`. Dates arrive as ISO strings (some without seconds)
  and are parsed leniently.
- **State.** `@Observable` models per feature, `@MainActor`. Live polling
  only while a game is live, as the web does.
- **Theme.** Semantic colours (background, surface, ink, muted, faint, line,
  accent, live, win, loss) as dynamic colours from the web tokens; follows
  the system appearance. Accent choice and the light/dark override come
  with Settings sync in Phase 3.
- **Glass.** The native tab bar is glass by itself on iOS 26. Chips and
  glass buttons use `.glassEffect()`; grouped controls sit in a
  `GlassEffectContainer`. Content cards are opaque — glass is for bars and
  controls, never content.
- **Tab bar.** `TabView` with `Tab`s and `.tabBarMinimizeBehavior(.onScrollDown)`.

## Phase 1

- App shell: five tabs with SF Symbols, accent tint, minimise-on-scroll.
- Scores tab on live data: league chips, LIVE NOW / UPCOMING / RESULTS
  groups, game cards with logos, followed-team highlight, footer (status,
  odds/broadcast/venue), pull-to-refresh, 30s polling while live, shaped
  skeletons, empty and error states.
- Followed teams and leagues come from a local default lineup until Phase 3
  syncs them from the account.
- Other tabs are placeholders naming their phase.
- Verification: XCUITest launches the app, scrolls the list, and asserts
  the other tabs stop being hittable (the bar minimised to its icon), then
  that tapping the pill and scrolling back up bring them back; screenshots
  attached at each step. Two things the simulator taught us: the
  accessibility container keeps its full height while the visible capsule
  shrinks, so hittability — not `frame.height` — is the honest signal; and
  the bar re-expands as the list travels back toward the top rather than on
  the first upward flick, while a tap expands it at once. Build and run in
  the iOS Simulator (iPhone 17 Pro, iOS 26.5) from the CLI.

## Phase 2

- **Teams.** A card per followed team: header tinted with the team colour,
  recent form as W/L chips, what's next, the scoring stretch, and actions for
  the schedule and (when the team is in it) the playoff bracket. Tapping a
  card features it in the Season Stats panel below — record, win %, streak,
  per-game tiles and the scoring chart.
- **Players.** A card per starred player: headshot, season stats in a
  three-wide grid with league ranks (gold for a league leader), a sparkline of
  the headline number, and the last four game logs.
- **Table.** One league at a time, showing the followed team's division or
  conference with that team's row highlighted. Columns come from the league,
  so hockey shows GP/W/L/OTL/PTS and football W/L/T/PCT/STRK.
- **Sheets.** Schedule, bracket and player, as native sheets with the grabber
  and swipe-to-dismiss. Each fetches its own data and carries a compact header
  with Done rather than a navigation bar.
- Game-log stats arrive as a JSON object, which Swift decodes into an
  unordered dictionary. Rather than print them alphabetically ("0 2B · 0 3B")
  the app states a per-league order, so a line reads like a box score
  ("4 AB · 1 R · 2 H").
- A small `Loadable`/`Cache` pair stands in for the web's React Query: one
  request per key, kept until pull-to-refresh forces it.
- Verification: a second XCUITest walks Teams → schedule sheet → season panel
  → Players → player sheet → Table, asserting live values rendered (the
  followed team's name, "Batting Average", "AL East", the row for the team you
  follow) and switching leagues. Screenshots at each step.

## Phase 3 (this PR)

- **Account.** Supabase Swift (2.55) for email/password sign-in and sign-up.
  The SDK keeps the session in the keychain, so signing in once is enough —
  the app reopens signed in until Settings signs you out. Guest mode keeps
  everything in memory, as the website does.
- **The front door.** A dark, branded welcome screen with sign up, sign in and
  "look around as a guest".
- **Onboarding.** Sports → leagues → teams → players, in a paged view so the
  steps can be swiped as well as tapped, then a Done screen that reads back
  what you picked. Teams come from `/api/teams` and players from `/api/roster`,
  so the pickers offer whatever ESPN currently lists rather than a baked-in
  catalogue.
- **Settings.** Profile (avatar emoji, display name), theme, accent colour,
  reduce motion, greeting name, the full list of follows with removal, sign
  out and delete account.
- **Sync.** The same three tables the website writes — `profiles`,
  `preferences`, `settings` — with the same column names and JSON shapes, so a
  team followed on the phone shows up on the website and a theme chosen in the
  browser arrives on the phone. Writes are debounced by 400ms, as on the web.
  The settings the app doesn't surface (radius, density, glow, hidden sections)
  are read and written back untouched rather than dropped.
- **The anon key ships in the app.** `SupabaseConfig` holds the project URL and
  the public anon key — the same pair the website serves in every page. Row-
  Level Security, not secrecy, is what scopes rows to their owner.
- **Account deletion needed one web change.** The route authenticated with the
  session cookie, which an app doesn't have; it now also accepts the session as
  a bearer token, verified by Supabase before anything is deleted.
- **The Capacitor shell is retired.** `ios/`, `capacitor.config.ts` and the
  three `@capacitor/*` dependencies are gone; the native app replaces it under
  the same bundle id. The website keeps its `/app` route for phone browsers,
  and with it the WebView detection in `src/lib/native.ts`, now inert.
- Verification: `AccountTests` asserts the front door, a real sign-in round
  trip to Supabase (an unknown account has to come back rejected), and the
  whole guest path — sports → leagues → teams (searched from the live
  catalogue) → roster → Done → the tabs showing exactly what was picked, with
  Settings reporting a guest session.

## Follow-ups after phase 3

- **Week view.** The Scores tab moved from today's slate to a week at a time:
  a strip of last week, this week, next week and the season ahead. The
  scoreboard route now takes a `dates` window (`YYYYMMDD-YYYYMMDD`) and caches
  the normalized games — a week of baseball is ~1.5MB raw, past what Next's
  fetch cache will store, but ~70KB once normalized.
- **Where the season is.** Football games carry their week from ESPN, so cards
  read "NFL · WEEK 2" and the strip notes "NFL Week 2 · NCAAF Week 3" for
  whatever is in view. Baseball and hockey carry a week index nobody quotes, so
  the API drops it for those leagues.
- **Teams by league.** The onboarding team picker groups its rows under league
  headings rather than running one alphabetical list across every league.
- **A faster Done screen.** The check draws itself — ring, then tick — instead
  of popping in, buttons answer the press immediately, the hand-off animation
  is 0.2s, and the Done screen prefetches the first scoreboard so the tabs open
  on games rather than skeletons.
- **Aiming the app elsewhere.** `APIClient` accepts `-api-base` as a launch
  argument or `FRONTROW_API_BASE` in the environment, which is how the
  simulator is pointed at a dev server; `xcrun simctl spawn <udid> launchctl
  setenv FRONTROW_API_BASE …` reaches a test run, where `TEST_RUNNER_`
  variables do not.

## Your teams first

- The scoreboard opens on **My teams** — only the games your followed teams
  play — because a week of every league is 200 games and none of them are why
  the app exists. A league chip still shows that league in full.
- Inside a league, your games sort to the front of each group, the group rule
  counts them ("45 · 3 yours"), and each card is marked: a star, an accent
  tint, a 5pt accent edge and a 2pt accent border. The mark only appears where
  it means something — under My teams everything would be marked, so nothing is.
- With nothing followed yet, My teams falls back to the whole slate rather than
  showing an empty screen, and the chip says "All".
- A team card's schedule and bracket strips are buttons across their full
  width, with a press state, rather than tappable words.

## Deferred

- Brand fonts (Archivo / Hanken Grotesk): SF Pro in Phase 1; bundling the
  fonts is a small follow-up.
- The design's custom tab glyphs: SF Symbols in Phase 1, as Apple's apps use.
- The web `/app` route's scroll glitch the maintainer mentioned — left as is
  by instruction while the native app takes over.
