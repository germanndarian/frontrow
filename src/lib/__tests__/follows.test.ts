import { beforeEach, describe, it, expect } from "vitest";
import { PREVIEW, followPreview, followSummary } from "@/lib/follows";
import { offersLeagueChoice } from "@/lib/leagues";
import { usePreferences } from "@/lib/store";
import type { FollowedPlayer, FollowedTeam } from "@/lib/types";

const team = (id: string): FollowedTeam => ({ league: "mlb", teamId: id, displayName: id, abbreviation: id, logo: "", color: "#000000" });
const player = (id: string): FollowedPlayer => ({ league: "mlb", id, fullName: id, teamAbbr: "NYY", headshot: "", position: "RF" });
const many = <T,>(n: number, make: (id: string) => T) => Array.from({ length: n }, (_, i) => make(String(i)));

describe("followSummary", () => {
  it("counts each kind, leaving out what's empty", () => {
    expect(followSummary({ leagues: ["mlb", "nhl", "nfl"], teams: many(4, team), players: many(2, player) })).toBe(
      "3 leagues · 4 teams · 2 players",
    );
    expect(followSummary({ leagues: ["mlb"], teams: [team("NYY")], players: [] })).toBe("1 league · 1 team");
    expect(followSummary({ leagues: [], teams: [], players: [] })).toBe("Nothing yet");
  });
});

describe("followPreview", () => {
  it("shows three of each, so the teams can't crowd out the players", () => {
    const preview = followPreview({ leagues: ["mlb"], teams: many(6, team), players: many(4, player) });
    expect(preview.teams).toHaveLength(PREVIEW);
    expect(preview.players).toHaveLength(PREVIEW);
    expect(preview.hidden).toBe(4);
    expect(preview.total).toBe(10);
  });

  it("hides nothing when it all fits", () => {
    expect(followPreview({ leagues: ["mlb"], teams: many(3, team), players: many(1, player) }).hidden).toBe(0);
  });
});

describe("offersLeagueChoice", () => {
  it("is only football, where one sport has two leagues", () => {
    expect(offersLeagueChoice(["football"])).toBe(true);
    expect(offersLeagueChoice(["baseball", "football"])).toBe(true);
    expect(offersLeagueChoice(["baseball", "hockey", "basketball"])).toBe(false);
    expect(offersLeagueChoice([])).toBe(false);
  });
});

describe("toggleSport", () => {
  beforeEach(() => usePreferences.getState().reset());

  it("follows a sport's leagues along with it", () => {
    usePreferences.getState().toggleSport("baseball");
    expect(usePreferences.getState().leagues).toEqual(["mlb"]);
    usePreferences.getState().toggleSport("football");
    expect(usePreferences.getState().leagues).toEqual(["mlb", "nfl", "college-football"]);
  });

  it("never follows a league twice", () => {
    usePreferences.setState({ sports: [], leagues: ["nfl"] });
    usePreferences.getState().toggleSport("football");
    expect(usePreferences.getState().leagues).toEqual(["nfl", "college-football"]);
  });

  it("still drops a sport's leagues, teams and players with it", () => {
    usePreferences.getState().toggleSport("baseball");
    usePreferences.getState().toggleTeam(team("NYY"));
    usePreferences.getState().togglePlayer(player("judge"));
    usePreferences.getState().toggleSport("baseball");
    const { sports, leagues, teams, players } = usePreferences.getState();
    expect({ sports, leagues, teams, players }).toEqual({ sports: [], leagues: [], teams: [], players: [] });
  });
});
