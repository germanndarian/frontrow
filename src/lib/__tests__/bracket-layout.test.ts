import { describe, it, expect } from "vitest";
import { layoutBracket, CARD_W } from "@/lib/bracket-layout";
import type { PlayoffBracket, PlayoffMatchup, PlayoffSide } from "@/lib/types";

function s(teamId: string, score: number, winner = false): PlayoffSide {
  return { teamId, abbreviation: teamId, displayName: teamId, logo: "", color: "#000", score, winner };
}
function m(
  id: string,
  round: number,
  home: PlayoffSide,
  away: PlayoffSide,
  next: string | null,
  winnerTeamId: string | null,
): PlayoffMatchup {
  return { id, round, format: "series", bestOf: 7, state: "post", home, away, summary: "", winnerTeamId, nextMatchupId: next };
}

const bracket: PlayoffBracket = {
  league: "nhl",
  name: "Stanley Cup Playoffs",
  rounds: [
    {
      id: "r0",
      name: "1st Round",
      matchups: [
        m("a", 0, s("BOS", 4, true), s("TOR", 1), "final", "BOS"),
        m("b", 0, s("FLA", 4, true), s("TBL", 0), "final", "FLA"),
      ],
    },
    {
      id: "r1",
      name: "Final",
      matchups: [m("final", 1, s("BOS", 2), s("FLA", 1), null, null)],
    },
  ],
};

describe("layoutBracket", () => {
  it("places a card per matchup, columns by round", () => {
    const l = layoutBracket(bracket);
    expect(l.cards).toHaveLength(3);
    expect(l.cards.find((c) => c.matchup.id === "a")!.x).toBe(0);
    expect(l.cards.find((c) => c.matchup.id === "final")!.x).toBeGreaterThan(CARD_W);
  });

  it("draws a connector for each matchup that feeds a next round", () => {
    const l = layoutBracket(bracket);
    // a -> final and b -> final
    expect(l.connectors).toHaveLength(2);
    expect(l.connectors.every((c) => c.d.startsWith("M"))).toBe(true);
  });

  it("highlights only the followed team's path", () => {
    const l = layoutBracket(bracket, "BOS");
    const onPathCards = l.cards.filter((c) => c.onPath).map((c) => c.matchup.id).sort();
    expect(onPathCards).toEqual(["a", "final"]);
    // exactly one connector (a -> final) is on the BOS path
    expect(l.connectors.filter((c) => c.onPath)).toHaveLength(1);
  });

  it("centers the final between its two feeders", () => {
    const l = layoutBracket(bracket);
    const a = l.cards.find((c) => c.matchup.id === "a")!;
    const b = l.cards.find((c) => c.matchup.id === "b")!;
    const f = l.cards.find((c) => c.matchup.id === "final")!;
    expect(f.y).toBeCloseTo((a.y + b.y) / 2, 0);
  });
});
