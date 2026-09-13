import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { Game, LeagueId } from "@/lib/types";
import { espnCached, espnFetch, espnFetchFresh } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeScoreboard } from "@/lib/espn/normalize";
import { includesToday, overlayFresh } from "@/lib/espn/overlay";
import type { RawScoreboard } from "@/lib/espn/raw";
import { rateLimited } from "@/lib/rate-limit";

const VALID = new Set(Object.keys(LEAGUES));

/** "20260914" or "20260914-20260920" — anything else is ignored rather than
    passed upstream. */
const DATES = /^\d{8}(-\d{8})?$/;

export async function GET(req: NextRequest) {
  const limited = rateLimited(req);
  if (limited) return limited;

  const param = req.nextUrl.searchParams.get("leagues") ?? "";
  const leagues = param
    .split(",")
    .map((s) => s.trim())
    .filter((l): l is LeagueId => VALID.has(l));

  const requested = req.nextUrl.searchParams.get("dates") ?? "";
  const dates = DATES.test(requested) ? requested : undefined;

  if (leagues.length === 0) return NextResponse.json([] as Game[]);

  // One bad league shouldn't blank the whole strip — keep the ones that work.
  const settled = await Promise.allSettled(
    leagues.map((l) => (dates ? week(l, dates) : today(l))),
  );

  const games = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const allFailed = settled.every((r) => r.status === "rejected");
  if (allFailed) return NextResponse.json({ error: "scoreboard_failed" }, { status: 502 });

  return NextResponse.json(games);
}

async function today(league: LeagueId): Promise<Game[]> {
  const raw = await espnFetch<RawScoreboard>(
    espnUrl.scoreboard(league),
    REVALIDATE.scoreboard,
  );
  return normalizeScoreboard(raw, league);
}

/** A week of baseball is well over a megabyte of raw JSON, which Next's fetch
    cache silently refuses to store — so cache the normalized games instead,
    the way the schedule and team routes do.

    That two-minute window is right for a slate and much too slow for a live
    score, and the app asks for a week even when it only wants today. Today's
    board is a tenth the size and cached for twenty seconds, so lay it over the
    week rather than making the score wait out the longer window. It costs
    nothing extra in practice: it's the same cached read the website makes. */
async function week(league: LeagueId, dates: string): Promise<Game[]> {
  const { data } = await espnCached(
    ["scoreboard", league, dates],
    REVALIDATE.scoreboardWeek,
    async () => {
      const raw = await espnFetchFresh<RawScoreboard>(espnUrl.scoreboard(league, dates));
      return normalizeScoreboard(raw, league);
    },
  );
  if (!includesToday(dates)) return data;
  // A slate that's two minutes old beats no slate at all, so a failed overlay
  // is not worth failing the request for.
  const fresh = await today(league).catch(() => []);
  return overlayFresh(data, fresh);
}
