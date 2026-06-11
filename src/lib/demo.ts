/**
 * Demo mode — run the whole app against the offline mock dataset, as a seeded
 * guest, with no Supabase required.
 *
 * Two ways in: the build-time `NEXT_PUBLIC_USE_MOCK` env flag, or the runtime
 * easter egg (tap the logo five times), which persists a flag in localStorage so
 * the preview survives client-side navigation and reloads. Kept dependency-free
 * so both the data facade and the auth store can read it without import cycles.
 */

const KEY = "frontrow:demo";

export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") return true;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setDemoFlag(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* private mode / storage disabled — demo just won't persist */
  }
}
