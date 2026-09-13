/**
 * A small fixed-window rate limiter for the API routes.
 *
 * What it is: a per-instance, in-memory counter keyed by client address. It
 * stops one client hammering a single serverless instance — a loop, a stuck
 * retry, a script pointed at our ESPN proxy — from burning through the
 * upstream budget the whole app shares.
 *
 * What it is not: distributed. Vercel runs several instances and each keeps
 * its own counters, so a determined attacker spread across instances gets a
 * multiple of the budget below. Making it exact needs shared state (Redis,
 * Vercel KV) and a network round trip per request; this costs nothing and
 * covers the case that actually happens. Vercel's own platform protections
 * sit in front of it for the rest.
 *
 * The budget is set well above what a real client uses. The iOS app polls
 * every 30 seconds across a handful of leagues, and the website the same, so
 * a heavy user sits at a few requests a minute. Anything near the limit is
 * not a person reading scores.
 */

export interface RateLimit {
  ok: boolean;
  /** Requests left in this window. */
  remaining: number;
  /** Seconds until the window resets — for the Retry-After header. */
  resetIn: number;
}

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Counts one request against `key` and says whether to serve it.
 *
 * Sweeps expired buckets as it goes: without that the map is a slow memory
 * leak on a long-lived instance, one entry per address ever seen.
 */
export function rateLimit(
  key: string,
  now: number = Date.now(),
  max: number = MAX_PER_WINDOW,
  windowMs: number = WINDOW_MS,
): RateLimit {
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetIn: Math.ceil(windowMs / 1000) };
  }

  bucket.count += 1;
  const resetIn = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return { ok: bucket.count <= max, remaining: Math.max(0, max - bucket.count), resetIn };
}

/**
 * Who to count against. Vercel sets x-forwarded-for and x-real-ip; the
 * left-most forwarded address is the client. With no header at all — a local
 * request, or a proxy that strips them — everything shares one bucket, which
 * would be wrong, so those are counted separately under a fixed key and the
 * generous budget keeps that harmless in development.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Test seam: forget every counter. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * The guard the routes call: null to carry on, or the 429 to return.
 *
 * A plain Response rather than NextResponse, so this module stays free of
 * framework imports and can be unit tested on its own.
 */
export function rateLimited(req: Request): Response | null {
  const limit = rateLimit(clientKey(req.headers));
  if (limit.ok) return null;
  return new Response(JSON.stringify({ error: "rate_limited" }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "retry-after": String(limit.resetIn),
      "x-ratelimit-remaining": "0",
    },
  });
}
