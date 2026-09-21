import { describe, it, expect } from "vitest";
import {
  boardGroups,
  emptyBoard,
  filterLeague,
  gameFoot,
  groupCount,
  groupGames,
  isFollowed,
  isLeagueView,
  mergeSlate,
  visibleGames,
  weekNote,
  whenLabel,
} from "@/lib/scores";
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

/* ── The dashboard's week of games ───────────────────────────────────── */

describe("visibleGames", () => {
  const followed = new Set(["mlb:Hmine"]);
  const mine = game("mine", "in", "mlb");
  const theirs = game("theirs", "in", "mlb");
  const hockey = game("hockey", "pre", "nhl");
  const all = [mine, theirs, hockey];

  it("shows only your teams' games under All", () => {
    expect(visibleGames(all, "all", followed).map((g) => g.id)).toEqual(["mine"]);
  });

  it("shows a league in full once it's picked", () => {
    expect(visibleGames(all, "mlb", followed).map((g) => g.id)).toEqual(["mine", "theirs"]);
  });

  it("shows everything under All when nothing is followed yet", () => {
    expect(visibleGames(all, "all", new Set())).toHaveLength(3);
  });
});

describe("boardGroups", () => {
  const followed = new Set(["mlb:Hmine"]);
  const early = game("early", "pre", "mlb", { date: "2026-09-21T17:00:00Z" });
  const mine = game("mine", "pre", "mlb", { date: "2026-09-22T23:00:00Z" });
  const late = game("late", "pre", "mlb", { date: "2026-09-23T23:00:00Z" });
  const live = game("live", "in", "mlb");
  const done = game("done", "post", "mlb");

  it("rows up live, upcoming and results, and drops an empty row", () => {
    const groups = boardGroups([done, early, live], { filter: "mlb", followed });
    expect(groups.map((g) => g.title)).toEqual(["LIVE NOW", "UPCOMING", "RESULTS"]);
    expect(boardGroups([early], { filter: "mlb", followed }).map((g) => g.title)).toEqual(["UPCOMING"]);
  });

  it("puts your games first, then goes by start time", () => {
    const [upcoming] = boardGroups([late, mine, early], { filter: "mlb", followed });
    expect(upcoming.games.map((g) => g.id)).toEqual(["mine", "early", "late"]);
    expect(upcoming.yours).toBe(1);
  });

  it("lifts a pinned game to the front of its own row, in a league's view", () => {
    const pinned = new Set(["late", "live"]);
    const groups = boardGroups([late, mine, early, live], { filter: "mlb", followed, pinned });
    expect(groups[0].games.map((g) => g.id)).toEqual(["live"]);
    expect(groups[1].games.map((g) => g.id)).toEqual(["late", "mine", "early"]);
  });

  it("lets a pin do nothing under All", () => {
    const [upcoming] = boardGroups([late, mine, early], { filter: "all", followed, pinned: new Set(["late"]) });
    expect(upcoming.games.map((g) => g.id)).toEqual(["mine", "early", "late"]);
  });

  it("counts yours only in a league's view", () => {
    const [upcoming] = boardGroups([late, mine, early], { filter: "mlb", followed });
    expect(groupCount(upcoming, "mlb")).toBe("3 · 1 yours");
    expect(groupCount(upcoming, "all")).toBe("3");
    expect(isLeagueView("all")).toBe(false);
    expect(isLeagueView("nfl")).toBe(true);
  });
});

describe("weekNote", () => {
  it("says where the season is, for the leagues that count in weeks", () => {
    const games = [
      game("a", "pre", "college-football", { week: 4 }),
      game("b", "in", "nfl", { week: 2 }),
      game("c", "pre", "nfl", { week: 3 }),
      game("d", "pre", "mlb"),
    ];
    expect(weekNote(games)).toBe("NFL Week 3 · NCAAF Week 4");
  });

  it("is nothing without a weekly league in view", () => {
    expect(weekNote([game("d", "pre", "mlb")])).toBeNull();
  });
});

describe("emptyBoard", () => {
  it("tells you your teams are off, and where to look instead", () => {
    const empty = emptyBoard("all", true, "Sep 21 – 27");
    expect(empty.title).toBe("None of your teams play");
    expect(empty.body).toBe("Your teams have no games in Sep 21 – 27. Pick a league to see everything that's on.");
  });

  it("says a league has nothing on", () => {
    expect(emptyBoard("nhl", true, "Sep 21 – 27").body).toBe("No NHL games in Sep 21 – 27.");
    expect(emptyBoard("all", false, "Sep 21 – 27").title).toBe("Nothing on the slate");
  });
});
