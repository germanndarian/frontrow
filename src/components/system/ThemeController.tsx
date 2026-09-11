"use client";

import { useEffect } from "react";
import { applySettings, snapshotSettings, useSettings } from "@/lib/settings";

/**
 * Reflects the user's appearance settings onto <html> as CSS variables and
 * data attributes. Mounted once near the root; it renders nothing. Every
 * settings change (and the initial hydrated value) is pushed to the DOM so the
 * accent, radius, density, motion and glow update live across the whole app.
 * While the theme is "system" it also tracks the device's scheme as it flips.
 */
export function ThemeController() {
  useEffect(() => {
    const apply = () => applySettings(snapshotSettings(useSettings.getState()));
    apply();
    const unsub = useSettings.subscribe((s) => applySettings(snapshotSettings(s)));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      if (useSettings.getState().appearance === "system") apply();
    };
    mq.addEventListener("change", onScheme);
    return () => {
      unsub();
      mq.removeEventListener("change", onScheme);
    };
  }, []);

  return null;
}
