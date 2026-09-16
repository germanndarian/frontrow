import { describe, it, expect } from "vitest";
import {
  easternStamp,
  monthsSpanning,
  windowEnds,
  withinWindow,
} from "@/lib/espn/window";

describe("monthsSpanning", () => {
  it("gives the one month a week inside it falls in", () => {
    expect(monthsSpanning("20260914", "20260920")).toEqual(["202609"]);
  });

  it("gives both months a week straddles", () => {
    expect(monthsSpanning("20260928", "20261004")).toEqual(["202609", "202610"]);
  });

  it("crosses a year end", () => {
    expect(monthsSpanning("20261228", "20270103")).toEqual(["202612", "202701"]);
  });

  it("covers the bracket's ~90-day window", () => {
    // Eighty days back from mid-September reaches the end of June.
    expect(monthsSpanning("20260628", "20260926")).toEqual([
      "202606",
      "202607",
      "202608",
      "202609",
    ]);
  });

  it("treats a single day as its own month", () => {
    expect(monthsSpanning("20260914", "20260914")).toEqual(["202609"]);
  });

  it("caps a window nobody asked for in good faith", () => {
    // The route's validation admits any two 8-digit numbers, and this one is
    // 960 months of upstream reads if nothing stops it.
    expect(monthsSpanning("20200101", "20991231")).toHaveLength(6);
  });

  it("gives nothing for a backwards window", () => {
    expect(monthsSpanning("20260920", "20260914")).toEqual([]);
  });
});

describe("easternStamp", () => {
  it("files a game under the Eastern day it was played on", () => {
    // 7:40pm in New York, already tomorrow in UTC.
    expect(easternStamp("2026-09-15T22:40Z")).toBe("20260915");
  });

  it("keeps a late game on the day it started, not the next one", () => {
    // 9:40pm ET on the 15th — ESPN returns this for dates=20260915.
    expect(easternStamp("2026-09-16T01:40Z")).toBe("20260915");
  });

  it("handles a game either side of the daylight-saving shift", () => {
    expect(easternStamp("2026-03-08T00:30Z")).toBe("20260307"); // EST, UTC-5
    expect(easternStamp("2026-11-02T00:30Z")).toBe("20261101"); // EDT, UTC-4
  });

  it("gives an empty stamp for a date it can't read", () => {
    expect(easternStamp("not a date")).toBe("");
  });
});

describe("withinWindow", () => {
  it("keeps a game inside the window", () => {
    expect(withinWindow("2026-09-16T17:00Z", "20260914", "20260920")).toBe(true);
  });

  it("keeps the late game on the window's last day", () => {
    // The regression this guards: 01:40Z on the 21st is the 20th in New York,
    // and slicing on the UTC date would drop it off the end of the week.
    expect(withinWindow("2026-09-21T01:40Z", "20260914", "20260920")).toBe(true);
  });

  it("drops the game that genuinely belongs to the next window", () => {
    expect(withinWindow("2026-09-21T17:00Z", "20260914", "20260920")).toBe(false);
  });

  it("takes both ends", () => {
    expect(withinWindow("2026-09-14T23:00Z", "20260914", "20260920")).toBe(true);
    expect(withinWindow("2026-09-13T23:00Z", "20260914", "20260920")).toBe(false);
  });

  it("drops a game whose date is unreadable rather than guessing", () => {
    expect(withinWindow("", "20260914", "20260920")).toBe(false);
  });
});

describe("windowEnds", () => {
  it("splits a range", () => {
    expect(windowEnds("20260914-20260920")).toEqual(["20260914", "20260920"]);
  });

  it("makes a single day both ends", () => {
    expect(windowEnds("20260914")).toEqual(["20260914", "20260914"]);
  });
});
