import { beforeEach, describe, it, expect } from "vitest";
import { usePins } from "@/lib/pins";
import type { Game } from "@/lib/types";

function game(id: string, state: Game["state"]): Game {
  const side = { teamId: id, abbreviation: id, displayName: id, shortName: id, logo: "", color: "#000000", score: null, record: null, winner: false };
  return { id, league: "mlb", state, statusDetail: "", shortDetail: "", date: "", home: side, away: side };
}

describe("pins", () => {
  beforeEach(() => {
    usePins.setState({ ids: [] });
    localStorage.clear();
  });

  it("pins a game and unpins it again", () => {
    usePins.getState().toggle("401");
    expect(usePins.getState().ids).toEqual(["401"]);
    usePins.getState().toggle("401");
    expect(usePins.getState().ids).toEqual([]);
  });

  it("keeps them in this browser", () => {
    usePins.getState().toggle("401");
    expect(JSON.parse(localStorage.getItem("frontrow.pinnedGames") ?? "{}").state.ids).toEqual(["401"]);
  });

  it("lets a game go once a board shows it final, and keeps the rest", () => {
    usePins.getState().toggle("done");
    usePins.getState().toggle("live");
    usePins.getState().forgetFinished([game("done", "post"), game("live", "in"), game("other", "post")]);
    expect(usePins.getState().ids).toEqual(["live"]);
  });

  it("changes nothing when none of the pinned games has finished", () => {
    usePins.getState().toggle("live");
    const before = usePins.getState();
    usePins.getState().forgetFinished([game("live", "in")]);
    expect(usePins.getState()).toBe(before);
  });
});
