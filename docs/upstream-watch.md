# Upstream watch (the ESPN contract check)

**Status: schedule paused since 2026-10-12.** The workflow still exists and can
be run by hand. It just no longer runs twice a day on its own.

## What it is

Frontrow gets all of its sports data from ESPN's public, keyless endpoints.
ESPN doesn't publish or version these APIs, so they can change without warning.

Every other test in the repo is **hermetic**. The unit tests (`npm test`) and
the browser tests (`npm run e2e`) run on the bundled demo dataset and never call
ESPN. That keeps the merge gate reliable: a red run means our code broke, never
that ESPN had a bad afternoon. The catch is that none of those tests can notice
when ESPN changes.

That gap caused the **September 2026 outage**. ESPN stopped answering date-range
requests (`dates=START-END`), the iOS Scores tab went dead, and 137 unit tests
stayed green. The upstream watch was added to catch that kind of change.

## How it works

- **Workflow:** `.github/workflows/upstream.yml` ("Upstream watch").
- **Tests:** `e2e/upstream.spec.ts`, run as the Playwright `upstream` project
  (`npm run e2e:upstream`).
- It builds the app, starts it, and calls **our own route handlers**
  (`/api/scoreboard`, standings, teams, the bracket…). Those call ESPN for
  real. The route handlers ignore `NEXT_PUBLIC_USE_MOCK`, so the live path is
  exercised even on the mock build.
- What it checks:
  - today's board comes back for every league (MLB, NFL, NBA, NHL, college
    football)
  - a week comes back (the request that broke in September 2026), and it isn't
    silently empty for a league in season
  - a month still has the shape ESPN answers
  - standings, teams and the playoff bracket all answer
  - an unknown league is turned down, a `../` in an id is rejected, and an empty
    league list is an empty board rather than an error
- On CI, Playwright retries a failing test twice, so a single ESPN blip doesn't
  fail the run. Locally it doesn't retry.
- On failure it uploads the Playwright report as the `upstream-report`
  artifact, kept 14 days.
- **It is deliberately not part of the merge gate.** A failure means "ESPN's
  contract moved, go look", never "this PR is bad". A third party's outage must
  not be able to block a release.

## Run it once, by hand

From GitHub: **Actions → Upstream watch → Run workflow**.

From the terminal:

```sh
gh workflow run upstream.yml
gh run watch "$(gh run list --workflow upstream.yml --limit 1 --json databaseId -q '.[0].databaseId')"
```

Or locally, without GitHub:

```sh
npm run e2e:upstream
```

Locally, Playwright reuses whatever is already on port 3100. If a stale server
is running there, kill it first: `lsof -ti tcp:3100 | xargs kill`.

## Turn the schedule back on

1. In `.github/workflows/upstream.yml`, uncomment the `schedule` block so `on:`
   reads:

   ```yaml
   on:
     schedule:
       # Twice a day, offset off the hour to avoid the cron stampede.
       - cron: "17 7,19 * * *"
     workflow_dispatch:
   ```

   Then delete the "schedule is paused" comment above it. The cron is UTC, so
   `17 7,19` is 07:17 and 19:17 UTC. GitHub often starts scheduled runs late,
   sometimes by an hour or more. For once a day instead, use e.g.
   `"17 7 * * *"`.

2. Update the docs that mention the pause: this file's status line,
   `PROJECT_GUIDE.md` (the `e2e:upstream` paragraph in the testing section),
   `README.md` (the testing section) and the comment at the top of
   `playwright.config.ts`.

3. Open a PR (`ci: turn the upstream watch schedule back on`) and merge it.
   Schedules only run from the default branch, so nothing happens until it's
   on `main`.

4. Note: GitHub turns off scheduled workflows by itself in a repository with no
   activity for 60 days. If that ever happens, re-enable it under **Actions →
   Upstream watch → Enable workflow**, or run `gh workflow enable upstream.yml`.

## When it fails

1. Open the failed run and download the `upstream-report` artifact (or read the
   log). It names the test that broke.
2. Check whether it's a blip: run it again by hand. A second green run means
   ESPN just had a bad moment.
3. If it fails again, call the ESPN endpoint directly (the URLs are built in
   `src/lib/espn/endpoints.ts`) and compare the response with what the
   normalizers in `src/lib/espn/` expect.
4. Fix the normalizer or the request, add or adjust a test in
   `e2e/upstream.spec.ts` that pins the new shape, and open a PR as usual.
