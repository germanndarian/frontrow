import { describe, it, expect } from "vitest";
import {
  furthest,
  nextStep,
  previousStep,
  reachableSteps,
  settleStep,
  setupSteps,
} from "@/lib/setup-steps";

describe("setupSteps", () => {
  it("asks about leagues only when football is picked", () => {
    expect(setupSteps(["baseball", "hockey"])).toEqual(["sports", "teams", "players"]);
    expect(setupSteps(["baseball", "football"])).toEqual(["sports", "leagues", "teams", "players"]);
    expect(setupSteps([])).toEqual(["sports", "teams", "players"]);
  });

  it("walks forward and back through the steps it has", () => {
    const steps = setupSteps(["baseball"]);
    expect(nextStep(steps, "sports")).toBe("teams");
    expect(nextStep(steps, "players")).toBeNull();
    expect(previousStep(steps, "teams")).toBe("sports");
    expect(previousStep(steps, "sports")).toBeNull();
  });
});

describe("how far the pager reaches", () => {
  const all = setupSteps(["football"]);

  it("goes no further than Continue has been", () => {
    expect(reachableSteps(all, "sports")).toEqual(["sports"]);
    expect(reachableSteps(all, "teams")).toEqual(["sports", "leagues", "teams"]);
  });

  it("keeps a step already reached when the league step goes away", () => {
    const withoutLeagues = setupSteps(["baseball"]);
    expect(reachableSteps(withoutLeagues, "teams")).toEqual(["sports", "teams"]);
    // Continue had only reached leagues, which is now gone: teams isn't earned.
    expect(reachableSteps(withoutLeagues, "leagues")).toEqual(["sports"]);
  });

  it("moves you off a step that's gone, onto the furthest one still in reach", () => {
    expect(settleStep("leagues", setupSteps(["baseball"]), "teams")).toBe("teams");
    expect(settleStep("leagues", setupSteps(["baseball"]), "leagues")).toBe("sports");
    expect(settleStep("teams", all, "teams")).toBe("teams");
  });

  it("remembers the furthest step Continue has opened", () => {
    expect(furthest("teams", "leagues")).toBe("teams");
    expect(furthest("sports", "players")).toBe("players");
  });
});
