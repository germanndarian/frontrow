import { describe, it, expect } from "vitest";
import { normalizeBracket } from "@/lib/espn/bracket";
import type { RawScoreboard } from "@/lib/espn/raw";

/** Build a minimal playoff scoreboard event the way ESPN shapes it. */
function game(opts: {
  id: string;
  date: string;
  headline: string;
  state?: string;
  detail?: string;
  a: { id: string; abbr: string; score?: string; winner?: boolean };
  b: { id: string; abbr: string; score?: string; winner?: boolean };
  series?: { summary: string; total: number; wins: Record<string, number> };
}) {
  const team = (t: { id: string; abbr: string }) => ({
    id: t.id,
    abbreviation: t.abbr,
    displayName: t.abbr,
    color: "112233",
    logo: `https://logo/${t.abbr}.png`,
  });
  return {
    id: opts.id,
    date: opts.date,
    season: { type: 3 },
    competitions: [
      {
        status: { type: { state: opts.state ?? "post", shortDetail: opts.detail ?? "Final" } },
        notes: [{ headline: opts.headline }],
        series: opts.series && {
          summary: opts.series.summary,
          totalCompetitions: opts.series.total,
          competitors: Object.entries(opts.series.wins).map(([id, wins]) => ({ id, wins })),
        },
        competitors: [
          { id: opts.a.id, homeAway: "home", winner: opts.a.winner, score: opts.a.score, team: team(opts.a) },
          { id: opts.b.id, homeAway: "away", winner: opts.b.winner, score: opts.b.score, team: team(opts.b) },
        ],
      },
    ],
  };
}

const raw: RawScoreboard = {
  events: [
    // East 1st round, two games — latest game shows the final 4-1 series score.
    game({ id: "g1", date: "2026-04-20T00:00Z", headline: "East 1st Round - Game 1",
      a: { id: "6", abbr: "BOS" }, b: { id: "10", abbr: "TOR" },
      series: { summary: "BOS leads series 1-0", total: 7, wins: { "6": 1, "10": 0 } } }),
    game({ id: "g2", date: "2026-04-28T00:00Z", headline: "East 1st Round - Game 5",
      a: { id: "6", abbr: "BOS" }, b: { id: "10", abbr: "TOR" },
      series: { summary: "BOS wins series 4-1", total: 7, wins: { "6": 4, "10": 1 } } }),
    // West 1st round.
    game({ id: "g3", date: "2026-04-22T00:00Z", headline: "West 1st Round - Game 4",
      a: { id: "26", abbr: "FLA" }, b: { id: "20", abbr: "TBL" },
      series: { summary: "FLA wins series 4-0", total: 7, wins: { "26": 4, "20": 0 } } }),
    // Final, in progress.
    game({ id: "g4", date: "2026-06-03T00:00Z", headline: "Stanley Cup Final - Game 3",
      state: "in", detail: "3rd Period",
      a: { id: "6", abbr: "BOS" }, b: { id: "26", abbr: "FLA" },
      series: { summary: "BOS leads series 2-1", total: 7, wins: { "6": 2, "26": 1 } } }),
  ],
};

describe("normalizeBracket", () => {
  const bracket = normalizeBracket(raw, "nhl");

  it("orders rounds earliest-first and merges conferences into one round", () => {
    expect(bracket.rounds.map((r) => r.name)).toEqual(["1st Round", "Stanley Cup Final"]);
    expect(bracket.rounds[0].matchups).toHaveLength(2);
    expect(bracket.rounds[1].matchups).toHaveLength(1);
  });

  it("uses the latest game for the series score and winner", () => {
    const bos = bracket.rounds[0].matchups.find((m) => m.home.teamId === "6")!;
    expect(bos.home.score).toBe(4); // not 1 from the first game
    expect(bos.away.score).toBe(1);
    expect(bos.home.winner).toBe(true);
    expect(bos.winnerTeamId).toBe("6");
    expect(bos.bestOf).toBe(7);
  });

  it("links advancing winners to the next round", () => {
    const final = bracket.rounds[1].matchups[0];
    const r0 = bracket.rounds[0].matchups;
    expect(r0.every((m) => m.nextMatchupId === final.id)).toBe(true);
  });

  it("keeps an in-progress final without a winner", () => {
    const final = bracket.rounds[1].matchups[0];
    expect(final.state).toBe("in");
    expect(final.winnerTeamId).toBeNull();
    expect(final.summary).toContain("2-1");
  });

  it("returns an empty bracket when there are no playoff games", () => {
    const reg: RawScoreboard = {
      events: [
        {
          id: "r",
          date: "2026-06-01T00:00Z",
          season: { type: 2 },
          competitions: [
            {
              status: { type: { state: "post" } },
              competitors: [
                { id: "6", team: { id: "6", abbreviation: "BOS" } },
                { id: "10", team: { id: "10", abbreviation: "TOR" } },
              ],
            },
          ],
        },
      ],
    };
    expect(normalizeBracket(reg, "nhl").rounds).toHaveLength(0);
  });
});
