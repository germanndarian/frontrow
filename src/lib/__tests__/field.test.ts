import { describe, it, expect } from "vitest";
import { buildField, toFieldPercent, toFirstDownPercent } from "@/lib/espn/field";
import type { FieldTeam } from "@/lib/espn/field";
import { normalizeScoreboard } from "@/lib/espn/normalize";
import type { RawScoreboard, RawSituation } from "@/lib/espn/raw";

/**
 * The fixtures below are the `start` blocks of real plays, copied out of the
 * ESPN summary feed's `drives` for two games played on 12 September 2026:
 * Arizona State at Texas A&M (event 401856683) and Ohio State at Texas
 * (event 401856682). A play's start block carries the same fields a live
 * game's `situation` does; the one addition here is `possession`, which the
 * play spells as `start.team.id` and the live feed as `situation.possession`.
 */

/* ── Arizona State at Texas A&M: TA&M home (245), ASU away (9) ─────────── */

const TAMU: FieldTeam = { teamId: "245", abbreviation: "TA&M" };
const ASU: FieldTeam = { teamId: "9", abbreviation: "ASU" };

/** 3rd quarter, TA&M driving out of their own half. */
const homeDrive: RawSituation = {
  down: 2,
  distance: 9,
  yardLine: 48,
  downDistanceText: "2nd & 9 at TA&M 48",
  shortDownDistanceText: "2nd & 9",
  possessionText: "TA&M 48",
  possession: "245",
};

/* ── Ohio State at Texas: TEX home (251), OSU away (194) ──────────────── */

const TEX: FieldTeam = { teamId: "251", abbreviation: "TEX" };
const OSU: FieldTeam = { teamId: "194", abbreviation: "OSU" };

/** OSU backed up on their own 19. */
const awayDrive: RawSituation = {
  down: 1,
  distance: 10,
  yardLine: 81,
  downDistanceText: "1st & 10 at OSU 19",
  shortDownDistanceText: "1st & 10",
  possessionText: "OSU 19",
  possession: "194",
};

/** The same OSU offense, now inside the Texas 20. */
const awayInTheRedZone: RawSituation = {
  down: 1,
  distance: 10,
  yardLine: 18,
  downDistanceText: "1st & 10 at TEX 18",
  shortDownDistanceText: "1st & 10",
  possessionText: "TEX 18",
  possession: "194",
  isRedZone: true,
};

/** Goal to go: ESPN caps `distance` at the goal line. */
const goalToGo: RawSituation = {
  down: 1,
  distance: 4,
  yardLine: 4,
  downDistanceText: "1st & Goal at TEX 4",
  shortDownDistanceText: "1st & Goal",
  possessionText: "TEX 4",
  possession: "194",
  isRedZone: true,
};

/** Texas with the ball on their own 22, after the opening kickoff. */
const homeBackedUp: RawSituation = {
  down: 1,
  distance: 10,
  yardLine: 22,
  downDistanceText: "1st & 10 at TEX 22",
  shortDownDistanceText: "1st & 10",
  possessionText: "TEX 22",
  possession: "251",
};

describe("toFieldPercent", () => {
  it("reads the home team's own half from their side of the field", () => {
    // TA&M's 48 is 48 yards from the home goal line, so 52 from the away one.
    expect(toFieldPercent(homeDrive, TAMU, ASU)).toBe(52);
    expect(toFieldPercent(homeBackedUp, TEX, OSU)).toBe(78);
  });

  it("reads the away team's own half from the other end", () => {
    expect(toFieldPercent(awayDrive, TEX, OSU)).toBe(19);
  });

  it("puts a drive into the opponent's half on the opponent's side", () => {
    // OSU on the Texas 18: deep in home territory, near the 100 end.
    expect(toFieldPercent(awayInTheRedZone, TEX, OSU)).toBe(82);
    expect(toFieldPercent(goalToGo, TEX, OSU)).toBe(96);
  });

  it("ignores yardLine, which counts from a goal line ESPN doesn't name", () => {
    // Both of these carry yardLine 48 but sit on opposite halves; only the
    // marker text tells them apart.
    const mirrored: RawSituation = { ...homeDrive, possessionText: "ASU 48" };
    expect(toFieldPercent(homeDrive, TAMU, ASU)).toBe(52);
    expect(toFieldPercent(mirrored, TAMU, ASU)).toBe(48);
  });

  it("reads midfield the same way whichever abbreviation it carries", () => {
    expect(toFieldPercent({ possessionText: "TEX 50" }, TEX, OSU)).toBe(50);
    expect(toFieldPercent({ possessionText: "OSU 50" }, TEX, OSU)).toBe(50);
  });

  it("falls back to the marker spelled out in the down and distance", () => {
    const spelledOut: RawSituation = { ...awayDrive, possessionText: undefined };
    expect(toFieldPercent(spelledOut, TEX, OSU)).toBe(19);
  });

  it("says nothing rather than guess", () => {
    // Between drives and at the half ESPN keeps the situation and drops the
    // marker; a bare down and distance must not read as "& 9".
    expect(toFieldPercent({ downDistanceText: "2nd & 9" }, TEX, OSU)).toBeNull();
    expect(toFieldPercent({}, TEX, OSU)).toBeNull();
    expect(toFieldPercent(undefined, TEX, OSU)).toBeNull();
    // A team neither side recognises, and a marker past the 50.
    expect(toFieldPercent({ possessionText: "MICH 30" }, TEX, OSU)).toBeNull();
    expect(toFieldPercent({ possessionText: "TEX 65" }, TEX, OSU)).toBeNull();
  });
});

describe("toFirstDownPercent", () => {
  it("puts the chains downfield of the scrimmage line", () => {
    // TA&M drive left towards 0; OSU drive right towards 100.
    expect(toFirstDownPercent(52, 9, true)).toBe(43);
    expect(toFirstDownPercent(19, 10, false)).toBe(29);
  });

  it("lands goal to go exactly on the goal line", () => {
    expect(toFirstDownPercent(96, 4, false)).toBe(100);
    expect(toFirstDownPercent(4, 4, true)).toBe(0);
  });

  it("keeps a distance that runs out the field on the field", () => {
    expect(toFirstDownPercent(96, 13, false)).toBe(100);
  });

  it("has no marker to draw without a line of scrimmage or a down", () => {
    expect(toFirstDownPercent(null, 10, true)).toBeNull();
    expect(toFirstDownPercent(52, undefined, true)).toBeNull();
    expect(toFirstDownPercent(52, 9, null)).toBeNull();
  });
});

describe("buildField", () => {
  it("resolves a home-possession drive", () => {
    expect(buildField(homeDrive, TAMU, ASU)).toEqual({
      ballOn: 52,
      firstDown: 43,
      homeHasBall: true,
      down: 2,
      distance: 9,
      downDistanceText: "2nd & 9 at TA&M 48",
      possessionText: "TA&M 48",
      isRedZone: false,
    });
  });

  it("resolves an away-possession drive", () => {
    expect(buildField(awayDrive, TEX, OSU)).toEqual({
      ballOn: 19,
      firstDown: 29,
      homeHasBall: false,
      down: 1,
      distance: 10,
      downDistanceText: "1st & 10 at OSU 19",
      possessionText: "OSU 19",
      isRedZone: false,
    });
  });

  it("carries the red zone flag through", () => {
    expect(buildField(awayInTheRedZone, TEX, OSU).isRedZone).toBe(true);
    expect(buildField(awayDrive, TEX, OSU).isRedZone).toBe(false);
  });

  it("leaves the field bare between drives", () => {
    const half = buildField({ lastPlay: { text: "End of the 2nd Quarter" } }, TEX, OSU);
    expect(half.ballOn).toBeNull();
    expect(half.firstDown).toBeNull();
    expect(half.homeHasBall).toBeNull();
  });

  it("won't name a possession it can't match to a side", () => {
    expect(buildField({ ...awayDrive, possession: "9999" }, TEX, OSU).homeHasBall).toBeNull();
  });
});

/* ── the normalizer only hands the graphic live football ────────────────── */

function event(sport: "football" | "baseball", state: "pre" | "in" | "post"): RawScoreboard {
  return {
    events: [
      {
        id: "1",
        date: "2026-09-12T23:30:00Z",
        competitions: [
          {
            status: { type: { state } },
            competitors: [
              { homeAway: "home", team: { id: "245", abbreviation: "TA&M" } },
              { homeAway: "away", team: { id: "9", abbreviation: "ASU" } },
            ],
            situation:
              sport === "football" ? homeDrive : { outs: 2, onFirst: true, strikes: 1 },
          },
        ],
      },
    ],
  };
}

describe("normalizeScoreboard field position", () => {
  it("resolves the drive on a live football game", () => {
    const [game] = normalizeScoreboard(event("football", "in"), "college-football");
    expect(game.field).toMatchObject({ ballOn: 52, firstDown: 43, homeHasBall: true });
  });

  it("leaves it off before kick-off and after the whistle", () => {
    expect(normalizeScoreboard(event("football", "pre"), "college-football")[0].field)
      .toBeUndefined();
    expect(normalizeScoreboard(event("football", "post"), "college-football")[0].field)
      .toBeUndefined();
  });

  it("leaves it off for the sports that don't have a field", () => {
    expect(normalizeScoreboard(event("baseball", "in"), "mlb")[0].field).toBeUndefined();
  });
});
