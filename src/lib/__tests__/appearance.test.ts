import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS, resolveAppearance } from "@/lib/settings";

describe("resolveAppearance", () => {
  it("passes explicit choices through untouched", () => {
    expect(resolveAppearance("light", true)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
  });

  it("follows the device for system", () => {
    expect(resolveAppearance("system", true)).toBe("dark");
    expect(resolveAppearance("system", false)).toBe("light");
  });

  it("defaults new users to system", () => {
    expect(DEFAULT_SETTINGS.appearance).toBe("system");
  });
});
