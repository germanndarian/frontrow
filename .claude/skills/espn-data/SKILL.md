---
name: espn-data
description: Use when touching ESPN data in Frontrow, such as scoreboard, schedule, standings, roster, playoffs or player endpoints, the `dates=` parameter, `src/lib/espn/` normalizers or `window.ts`, a Scores tab that is empty or erroring, or the upstream watch (`e2e:upstream`) failing.
---

# ESPN data

The browser never calls ESPN. It calls `src/app/api/*` route handlers, which call ESPN through `src/lib/espn/` (`client.ts` fetch with 8s timeout and retry-once, `endpoints.ts` URL builders, `raw.ts` raw types, `normalize.ts` and `bracket.ts` normalizers).

## Rules

- `dates=` takes a day (`20260915`) or a month (`202609`), never a range. A range returns 400.
- For a window, request each month it touches with `&limit=400` (without the limit a month caps at 100 events), then slice with `src/lib/espn/window.ts`.
- Slice on the US Eastern day, not UTC: ESPN files a game under its Eastern date, so a UTC slice drops late games.
- `/scoreboard` without `dates` is today only.
- Normalizers must be defensive: a missing or renamed ESPN field becomes a placeholder, never a throw.
- Server-side caching: scoreboard about 20s, team/standings/player about 5m, teams/rosters about 24h. The client polls only while a game is live.
- Route handlers ignore `NEXT_PUBLIC_USE_MOCK`; demo data lives in `src/lib/mock.ts` and `data.mock.ts`.

## Steps for a change

1. Add or change the URL in `endpoints.ts`, the raw type in `raw.ts`, the mapping in `normalize.ts`.
2. Add a Vitest case in `src/lib/__tests__/normalize.test.ts` (or `window.test.ts`, `overlay.test.ts`, `src/lib/espn/__tests__/bracket.test.ts`) with a trimmed raw fixture, including one with the field missing.
3. Run `npx vitest run src/lib/__tests__/normalize.test.ts` while working, then the full gate from AGENTS.md.

## When the real ESPN seems broken

1. `npm run e2e:upstream 2>&1 | tail -60` (it builds and starts the app on port 3100; free it with `lsof -ti tcp:3100 | xargs kill`). Or `gh workflow run upstream.yml`.
2. Run it twice to rule out a blip. If it fails again, call the URL from `endpoints.ts` directly and compare with what `normalize.ts` expects.
3. Fix the normalizer or request, and pin the new shape in `e2e/upstream.spec.ts`.

The upstream watch is not in the merge gate, and its schedule is paused (manual runs only). Runbook: `~/Documents/Projects/personal-os/projects/Frontrow/Frontrow upstream watch.md`.

## Check it worked

`npm test`, and `npm run e2e:upstream` when the request shape changed.
