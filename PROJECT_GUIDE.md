# Frontrow — Project Guide

> **Read me first.** This file is the single source of truth for an AI assistant (or a new
> human contributor) picking up this repo cold. It describes what the app is, how it's built,
> the infrastructure behind it, the full feature history, and exactly how the maintainer wants
> pull requests handled. If you've just been told "read the md," this is it.

---

## 1. What Frontrow is

Frontrow is a personal sports dashboard. Most sports apps drown you in every game on earth;
Frontrow does the opposite — you pick your teams and players once, and get a single
broadcast-grade dashboard showing **only** what you follow: live scores, recent form, next
fixtures, standings, season stats, betting odds on upcoming games, and live playoff brackets.

- **Live demo:** https://frontrow-ten.vercel.app
- **Repo:** https://github.com/germanndarian/frontrow
- **Leagues covered:** NFL, College Football (NCAAF), MLB, NHL, NBA.
  - Soccer/EPL was deliberately **removed** — do not reintroduce it.
- **Data:** ESPN's public (keyless) endpoints, fetched server-side and normalized defensively.

The brand voice: "a floodlit night game from the press box." Cobalt blue is the brand color, a
single live-red pulse marks live games, amber marks leaders. The default theme is **light
cobalt** (matching the marketing homepage); the original midnight/dark look is preserved as a
selectable setting (like a dark-mode toggle).

---

## 2. Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16.2.7** (App Router, Turbopack), **React 19.2.4** |
| Language | TypeScript 5 |
| Styling | **Tailwind CSS v4** with OKLCH design tokens in `@theme` (`src/app/globals.css`) |
| Auth + DB | **Supabase** (email/password + OAuth, Postgres, Row-Level Security) via `@supabase/ssr` |
| Server state | **TanStack Query** (`@tanstack/react-query`) |
| Client state | **Zustand** (`auth`, `preferences`/store, `settings`) |
| Charts | **Recharts** |
| Animation | **Motion** (`motion`) |
| Analytics | `@vercel/analytics` + `@vercel/speed-insights` |
| Tests | **Vitest** (+ jsdom) |
| CI | **GitHub Actions** (`.github/workflows/ci.yml`) |
| Hosting | **Vercel** |

### ⚠️ Critical: this is a modified Next.js

`AGENTS.md` / `CLAUDE.md` warn that **this version of Next.js has breaking changes** vs. what's
in your training data — APIs, conventions, and file structure may all differ. **Before writing
any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`** and heed
deprecation notices. Do not assume Next.js behavior from memory.

---

## 3. Infrastructure

### Vercel (hosting)
- Deploys automatically on push to `main` via the Vercel Git integration. CI does **not** deploy
  — it only gates quality (lint/type-check/test/build).
- Each PR gets a **Vercel preview deployment**. The preview URL must go in every PR body (see §8).
- Vercel Analytics + Speed Insights are wired in `src/app/layout.tsx`.
- The Supabase Vercel integration injects Supabase env vars in production. Sensitive vars come
  back **blank** from `vercel env pull`, so local dev needs them set manually (see §6).

### Supabase (auth + database)
- **Auth:** email/password with email confirmation, plus OAuth (**Google** and **GitHub**).
  Sessions are signed JWTs stored in cookies by `@supabase/ssr`. OAuth redirects to
  `/auth/confirm`.
- **Database:** three 1:1-with-user tables, all under Row-Level Security so a user can only ever
  touch their own row:
  - `profiles` — display name, avatar emoji, avatar color
  - `preferences` — followed sports/leagues/teams/players + `onboarded` flag
  - `settings` — appearance, accent, radius, density, motion/glow, greeting name, default league,
    hidden sections
- A `handle_new_user()` trigger seeds default rows on signup (`security definer`,
  `search_path = ''`).
- **Migrations** live in `supabase/migrations/` and are applied manually via the Supabase SQL
  Editor (there is no automated migration runner). Current migrations:
  - `0001_init.sql` — tables, RLS policies, signup trigger
  - `0002_appearance.sql` — adds `settings.appearance` (default `'light'`)
- **Outstanding manual Supabase actions** (not done in code; do when deploying related work):
  - Enable **leaked-password protection** in the Supabase dashboard (Auth settings — it's a
    dashboard toggle, not SQL).
  - A linter-fix migration (RLS `auth.uid()` → `(select auth.uid())` for performance, and
    revoking execute on the trigger function) was drafted in PR #21 but that PR was **closed,
    not merged** — so it is **not** in the repo. Re-do it if revisiting the linter warnings.

### GitHub (source + CI)
- `main` is the protected default branch; nothing merges red.
- CI (`.github/workflows/ci.yml`) runs on every PR and on push to `main`: Node 22, then
  `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.
- Commit/PR authorship **must be `germanndarian`**, never `ia24a-germannd` (see §8).

---

## 4. Project structure

```
src/
  app/
    layout.tsx              Fonts (Space Mono, Archivo) + providers + Analytics/Speed Insights;
                            <html data-appearance="light"> default
    page.tsx                Marketing homepage (client component, uses home.css)
    home.css                Scoped homepage styles (.fr-home), cobalt accent #3c82e6
    globals.css             OKLCH design tokens, light + dark palettes, base styles, keyframes
    providers.tsx           React Query + system providers
    dashboard/page.tsx      Auth-gated dashboard (redirects to /login or /setup)
    login/page.tsx          Email + Google + GitHub auth; reads ?mode=signup; back-to-home pill
    setup/page.tsx          Four-step onboarding (sports → leagues → teams → players)
    settings/page.tsx       Profile · appearance · dashboard · follows
    auth/confirm/route.ts   Email-confirmation / OAuth callback handler
    api/                    Server route handlers (ESPN proxy + account):
      scoreboard/ team/[id]/ standings/[league]/ player/[id]/ playoffs/[league]/
      teams/ roster/ schedule/ account/
  lib/
    supabase/client.ts      Browser Supabase client
    supabase/server.ts      Server Supabase client (@supabase/ssr)
    auth.ts                 Zustand auth store (signIn/signUp/signInWithGoogle/signInWithGithub/
                            signOut); loads profile+follows+settings on login, pushes changes back
    store.ts                Zustand preferences store (who you follow) + useHasHydrated
    settings.ts             Zustand settings store + AppSettings + accent presets + applySettings()
    sync.ts                 Maps follows + settings ⇄ Postgres rows (load/push)
    espn/                   Server-only ESPN integration:
      client.ts             fetch wrapper (8s timeout, retry-once, caching)
      endpoints.ts          URL builders
      raw.ts                Raw ESPN response types
      normalize.ts          Defensive normalizers → lib/types shapes (incl. odds, conceded)
      bracket.ts            Playoff bracket normalization
    leagues.ts              LEAGUES/SPORTS config, inSeason flags, standings columns, ordering
    types.ts                Normalized domain models (Game, TeamCard, Player, OddsLine, etc.)
    data.ts                 Client data facade → calls /api/* (or mock when NEXT_PUBLIC_USE_MOCK)
    data.mock.ts / mock.ts  Offline demo dataset
    queries.ts              React Query hooks (useScoreboard, useTeamSlate, useTeamCard, ...)
    catalog.ts              Catalog (team/player picker) types
    bracket-layout.ts       Bracket geometry
    utils.ts                Misc helpers
    __tests__/              Vitest unit tests
  components/
    brand/Wordmark.tsx      Logo (stadium image via next/image)
    dashboard/              AppHeader, Dashboard, ScoreboardStrip, GameCard, TeamCardView,
                            PlayerCardView, StandingsCard, SeasonTrendCard, TeamStatCards,
                            Section, LeagueFilter, MatchupCard, Bracket, BracketModal,
                            ScheduleModal, AccountMenu
    setup/                  SetupFlow, TeamPicker, PlayerPicker, CheckMark
    system/                 AuthBridge (boots auth), ThemeController (applies settings to <html>)
    ui/                     Card, Badge, Modal, Skeleton, Sparkline, States, TeamLogo, Headshot,
                            SearchInput
supabase/migrations/        SQL schema + RLS (applied manually)
docs/                       Design specs (e.g. playoff bracket)
public/                     Static assets (logo, etc.)
.github/                    CI workflow + README banner
```

---

## 5. How it works (data flow)

```
 Browser ─▶ /api/* route handlers (server) ─▶ ESPN public endpoints ─▶ normalizer ─▶ UI
 Accounts ─▶ Supabase Auth (cookies, @supabase/ssr) ─▶ Postgres + RLS ◀─ follows & settings
```

- **The browser never calls ESPN directly.** Every surface is cached server-side
  (scoreboard ~20s · team/standings/player ~5m · teams/rosters ~24h), and the client polls
  **only while a game is actually live** (`NEXT_PUBLIC_LIVE_POLL_MS`, default 30s, via
  `useScoreboard`'s `refetchInterval` gated on `hasLiveGame`).
- **Normalizers are defensive:** an upstream ESPN field change degrades to a placeholder instead
  of crashing.
- **Key ESPN quirk:** the `/scoreboard` endpoint returns **only today's games**. To show a
  team's *next* game days out, `useTeamSlate` (in `src/lib/queries.ts`) merges live/today games
  from the scoreboard with **future games from each followed team's full-season schedule**,
  dedupes by id, and sorts chronologically. This is why "Live & Upcoming" correctly orders games
  across leagues with different season calendars (the bug where "Braves had games before the NFL
  season" came from relying on the scoreboard alone).
- **Theming:** the app is almost entirely driven by semantic OKLCH tokens (`--color-bg`,
  `--color-surface`, `--color-ink`, `--color-primary`, …). `applySettings()` (in `settings.ts`,
  applied by `ThemeController`) writes CSS vars + `data-*` attributes (e.g.
  `data-appearance="light|dark"`) onto `<html>`. Light vs. dark is purely a token override;
  accents are presets. This is why new themes are cheap.

### Auth / routing flow
1. `/` marketing homepage → "Log in" / "Sign up" → `/login` (sign-up via `?mode=signup`).
2. After auth → `/dashboard`. The dashboard is gated: unauthenticated → `/login`; authenticated
   but not onboarded → `/setup`.
3. **Security behavior:** in the dashboard header, the **Home button logs you out** — it calls
   `signOut()` then `router.replace("/")` (see `AppHeader.tsx`). This is intentional ("when I
   click home I want it to log me out, for security"). The Dashboard link was removed from the
   homepage nav for the same reason.

---

## 6. Local development

```bash
npm install
cp .env.example .env.local      # add the two public Supabase values
npm run dev                     # http://localhost:3000
```

```bash
npm run build && npm run start  # production build
npm run lint                    # ESLint
npx tsc --noEmit                # type-check
npm test                        # Vitest
```

### Environment variables
ESPN needs **no key**. Accounts need Supabase.

| Variable | Purpose | Required |
| --- | --- | :---: |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS-guarded) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — used by `DELETE /api/account` | — |
| `NEXT_PUBLIC_LIVE_POLL_MS` | Live-game refresh cadence | `30000` |
| `NEXT_PUBLIC_USE_MOCK` | Run fully offline on the demo dataset | `false` |
| `ESPN_SITE_API` / `ESPN_STANDINGS_API` / `ESPN_WEB_API` | ESPN base URLs (override only if proxying) | — |

For local dev, copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the
Supabase dashboard (Project Settings → API) into `.env.local`. Set `NEXT_PUBLIC_USE_MOCK=true`
to work with no network.

---

## 7. Feature history (chronological)

Built as a sequence of small, single-purpose PRs (each squash-merged to `main`):

1. **#1** Local-first login, sessions, customization
2. **#2** Unit tests + CI gate
3. **#3** Vercel Analytics + Speed Insights
4. **#4** Move accounts + follows + settings to Supabase (Auth, Postgres, RLS)
5. **#7** Stunning README + custom banner (after a refresh/revert round-trip, #5/#6)
6. **#8** Playoff bracket — live ESPN data
7. **#9** Greet by display name + animated password reveal
8. **#11** "Continue with Google" (Apple, #10, was closed/abandoned)
9. **#12** Add NBA / basketball
10. **#13** Basketball avatar emoji + declutter settings
11. **#14** "Continue with GitHub"
12. **#15** Marketing homepage; route dashboard to `/dashboard`
13. **#16** Remove Man City from homepage favorites
14. **#17** Homepage: stadium logo, lighter-cobalt brand, **drop all soccer/EPL**
15. **#18** Back-to-home button on dashboard + login
16. **#19** **Light cobalt theme** matching homepage (dark preserved as a setting). (Paper
    Shaders were tried here to fill space, then removed at the maintainer's request.)
17. **#20** Betting odds on upcoming games (sourced from ESPN's existing
    `competitions[].odds[]` — no new API needed)
18. **#21** Supabase linter fixes — **CLOSED, not merged** (see §3; not in repo)
19. **#22** Season-stats cards (`TeamStatCards`) + my-teams chronological Live & Upcoming
    (`useTeamSlate`). Note: season stats are shown as **separate cards**, not added to the trend
    chart — the maintainer explicitly wanted cards, not more graph overlays.
20. **#23** Home button logs out; drop Dashboard link from homepage nav

---

## 8. How the maintainer wants PRs handled

These are firm working rules (some are persisted across sessions):

- **Always open a PR.** After making a code change, open a PR by default — don't wait to be asked.
- **Never merge without explicit say-so.** Open the PR and report it; the maintainer merges.
- **Always include the Vercel preview URL** in the PR body.
- **Authorship must be `germanndarian`**, never `ia24a-germannd`. Verify the commit/PR author.
- **End commit messages with:**
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```
- **End PR bodies with:**
  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  ```
- **Branch fresh off `origin/main` for every change.** PRs are squash-merged and their branches
  auto-deleted, so never reuse a merged branch name (doing so re-creates a stale remote branch).
  Pull/fetch `origin/main` first, branch, commit, push, open PR.
- **Keep PRs small and single-purpose**, matching the existing history.
- **Quality gate before opening a PR:** run `npm run lint`, `npx tsc --noEmit`, `npm test`, and
  `npm run build` — `main` is protected and nothing merges red.

---

## 9. Conventions & gotchas

- **Read `node_modules/next/dist/docs/` before writing Next.js code** (modified Next.js — §2).
- **Match surrounding code style** — comment density, naming, and idioms vary by file; this repo
  favors a brief explanatory comment block at the top of non-trivial modules.
- **Tokens over hardcoded colors.** Style via the OKLCH semantic tokens so theming keeps working;
  the only hardcoded colors are team-color fallbacks and scrims.
- **React 19 / hooks purity:** don't call `Date.now()` (or other impure reads) directly in
  render — seed with `useState(() => Date.now())` (see `useTeamSlate`). Don't set state in an
  effect to read URL params — read `useSearchParams()` and seed `useState`, wrapping in
  `<Suspense>` (see `login/page.tsx`).
- **ESPN scoreboard = today only.** Use schedule endpoints for future games (§5).
- **Supabase migrations are manual** — adding a column/policy means writing a new
  `supabase/migrations/000N_*.sql` *and* telling the maintainer to run it in the SQL Editor
  before the dependent code deploys.
- **`inSeason` (in `leagues.ts`)** drives whether a league shows live data or a "season hasn't
  started" state. As of mid-2026: MLB/NHL/NBA in season; NFL/NCAAF off-season.
