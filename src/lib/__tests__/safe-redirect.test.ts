import { describe, it, expect } from "vitest";
import { safeNext } from "@/lib/safe-redirect";

const ORIGIN = "https://frontrow-ten.vercel.app";

describe("safeNext", () => {
  it("keeps an ordinary path", () => {
    expect(safeNext("/dashboard")).toBe("/dashboard");
    expect(safeNext("/settings?tab=follows")).toBe("/settings?tab=follows");
  });

  it("falls back when there's nothing to go on", () => {
    expect(safeNext(null)).toBe("/dashboard");
    expect(safeNext("")).toBe("/dashboard");
  });

  it("refuses anything that leaves this site", () => {
    // The bare string looks harmless; pasted onto the origin it isn't.
    expect(safeNext("@evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("javascript:alert(1)")).toBe("/dashboard");
  });

  it("lands on this origin for every input, which is the point", () => {
    const attempts = [
      "@evil.com",
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "\\\\evil.com",
      "/dashboard",
      null,
    ];
    for (const attempt of attempts) {
      expect(new URL(ORIGIN + safeNext(attempt)).host).toBe("frontrow-ten.vercel.app");
    }
  });
});
