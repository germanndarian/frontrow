import { describe, it, expect } from "vitest";
import { hex, monogram, relativeTime } from "@/lib/utils";

describe("hex", () => {
  it("normalizes a bare 6-digit hex to a CSS color", () => {
    expect(hex("132448")).toBe("#132448");
  });

  it("strips a leading # and keeps valid colors", () => {
    expect(hex("#abcabc")).toBe("#abcabc");
  });

  it("falls back when the input isn't a valid hex", () => {
    expect(hex("")).toBe("#64748b");
    expect(hex("not-a-color")).toBe("#64748b");
  });

  it("honors a custom fallback", () => {
    expect(hex(null, "000000")).toBe("#000000");
  });
});

describe("monogram", () => {
  it("uses first + last initials for multi-word names", () => {
    expect(monogram("New York Yankees")).toBe("NY");
  });

  it("uses the first two letters for single-word names", () => {
    expect(monogram("Yankees")).toBe("YA");
  });
});

describe("relativeTime", () => {
  const now = Date.UTC(2026, 5, 8, 12, 0, 0);

  it("reads as 'now' for the current moment", () => {
    expect(relativeTime(new Date(now).toISOString(), now)).toBe("now");
  });

  it("points forward for future times", () => {
    const future = new Date(now + 2 * 3600_000).toISOString();
    expect(relativeTime(future, now)).toMatch(/^in /);
  });

  it("points backward for past times", () => {
    const past = new Date(now - 30 * 60_000).toISOString();
    expect(relativeTime(past, now)).toMatch(/ago$/);
  });
});
