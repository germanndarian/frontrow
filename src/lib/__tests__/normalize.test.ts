import { describe, it, expect } from "vitest";
import { normalizeScoreboard } from "@/lib/espn/normalize";
import type { RawScoreboard } from "@/lib/espn/raw";

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
