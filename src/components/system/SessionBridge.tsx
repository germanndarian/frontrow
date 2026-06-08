"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/store";
import { useSettings } from "@/lib/settings";

/**
 * Keeps the signed-in account in step with the live stores, and enforces
 * session expiry. Renders nothing.
 *
 * - On mount, an expired session is signed out (its `expiresAt` has passed).
 * - While signed in, any change to follows or settings is mirrored back into
 *   the account via `syncActive`. The mirror only writes account → it never
 *   touches the live stores, so there's no feedback loop.
 */
export function SessionBridge() {
  useEffect(() => {
    const { session, logOut } = useAuth.getState();
    if (session && session.expiresAt <= Date.now()) {
      logOut();
    }

    const mirror = () => {
      if (useAuth.getState().session) useAuth.getState().syncActive();
    };
    const unsubPrefs = usePreferences.subscribe(mirror);
    const unsubSettings = useSettings.subscribe(mirror);
    return () => {
      unsubPrefs();
      unsubSettings();
    };
  }, []);

  return null;
}
