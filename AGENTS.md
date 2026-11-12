<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontrow

A personal sports dashboard that shows only the teams and players you follow.
It ships as a website and a native iPhone app. Read the project note first when
you can reach it: `~/Documents/Projects/personal-os/projects/Frontrow/Frontrow.md`
(the long version of everything below is in `Frontrow project guide.md` next to it).

## Stack

- Web: Next.js 16 (modified, see above), React 19, Tailwind v4 with OKLCH tokens,
  TanStack Query, Zustand, Supabase (auth + Postgres with RLS), ESPN data through our `/api/*` routes.
- Native: SwiftUI in `apple/` (XcodeGen from `apple/project.yml`, widgets, Live Activity).

## Commands

```bash
npm run lint                      # ESLint
npx tsc --noEmit                  # types
npm test                          # Vitest, all unit tests
npx vitest run src/lib/__tests__/window.test.ts   # one Vitest file
npm run e2e                       # Playwright, projects app + mobile (Chromium + WebKit), demo data
npm run e2e:all                   # every Playwright project, upstream included
npm run e2e:report                # open the last HTML report
npm run e2e:upstream              # calls ESPN for real; not in the gate
npm run build                     # production build
npm run native:gen                # xcodegen generate (after editing project.yml or adding files)
npm run native:open               # open apple/Frontrow.xcodeproj
npm run native:build              # xcodebuild build, iPhone 17 Pro simulator
npm run native:test               # xcodebuild UI tests
```

Keep logs short:

- `npm run lint 2>&1 | tail -40`, `npx tsc --noEmit 2>&1 | head -40`, `npm run build 2>&1 | tail -40`
- `npm test -- --reporter=dot 2>&1 | tail -40`
- `npm run e2e -- --reporter=line 2>&1 | tail -60`; one spec: `npm run e2e -- e2e/week.spec.ts --reporter=line`
- `npm run native:build 2>&1 | grep -E "error:|BUILD"`
- Playwright reuses whatever is on port 3100; if a stale server sits there: `lsof -ti tcp:3100 | xargs kill`.

## Layout

- `src/app/`: routes. `page.tsx` homepage, `dashboard/`, `login/`, `setup/` (onboarding), `settings/`, `auth/` (callback), `app/`, `api/*` (server route handlers: ESPN proxy + account), `globals.css` (OKLCH tokens), `home.css`.
- `src/components/`: UI by area: `brand/ dashboard/ mobile/ settings/ setup/ system/ ui/`.
- `src/lib/`: logic and state. `clock.ts` (time), `auth.ts`/`store.ts`/`settings.ts` (Zustand), `sync.ts` (follows and settings to Postgres), `queries.ts` (TanStack hooks), `leagues.ts`/`seasons.ts`, `week.ts`, `mock.ts`/`data.mock.ts` (demo data).
- `src/lib/espn/`: server-only ESPN integration: `client.ts`, `endpoints.ts`, `raw.ts`, `normalize.ts`, `bracket.ts`, `window.ts`, and more.
- `src/lib/supabase/`: browser and server clients. `src/lib/__tests__/`, `src/lib/espn/__tests__/`: Vitest. `src/test/setup.ts`: Vitest setup.
- `e2e/`: Playwright specs and `helpers.ts`. `playwright.config.ts` defines the projects.
- `supabase/migrations/`: numbered SQL, run by hand.
- `apple/`: `Frontrow/` app, `FrontrowWidgets/` widgets + Live Activity, `FrontrowUITests/`, `project.yml`.
- `capacitor/www/`: web shell for the Capacitor wrapper.
- `.github/`: `workflows/` (ci, release-notes, upstream, agents), `scripts/` (release notes), PR template.

## Conventions and gotchas

- Read `node_modules/next/dist/docs/` before writing Next.js code.
- Match the surrounding code. Non-trivial modules start with a short explanatory comment block.
- Style with the OKLCH semantic tokens in `src/app/globals.css`, never hardcoded colours (only team-colour fallbacks and scrims are hardcoded).
- Read the time from `src/lib/clock.ts`, not `Date.now()`: demo mode runs on the demo evening's clock (7:30 PM ET, Fri 5 June 2026). Weeks, countdowns and seasons depend on it.
- Hooks purity (React 19): don't call `now()` in render, seed `useState(now)`. Read URL params with `useSearchParams()` inside `<Suspense>`, not by setting state in an effect (see `login/page.tsx`).
- The browser never calls ESPN; it calls `/api/*`. ESPN `/scoreboard` returns only today unless given `dates`.
- ESPN's `dates=` takes a day or a month, never a range (`dates=20260914-20260920` now returns 400). Ask for the months a window touches (`dates=202609&limit=400`, the limit is load-bearing: a month caps at 100 events without it) and slice with `src/lib/espn/window.ts` on the US Eastern day, not UTC.
- ESPN normalizers are defensive: an upstream field change must degrade to a placeholder, never crash.
- `inSeason` (`leagues.ts`) comes from the date via `seasons.ts`; nothing to update by hand when a season starts.
- Supabase migrations are manual: write `supabase/migrations/000N_*.sql` and tell the maintainer to run it in the SQL Editor before the dependent code deploys.
- Deliberate, don't undo: soccer/EPL is gone; the dashboard's Home button signs you out and the homepage has no Dashboard link (a shared screen must never hand over someone's account); season stats are separate cards, not more lines on the trend chart.
- Unit and e2e tests are hermetic (no ESPN, no Supabase). Only `e2e:upstream` calls ESPN. It stays out of the merge gate and its schedule is paused: it runs by hand, or uncomment the `schedule` block in `.github/workflows/upstream.yml`.
- e2e gotchas: the browser tests run on the demo dataset (`NEXT_PUBLIC_USE_MOCK=true`) with a Supabase URL that points nowhere and get past the auth gate with guest mode (a real button on `/login`). Guest mode is in memory, so `page.goto` after signing in silently signs you out: navigate by clicking. Onboarding keeps all four steps mounted, so scope locators to what is visible. `e2e/helpers.ts` covers both. The mock build writes to `.next-e2e`, so it never clobbers `.next`. Playwright pins `en-US` and New York time.
- No secrets in the repo. ESPN needs no key; Supabase needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (see `.env.example`).

## Skills

Task playbooks in `.claude/skills/`: `espn-data`, `supabase-migration`, `release-notes`, `native-ios`.

## Done means

All five pass: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run e2e`, `npm run build`.
`main` is protected; nothing merges red. Native changes also need `npm run native:build`.
