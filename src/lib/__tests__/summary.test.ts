import { describe, it, expect } from "vitest";
import { normalizeSummary } from "@/lib/espn/normalize";
import type { RawSummary } from "@/lib/espn/raw";

function header(state: "pre" | "in" | "post" = "in"): RawSummary["header"] {
  return {
    id: "401",
    competitions: [
      {
        date: "2026-01-01T00:00:00Z",
        status: { type: { state, shortDetail: "3rd Quarter", detail: "3rd Quarter" } },
        competitors: [
          { homeAway: "home", team: { id: "1", abbreviation: "KC", displayName: "Kansas City Chiefs", color: "e31837" }, score: "21" },
          { homeAway: "away", team: { id: "2", abbreviation: "HOU", displayName: "Houston Texans", color: "00143f" }, score: "14" },
        ],
        broadcasts: [{ media: { shortName: "ESPN" } }],
      },
    ],
  };
}

describe("normalizeSummary — header + teams", () => {
  it("maps home/away sides, status, score and broadcast", () => {
    const g = normalizeSummary({ header: header("in") }, "nfl", "401");
    expect(g.id).toBe("401");
    expect(g.state).toBe("in");
    expect(g.home.abbreviation).toBe("KC");
    expect(g.home.score).toBe(21);
    expect(g.away.abbreviation).toBe("HOU");
    expect(g.away.score).toBe(14);
    expect(g.broadcast).toBe("ESPN");
    expect(g.home.color).toBe("#e31837");
  });

  it("falls back to the event id and a pre state when the header is empty", () => {
    const g = normalizeSummary({}, "nba", "999");
    expect(g.id).toBe("999");
    expect(g.state).toBe("pre");
    expect(g.winProbability).toEqual([]);
    expect(g.plays).toEqual([]);
    expect(g.drives).toEqual([]);
    expect(g.leaders).toEqual([]);
    expect(g.hasWinProb).toBe(false);
  });
});

describe("normalizeSummary — win probability", () => {
  it("converts home win fractions to a 0–100 indexed series", () => {
    const raw: RawSummary = {
      header: header(),
      winprobability: [
        { homeWinPercentage: 0.5 },
        { homeWinPercentage: 0.626 },
        { homeWinPercentage: 1 },
      ],
    };
    const g = normalizeSummary(raw, "nfl", "401");
    expect(g.winProbability).toEqual([
      { i: 0, home: 50 },
      { i: 1, home: 62.6 },
      { i: 2, home: 100 },
    ]);
    expect(g.hasWinProb).toBe(true);
  });

  it("clamps out-of-range values and is not 'available' with under two points", () => {
    const raw: RawSummary = {
      header: header(),
      winprobability: [{ homeWinPercentage: 1.4 }],
    };
    const g = normalizeSummary(raw, "nfl", "401");
    expect(g.winProbability[0].home).toBe(100);
    expect(g.hasWinProb).toBe(false);
  });
});

describe("normalizeSummary — scoring plays", () => {
  it("reads a dedicated scoringPlays list (football) with type + period label", () => {
    const raw: RawSummary = {
      header: header(),
      scoringPlays: [
        {
          id: "s1",
          text: "Harrison Butker 32 Yd Field Goal",
          period: { number: 1 },
          clock: { displayValue: "13:58" },
          team: { abbreviation: "KC" },
          scoringType: { abbreviation: "FG" },
          homeScore: 3,
          awayScore: 0,
        },
      ],
    };
    const g = normalizeSummary(raw, "nfl", "401");
    expect(g.scoringPlays).toHaveLength(1);
    expect(g.scoringPlays[0]).toMatchObject({
      periodLabel: "Q1",
      clock: "13:58",
      teamAbbr: "KC",
      scoreType: "FG",
      homeScore: 3,
      awayScore: 0,
    });
  });

  it("falls back to scoring-flagged plays when there's no scoringPlays list (basketball)", () => {
    const raw: RawSummary = {
      header: header(),
      plays: [
        { id: "p1", text: "Jump ball", scoringPlay: false, period: { number: 1 } },
        {
          id: "p2",
          text: "J. Williams makes 3-pt jumper",
          scoringPlay: true,
          period: { number: 1 },
          clock: { displayValue: "10:02" },
          team: { abbreviation: "OKC" },
          homeScore: 3,
          awayScore: 0,
        },
      ],
    };
    const g = normalizeSummary(raw, "nba", "401");
    expect(g.scoringPlays).toHaveLength(1);
    expect(g.scoringPlays[0].text).toContain("3-pt");
    expect(g.scoringPlays[0].periodLabel).toBe("Q1");
  });
});

describe("normalizeSummary — play-by-play feed", () => {
  it("returns plays most-recent-first and caps the list at 100", () => {
    const plays = Array.from({ length: 130 }, (_, i) => ({
      id: `p${i}`,
      sequenceNumber: String(i),
      text: `Play ${i}`,
      period: { number: 1 },
      clock: { displayValue: "1:00" },
    }));
    const g = normalizeSummary({ header: header(), plays }, "nba", "401");
    expect(g.plays).toHaveLength(100);
    // Newest (highest sequence) first.
    expect(g.plays[0].text).toBe("Play 129");
    expect(g.plays[0].seq).toBe(129);
  });

  it("labels hockey periods and overtime", () => {
    const raw: RawSummary = {
      header: header(),
      plays: [
        { id: "p1", text: "Goal", period: { number: 2 }, clock: { displayValue: "5:00" } },
        { id: "p2", text: "OT goal", period: { number: 4 }, clock: { displayValue: "1:00" } },
      ],
    };
    const g = normalizeSummary(raw, "nhl", "401");
    // p2 is newer, so it's first.
    expect(g.plays[0].periodLabel).toBe("OT");
    expect(g.plays[1].periodLabel).toBe("P2");
  });
});

describe("normalizeSummary — drives & possession (football)", () => {
  it("puts the current drive first, then previous newest-first, and flags possession", () => {
    const raw: RawSummary = {
      header: header("in"),
      drives: {
        current: { id: "d3", team: { abbreviation: "KC" }, description: "3 plays, 20 yards", displayResult: "In progress" },
        previous: [
          { id: "d1", team: { abbreviation: "HOU" }, displayResult: "Punt" },
          { id: "d2", team: { abbreviation: "KC" }, displayResult: "Touchdown", isScore: true },
        ],
      },
    };
    const g = normalizeSummary(raw, "nfl", "401");
    expect(g.drives.map((d) => d.id)).toEqual(["d3", "d2", "d1"]);
    expect(g.drives[1].isScore).toBe(true);
    expect(g.possession).toBe("KC");
  });

  it("does not report possession for a non-football sport, even with a current drive", () => {
    const raw: RawSummary = {
      header: header("in"),
      drives: { current: { id: "d1", team: { abbreviation: "OKC" } } },
    };
    const g = normalizeSummary(raw, "nba", "401");
    expect(g.possession).toBeNull();
    // NBA has no drives concept — the panel degrades to nothing.
    expect(g.drives.map((d) => d.id)).toEqual(["d1"]);
  });

  it("clears possession once the game is final", () => {
    const raw: RawSummary = {
      header: header("post"),
      drives: { current: { id: "d1", team: { abbreviation: "KC" } } },
    };
    const g = normalizeSummary(raw, "nfl", "401");
    expect(g.possession).toBeNull();
  });
});

describe("normalizeSummary — leaders", () => {
  it("flattens per-team categories to a single leader each", () => {
    const raw: RawSummary = {
      header: header(),
      leaders: [
        {
          team: { abbreviation: "OKC" },
          leaders: [
            {
              name: "points",
              displayName: "Points",
              leaders: [
                {
                  displayValue: "40",
                  summary: "40 PTS, 6 REB",
                  athlete: { displayName: "Jalen Williams", headshot: { href: "h.png" }, position: { abbreviation: "G" } },
                },
              ],
            },
            { name: "assists", displayName: "Assists", leaders: [] },
          ],
        },
      ],
    };
    const g = normalizeSummary(raw, "nba", "401");
    // The empty category is dropped (no athlete).
    expect(g.leaders).toHaveLength(1);
    expect(g.leaders[0]).toMatchObject({
      category: "Points",
      teamAbbr: "OKC",
      playerName: "Jalen Williams",
      statValue: "40",
      detail: "40 PTS, 6 REB",
      headshot: "h.png",
    });
  });
});
