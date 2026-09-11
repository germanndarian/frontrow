import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { Game, LeagueId } from "@/lib/types";
import { espnCached, espnFetch, espnFetchFresh } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeScoreboard } from "@/lib/espn/normalize";
import type { RawScoreboard } from "@/lib/espn/raw";

const VALID = new Set(Object.keys(LEAGUES));

/** "20260914" or "20260914-20260920" — anything else is ignored rather than
    passed upstream. */
const DATES = /^\d{8}(-\d{8})?$/;

export async function GET(req: NextRequest) {
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
    the way the schedule and team routes do. */
async function week(league: LeagueId, dates: string): Promise<Game[]> {
  const { data } = await espnCached(
    ["scoreboard", league, dates],
    REVALIDATE.scoreboardWeek,
    async () => {
      const raw = await espnFetchFresh<RawScoreboard>(espnUrl.scoreboard(league, dates));
      return normalizeScoreboard(raw, league);
    },
  );
  return data;
}
