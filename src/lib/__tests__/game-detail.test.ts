import { describe, it, expect } from "vitest";
import {
  countdownText,
  detailRows,
  hasLineScore,
  isLeading,
  periodCount,
  periodLabel,
  periodValue,
  statusLine,
  totalLabel,
} from "@/lib/game-detail";
import type { Game, GameSide } from "@/lib/types";

function side(teamId: string, extra: Partial<GameSide> = {}): GameSide {
  return { teamId, abbreviation: teamId, displayName: teamId, shortName: teamId, logo: "", color: "#000000", score: null, record: null, winner: false, ...extra };
}
function game(extra: Partial<Game> = {}): Game {
  return { id: "g", league: "mlb", state: "in", statusDetail: "", shortDetail: "", date: "2026-09-21T23:05:00Z", home: side("NYY"), away: side("BOS"), ...extra };
}

describe("line score columns", () => {
  it("draws as many periods as either side has reported", () => {
    const g = game({ home: side("NYY", { linescores: [1, 0, 0] }), away: side("BOS", { linescores: [0, 2, 0, 1] }) });
    expect(periodCount(g)).toBe(4);
    expect(hasLineScore(g)).toBe(true);
    expect(hasLineScore(game())).toBe(false);
  });

  it("keeps counting innings into extras", () => {
    expect(periodLabel("mlb", 0)).toBe("1");
    expect(periodLabel("mlb", 8)).toBe("9");
    expect(periodLabel("mlb", 10)).toBe("11");
  });

  it("calls one overtime OT and numbers the ones after it", () => {
    expect(periodLabel("nhl", 2)).toBe("3");
    expect(periodLabel("nhl", 3)).toBe("OT");
    expect(periodLabel("nba", 4)).toBe("OT");
    expect(periodLabel("nba", 5)).toBe("OT2");
    expect(periodLabel("nfl", 3)).toBe("4");
    expect(periodLabel("college-football", 6)).toBe("OT3");
  });

  it("heads the total R for baseball and T everywhere else", () => {
    expect(totalLabel("mlb")).toBe("R");
    expect(totalLabel("nhl")).toBe("T");
    expect(totalLabel("nfl")).toBe("T");
  });

  it("shows a dash, not a zero, for a period a side hasn't reached", () => {
    const home = side("PHI", { linescores: [2, 0, 0, 3, 0, 0, 1, 0] });
    expect(periodValue(home, 3)).toBe("3");
    expect(periodValue(home, 8)).toBe("–");
    expect(periodValue(side("X"), 0)).toBe("–");
  });
});

describe("countdownText", () => {
  const start = Date.UTC(2026, 8, 27, 20, 25);
  const before = (seconds: number) => start - seconds * 1000;

  it("shows as much as is left and no more", () => {
    expect(countdownText(start, before(2 * 86_400 + 4 * 3600 + 31 * 60 + 9))).toBe("2d 04:31:09");
    expect(countdownText(start, before(4 * 3600 + 31 * 60 + 9))).toBe("04:31:09");
    expect(countdownText(start, before(31 * 60 + 9))).toBe("31:09");
    expect(countdownText(start, before(5))).toBe("00:05");
  });

  it("says any moment once the time has come", () => {
    expect(countdownText(start, start)).toBe("Any moment");
    expect(countdownText(start, start + 60_000)).toBe("Any moment");
    expect(countdownText(Number.NaN, start)).toBe("Any moment");
  });
});

describe("statusLine", () => {
  it("is the clock while live and the final after", () => {
    expect(statusLine(game({ shortDetail: "Bot 7th" }))).toBe("Bot 7th");
    expect(statusLine(game({ shortDetail: "" }))).toBe("Live");
    expect(statusLine(game({ state: "post", shortDetail: "Final/OT" }))).toBe("Final/OT");
    expect(statusLine(game({ state: "post", shortDetail: "" }))).toBe("Final");
  });

  it("is the start time before", () => {
    expect(statusLine(game({ state: "pre" }))).toMatch(/·/);
  });
});

describe("isLeading", () => {
  it("has nobody trailing before the start, and ties lead together", () => {
    const pre = game({ state: "pre" });
    expect(isLeading(pre, pre.home)).toBe(true);
    const tied = game({ home: side("NYY", { score: 2 }), away: side("BOS", { score: 2 }) });
    expect(isLeading(tied, tied.home) && isLeading(tied, tied.away)).toBe(true);
    const ahead = game({ home: side("NYY", { score: 4 }), away: side("BOS", { score: 3 }) });
    expect(isLeading(ahead, ahead.home)).toBe(true);
    expect(isLeading(ahead, ahead.away)).toBe(false);
  });
});

describe("detailRows", () => {
  it("lists what the feed knows, in the sheet's order", () => {
    const g = game({
      state: "pre",
      venue: "AT&T Stadium",
      broadcast: "FOX",
      odds: { details: "KC -3", overUnder: 47.5 },
      statusDetail: "Sun, September 27th at 4:25 PM EDT",
    });
    expect(detailRows(g).map(([label]) => label)).toEqual(["Venue", "TV", "Line", "Over/under", "Start", "Status"]);
    expect(detailRows(g)[3]).toEqual(["Over/under", "47.5"]);
  });

  it("leads with the last play when there's no field to carry it", () => {
    const g = game({ lastPlay: "Soto singles to right", venue: "Yankee Stadium" });
    expect(detailRows(g)[0]).toEqual(["Last play", "Soto singles to right"]);
    const football = game({
      league: "nfl",
      lastPlay: "Hurts pass complete",
      field: { ballOn: 52, firstDown: 43, homeHasBall: true, isRedZone: false },
    });
    expect(detailRows(football).some(([label]) => label === "Last play")).toBe(false);
  });

  it("skips a start time it can't read", () => {
    expect(detailRows(game({ date: "" })).some(([label]) => label === "Start")).toBe(false);
  });
});
