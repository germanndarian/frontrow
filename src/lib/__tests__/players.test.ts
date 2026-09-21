import { describe, it, expect } from "vitest";
import { bioRows, playerSections, playerSubtitle } from "@/lib/players";
import type { FollowedPlayer, FollowedTeam } from "@/lib/types";

function team(league: FollowedTeam["league"], abbreviation: string, displayName: string): FollowedTeam {
  return { league, teamId: abbreviation, displayName, abbreviation, logo: "", color: `#${abbreviation.length}00000` };
}
function player(id: string, league: FollowedPlayer["league"], teamAbbr: string): FollowedPlayer {
  return { league, id, fullName: id, teamAbbr, headshot: "", position: "" };
}

describe("playerSections", () => {
  const teams = [team("nhl", "EDM", "Edmonton Oilers"), team("mlb", "NYY", "New York Yankees")];

  it("groups players under their team, in the order the teams are listed", () => {
    const sections = playerSections(
      [player("judge", "mlb", "NYY"), player("mcdavid", "nhl", "EDM"), player("stanton", "mlb", "NYY")],
      teams,
    );
    expect(sections.map((s) => [s.title, s.players.map((p) => p.id)])).toEqual([
      ["Edmonton Oilers", ["mcdavid"]],
      ["New York Yankees", ["judge", "stanton"]],
    ]);
  });

  it("gives a player whose team isn't followed a group of their own, after yours", () => {
    const sections = playerSections([player("ohtani", "mlb", "LAD"), player("judge", "mlb", "NYY")], teams);
    expect(sections.map((s) => s.title)).toEqual(["New York Yankees", "LAD"]);
    expect(sections[1].color).toBe("#8c8c86");
  });

  it("keeps two leagues' same abbreviation apart", () => {
    const sections = playerSections(
      [player("hurts", "nfl", "PHI"), player("harper", "mlb", "PHI")],
      [team("nfl", "PHI", "Philadelphia Eagles")],
    );
    expect(sections.map((s) => s.title)).toEqual(["Philadelphia Eagles", "PHI"]);
  });

  it("has nothing to group with no players", () => {
    expect(playerSections([], teams)).toEqual([]);
  });
});

describe("playerSubtitle", () => {
  it("reads team, position and number", () => {
    expect(playerSubtitle({ teamAbbr: "NYY", position: "RF", jersey: "99" })).toBe("NYY · RF · #99");
  });

  it("leaves out what the feed doesn't have", () => {
    expect(playerSubtitle({ teamAbbr: "TEX", position: "QB", jersey: "" })).toBe("TEX · QB");
    expect(playerSubtitle({ teamAbbr: "TEX", position: "", jersey: "—" })).toBe("TEX");
  });
});

describe("bioRows", () => {
  it("lists the profile in reading order", () => {
    expect(
      bioRows({ height: `6' 7"`, weight: "282 lbs", age: 34, birthplace: "Linden, CA", batsThrows: "Right/Right", college: "Fresno State", draft: "2013: Rd 1, Pk 32 (NYY)" }),
    ).toEqual([
      ["Height", `6' 7"`],
      ["Weight", "282 lbs"],
      ["Age", "34"],
      ["Born", "Linden, CA"],
      ["Bats/Throws", "Right/Right"],
      ["College", "Fresno State"],
      ["Draft", "2013: Rd 1, Pk 32 (NYY)"],
    ]);
  });

  it("puts a status first, and skips what isn't there", () => {
    expect(bioRows({ status: "Injured Reserve", experience: "Junior", college: " " })).toEqual([
      ["Status", "Injured Reserve"],
      ["Experience", "Junior"],
    ]);
    expect(bioRows({})).toEqual([]);
    expect(bioRows(undefined)).toEqual([]);
  });
});
