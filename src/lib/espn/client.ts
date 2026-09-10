/** Server-side ESPN fetch: timeout, one retry on transient failure, and Next's
    revalidate cache so many followers share a single upstream call. */

import { unstable_cache } from "next/cache";
import type { LeagueId } from "@/lib/types";
import { espnUrl } from "./endpoints";
import type { RawSchedule } from "./raw";

export class EspnError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "EspnError";
    this.status = status;
  }
}

const TIMEOUT_MS = 8_000;
/* Identify ourselves honestly. We used to send a spoofed Chrome UA on the
   theory that ESPN's edge preferred it; that stopped being true — their bot
   management now treats a browser UA arriving without browser TLS as an
   impersonator and 403s it. Saying who we are works on the host we query. */
const UA = "frontrow/1.0 (+https://github.com/germanndarian/frontrow)";

/** `revalidate: false` skips the fetch cache entirely — used for the oversized
    payloads that are cached after normalization instead (see `espnCached`). */
async function once<T>(url: string, revalidate: number | false): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": UA },
      ...(revalidate === false
        ? { cache: "no-store" as const }
        : { next: { revalidate } }),
    });
    if (!res.ok) throw new EspnError(`ESPN ${res.status} for ${url}`, res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function retrying<T>(url: string, revalidate: number | false): Promise<T> {
  try {
    return await once<T>(url, revalidate);
  } catch (err) {
    // Retry once on network errors and 5xx; let 4xx fail fast.
    const status = err instanceof EspnError ? err.status : undefined;
    if (status && status < 500) throw err;
    return await once<T>(url, revalidate);
  }
}

export function espnFetch<T>(url: string, revalidate: number): Promise<T> {
  return retrying<T>(url, revalidate);
}

/** Uncached upstream read. Only for payloads normalized behind `espnCached`. */
export function espnFetchFresh<T>(url: string): Promise<T> {
  return retrying<T>(url, false);
}

/* ───────────────────────────────────────────────────────────────────────────
   Caching oversized payloads.

   Next's data cache silently refuses to store any single fetch response over
   2MB, and several ESPN payloads sail past it — a team's full-season schedule
   is ~3.7MB, the postseason scoreboard ~10MB. For those, `next: { revalidate }`
   is a no-op: the write fails, nothing is cached, and every request goes back
   to ESPN. With one schedule call per followed team on each dashboard load,
   that is what gets us rate-limited.

   `espnCached` caches the NORMALIZED result instead (tens of KB, comfortably
   under the ceiling), so the revalidate window is actually honoured. It also
   keeps the last good value in memory: when ESPN blocks us, a surface degrades
   to slightly-stale data instead of a dead panel. That memory is per-instance
   and lost on cold start, which is fine — it's a cushion, not a store.
   ─────────────────────────────────────────────────────────────────────────── */

const lastGood = new Map<string, unknown>();

export interface Cached<R> {
  data: R;
  /** True when the upstream read failed and this is the previous good value. */
  stale: boolean;
}

export async function espnCached<R>(
  keyParts: string[],
  revalidate: number,
  build: () => Promise<R>,
): Promise<Cached<R>> {
  const key = keyParts.join(":");
  try {
    const data = await unstable_cache(build, keyParts, { revalidate })();
    lastGood.set(key, data);
    return { data, stale: false };
  } catch (err) {
    if (lastGood.has(key)) return { data: lastGood.get(key) as R, stale: true };
    throw err;
  }
}

/** Team schedule with an off-season fallback: the default endpoint can be empty
    out of season, but the regular-season type (seasontype=2) still carries it.
    A failed read throws rather than returning an empty slate, so callers can
    tell "no games" apart from "ESPN is refusing us" and degrade accordingly. */
export async function fetchSchedule(
  league: LeagueId,
  teamId: string,
): Promise<RawSchedule> {
  const raw = await espnFetchFresh<RawSchedule>(espnUrl.schedule(league, teamId));
  if ((raw.events?.length ?? 0) > 0) return raw;
  return espnFetchFresh<RawSchedule>(espnUrl.schedule(league, teamId, 2)).catch(() => raw);
}
