import { describe, it, expect } from "vitest";
import { normalizePlayer } from "@/lib/espn/normalize";
import type { RawAthlete, RawGamelog } from "@/lib/espn/raw";

/**
 * The athlete blocks below are the shapes ESPN actually returns, taken from
 * four real players on 13 September 2026 — Aaron Judge (MLB), Connor McDavid
 * (NHL), Jalen Hurts (NFL) and Arch Manning (college football). The point of
 * having all four is the gaps: a college player has no draft and no age, a
 * hockey player has no college, and bats/throws is baseball's alone.
 */

const noGames: RawGamelog = {};

function athlete(bio: Record<string, unknown>): RawAthlete {
  return {
    athlete: {
      id: "1",
      fullName: "A Player",
      team: { abbreviation: "NYY" },
      statsSummary: { displayName: "2026 season stats", statistics: [] },
      ...bio,
    },
  };
}

describe("player bio", () => {
  it("carries what a baseball player's page holds", () => {
    const { bio } = normalizePlayer(
      athlete({
        age: 34,
        displayHeight: `6' 7"`,
        displayWeight: "282 lbs",
        displayBirthPlace: "Linden, CA",
        displayBatsThrows: "Right/Right",
        displayExperience: "11th Season",
        displayDraft: "2013: Rd 1, Pk 32 (NYY)",
        college: { name: "Fresno State", shortName: "Fresno St" },
        status: { name: "Active", type: "active" },
      }),
      noGames,
      "mlb",
    );

    expect(bio).toEqual({
      height: `6' 7"`,
      weight: "282 lbs",
      age: 34,
      birthplace: "Linden, CA",
      batsThrows: "Right/Right",
      experience: "11th Season",
      college: "Fresno State",
      draft: "2013: Rd 1, Pk 32 (NYY)",
      status: undefined,
    });
  });

  it("leaves out what a sport doesn't have", () => {
    // McDavid: no college, and hockey has no bats/throws.
    const { bio } = normalizePlayer(
      athlete({
        age: 29,
        displayHeight: `6' 1"`,
        displayWeight: "194 lbs",
        displayBirthPlace: "Richmond Hill, ON",
        displayExperience: "11th Season",
        displayDraft: "2015: Rd 1, Pk 1 (EDM)",
        college: null,
      }),
      noGames,
      "nhl",
    );

    expect(bio.college).toBeUndefined();
    expect(bio.batsThrows).toBeUndefined();
    expect(bio.draft).toBe("2015: Rd 1, Pk 1 (EDM)");
  });

  it("handles a college player, who has no draft and no age", () => {
    const { bio } = normalizePlayer(
      athlete({
        displayHeight: `6' 4"`,
        displayWeight: "222 lbs",
        displayBirthPlace: "New Orleans, LA",
        displayExperience: "Junior",
        college: { name: "Texas" },
      }),
      noGames,
      "college-football",
    );

    expect(bio.draft).toBeUndefined();
    expect(bio.age).toBeUndefined();
    expect(bio.experience).toBe("Junior");
    expect(bio.college).toBe("Texas");
  });

  it("says nothing at all when the page is bare", () => {
    const { bio } = normalizePlayer(athlete({}), noGames, "nfl");
    expect(Object.values(bio).every((v) => v === undefined)).toBe(true);
  });

  it("drops a field the feed filled with an empty string", () => {
    const { bio } = normalizePlayer(
      athlete({ displayHeight: "", displayWeight: "   ", college: { name: "" } }),
      noGames,
      "nfl",
    );
    expect(bio.height).toBeUndefined();
    expect(bio.weight).toBeUndefined();
    expect(bio.college).toBeUndefined();
  });

  it("mentions a status only when it isn't the usual one", () => {
    const playing = normalizePlayer(
      athlete({ status: { name: "Active", type: "active" } }),
      noGames,
      "nfl",
    );
    expect(playing.bio.status).toBeUndefined();

    const hurt = normalizePlayer(
      athlete({ status: { name: "Injured Reserve", type: "injured" } }),
      noGames,
      "nfl",
    );
    expect(hurt.bio.status).toBe("Injured Reserve");
  });
});
