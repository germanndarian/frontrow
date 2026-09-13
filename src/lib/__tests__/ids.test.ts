import { describe, it, expect } from "vitest";
import { isValidId } from "@/lib/espn/ids";
import { espnUrl } from "@/lib/espn/endpoints";

describe("isValidId", () => {
  it("takes the ids the app actually uses", () => {
    // Yankees, Longhorns, Aaron Judge, Arch Manning.
    for (const id of ["10", "251", "33192", "4870906"]) {
      expect(isValidId(id)).toBe(true);
    }
  });

  it("turns away anything that could steer the upstream request", () => {
    const attacks = [
      "123/../../../teams", // a different ESPN path
      "123?limit=1", // a query string bolted onto ours
      "123&limit=1",
      "123#fragment",
      "../secrets",
      "1/2",
      "%2e%2e%2f",
      "1 2",
      "",
    ];
    for (const id of attacks) expect(isValidId(id)).toBe(false);
  });

  it("turns away a missing id rather than building a URL without one", () => {
    expect(isValidId(null)).toBe(false);
    expect(isValidId(undefined)).toBe(false);
  });

  it("caps the length, so the cache can't be filled with distinct keys", () => {
    expect(isValidId("1".repeat(32))).toBe(true);
    expect(isValidId("1".repeat(33))).toBe(false);
  });

  it("leaves the upstream URL on ESPN's own path for everything it accepts", () => {
    const url = new URL(espnUrl.team("mlb", "10"));
    expect(url.host).toBe("site.web.api.espn.com");
    expect(url.pathname).toBe("/apis/site/v2/sports/baseball/mlb/teams/10");
    expect(url.search).toBe("");
  });
});
