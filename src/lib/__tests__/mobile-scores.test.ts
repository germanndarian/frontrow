import { describe, it, expect } from "vitest";
import { filterLeague, gameFoot, groupGames, isFollowed, mergeSlate, whenLabel } from "@/lib/mobile-scores";
import type { Game, GameSide } from "@/lib/types";

function side(teamId: string): GameSide {
  return { teamId, abbreviation: teamId, displayName: teamId, shortName: teamId, logo: "", color: "#000", score: null, record: null, winner: false };
}
function game(id: string, state: Game["state"], league: Game["league"] = "mlb", extra: Partial<Game> = {}): Game {
  return { id, league, state, statusDetail: "", shortDetail: "", date: "2026-09-10T20:20:00Z", home: side("H" + id), away: side("A" + id), ...extra };
}

describe("mergeSlate", () => {
  it("keeps slate order first and dedupes by id", () => {
    const out = mergeSlate([game("1", "pre"), game("2", "in")], [game("2", "in"), game("3", "post")]);
    expect(out.map((g) => g.id)).toEqual(["1", "2", "3"]);
  });
});

describe("groupGames", () => {
  it("buckets live, upcoming and results and drops empty buckets", () => {
    const groups = groupGames([game("a", "post"), game("b", "in"), game("c", "in")]);
    expect(groups.map((g) => [g.title, g.games.length])).toEqual([["LIVE NOW", 2], ["RESULTS", 1]]);
  });
});

describe("filterLeague / isFollowed", () => {
  it("filters by league and detects followed sides", () => {
    const games = [game("m", "pre", "mlb"), game("n", "pre", "nhl")];
    expect(filterLeague(games, "nhl").map((g) => g.id)).toEqual(["n"]);
    expect(filterLeague(games, "all")).toHaveLength(2);
    expect(isFollowed(games[0], new Set(["mlb:Hm"]))).toBe(true);
    expect(isFollowed(games[0], new Set(["nhl:Hm"]))).toBe(false);
  });
});

describe("whenLabel", () => {
  const now = new Date("2026-09-10T12:00:00");
  it("says Today / Tomorrow / a date", () => {
    expect(whenLabel("2026-09-10T20:20:00", now)).toMatch(/^Today · /);
    expect(whenLabel("2026-09-11T13:05:00", now)).toMatch(/^Tomorrow · /);
    expect(whenLabel("2026-10-02T13:05:00", now)).toMatch(/^Oct 2 · /);
  });
  it("is empty for garbage", () => {
    expect(whenLabel("nope", now)).toBe("");
  });
});

describe("gameFoot", () => {
  it("prefers the last play while live, odds when upcoming, venue when final", () => {
    expect(gameFoot(game("l", "in", "mlb", { shortDetail: "Bot 7th", lastPlay: "Soto singles" }))).toEqual({ left: "Bot 7th", right: "Soto singles" });
    const pre = gameFoot(game("p", "pre", "mlb", { odds: { details: "MIL -145", overUnder: 8.5, provider: "x" }, broadcast: "FS1" }), new Date("2026-09-10T12:00:00"));
    expect(pre.right).toBe("MIL -145 · O/U 8.5 · FS1");
    expect(gameFoot(game("f", "post", "mlb", { shortDetail: "Final", venue: "Citizens Bank Park" }))).toEqual({ left: "Final", right: "Citizens Bank Park" });
  });
});
