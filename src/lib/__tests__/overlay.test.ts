import { describe, it, expect } from "vitest";
import { includesToday, overlayFresh } from "@/lib/espn/overlay";
import type { Game, GameSide } from "@/lib/types";

function side(abbr: string, score: number | null): GameSide {
  return {
    teamId: abbr,
    abbreviation: abbr,
    displayName: abbr,
    shortName: abbr,
    logo: "",
    color: "#000000",
    score,
    record: null,
    winner: false,
  };
}

function game(id: string, state: Game["state"], home: number | null, away: number | null): Game {
  return {
    id,
    league: "nfl",
    state,
    statusDetail: state === "in" ? "2nd Quarter" : "Scheduled",
    shortDetail: state === "in" ? "2nd · 07:34" : "1:00 PM",
    date: "2026-09-13T17:00:00Z",
    home: side("DAL", home),
    away: side("PHI", away),
  };
}

describe("overlayFresh", () => {
  it("takes the fresher copy of a game both boards carry", () => {
    const slate = [game("1", "pre", null, null), game("2", "in", 7, 3)];
    const fresh = [game("2", "in", 21, 10)];

    const merged = overlayFresh(slate, fresh);
    expect(merged.map((g) => g.home.score)).toEqual([null, 21]);
    expect(merged).toHaveLength(2);
  });

  it("keeps the games the fresher board says nothing about", () => {
    const tuesday = game("9", "post", 4, 1);
    const merged = overlayFresh([tuesday, game("2", "in", 7, 3)], [game("2", "in", 21, 10)]);
    expect(merged[0]).toBe(tuesday);
  });

  it("holds the slate's own order", () => {
    const slate = [game("1", "in", 0, 0), game("2", "in", 0, 0), game("3", "in", 0, 0)];
    const merged = overlayFresh(slate, [game("3", "in", 9, 9), game("1", "in", 5, 5)]);
    expect(merged.map((g) => g.id)).toEqual(["1", "2", "3"]);
  });

  it("never adds a game the window didn't ask for", () => {
    // Today's board reaches a caller looking at next week; none of it is theirs.
    const merged = overlayFresh([game("1", "pre", null, null)], [game("77", "in", 14, 0)]);
    expect(merged.map((g) => g.id)).toEqual(["1"]);
  });

  it("leaves the slate alone when there's nothing fresher", () => {
    const slate = [game("1", "in", 7, 3)];
    expect(overlayFresh(slate, [])).toBe(slate);
  });
});

describe("includesToday", () => {
  const now = new Date("2026-09-13T12:00:00Z");

  it("takes a week that holds today", () => {
    expect(includesToday("20260907-20260913", now)).toBe(true);
    expect(includesToday("20260913-20260919", now)).toBe(true);
    expect(includesToday("20260910-20260916", now)).toBe(true);
  });

  it("takes a single day", () => {
    expect(includesToday("20260913", now)).toBe(true);
  });

  it("allows a day either side, for a device whose calendar isn't ours", () => {
    // A phone hours ahead of this server asks for a window starting tomorrow.
    expect(includesToday("20260914-20260920", now)).toBe(true);
    expect(includesToday("20260906-20260912", now)).toBe(true);
  });

  it("turns down a window today can't reach", () => {
    expect(includesToday("20260830-20260905", now)).toBe(false);
    expect(includesToday("20260921-20260927", now)).toBe(false);
    expect(includesToday("20251101", now)).toBe(false);
  });
});
