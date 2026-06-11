"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "./store";
import { useAuth } from "./auth";
import { setDemoFlag } from "./demo";
import { DEFAULT_PREFERENCES } from "./mock";

/**
 * Easter egg: tap the logo `taps` times within `windowMs` to drop straight into
 * demo mode — the offline mock dataset, seeded follows, and a guest session, no
 * account required. Returns an onClick handler to spread onto a logo.
 */
export function useDemoTap(taps = 5, windowMs = 1500) {
  const router = useRouter();
  const count = useRef(0);
  const last = useRef(0);

  return useCallback(() => {
    const now = Date.now();
    count.current = now - last.current > windowMs ? 1 : count.current + 1;
    last.current = now;

    if (count.current >= taps) {
      count.current = 0;
      setDemoFlag(true);
      usePreferences.setState({ ...DEFAULT_PREFERENCES });
      useAuth.getState().continueAsGuest();
      router.push("/dashboard");
    }
  }, [router, taps, windowMs]);
}
