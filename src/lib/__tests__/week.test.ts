import { describe, it, expect } from "vitest";
import {
  WEEK_OFFSETS,
  firstDayOfWeek,
  weekLabel,
  weekQuery,
  weekRange,
  weekWindow,
  weekWindows,
} from "@/lib/week";

const MONDAY = 1;
const SUNDAY = 7;
// Monday 21 September 2026, in the middle of the afternoon.
const today = new Date(2026, 8, 21, 15, 0);

describe("weekWindow", () => {
  it("starts on the reader's first day of the week", () => {
    expect(weekQuery(weekWindow(today, 0, MONDAY))).toBe("20260921-20260927");
    expect(weekQuery(weekWindow(today, 0, SUNDAY))).toBe("20260920-20260926");
  });

  it("counts a Sunday into the week it ends, for a Monday reader", () => {
    const sunday = new Date(2026, 8, 27, 22, 0);
    expect(weekQuery(weekWindow(sunday, 0, MONDAY))).toBe("20260921-20260927");
    expect(weekQuery(weekWindow(sunday, 0, SUNDAY))).toBe("20260927-20261003");
  });

  it("moves a whole week per step, either way", () => {
    expect(weekQuery(weekWindow(today, -1, MONDAY))).toBe("20260914-20260920");
    expect(weekQuery(weekWindow(today, 1, MONDAY))).toBe("20260928-20261004");
    expect(weekQuery(weekWindow(today, 16, MONDAY))).toBe("20270111-20270117");
  });

  it("runs from last week to sixteen weeks ahead", () => {
    expect(WEEK_OFFSETS[0]).toBe(-1);
    expect(WEEK_OFFSETS.at(-1)).toBe(16);
    expect(weekWindows(today, MONDAY).map((w) => w.offset)).toEqual(WEEK_OFFSETS);
  });
});

describe("what a week is called", () => {
  const weeks = weekWindows(today, MONDAY);
  const at = (offset: number) => weeks.find((w) => w.offset === offset)!;

  it("names the near weeks and dates the rest", () => {
    expect(weekLabel(at(-1))).toBe("Last week");
    expect(weekLabel(at(0))).toBe("This week");
    expect(weekLabel(at(1))).toBe("Next week");
    expect(weekLabel(at(2))).toBe("Oct 5");
  });

  it("writes the range short, and names both months when it crosses one", () => {
    expect(weekRange(at(0))).toBe("Sep 21 – 27");
    expect(weekRange(at(1))).toBe("Sep 28 – Oct 4");
  });
});

describe("firstDayOfWeek", () => {
  it("reads it from the locale where the browser knows", () => {
    const us = new Intl.Locale("en-US") as Intl.Locale & { getWeekInfo?: unknown; weekInfo?: unknown };
    // Node and every browser but Firefox answer; where it can't, Monday it is.
    if (us.getWeekInfo || us.weekInfo) {
      expect(firstDayOfWeek("en-US")).toBe(SUNDAY);
      expect(firstDayOfWeek("de-DE")).toBe(MONDAY);
    } else {
      expect(firstDayOfWeek("en-US")).toBe(MONDAY);
    }
  });

  it("falls back to Monday for a locale it can't read", () => {
    expect(firstDayOfWeek("not a locale!")).toBe(MONDAY);
  });
});
