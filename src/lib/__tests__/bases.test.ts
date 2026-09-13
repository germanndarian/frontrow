import { describe, it, expect } from "vitest";
import { normalizeScoreboard } from "@/lib/espn/normalize";
import type { RawScoreboard, RawSituation } from "@/lib/espn/raw";

/**
 * The situations below are real ones, read off the MLB scoreboard on the
 * afternoon of 13 September 2026: Colorado at Detroit in the top of the 6th
 * with two out and nobody on, and the Angels at Washington with the bases
 * loaded in the bottom of the 1st.
 */

const nobodyOn: RawSituation = {
  balls: 1,
  strikes: 1,
  outs: 2,
  onFirst: false,
  onSecond: false,
  onThird: false,
  pitcher: { athlete: { shortName: "J. Jobe" }, summary: "5.2 IP, ER, 2 H, 6 K, BB" },
  batter: { athlete: { shortName: "C. Carrigg" }, summary: "0-2, K" },
};

const loaded: RawSituation = {
  balls: 1,
  strikes: 2,
  outs: 1,
  onFirst: true,
  onSecond: true,
  onThird: true,
  pitcher: { athlete: { shortName: "G. Rodriguez" } },
  batter: { athlete: { shortName: "Y. Morales" } },
};

function board(situation: RawSituation | undefined, state: "pre" | "in" | "post" = "in"): RawScoreboard {
  return {
    events: [
      {
        id: "1",
        date: "2026-09-13T17:10:00Z",
        competitions: [
          {
            status: { type: { state } },
            competitors: [
              { homeAway: "home", team: { id: "19", abbreviation: "DET" } },
              { homeAway: "away", team: { id: "27", abbreviation: "COL" } },
            ],
            situation,
          },
        ],
      },
    ],
  };
}

describe("normalizeScoreboard bases", () => {
  it("carries the count, the outs and an empty diamond", () => {
    const [game] = normalizeScoreboard(board(nobodyOn), "mlb");
    expect(game.bases).toEqual({
      balls: 1,
      strikes: 1,
      outs: 2,
      onFirst: false,
      onSecond: false,
      onThird: false,
      pitcher: "J. Jobe",
      batter: "C. Carrigg",
    });
  });

  it("carries a loaded diamond", () => {
    const [game] = normalizeScoreboard(board(loaded), "mlb");
    expect(game.bases).toMatchObject({ onFirst: true, onSecond: true, onThird: true, outs: 1 });
  });

  it("gives a fresh at-bat zeroes rather than gaps", () => {
    // A 0-0 count with nobody on is a real state the tracker has to draw, and
    // a missing number would be indistinguishable from it.
    const [game] = normalizeScoreboard(board({ lastPlay: { text: "Play ball" } }), "mlb");
    expect(game.bases).toMatchObject({
      balls: 0,
      strikes: 0,
      outs: 0,
      onFirst: false,
      onSecond: false,
      onThird: false,
    });
  });

  it("leaves the names out rather than leaving them stale", () => {
    const [game] = normalizeScoreboard(board({ balls: 2, strikes: 0, outs: 0 }), "mlb");
    expect(game.bases?.pitcher).toBeUndefined();
    expect(game.bases?.batter).toBeUndefined();
  });

  it("is baseball's alone, and only while the game is on", () => {
    expect(normalizeScoreboard(board(nobodyOn, "pre"), "mlb")[0].bases).toBeUndefined();
    expect(normalizeScoreboard(board(nobodyOn, "post"), "mlb")[0].bases).toBeUndefined();
    expect(normalizeScoreboard(board(nobodyOn), "nfl")[0].bases).toBeUndefined();
  });
});
