"use client";

import { useReducedMotion } from "motion/react";
import { useSettings } from "@/lib/settings";

/** True when motion should be minimal: the OS asks for it, or the user's
    "Reduce motion" setting is on. Springs and slides collapse to instant. */
export function useMotionPref(): boolean {
  const system = useReducedMotion();
  const setting = useSettings((s) => s.reduceMotion);
  return !!system || setting;
}
