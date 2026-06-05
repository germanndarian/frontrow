# Frontrow

A personal sports companion for **NFL, college football, NHL and MLB**. Follow your
teams and players, and get one beautiful, broadcast-grade dashboard: live scores,
recent form, next fixtures, standings, and season stats — only for what you care about.

> Status: **fully live.** Dashboard, multi-step onboarding, and all data are wired to
> ESPN's public endpoints through server-side route handlers (see
> [Live data](#live-data-espn)). Set `NEXT_PUBLIC_USE_MOCK=true` to run offline.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — see below, there is NO API key to set
npm run dev
```

Open **http://localhost:3000**.

```bash
npm run build && npm run start   # production build
```

Requires Node 18.18+ (developed on Node 24).

## Environment & API key

**There is no API key to configure.** Frontrow reads from ESPN's public, keyless
endpoints, so it runs with zero setup. `.env.local` is entirely optional and holds only
non-secret config. All ESPN calls run through Next.js **server-side route handlers**
(`src/app/api/*`), so nothing sensitive is shipped to the browser and many followers
share one cached upstream call.

| Variable | Purpose | Default |
| --- | --- | --- |
| `ESPN_SITE_API` | Scoreboard / teams / schedule / roster | ESPN site API |
| `ESPN_STANDINGS_API` | Division standings | ESPN v2 API |
| `ESPN_WEB_API` | Athlete season stats + game logs | ESPN web API |
| `NEXT_PUBLIC_LIVE_POLL_MS` | Live-game refresh cadence (only while live) | `30000` |
| `NEXT_PUBLIC_USE_MOCK` | Run fully offline on the bundled demo dataset | `false` |

## What's in the box

- **First-run onboarding** — a four-step setup (sport → league → team → player) with a
  progress bar, animated step transitions, searchable selectors, and loading/empty
  states. Choices persist to `localStorage`; returning visitors skip straight to the
  dashboard. Re-runnable from Settings, with a one-tap "sample lineup" shortcut.
- **Live & Upcoming** — a horizontally scrolling scoreboard with clear
  `live / upcoming / final` states, the live game's situation + last play, and
  auto-refresh that only polls while something is actually live.
- **Your Teams** — recent form, next fixture, standings position, and a scoring
  trend, with a team-colored card header.
- **Your Players** — position-aware season stats with league ranks, plus a recent
  game log and an output sparkline.
- **Season Stats** — a per-game scoring trend chart (Recharts) for your spotlight team.
- **Around the League** — full standings tables with an inline strength bar; your
  team is highlighted.
- **Settings** — review and unfollow teams/players; restore or clear your follows.
- Considered **loading, empty, and error** states everywhere; fully responsive and
  mobile-first; respects `prefers-reduced-motion`.

## Tech

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** with an OKLCH design-token system (`src/app/globals.css`)
- **TanStack Query** — caching + live polling
- **Motion** — page/section reveals and the live-score micro-interactions
- **Recharts** — the season-trend chart
- **Zustand** (+ `persist`) — follow preferences in `localStorage`

## Project structure

```
src/
  app/
    layout.tsx          Fonts (Archivo / Hanken Grotesk / Geist Mono) + providers
    page.tsx            Dashboard entry
    settings/page.tsx   Manage follows
    globals.css         Design tokens, base styles, keyframes
  lib/
    types.ts            Normalized domain models (mirror ESPN's shapes)
    leagues.ts          League/sport config (ESPN slugs, standings columns, season state)
    mock.ts             Realistic mock dataset (real logos/headshots)
    data.ts             Data facade  <-- swap this to go live
    queries.ts          TanStack Query hooks (live polling lives here)
    store.ts            Zustand preferences (persisted)
    utils.ts            cn(), time/format helpers
  components/
    ui/                 Primitives: TeamLogo, Headshot, Card, Badge, Sparkline, States
    brand/Wordmark.tsx
    dashboard/          Header, ScoreboardStrip, GameCard, Team/Player/Standings cards
  lib/espn/             ESPN integration (server-only)
    endpoints.ts        URL builders + per-surface cache lifetimes
    client.ts           fetch wrapper: timeout, retry-once, revalidate cache
    raw.ts              minimal types for the ESPN JSON we read
    normalize.ts        raw ESPN -> lib/types.ts shapes (defensive)
  app/api/              Route handlers (one per surface)
```

## Live data (ESPN)

Data flows: **client hook → `/api/*` route handler (server) → ESPN (cached) →
normalizer → component**. The browser never calls ESPN directly.

| Route | ESPN source |
| --- | --- |
| `GET /api/scoreboard?leagues=` | `.../{sport}/{league}/scoreboard` |
| `GET /api/team/[id]?league=` | team detail + `.../teams/{id}/schedule` |
| `GET /api/standings/[league]?teamId=` | `.../v2/.../standings?level=3` (division) |
| `GET /api/player/[id]?league=` | `athletes/{id}` (`statsSummary`) + `athletes/{id}/gamelog` |
| `GET /api/teams?leagues=` | `.../teams` (onboarding) |
| `GET /api/roster?league=&teamId=` | `.../teams/{id}/roster` (onboarding) |

**Rate-limit posture.** ESPN's endpoints are unofficial with an informal ~2.5k/day
ceiling; we stay well under it. Each surface is cached server-side
(`endpoints.ts` → `REVALIDATE`): scoreboard 20s, team/standings/player 5min,
teams/rosters 24h. The client polls **only while a game is live**, every 30s.

**Resilience.** `client.ts` retries once and times out at 8s; route handlers return
`502` on hard failure and TanStack Query keeps the last good data; every normalizer is
defensive, so an ESPN field change degrades to a placeholder rather than crashing.

To work offline, set `NEXT_PUBLIC_USE_MOCK=true` — the facade in `src/lib/data.ts`
delegates to the bundled dataset in `src/lib/data.mock.ts` with zero UI changes.
