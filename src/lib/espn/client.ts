/** Server-side ESPN fetch: timeout, one retry on transient failure, and Next's
    revalidate cache so many followers share a single upstream call. */

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
// A browser-ish UA; ESPN's edge is friendlier to these than a bare fetch UA.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function once<T>(url: string, revalidate: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": UA },
      next: { revalidate },
    });
    if (!res.ok) throw new EspnError(`ESPN ${res.status} for ${url}`, res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function espnFetch<T>(url: string, revalidate: number): Promise<T> {
  try {
    return await once<T>(url, revalidate);
  } catch (err) {
    // Retry once on network errors and 5xx; let 4xx fail fast.
    const status = err instanceof EspnError ? err.status : undefined;
    if (status && status < 500) throw err;
    return await once<T>(url, revalidate);
  }
}

/** Team schedule with an off-season fallback: the default endpoint can be empty
    out of season, but the regular-season type (seasontype=2) still carries it. */
export async function fetchSchedule(
  league: LeagueId,
  teamId: string,
  revalidate: number,
): Promise<RawSchedule> {
  const raw = await espnFetch<RawSchedule>(
    espnUrl.schedule(league, teamId),
    revalidate,
  ).catch(() => ({ events: [] }) as RawSchedule);
  if ((raw.events?.length ?? 0) > 0) return raw;
  return espnFetch<RawSchedule>(
    espnUrl.schedule(league, teamId, 2),
    revalidate,
  ).catch(() => raw);
}
