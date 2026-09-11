import { describe, it, expect } from "vitest";
import { decideSwipe } from "@/components/mobile/SwipePager";

describe("decideSwipe", () => {
  const w = 400;
  it("pages forward on a long drag left, back on a long drag right", () => {
    expect(decideSwipe(-120, 0, w)).toBe(1);
    expect(decideSwipe(120, 0, w)).toBe(-1);
  });
  it("pages on a quick flick even when the drag is short", () => {
    expect(decideSwipe(-20, -800, w)).toBe(1);
    expect(decideSwipe(20, 800, w)).toBe(-1);
  });
  it("snaps back on a short, slow drag", () => {
    expect(decideSwipe(-40, -100, w)).toBe(0);
    expect(decideSwipe(30, 50, w)).toBe(0);
  });
  it("never needs less than 56px on narrow screens", () => {
    expect(decideSwipe(-50, 0, 200)).toBe(0);
    expect(decideSwipe(-60, 0, 200)).toBe(1);
  });
});
