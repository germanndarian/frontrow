/* Am I running inside the iOS shell?

   The Capacitor runtime injects a `Capacitor` global into the WebView before
   the page loads. Reading it is enough to tell the native app apart from a
   browser, so the website carries no Capacitor dependency — this file is a
   `typeof window` check and nothing more.

   Used to drop sign-in methods the WebView can't complete (Google refuses
   OAuth from an embedded WebView) and to turn on safe-area padding for the
   notch and home indicator. */

import { useSyncExternalStore } from "react";

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
}

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap) return false;
  return typeof cap.isNativePlatform === "function" ? cap.isNativePlatform() : true;
}

/* The global is injected before the page loads and never changes afterwards,
   so there is nothing to subscribe to. */
const subscribe = () => () => {};

/** False on the server, so the markup hydrates cleanly; the real value lands on
    the client render straight after. */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(subscribe, isNativeApp, () => false);
}
