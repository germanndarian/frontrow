/* Upstream (ESPN) health, shared between the API routes and the dashboard.

   ESPN's edge rate-limits aggressively and answers with a 403 once it decides
   we've asked too often. When that happens the route handlers serve the last
   good payload instead of failing, and tag the response with STALE_HEADER. The
   client records which surfaces came back stale so the dashboard can say the
   scores may be behind rather than quietly showing old numbers as if live. */

export const STALE_HEADER = "x-frontrow-stale";

const staleUrls = new Set<string>();
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Record whether a given surface is currently serving last-known-good data. */
export function reportUpstream(url: string, stale: boolean) {
  const wasStale = staleUrls.size > 0;
  if (stale) staleUrls.add(url);
  else staleUrls.delete(url);
  if (staleUrls.size > 0 !== wasStale) notify();
}

export function isUpstreamStale() {
  return staleUrls.size > 0;
}

export function subscribeUpstream(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
