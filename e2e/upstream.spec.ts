import { test, expect } from "@playwright/test";

/* The contract with ESPN.

   Every other test in this folder runs on the bundled demo dataset and proves
   our code works. None of them can fail when ESPN changes, because none of
   them call it — which is exactly how the September 2026 outage got out: 137
   unit tests passed while the iOS Scores tab was dead, because the thing that
   moved was a third party's API.

   These call ESPN for real, through our own route handlers. They are NOT part
   of the merge gate: someone else's outage must not block a release. They run
   on a schedule instead, where a failure means "the contract moved, go look",
   not "this pull request is bad".

   The route handlers ignore NEXT_PUBLIC_USE_MOCK — that flag only swaps the
   client's data source — so these hit the live path even on the mock build. */

/** The Sunday-to-Saturday window around today, as the app builds it. */
function thisWeek(): string {
  const stamp = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${stamp(start)}-${stamp(end)}`;
}

const LEAGUES = ["mlb", "nfl", "nba", "nhl", "college-football"] as const;

test.describe("ESPN contract", () => {
  test("today's board comes back for every league", async ({ request }) => {
    const res = await request.get(`/api/scoreboard?leagues=${LEAGUES.join(",")}`);
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("a week comes back — the request that broke in September 2026", async ({ request }) => {
    // The iOS Scores tab always asks for a week. When ESPN stopped answering
    // date ranges this 502'd for every league and the tab showed
    // "Couldn't reach the scoreboard". Nothing offline could have caught it.
    const res = await request.get(
      `/api/scoreboard?leagues=${LEAGUES.join(",")}&dates=${thisWeek()}`,
    );
    expect(res.status()).toBe(200);

    const games = await res.json();
    expect(Array.isArray(games)).toBe(true);
    for (const game of games.slice(0, 5)) {
      expect(game).toHaveProperty("id");
      expect(game).toHaveProperty("league");
      expect(game).toHaveProperty("home.abbreviation");
      expect(game).toHaveProperty("away.abbreviation");
      expect(["pre", "in", "post"]).toContain(game.state);
    }
  });

  test("a week is not silently empty for a league in season", async ({ request }) => {
    // A 200 with zero games is what a broken date filter looks like from the
    // outside, so the in-season leagues have to actually carry a slate.
    const res = await request.get(`/api/scoreboard?leagues=${LEAGUES.join(",")}&dates=${thisWeek()}`);
    const games = await res.json();
    expect(games.length).toBeGreaterThan(0);
  });

  test("a month is still the shape ESPN answers", async ({ request }) => {
    // Our week fetch is built on month queries with a raised limit. If ESPN
    // caps or drops either, the week quietly loses games.
    const month = new Date().toISOString().slice(0, 7).replace("-", "");
    const res = await request.get(
      `https://site.web.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${month}&limit=400`,
      { headers: { "user-agent": "frontrow/1.0 (+https://github.com/germanndarian/frontrow)" } },
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Without limit=400 this comes back capped at 100.
    expect(Array.isArray(body.events)).toBe(true);
  });

  test("standings, teams and the bracket all answer", async ({ request }) => {
    for (const league of ["mlb", "nhl"]) {
      expect((await request.get(`/api/standings/${league}`)).status()).toBe(200);
      expect((await request.get(`/api/playoffs/${league}`)).status()).toBe(200);
    }
    expect((await request.get("/api/teams?league=mlb")).status()).toBe(200);
  });
});

test.describe("route handling", () => {
  test("an unknown league is turned down, not passed upstream", async ({ request }) => {
    const res = await request.get("/api/playoffs/quidditch");
    expect(res.status()).toBe(400);
  });

  test("a traversal in an id is rejected", async ({ request }) => {
    // These ids are spliced into an upstream URL and a cache key; `../` used to
    // reach other ESPN paths (fixed in the September 2026 security audit).
    const res = await request.get("/api/team/..%2F..%2Fetc?league=mlb");
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("an empty league list is an empty board, not an error", async ({ request }) => {
    const res = await request.get("/api/scoreboard?leagues=");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
