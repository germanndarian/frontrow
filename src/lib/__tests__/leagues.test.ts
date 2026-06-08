import { describe, it, expect } from "vitest";
import {
  LEAGUES,
  LEAGUE_ORDER,
  SPORTS,
  leaguesForSports,
} from "@/lib/leagues";

describe("leaguesForSports", () => {
  it("maps a sport to its leagues", () => {
    expect(leaguesForSports(["baseball"])).toEqual(["mlb"]);
  });

  it("returns leagues in LEAGUE_ORDER", () => {
    expect(leaguesForSports(["football"])).toEqual(["nfl", "college-football"]);
  });

  it("returns nothing for no sports", () => {
    expect(leaguesForSports([])).toEqual([]);
  });
});

describe("league metadata", () => {
  it("lists every league exactly once in LEAGUE_ORDER", () => {
    const keys = Object.keys(LEAGUES).sort();
    expect([...LEAGUE_ORDER].sort()).toEqual(keys);
  });

  it("references a real sport for every league", () => {
    for (const id of LEAGUE_ORDER) {
      expect(SPORTS[LEAGUES[id].sport]).toBeDefined();
    }
  });
});
