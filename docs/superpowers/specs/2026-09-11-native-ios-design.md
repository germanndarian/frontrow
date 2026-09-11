# Frontrow — native iOS app — design

**Date:** 2026-09-11
**Status:** approved (direction and phasing); Phases 1 and 2 built

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

## Phase 2 (this PR)

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

## Deferred

- Brand fonts (Archivo / Hanken Grotesk): SF Pro in Phase 1; bundling the
  fonts is a small follow-up.
- The design's custom tab glyphs: SF Symbols in Phase 1, as Apple's apps use.
- Retiring the Capacitor shell (`ios/`, `capacitor.config.ts`, deps) once
  the native app reaches parity in Phase 3.
- The web `/app` route's scroll glitch the maintainer mentioned — left as is
  by instruction while the native app takes over.
