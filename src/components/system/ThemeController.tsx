"use client";

import { useEffect } from "react";
import { applySettings, snapshotSettings, useSettings } from "@/lib/settings";

/**
 * Reflects the user's appearance settings onto <html> as CSS variables and
 * data attributes. Mounted once near the root; it renders nothing. Every
 * settings change (and the initial hydrated value) is pushed to the DOM so the
 * accent, radius, density, motion and glow update live across the whole app.
 */
export function ThemeController() {
  useEffect(() => {
    applySettings(snapshotSettings(useSettings.getState()));
    const unsub = useSettings.subscribe((s) =>
      applySettings(snapshotSettings(s)),
    );
    return unsub;
  }, []);

  return null;
}
