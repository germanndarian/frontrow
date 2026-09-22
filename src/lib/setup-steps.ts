import type { SportId } from "./types";
import { offersLeagueChoice } from "./leagues";

/* Setup is a shape, not a fixed four steps — the iPhone app's rules.

   The league step only appears when a sport you picked offers more than one
   league: football does, the rest don't, so most people go sports → teams →
   players. And the pager reaches back through every step you've seen but
   forward no further than Continue has taken you: swiping never opens a step.
   No React — unit-tested. */

export type SetupStep = "sports" | "leagues" | "teams" | "players";

const ORDER: SetupStep[] = ["sports", "leagues", "teams", "players"];

/** The steps this run of setup has. */
export function setupSteps(sports: SportId[]): SetupStep[] {
  return ORDER.filter((step) => step !== "leagues" || offersLeagueChoice(sports));
}

/** The steps the pager may show: everything up to the furthest one Continue
    has opened. */
export function reachableSteps(steps: SetupStep[], unlocked: SetupStep): SetupStep[] {
  const limit = ORDER.indexOf(unlocked);
  return steps.filter((step) => ORDER.indexOf(step) <= limit);
}

/** Where to stand: the step asked for while it still exists and is in reach,
    otherwise the furthest step that is — so dropping football never leaves
    you on a page that's gone. */
export function settleStep(step: SetupStep, steps: SetupStep[], unlocked: SetupStep): SetupStep {
  const reach = reachableSteps(steps, unlocked);
  return reach.includes(step) ? step : (reach.at(-1) ?? "sports");
}

/** The step after this one, or null on the last. */
export function nextStep(steps: SetupStep[], step: SetupStep): SetupStep | null {
  const i = steps.indexOf(step);
  return i >= 0 && i + 1 < steps.length ? steps[i + 1] : null;
}

export function previousStep(steps: SetupStep[], step: SetupStep): SetupStep | null {
  const i = steps.indexOf(step);
  return i > 0 ? steps[i - 1] : null;
}

/** Whichever of two steps comes later — how far Continue has been. */
export function furthest(a: SetupStep, b: SetupStep): SetupStep {
  return ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b;
}
