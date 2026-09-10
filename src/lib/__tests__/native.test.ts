import { describe, it, expect, afterEach } from "vitest";
import { isNativeApp } from "@/lib/native";

type W = Window & { Capacitor?: unknown };

afterEach(() => {
  delete (window as W).Capacitor;
});

describe("isNativeApp", () => {
  it("is false in a plain browser", () => {
    expect(isNativeApp()).toBe(false);
  });

  it("is true when the runtime reports a native platform", () => {
    (window as W).Capacitor = { isNativePlatform: () => true };
    expect(isNativeApp()).toBe(true);
  });

  it("is false when Capacitor is present but serving the web build", () => {
    (window as W).Capacitor = { isNativePlatform: () => false };
    expect(isNativeApp()).toBe(false);
  });

  it("falls back to presence when isNativePlatform is missing", () => {
    (window as W).Capacitor = {};
    expect(isNativeApp()).toBe(true);
  });
});
