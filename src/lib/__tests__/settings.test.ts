import { describe, it, expect, beforeEach } from "vitest";
import {
  ACCENTS,
  ACCENT_ORDER,
  DEFAULT_SETTINGS,
  snapshotSettings,
  useSettings,
} from "@/lib/settings";

beforeEach(() => {
  useSettings.getState().reset();
});

describe("settings defaults", () => {
  it("starts on the cobalt accent", () => {
    expect(DEFAULT_SETTINGS.accent).toBe("cobalt");
    expect(DEFAULT_SETTINGS.hiddenSections).toEqual([]);
  });
});

describe("accent presets", () => {
  it("defines an accent for every id in the order list", () => {
    for (const id of ACCENT_ORDER) {
      expect(ACCENTS[id]).toBeDefined();
      expect(ACCENTS[id].vars["--color-primary"]).toBeTruthy();
    }
  });
});

describe("snapshotSettings", () => {
  it("returns a detached copy of the values", () => {
    const snap = snapshotSettings({
      ...DEFAULT_SETTINGS,
      hiddenSections: ["players"],
    });
    expect(snap.hiddenSections).toEqual(["players"]);
    // Mutating the snapshot must not reach back into the source array.
    snap.hiddenSections.push("teams");
    expect(DEFAULT_SETTINGS.hiddenSections).toEqual([]);
  });
});

describe("settings store", () => {
  it("updates a single key with set()", () => {
    useSettings.getState().set("accent", "violet");
    expect(useSettings.getState().accent).toBe("violet");
  });

  it("toggles a section off and back on", () => {
    const { toggleSection } = useSettings.getState();
    toggleSection("standings");
    expect(useSettings.getState().hiddenSections).toContain("standings");
    toggleSection("standings");
    expect(useSettings.getState().hiddenSections).not.toContain("standings");
  });
});
