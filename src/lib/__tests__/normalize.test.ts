import { describe, it, expect } from "vitest";
import { normalizeScoreboard } from "@/lib/espn/normalize";
import type { RawLinescore, RawScoreboard } from "@/lib/espn/raw";

function event(state: "pre" | "in" | "post", odds?: unknown[]): RawScoreboard {
  return {
    events: [
      {
        id: "1",
        date: "2026-01-01T00:00:00Z",
        competitions: [
          {
            status: { type: { state } },
            competitors: [
              { homeAway: "home", team: { abbreviation: "DAL" } },
              { homeAway: "away", team: { abbreviation: "PHI" } },
            ],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            odds: odds as any,
          },
        ],
      },
    ],
  };
}

describe("normalizeScoreboard odds", () => {
  it("parses spread + over/under for an upcoming game", () => {
    const raw = event("pre", [
      { provider: { name: "ESPN BET", priority: 1 }, details: "DAL -3.5", overUnder: 45.5 },
    ]);
    const [game] = normalizeScoreboard(raw, "nfl");
    expect(game.odds).toEqual({
      details: "DAL -3.5",
      overUnder: 45.5,
      provider: "ESPN BET",
    });
  });

  it("prefers the priority-1 provider", () => {
    const raw = event("pre", [
      { provider: { name: "Other", priority: 2 }, details: "DAL -2.5", overUnder: 44 },
      { provider: { name: "ESPN BET", priority: 1 }, details: "DAL -3.5", overUnder: 45.5 },
    ]);
    const [game] = normalizeScoreboard(raw, "nfl");
    expect(game.odds?.provider).toBe("ESPN BET");
    expect(game.odds?.details).toBe("DAL -3.5");
  });

  it("omits odds when none are provided", () => {
    const [game] = normalizeScoreboard(event("pre"), "nfl");
    expect(game.odds).toBeUndefined();
  });

  it("does not attach odds to live or final games", () => {
    const live = normalizeScoreboard(
      event("in", [{ provider: { priority: 1 }, details: "DAL -3.5", overUnder: 45.5 }]),
      "nfl",
    )[0];
    const final = normalizeScoreboard(
      event("post", [{ provider: { priority: 1 }, details: "DAL -3.5", overUnder: 45.5 }]),
      "nfl",
    )[0];
    expect(live.odds).toBeUndefined();
    expect(final.odds).toBeUndefined();
  });
});

describe("normalizeScoreboard week", () => {
  function weekly(week?: number): RawScoreboard {
    return {
      events: [
        {
          id: "1",
          date: "2026-09-14T00:00:00Z",
          week: week === undefined ? undefined : { number: week },
          competitions: [
            {
              status: { type: { state: "pre" } },
              competitors: [
                { homeAway: "home", team: { abbreviation: "DAL" } },
                { homeAway: "away", team: { abbreviation: "PHI" } },
              ],
            },
          ],
        },
      ],
    };
  }

  it("carries the week for football", () => {
    expect(normalizeScoreboard(weekly(2), "nfl")[0].week).toBe(2);
    expect(normalizeScoreboard(weekly(3), "college-football")[0].week).toBe(3);
  });

  it("drops it for leagues nobody counts in weeks", () => {
    expect(normalizeScoreboard(weekly(24), "mlb")[0].week).toBeUndefined();
    expect(normalizeScoreboard(weekly(24), "nhl")[0].week).toBeUndefined();
  });

  it("is undefined when ESPN omits it", () => {
    expect(normalizeScoreboard(weekly(undefined), "nfl")[0].week).toBeUndefined();
  });
});

describe("normalizeScoreboard line scores", () => {
  function withLines(home?: RawLinescore[], away?: RawLinescore[]): RawScoreboard {
    return {
      events: [
        {
          id: "1",
          date: "2026-09-12T00:00:00Z",
          competitions: [
            {
              status: { type: { state: "post" } },
              competitors: [
                { homeAway: "home", team: { abbreviation: "SEA" }, linescores: home },
                { homeAway: "away", team: { abbreviation: "NE" }, linescores: away },
              ],
            },
          ],
        },
      ],
    };
  }

  it("carries a period-by-period column for each side", () => {
    const raw = withLines(
      [{ value: 0 }, { value: 0 }, { value: 3 }, { value: 10 }],
      [{ value: 0 }, { value: 7 }, { value: 3 }, { value: 0 }],
    );
    const [game] = normalizeScoreboard(raw, "nfl");
    expect(game.home.linescores).toEqual([0, 0, 3, 10]);
    expect(game.away.linescores).toEqual([0, 7, 3, 0]);
  });

  it("drops the column rather than pass on holes", () => {
    const [game] = normalizeScoreboard(withLines([{ value: 3 }, {}], undefined), "nfl");
    expect(game.home.linescores).toBeUndefined();
    expect(game.away.linescores).toBeUndefined();
  });
});
