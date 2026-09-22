import { afterEach, describe, it, expect, vi } from "vitest";
import { seasonAt } from "@/lib/seasons";

/** Midday in New York, so a test reads as the day it names. */
const on = (day: string) => new Date(`${day}T16:00:00Z`);

describe("seasonAt", () => {
  it("calls late September what it is: football and baseball on, hockey and basketball not yet", () => {
    const today = on("2026-09-21");
    expect(seasonAt("nfl", today)).toEqual({ inSeason: true, phase: "regular", label: "Regular season" });
    expect(seasonAt("college-football", today).inSeason).toBe(true);
    expect(seasonAt("mlb", today)).toEqual({ inSeason: true, phase: "regular", label: "Regular season" });
    expect(seasonAt("nhl", today)).toEqual({ inSeason: false, phase: null, label: "Opens in October" });
    expect(seasonAt("nba", today)).toEqual({ inSeason: false, phase: null, label: "Tips off in October" });
  });

  it("tells the demo evening's story: baseball, and the hockey and basketball finals", () => {
    const demo = new Date(Date.UTC(2026, 5, 5, 23, 30));
    expect(seasonAt("mlb", demo).phase).toBe("regular");
    expect(seasonAt("nhl", demo)).toEqual({ inSeason: true, phase: "post", label: "Playoffs" });
    expect(seasonAt("nba", demo).phase).toBe("post");
    expect(seasonAt("nfl", demo)).toEqual({ inSeason: false, phase: null, label: "Kicks off in September" });
    expect(seasonAt("college-football", demo).label).toBe("Kicks off in late August");
  });

  it("runs the NFL season past New Year into the playoffs, and out after the Super Bowl", () => {
    expect(seasonAt("nfl", on("2027-01-05")).phase).toBe("regular");
    expect(seasonAt("nfl", on("2027-01-20"))).toEqual({ inSeason: true, phase: "post", label: "Playoffs" });
    expect(seasonAt("nfl", on("2027-02-15")).inSeason).toBe(true);
    expect(seasonAt("nfl", on("2027-02-16")).inSeason).toBe(false);
    expect(seasonAt("nfl", on("2026-08-31")).inSeason).toBe(false);
    expect(seasonAt("nfl", on("2026-09-01")).inSeason).toBe(true);
  });

  it("gives college football its bowl season either side of New Year", () => {
    expect(seasonAt("college-football", on("2026-08-20")).phase).toBe("regular");
    expect(seasonAt("college-football", on("2026-12-20"))).toEqual({ inSeason: true, phase: "post", label: "Bowl season" });
    expect(seasonAt("college-football", on("2027-01-10")).phase).toBe("post");
    expect(seasonAt("college-football", on("2027-01-26")).inSeason).toBe(false);
  });

  it("carries baseball into October, and says when it comes back", () => {
    expect(seasonAt("mlb", on("2026-10-05"))).toEqual({ inSeason: true, phase: "post", label: "Postseason" });
    expect(seasonAt("mlb", on("2026-11-20"))).toEqual({ inSeason: false, phase: null, label: "Opening Day is in late March" });
    expect(seasonAt("mlb", on("2027-03-18")).inSeason).toBe(true);
  });

  it("gives hockey and basketball their spring playoffs", () => {
    expect(seasonAt("nhl", on("2027-05-10")).label).toBe("Playoffs");
    expect(seasonAt("nhl", on("2026-10-01")).phase).toBe("regular");
    expect(seasonAt("nhl", on("2027-07-01")).inSeason).toBe(false);
    expect(seasonAt("nba", on("2027-04-20")).label).toBe("Playoffs");
    expect(seasonAt("nba", on("2027-06-26")).inSeason).toBe(false);
  });

  it("reads the day in New York, not in UTC", () => {
    // 02:00 UTC on 1 September is still 31 August in New York.
    expect(seasonAt("nfl", new Date("2026-09-01T02:00:00Z")).inSeason).toBe(false);
    expect(seasonAt("nfl", new Date("2026-09-01T05:00:00Z")).inSeason).toBe(true);
  });

  it("treats a date it can't read as out of season rather than throwing", () => {
    expect(seasonAt("nfl", new Date("nope")).inSeason).toBe(false);
  });
});

describe("the demo clock", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is the real time outside demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "false");
    vi.resetModules();
    const { now } = await import("@/lib/clock");
    expect(Math.abs(now() - Date.now())).toBeLessThan(1_000);
  });

  it("starts demo mode on the demo evening and ticks from there", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "true");
    vi.resetModules();
    const { now, DEMO_MOMENT } = await import("@/lib/clock");
    const at = now();
    expect(at).toBeGreaterThanOrEqual(DEMO_MOMENT);
    expect(at - DEMO_MOMENT).toBeLessThan(5_000);
  });

  it("puts the leagues where the demo dataset expects them", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "true");
    vi.resetModules();
    const { LEAGUES } = await import("@/lib/leagues");
    expect(LEAGUES.nhl.inSeason).toBe(true);
    expect(LEAGUES.mlb.inSeason).toBe(true);
    expect(LEAGUES.nfl.inSeason).toBe(false);
    expect(LEAGUES["college-football"].inSeason).toBe(false);
  });
});
