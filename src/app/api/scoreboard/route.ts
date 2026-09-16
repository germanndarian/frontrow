import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { Game, LeagueId } from "@/lib/types";
import { espnCached, espnFetch, espnFetchFresh } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeScoreboard } from "@/lib/espn/normalize";
import { includesToday, overlayFresh } from "@/lib/espn/overlay";
import { monthsSpanning, windowEnds, withinWindow } from "@/lib/espn/window";
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

/** A window of games, which ESPN no longer takes as a range — so ask for the
    months it touches and cut the window out here (see `espn/window.ts`).

    A month of baseball is several megabytes of raw JSON, way over the fetch
    cache's ceiling, so the normalized games are what gets cached, the way the
    schedule and team routes do. Caching the whole month rather than the asked-
    for week is what makes this cheaper than the range it replaces: every week
    of a month, and every league's request for it, reads the one copy.

    That two-minute window is right for a slate and much too slow for a live
    score, and the app asks for a week even when it only wants today. Today's
    board is a fraction of the size and cached for twenty seconds, so lay it
    over the window rather than making the score wait out the longer one. */
async function week(league: LeagueId, dates: string): Promise<Game[]> {
  const [start, end] = windowEnds(dates);
  const months = monthsSpanning(start, end);

  // One slow month shouldn't hold up the others; a failed one has nothing to
  // fall back on and throws, which is what marks the league as failed upstream.
  const slates = await Promise.all(
    months.map((month) =>
      espnCached(["scoreboard", league, month], REVALIDATE.scoreboardMonth, async () => {
        const raw = await espnFetchFresh<RawScoreboard>(espnUrl.scoreboard(league, month));
        return normalizeScoreboard(raw, league);
      }),
    ),
  );

  const data = slates
    .flatMap(({ data: games }) => games)
    .filter((game) => withinWindow(game.date, start, end))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!includesToday(dates)) return data;
  // A slate that's two minutes old beats no slate at all, so a failed overlay
  // is not worth failing the request for.
  const fresh = await today(league).catch(() => []);
  return overlayFresh(data, fresh);
}
