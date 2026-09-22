import { describe, it, expect } from "vitest";
import {
  ENDZONE_SHARE,
  YARD_NUMBERS,
  ballSide,
  drivesTowardHome,
  endzoneStyle,
  fieldHeadline,
  fieldSummary,
  fieldX,
  lastPlayLine,
  redZone,
  showChains,
} from "@/lib/field-graphic";
import type { FieldSituation, Game } from "@/lib/types";

function field(extra: Partial<FieldSituation> = {}): FieldSituation {
  return { ballOn: 52, firstDown: 43, homeHasBall: true, isRedZone: false, ...extra };
}
function game(extra: Partial<Game> = {}): Game {
  const side = { teamId: "", abbreviation: "", displayName: "", shortName: "", logo: "", color: "#000000", score: 0, record: null, winner: false };
  return { id: "g", league: "nfl", state: "in", statusDetail: "", shortDetail: "", date: "", home: side, away: side, ...extra };
}

describe("fieldX", () => {
  it("puts the goal lines at the inside edges of the endzones", () => {
    const width = 340;
    expect(fieldX(0, width)).toBeCloseTo(width * ENDZONE_SHARE);
    expect(fieldX(100, width)).toBeCloseTo(width - width * ENDZONE_SHARE);
    expect(fieldX(50, width)).toBeCloseTo(width / 2);
  });

  it("paints 10–50–10 up the sideline", () => {
    expect(YARD_NUMBERS.map((n) => n.label)).toEqual([10, 20, 30, 40, 50, 40, 30, 20, 10]);
  });
});

describe("which way the offense is going", () => {
  it("has the home team driving at the away goal, and the away team the other way", () => {
    expect(drivesTowardHome(field({ homeHasBall: true }))).toBe(false);
    expect(drivesTowardHome(field({ homeHasBall: false }))).toBe(true);
    expect(drivesTowardHome(field({ homeHasBall: null }))).toBeNull();
  });

  it("sits the ball behind the line, on the side the drive comes from", () => {
    // Home drives toward 0, so behind the line is the high side.
    expect(ballSide(field({ homeHasBall: true }))).toBe(1);
    expect(ballSide(field({ homeHasBall: false }))).toBe(-1);
  });

  it("tints the twenty being attacked, and only in the red zone", () => {
    expect(redZone(field({ isRedZone: true, homeHasBall: false }))).toEqual([80, 100]);
    expect(redZone(field({ isRedZone: true, homeHasBall: true }))).toEqual([0, 20]);
    expect(redZone(field({ isRedZone: false }))).toBeNull();
    expect(redZone(field({ isRedZone: true, homeHasBall: null }))).toBeNull();
  });

  it("draws the chains only while there's a ball to measure from", () => {
    expect(showChains(field())).toBe(true);
    expect(showChains(field({ ballOn: null }))).toBe(false);
    expect(showChains(field({ firstDown: null }))).toBe(false);
  });
});

describe("the words under the field", () => {
  it("adds the marker to the down and distance only when it's missing", () => {
    expect(fieldHeadline(field({ downDistanceText: "2nd & 9", possessionText: "DAL 48" }))).toBe("2nd & 9 at DAL 48");
    expect(fieldHeadline(field({ downDistanceText: "1st & 10 at TEX 22", possessionText: "TEX 22" }))).toBe("1st & 10 at TEX 22");
    expect(fieldHeadline(field({ downDistanceText: "3rd & 4" }))).toBe("3rd & 4");
    expect(fieldHeadline(field())).toBeNull();
  });

  it("puts the game clock in front of the last play when the feed hasn't", () => {
    expect(lastPlayLine(game({ lastPlay: "D.Prescott pass short right", period: "9:32 - 3rd" }))).toBe(
      "Last play: 9:32 - 3rd · D.Prescott pass short right",
    );
    expect(lastPlayLine(game({ lastPlay: "(09:40) M.Reed rush middle", period: "9:32 - 3rd" }))).toBe(
      "Last play: (09:40) M.Reed rush middle",
    );
    expect(lastPlayLine(game({ lastPlay: "  " }))).toBeNull();
  });

  it("gives a screen reader the words when there's no drawing to see", () => {
    expect(fieldSummary(game(), field())).toBe("Field position");
    expect(fieldSummary(game({ lastPlay: "Kneel" }), field({ downDistanceText: "1st & 10" }))).toBe("1st & 10. Last play: Kneel");
  });
});

describe("endzoneStyle", () => {
  it("labels a dark colour in white", () => {
    expect(endzoneStyle("#041e42")).toEqual({ fill: "#041e42", label: "#ffffff" });
  });

  it("labels a light colour in ink", () => {
    expect(endzoneStyle("#ffb81c")?.label).toBe("#131313");
  });

  it("finds a readable label for any real colour — even a mid grey clears 3:1 against one of the two", () => {
    expect(endzoneStyle("#787878")?.label).toBe("#ffffff");
    expect(endzoneStyle("#9a9a9a")?.label).toBe("#131313");
  });

  it("falls back to neutral for a colour it can't read", () => {
    expect(endzoneStyle("not a colour")).toBeNull();
    expect(endzoneStyle("#fff")).toBeNull();
    expect(endzoneStyle("")).toBeNull();
  });
});
