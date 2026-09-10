import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { espnCached, espnFetchFresh, fetchSchedule } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeTeamCard } from "@/lib/espn/normalize";
import { jsonCached } from "@/lib/espn/response";
import type { RawSchedule, RawTeamDetail } from "@/lib/espn/raw";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const league = req.nextUrl.searchParams.get("league");
  if (!league || !VALID.has(league)) {
    return NextResponse.json({ error: "bad_league" }, { status: 400 });
  }
  const l = league as LeagueId;

  try {
    // Cached after normalization — the schedule half blows past the 2MB
    // fetch-cache ceiling, so caching the raw responses wouldn't stick.
    const cached = await espnCached(["team", l, id], REVALIDATE.team, async () => {
      const [detail, sched] = await Promise.all([
        espnFetchFresh<RawTeamDetail>(espnUrl.team(l, id)),
        // Schedule is supplementary (and has an off-season fallback) — never fatal.
        fetchSchedule(l, id).catch(() => ({ events: [] }) as RawSchedule),
      ]);
      return normalizeTeamCard(detail, sched, l);
    });
    return jsonCached(cached);
  } catch {
    return NextResponse.json({ error: "team_failed" }, { status: 502 });
  }
}
